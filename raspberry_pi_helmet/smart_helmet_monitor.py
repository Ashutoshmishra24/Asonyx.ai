#!/usr/bin/env python3
"""Run the ADXL345 crash monitor and MQ-3 monitor concurrently."""

from __future__ import annotations

import logging
import signal
import threading
from pathlib import Path
from typing import Callable

from alcohol_monitor import AlcoholSettings, run_alcohol_monitor
from audio_services import AudioCoordinator, EspeakFeedback, Mpg123Player
from emergency_button import EmergencyButtonSettings, run_emergency_button
from emergency_system import EmergencyController
from helmet_monitor import Settings, run_monitor
from twilio_services import TwilioService
from voice_assistant import VoiceSettings, run_voice_assistant

LOGGER = logging.getLogger("asonyx.smart_helmet")


def _worker(name: str, target: Callable[[], None]) -> None:
    try:
        target()
    except Exception:
        LOGGER.exception("%s monitor stopped after an error; the other monitor will keep running", name)
    finally:
        LOGGER.info("%s worker finished", name)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).with_name(".env"))
    stop_event = threading.Event()
    signal.signal(signal.SIGINT, lambda *_: stop_event.set())
    signal.signal(signal.SIGTERM, lambda *_: stop_event.set())

    try:
        tilt_settings = Settings.from_environment()
        alcohol_settings = AlcoholSettings.from_environment()
        voice_settings = VoiceSettings.from_environment()
        button_settings = EmergencyButtonSettings.from_environment()
        notifier = TwilioService()
        audio = AudioCoordinator(
            Mpg123Player(voice_settings.music_file, voice_settings.output_device),
            EspeakFeedback(voice_settings.output_device),
        )
        emergency = EmergencyController(
            audio,
            notifier,
            voice_settings.emergency_numbers,
            button_settings.countdown_seconds,
        )
    except ValueError as error:
        LOGGER.error("Configuration error: %s", error)
        return 1

    workers = [
        threading.Thread(
            name="adxl345-monitor",
            target=_worker,
            args=("ADXL345", lambda: run_monitor(tilt_settings, stop_event, notifier)),
        ),
        threading.Thread(
            name="mq3-monitor",
            target=_worker,
            args=(
                "MQ-3",
                lambda: run_alcohol_monitor(alcohol_settings, stop_event, notifier),
            ),
        ),
        threading.Thread(
            name="voice-assistant",
            target=_worker,
            args=(
                "voice assistant",
                lambda: run_voice_assistant(
                    voice_settings,
                    stop_event,
                    notifier,
                    audio,
                    emergency,
                ),
            ),
        ),
        threading.Thread(
            name="emergency-button",
            target=_worker,
            args=(
                "emergency button",
                lambda: run_emergency_button(button_settings, emergency, stop_event),
            ),
        ),
    ]
    for worker in workers:
        worker.start()
    LOGGER.info("Smart helmet monitor started with %d workers", len(workers))

    try:
        while any(worker.is_alive() for worker in workers):
            for worker in workers:
                worker.join(timeout=0.5)
    finally:
        stop_event.set()
        for worker in workers:
            worker.join(timeout=5)
        emergency.close()
        audio.close()
    LOGGER.info("Smart helmet monitor stopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
