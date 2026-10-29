#!/usr/bin/env python3
"""ADXL345 tilt alarm prototype for an Asonyx smart helmet.

The monitor calibrates an upright reference vector at startup, sounds an active
buzzer whenever the configured tilt threshold is exceeded, and sends one Twilio
SMS after the excessive tilt has persisted for the configured hold time.
"""

from __future__ import annotations

import argparse
import logging
import math
import os
import re
import signal
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from twilio_services import TwilioService

LOGGER = logging.getLogger("asonyx.helmet")
E164_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


def env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    normalized = raw.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be true or false, got {raw!r}")


@dataclass(frozen=True)
class Vector3:
    x: float
    y: float
    z: float

    @property
    def magnitude(self) -> float:
        return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)

    def angle_to(self, other: "Vector3") -> float:
        denominator = self.magnitude * other.magnitude
        if denominator < 1e-9:
            raise ValueError("Cannot calculate tilt from a zero-length acceleration vector")
        cosine = (self.x * other.x + self.y * other.y + self.z * other.z) / denominator
        return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


class AccelerationSensor(Protocol):
    def read_acceleration(self) -> Vector3: ...

    def close(self) -> None: ...


class AlarmOutput(Protocol):
    def set_active(self, active: bool) -> None: ...

    def close(self) -> None: ...


class ADXL345Sensor:
    """Small ADXL345 I2C driver using smbus2.

    Full-resolution +/-2g mode keeps a scale of approximately 3.9 mg/LSB.
    """

    DEVICE_ID_REGISTER = 0x00
    EXPECTED_DEVICE_ID = 0xE5
    BW_RATE_REGISTER = 0x2C
    POWER_CONTROL_REGISTER = 0x2D
    DATA_FORMAT_REGISTER = 0x31
    DATA_START_REGISTER = 0x32
    SCALE_G_PER_LSB = 0.0039

    def __init__(self, bus_number: int, address: int) -> None:
        from smbus2 import SMBus

        self.address = address
        self.bus = SMBus(bus_number)
        device_id = self.bus.read_byte_data(self.address, self.DEVICE_ID_REGISTER)
        if device_id != self.EXPECTED_DEVICE_ID:
            self.bus.close()
            raise RuntimeError(
                f"No ADXL345 found at 0x{address:02X}; read device ID 0x{device_id:02X}"
            )

        self.bus.write_byte_data(self.address, self.POWER_CONTROL_REGISTER, 0x00)
        self.bus.write_byte_data(self.address, self.DATA_FORMAT_REGISTER, 0x08)
        self.bus.write_byte_data(self.address, self.BW_RATE_REGISTER, 0x0A)  # 100 Hz output rate
        self.bus.write_byte_data(self.address, self.POWER_CONTROL_REGISTER, 0x08)
        time.sleep(0.01)

    @staticmethod
    def _decode_axis(low: int, high: int) -> int:
        return int.from_bytes(bytes((low, high)), byteorder="little", signed=True)

    def read_acceleration(self) -> Vector3:
        data = self.bus.read_i2c_block_data(self.address, self.DATA_START_REGISTER, 6)
        return Vector3(
            self._decode_axis(data[0], data[1]) * self.SCALE_G_PER_LSB,
            self._decode_axis(data[2], data[3]) * self.SCALE_G_PER_LSB,
            self._decode_axis(data[4], data[5]) * self.SCALE_G_PER_LSB,
        )

    def close(self) -> None:
        self.bus.close()


class GPIOBuzzer:
    def __init__(self, gpio_pin: int, active_high: bool) -> None:
        from gpiozero import Buzzer

        self._buzzer = Buzzer(gpio_pin, active_high=active_high, initial_value=False)
        self._active = False

    def set_active(self, active: bool) -> None:
        if active == self._active:
            return
        self._active = active
        self._buzzer.on() if active else self._buzzer.off()

    def close(self) -> None:
        self._buzzer.off()
        self._buzzer.close()


class DisabledBuzzer:
    def set_active(self, active: bool) -> None:
        del active

    def close(self) -> None:
        pass


@dataclass(frozen=True)
class AlarmDecision:
    beep: bool
    notify: bool
    armed: bool


class TiltAlarm:
    """State machine that filters brief movement and limits repeated alerts."""

    def __init__(
        self,
        threshold_degrees: float,
        hold_seconds: float,
        reset_threshold_degrees: float,
        reset_hold_seconds: float,
        cooldown_seconds: float,
    ) -> None:
        if not 0 < reset_threshold_degrees < threshold_degrees < 180:
            raise ValueError("Require 0 < reset threshold < alarm threshold < 180 degrees")
        if min(hold_seconds, reset_hold_seconds, cooldown_seconds) < 0:
            raise ValueError("Alarm timing values cannot be negative")

        self.threshold_degrees = threshold_degrees
        self.hold_seconds = hold_seconds
        self.reset_threshold_degrees = reset_threshold_degrees
        self.reset_hold_seconds = reset_hold_seconds
        self.cooldown_seconds = cooldown_seconds
        self.armed = True
        self._tilted_since: float | None = None
        self._upright_since: float | None = None
        self._last_notification = float("-inf")

    def update(self, angle_degrees: float, now: float) -> AlarmDecision:
        if angle_degrees >= self.threshold_degrees:
            self._upright_since = None
            if self._tilted_since is None:
                self._tilted_since = now
            sustained = now - self._tilted_since >= self.hold_seconds
            cooldown_complete = now - self._last_notification >= self.cooldown_seconds
            notify = self.armed and sustained and cooldown_complete
            if notify:
                self.armed = False
                self._last_notification = now
            return AlarmDecision(beep=True, notify=notify, armed=self.armed)

        self._tilted_since = None
        if not self.armed and angle_degrees <= self.reset_threshold_degrees:
            if self._upright_since is None:
                self._upright_since = now
            if (
                now - self._upright_since >= self.reset_hold_seconds
                and now - self._last_notification >= self.cooldown_seconds
            ):
                self.armed = True
                self._upright_since = None
        elif angle_degrees > self.reset_threshold_degrees:
            self._upright_since = None

        return AlarmDecision(beep=False, notify=False, armed=self.armed)


@dataclass(frozen=True)
class Settings:
    i2c_bus: int
    i2c_address: int
    buzzer_gpio: int
    buzzer_enabled: bool
    buzzer_active_high: bool
    tilt_threshold_degrees: float
    tilt_hold_seconds: float
    reset_threshold_degrees: float
    reset_hold_seconds: float
    alert_cooldown_seconds: float
    sample_interval_seconds: float
    calibration_samples: int
    dry_run: bool
    owner_name: str
    account_sid: str
    auth_token: str
    from_number: str
    emergency_numbers: tuple[str, ...]

    @classmethod
    def from_environment(cls) -> "Settings":
        emergency_numbers = tuple(
            number.strip()
            for number in os.getenv("EMERGENCY_TO_NUMBERS", "").split(",")
            if number.strip()
        )
        settings = cls(
            i2c_bus=int(os.getenv("ADXL345_I2C_BUS", "1")),
            i2c_address=int(os.getenv("ADXL345_ADDRESS", "0x53"), 0),
            buzzer_gpio=int(os.getenv("BUZZER_GPIO", "17")),
            buzzer_enabled=env_bool("BUZZER_ENABLED", True),
            buzzer_active_high=env_bool("BUZZER_ACTIVE_HIGH", True),
            tilt_threshold_degrees=float(os.getenv("TILT_THRESHOLD_DEGREES", "55")),
            tilt_hold_seconds=float(os.getenv("TILT_HOLD_SECONDS", "2")),
            reset_threshold_degrees=float(os.getenv("RESET_THRESHOLD_DEGREES", "20")),
            reset_hold_seconds=float(os.getenv("RESET_HOLD_SECONDS", "5")),
            alert_cooldown_seconds=float(os.getenv("ALERT_COOLDOWN_SECONDS", "300")),
            sample_interval_seconds=float(os.getenv("SAMPLE_INTERVAL_SECONDS", "0.1")),
            calibration_samples=int(os.getenv("CALIBRATION_SAMPLES", "50")),
            dry_run=env_bool("DRY_RUN", True),
            owner_name=os.getenv("HELMET_OWNER_NAME", "Helmet wearer").strip() or "Helmet wearer",
            account_sid=os.getenv("TWILIO_ACCOUNT_SID", "").strip(),
            auth_token=os.getenv("TWILIO_AUTH_TOKEN", "").strip(),
            from_number=os.getenv("TWILIO_FROM_NUMBER", "").strip(),
            emergency_numbers=emergency_numbers,
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if self.calibration_samples < 5:
            raise ValueError("CALIBRATION_SAMPLES must be at least 5")
        if self.sample_interval_seconds <= 0:
            raise ValueError("SAMPLE_INTERVAL_SECONDS must be greater than zero")
        if not self.dry_run:
            missing = [
                name
                for name, value in (
                    ("TWILIO_ACCOUNT_SID", self.account_sid),
                    ("TWILIO_AUTH_TOKEN", self.auth_token),
                    ("TWILIO_FROM_NUMBER", self.from_number),
                    ("EMERGENCY_TO_NUMBERS", self.emergency_numbers),
                )
                if not value
            ]
            if missing:
                raise ValueError(f"Missing required Twilio settings: {', '.join(missing)}")
        for number in (self.from_number, *self.emergency_numbers):
            if number and not E164_PATTERN.fullmatch(number):
                raise ValueError(f"Phone number must use E.164 format, got {number!r}")


def calibrate(sensor: AccelerationSensor, samples: int, interval: float) -> Vector3:
    LOGGER.info("Calibrating: keep the helmet upright and still (%d samples)", samples)
    total_x = total_y = total_z = 0.0
    for _ in range(samples):
        reading = sensor.read_acceleration()
        total_x += reading.x
        total_y += reading.y
        total_z += reading.z
        time.sleep(interval)
    reference = Vector3(total_x / samples, total_y / samples, total_z / samples)
    if not 0.5 <= reference.magnitude <= 1.5:
        raise RuntimeError(
            f"Calibration acceleration was {reference.magnitude:.2f}g; check sensor wiring and keep it still"
        )
    LOGGER.info(
        "Calibration complete: reference=(%.3f, %.3f, %.3f)g",
        reference.x,
        reference.y,
        reference.z,
    )
    return reference


def run_monitor(
    settings: Settings,
    stop_event: threading.Event | None = None,
    notifier: TwilioService | None = None,
) -> None:
    sensor: AccelerationSensor | None = None
    buzzer: AlarmOutput = DisabledBuzzer()
    owns_stop_event = stop_event is None
    stop_event = stop_event or threading.Event()
    if owns_stop_event:
        signal.signal(signal.SIGTERM, lambda *_: stop_event.set())
        signal.signal(signal.SIGINT, lambda *_: stop_event.set())

    try:
        sensor = ADXL345Sensor(settings.i2c_bus, settings.i2c_address)
        if settings.buzzer_enabled:
            buzzer = GPIOBuzzer(settings.buzzer_gpio, settings.buzzer_active_high)
        reference = calibrate(sensor, settings.calibration_samples, settings.sample_interval_seconds)
        alarm = TiltAlarm(
            threshold_degrees=settings.tilt_threshold_degrees,
            hold_seconds=settings.tilt_hold_seconds,
            reset_threshold_degrees=settings.reset_threshold_degrees,
            reset_hold_seconds=settings.reset_hold_seconds,
            cooldown_seconds=settings.alert_cooldown_seconds,
        )
        notifier = notifier or TwilioService()
        LOGGER.info(
            "Monitoring started: threshold=%.1f degrees, hold=%.1fs, dry_run=%s",
            settings.tilt_threshold_degrees,
            settings.tilt_hold_seconds,
            settings.dry_run,
        )

        consecutive_sensor_errors = 0
        last_log_time = 0.0
        while not stop_event.is_set():
            loop_started = time.monotonic()
            try:
                acceleration = sensor.read_acceleration()
                consecutive_sensor_errors = 0
            except OSError:
                consecutive_sensor_errors += 1
                LOGGER.exception("ADXL345 read failed (%d/5)", consecutive_sensor_errors)
                buzzer.set_active(False)
                if consecutive_sensor_errors >= 5:
                    raise RuntimeError("ADXL345 failed five consecutive reads")
                time.sleep(settings.sample_interval_seconds)
                continue

            angle = acceleration.angle_to(reference)
            decision = alarm.update(angle, loop_started)
            buzzer.set_active(decision.beep)

            if loop_started - last_log_time >= 1.0:
                LOGGER.info(
                    "tilt=%5.1f° acceleration=(% .2f, % .2f, % .2f)g alarm=%s armed=%s",
                    angle,
                    acceleration.x,
                    acceleration.y,
                    acceleration.z,
                    decision.beep,
                    decision.armed,
                )
                last_log_time = loop_started

            if decision.notify:
                LOGGER.warning("Sustained helmet tilt detected at %.1f degrees", angle)
                for number in settings.emergency_numbers:
                    try:
                        notifier.send_accident_sms(number)
                    except Exception:
                        LOGGER.exception("Could not send accident alert to %s", number)

            elapsed = time.monotonic() - loop_started
            stop_event.wait(max(0.0, settings.sample_interval_seconds - elapsed))
    finally:
        buzzer.close()
        if sensor is not None:
            sensor.close()
        LOGGER.info("Helmet monitor stopped")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Monitor an ADXL345 and alert on sustained helmet tilt")
    parser.add_argument("--debug", action="store_true", help="enable verbose logging")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).with_name(".env"))
        settings = Settings.from_environment()
        run_monitor(settings)
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        LOGGER.error("Startup/monitor failure: %s", error)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
