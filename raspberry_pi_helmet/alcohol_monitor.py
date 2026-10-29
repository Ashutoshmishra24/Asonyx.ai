#!/usr/bin/env python3
"""MQ-3 alcohol-vapour monitor with bounded Twilio notifications."""

from __future__ import annotations

import logging
import os
import signal
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from twilio_services import TwilioService

LOGGER = logging.getLogger("asonyx.alcohol")


def env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    normalized = raw.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be true or false")


class AlcoholSensor(Protocol):
    def read_level(self) -> float: ...

    def close(self) -> None: ...


class MQ3DigitalSensor:
    """Read the DO pin from an MQ-3 module with an onboard comparator."""

    def __init__(self, gpio_pin: int, active_low: bool) -> None:
        from gpiozero import DigitalInputDevice

        self._device = DigitalInputDevice(gpio_pin, pull_up=False)
        self._active_low = active_low

    def read_level(self) -> float:
        detected = not self._device.value if self._active_low else bool(self._device.value)
        return 1.0 if detected else 0.0

    def close(self) -> None:
        self._device.close()


class MQ3MCP3008Sensor:
    """Read MQ-3 AO through an MCP3008 ADC channel (normalized 0.0-1.0)."""

    def __init__(self, channel: int) -> None:
        from gpiozero import MCP3008

        self._device = MCP3008(channel=channel)

    def read_level(self) -> float:
        return float(self._device.value)

    def close(self) -> None:
        self._device.close()


@dataclass(frozen=True)
class AlcoholDecision:
    detected: bool
    notify: bool
    notification_number: int


class AlcoholAlarm:
    """Require a sustained reading and allow only two alerts per incident."""

    def __init__(
        self,
        threshold: float,
        hold_seconds: float,
        clear_threshold: float,
        clear_hold_seconds: float,
        repeat_seconds: float,
        max_notifications: int = 2,
    ) -> None:
        if not 0 <= clear_threshold < threshold <= 1:
            raise ValueError("Require 0 <= alcohol clear threshold < detection threshold <= 1")
        if min(hold_seconds, clear_hold_seconds, repeat_seconds) < 0:
            raise ValueError("Alcohol alarm timing values cannot be negative")
        if max_notifications < 1:
            raise ValueError("max_notifications must be at least one")
        self.threshold = threshold
        self.hold_seconds = hold_seconds
        self.clear_threshold = clear_threshold
        self.clear_hold_seconds = clear_hold_seconds
        self.repeat_seconds = repeat_seconds
        self.max_notifications = max_notifications
        self._high_since: float | None = None
        self._clear_since: float | None = None
        self._last_notification = float("-inf")
        self._notifications = 0

    def update(self, level: float, now: float) -> AlcoholDecision:
        if level >= self.threshold:
            self._clear_since = None
            if self._high_since is None:
                self._high_since = now
            sustained = now - self._high_since >= self.hold_seconds
            can_notify = (
                sustained
                and self._notifications < self.max_notifications
                and now - self._last_notification >= self.repeat_seconds
            )
            if can_notify:
                self._notifications += 1
                self._last_notification = now
            return AlcoholDecision(True, can_notify, self._notifications)

        self._high_since = None
        if level <= self.clear_threshold:
            if self._clear_since is None:
                self._clear_since = now
            if now - self._clear_since >= self.clear_hold_seconds:
                self._notifications = 0
                self._last_notification = float("-inf")
        else:
            self._clear_since = None
        return AlcoholDecision(False, False, self._notifications)


@dataclass(frozen=True)
class AlcoholSettings:
    enabled: bool
    mode: str
    digital_gpio: int
    digital_active_low: bool
    adc_channel: int
    threshold: float
    clear_threshold: float
    hold_seconds: float
    clear_hold_seconds: float
    repeat_seconds: float
    warmup_seconds: float
    sample_interval_seconds: float
    emergency_numbers: tuple[str, ...]

    @classmethod
    def from_environment(cls) -> "AlcoholSettings":
        settings = cls(
            enabled=env_bool("MQ3_ENABLED", True),
            mode=os.getenv("MQ3_MODE", "digital").strip().lower(),
            digital_gpio=int(os.getenv("MQ3_DIGITAL_GPIO", "27")),
            digital_active_low=env_bool("MQ3_DIGITAL_ACTIVE_LOW", True),
            adc_channel=int(os.getenv("MQ3_ADC_CHANNEL", "0")),
            threshold=float(os.getenv("MQ3_THRESHOLD", "0.55")),
            clear_threshold=float(os.getenv("MQ3_CLEAR_THRESHOLD", "0.40")),
            hold_seconds=float(os.getenv("MQ3_HOLD_SECONDS", "3")),
            clear_hold_seconds=float(os.getenv("MQ3_CLEAR_HOLD_SECONDS", "30")),
            repeat_seconds=float(os.getenv("MQ3_REPEAT_SMS_SECONDS", "60")),
            warmup_seconds=float(os.getenv("MQ3_WARMUP_SECONDS", "60")),
            sample_interval_seconds=float(os.getenv("MQ3_SAMPLE_INTERVAL_SECONDS", "0.2")),
            emergency_numbers=tuple(
                number.strip()
                for number in os.getenv("EMERGENCY_TO_NUMBERS", "").split(",")
                if number.strip()
            ),
        )
        if settings.mode not in {"digital", "mcp3008"}:
            raise ValueError("MQ3_MODE must be digital or mcp3008")
        if not 0 <= settings.adc_channel <= 7:
            raise ValueError("MQ3_ADC_CHANNEL must be between 0 and 7")
        if min(settings.warmup_seconds, settings.sample_interval_seconds) < 0:
            raise ValueError("MQ-3 timing values cannot be negative")
        return settings


def create_sensor(settings: AlcoholSettings) -> AlcoholSensor:
    if settings.mode == "digital":
        return MQ3DigitalSensor(settings.digital_gpio, settings.digital_active_low)
    return MQ3MCP3008Sensor(settings.adc_channel)


def run_alcohol_monitor(
    settings: AlcoholSettings,
    stop_event: threading.Event | None = None,
    notifier: TwilioService | None = None,
) -> None:
    if not settings.enabled:
        LOGGER.info("MQ-3 monitor is disabled")
        return
    owns_stop_event = stop_event is None
    stop_event = stop_event or threading.Event()
    if owns_stop_event:
        signal.signal(signal.SIGINT, lambda *_: stop_event.set())
        signal.signal(signal.SIGTERM, lambda *_: stop_event.set())
    notifier = notifier or TwilioService()
    sensor: AlcoholSensor | None = None
    try:
        sensor = create_sensor(settings)
        alarm = AlcoholAlarm(
            settings.threshold,
            settings.hold_seconds,
            settings.clear_threshold,
            settings.clear_hold_seconds,
            settings.repeat_seconds,
            max_notifications=2,
        )
        ready_at = time.monotonic() + settings.warmup_seconds
        LOGGER.info("MQ-3 warming for %.0fs; alerts are suppressed during warm-up", settings.warmup_seconds)
        last_log = 0.0
        while not stop_event.is_set():
            started = time.monotonic()
            level = sensor.read_level()
            if started >= ready_at:
                decision = alarm.update(level, started)
                if decision.notify:
                    LOGGER.warning(
                        "Alcohol threshold sustained; sending alert round %d/2",
                        decision.notification_number,
                    )
                    for number in settings.emergency_numbers:
                        try:
                            notifier.send_alcohol_sms(number)
                        except Exception:
                            LOGGER.exception("Could not send alcohol alert to %s", number)
            if started - last_log >= 2:
                LOGGER.info("mq3_level=%.3f warmed_up=%s", level, started >= ready_at)
                last_log = started
            stop_event.wait(max(0.0, settings.sample_interval_seconds - (time.monotonic() - started)))
    finally:
        if sensor is not None:
            sensor.close()
        LOGGER.info("MQ-3 monitor stopped")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).with_name(".env"))
        run_alcohol_monitor(AlcoholSettings.from_environment())
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        LOGGER.error("Alcohol monitor failure: %s", error)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
