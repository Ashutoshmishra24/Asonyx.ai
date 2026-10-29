"""Reusable Twilio SMS helpers for the smart-helmet prototype."""

from __future__ import annotations

import logging
import os
import re
import threading
from dataclasses import dataclass
from datetime import datetime
from typing import TypeAlias

LOGGER = logging.getLogger("asonyx.twilio")
E164_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
GPSLocation: TypeAlias = tuple[float, float]


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be true or false")


def _location_suffix(gps_location: GPSLocation | None) -> str:
    if gps_location is None:
        return ""
    if len(gps_location) != 2:
        raise ValueError("GPS location must be a (latitude, longitude) tuple")
    latitude, longitude = (float(value) for value in gps_location)
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("GPS latitude or longitude is outside its valid range")
    return f" Location: https://maps.google.com/?q={latitude:.6f},{longitude:.6f}"


@dataclass(frozen=True)
class TwilioConfig:
    account_sid: str
    auth_token: str
    from_number: str
    dry_run: bool = True
    owner_name: str = "Helmet wearer"

    @classmethod
    def from_environment(cls) -> "TwilioConfig":
        config = cls(
            account_sid=os.getenv("TWILIO_ACCOUNT_SID", "").strip(),
            auth_token=os.getenv("TWILIO_AUTH_TOKEN", "").strip(),
            from_number=os.getenv("TWILIO_FROM_NUMBER", "").strip(),
            dry_run=_env_bool("DRY_RUN", True),
            owner_name=os.getenv("HELMET_OWNER_NAME", "Helmet wearer").strip()
            or "Helmet wearer",
        )
        config.validate()
        return config

    def validate(self) -> None:
        if self.from_number and not E164_PATTERN.fullmatch(self.from_number):
            raise ValueError("TWILIO_FROM_NUMBER must use E.164 format")
        if not self.dry_run:
            missing = [
                name
                for name, value in (
                    ("TWILIO_ACCOUNT_SID", self.account_sid),
                    ("TWILIO_AUTH_TOKEN", self.auth_token),
                    ("TWILIO_FROM_NUMBER", self.from_number),
                )
                if not value
            ]
            if missing:
                raise ValueError(f"Missing Twilio settings: {', '.join(missing)}")


class TwilioService:
    """Thread-safe SMS sender shared by the sensor monitors."""

    def __init__(self, config: TwilioConfig | None = None) -> None:
        self.config = config or TwilioConfig.from_environment()
        self._client = None
        self._lock = threading.Lock()

    def send(self, number: str, body: str, gps_location: GPSLocation | None = None) -> str | None:
        number = number.strip()
        if not E164_PATTERN.fullmatch(number):
            raise ValueError(f"Destination number must use E.164 format, got {number!r}")
        message_body = f"{body.rstrip()}{_location_suffix(gps_location)}"
        if self.config.dry_run:
            LOGGER.warning("DRY RUN - would send SMS to %s: %s", number, message_body)
            return None

        with self._lock:
            if self._client is None:
                from twilio.rest import Client

                self._client = Client(self.config.account_sid, self.config.auth_token)
            message = self._client.messages.create(
                body=message_body,
                from_=self.config.from_number,
                to=number,
            )
        LOGGER.info("Queued Twilio message %s for %s", message.sid, number)
        return str(message.sid)

    def send_alcohol_sms(
        self, number: str, gps_location: GPSLocation | None = None
    ) -> str | None:
        return self.send(
            number,
            f"Asonyx alert: alcohol vapour was detected near {self.config.owner_name}'s helmet "
            f"at {datetime.now().astimezone():%Y-%m-%d %H:%M:%S %Z}. Please check on them. "
            "This prototype reading is not a medical or legal blood-alcohol measurement.",
            gps_location,
        )

    def send_accident_sms(
        self, number: str, gps_location: GPSLocation | None = None
    ) -> str | None:
        return self.send(
            number,
            f"Asonyx emergency alert: a possible accident was detected for "
            f"{self.config.owner_name} at {datetime.now().astimezone():%Y-%m-%d %H:%M:%S %Z}. "
            "Please call them and check immediately. This prototype does not contact emergency services.",
            gps_location,
        )

    def send_sos_message(
        self, number: str, gps_location: GPSLocation | None = None
    ) -> str | None:
        return self.send(
            number,
            f"SOS from {self.config.owner_name}: I may need help. Please contact me immediately.",
            gps_location,
        )

    def send_custom_sos_message(
        self,
        number: str,
        message: str,
        gps_location: GPSLocation | None = None,
    ) -> str | None:
        if not message.strip():
            raise ValueError("Custom SOS message cannot be empty")
        return self.send(number, f"SOS from {self.config.owner_name}: {message.strip()}", gps_location)


_default_service: TwilioService | None = None
_default_lock = threading.Lock()


def _service() -> TwilioService:
    global _default_service
    with _default_lock:
        if _default_service is None:
            _default_service = TwilioService()
        return _default_service


def send_sms_alcohol(number: str, gps_location: GPSLocation | None = None) -> str | None:
    return _service().send_alcohol_sms(number, gps_location)


def send_accident_sms(number: str, gps_location: GPSLocation | None = None) -> str | None:
    return _service().send_accident_sms(number, gps_location)


def send_sos_message(number: str, gps_location: GPSLocation | None = None) -> str | None:
    return _service().send_sos_message(number, gps_location)


def send_custom_sos_message(
    number: str, message: str, gps_location: GPSLocation | None = None
) -> str | None:
    return _service().send_custom_sos_message(number, message, gps_location)
