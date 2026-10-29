"""Cancellable emergency countdown shared by button and voice controls."""

from __future__ import annotations

import logging
import threading
import time
from typing import Protocol

from audio_services import AudioCoordinator

LOGGER = logging.getLogger("asonyx.emergency")


class EmergencyNotifier(Protocol):
    def send_sos_message(self, number: str) -> object: ...


class EmergencyController:
    def __init__(
        self,
        audio: AudioCoordinator,
        notifier: EmergencyNotifier,
        emergency_numbers: tuple[str, ...],
        countdown_seconds: int = 8,
    ) -> None:
        if countdown_seconds < 1:
            raise ValueError("Emergency countdown must be at least one second")
        self.audio = audio
        self.notifier = notifier
        self.emergency_numbers = emergency_numbers
        self.countdown_seconds = countdown_seconds
        self._lock = threading.Lock()
        self._cancel_event = threading.Event()
        self._thread: threading.Thread | None = None

    @property
    def is_active(self) -> bool:
        with self._lock:
            return self._thread is not None and self._thread.is_alive()

    def toggle(self, source: str = "button") -> bool:
        if self.is_active:
            self.cancel(source)
            return False
        return self.start(source)

    def start(self, source: str = "button") -> bool:
        with self._lock:
            if self._thread is not None and self._thread.is_alive():
                return False
            self._cancel_event = threading.Event()
            self._thread = threading.Thread(
                name="emergency-countdown",
                target=self._run_countdown,
                args=(self._cancel_event, source),
                daemon=True,
            )
            self._thread.start()
        return True

    def cancel(self, source: str = "button") -> bool:
        with self._lock:
            if self._thread is None or not self._thread.is_alive():
                return False
            if self._cancel_event.is_set():
                return False
            LOGGER.warning("Emergency countdown cancellation requested by %s", source)
            self._cancel_event.set()
            return True

    def close(self) -> None:
        self.cancel("shutdown")
        thread = self._thread
        if thread is not None and thread is not threading.current_thread():
            thread.join(timeout=3)

    def _run_countdown(self, cancel_event: threading.Event, source: str) -> None:
        LOGGER.warning("Emergency countdown started by %s", source)
        music_was_paused = self.audio.pause_music()
        try:
            deadline = time.monotonic() + self.countdown_seconds
            self.audio.speak(
                f"Initiating emergency system. {self.countdown_seconds}",
                manage_music=False,
            )
            last_spoken = self.countdown_seconds
            while not cancel_event.is_set():
                remaining = max(0, int(deadline - time.monotonic() + 0.999))
                if remaining <= 0:
                    break
                if remaining < last_spoken:
                    self.audio.speak(str(remaining), manage_music=False)
                    last_spoken = remaining
                cancel_event.wait(0.05)

            if cancel_event.is_set():
                self.audio.speak("Emergency alert cancelled", manage_music=False)
                LOGGER.warning("Emergency countdown cancelled")
                return

            if not self.emergency_numbers:
                self.audio.speak("Emergency contacts are not configured", manage_music=False)
                LOGGER.error("Emergency countdown completed without configured contacts")
                return

            sent = 0
            for number in self.emergency_numbers:
                try:
                    self.notifier.send_sos_message(number)
                    sent += 1
                except Exception:
                    LOGGER.exception("Could not send button SOS to %s", number)
            if sent:
                self.audio.speak("Emergency SOS sent", manage_music=False)
                LOGGER.warning("Emergency SOS sent to %d contact(s)", sent)
            else:
                self.audio.speak("Emergency message failed", manage_music=False)
        except Exception:
            LOGGER.exception("Emergency countdown failed")
        finally:
            if music_was_paused:
                self.audio.resume_music()
