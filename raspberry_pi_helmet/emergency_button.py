"""Physical emergency-button worker."""

from __future__ import annotations

import logging
import os
import threading
from dataclasses import dataclass

from emergency_system import EmergencyController

LOGGER = logging.getLogger("asonyx.emergency_button")


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


@dataclass(frozen=True)
class EmergencyButtonSettings:
    enabled: bool
    gpio_pin: int
    active_low: bool
    bounce_seconds: float
    countdown_seconds: int

    @classmethod
    def from_environment(cls) -> "EmergencyButtonSettings":
        settings = cls(
            enabled=env_bool("EMERGENCY_BUTTON_ENABLED", True),
            gpio_pin=int(os.getenv("EMERGENCY_BUTTON_GPIO", "22")),
            active_low=env_bool("EMERGENCY_BUTTON_ACTIVE_LOW", True),
            bounce_seconds=float(os.getenv("EMERGENCY_BUTTON_BOUNCE_SECONDS", "0.15")),
            countdown_seconds=int(os.getenv("EMERGENCY_COUNTDOWN_SECONDS", "8")),
        )
        if not 0 <= settings.gpio_pin <= 27:
            raise ValueError("EMERGENCY_BUTTON_GPIO must be a BCM GPIO from 0 to 27")
        if settings.bounce_seconds < 0:
            raise ValueError("EMERGENCY_BUTTON_BOUNCE_SECONDS cannot be negative")
        if settings.countdown_seconds < 1:
            raise ValueError("EMERGENCY_COUNTDOWN_SECONDS must be at least 1")
        return settings


def run_emergency_button(
    settings: EmergencyButtonSettings,
    controller: EmergencyController,
    stop_event: threading.Event,
) -> None:
    if not settings.enabled:
        LOGGER.info("Emergency button is disabled")
        return
    from gpiozero import Button

    button = Button(
        settings.gpio_pin,
        pull_up=settings.active_low,
        bounce_time=settings.bounce_seconds,
    )

    def pressed() -> None:
        active = controller.toggle("physical button")
        LOGGER.warning("Emergency button pressed; countdown active=%s", active)

    button.when_pressed = pressed
    LOGGER.info("Emergency button listening on BCM GPIO%d", settings.gpio_pin)
    try:
        stop_event.wait()
    finally:
        button.close()
        controller.close()
        LOGGER.info("Emergency button stopped")
