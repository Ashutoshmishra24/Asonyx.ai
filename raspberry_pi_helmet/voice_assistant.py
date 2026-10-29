#!/usr/bin/env python3
"""Low-resource offline voice commands for the smart-helmet prototype."""

from __future__ import annotations

import argparse
import json
import logging
import os
import queue
import signal
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from audio_services import AudioCoordinator, EspeakFeedback, Mpg123Player
from emergency_system import EmergencyController
from twilio_services import TwilioService

LOGGER = logging.getLogger("asonyx.voice")
COMMAND_PHRASES = (
    "play music",
    "play song",
    "stop music",
    "stop song",
    "send sos",
    "send emergency sos",
    "emergency sos",
    "start emergency alert",
    "initiate emergency alert",
    "stop emergency alert",
    "cancel emergency alert",
    "stop emergency",
    "cancel emergency",
    "stop sos",
    "cancel sos",
)


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


def audio_device(value: str) -> int | str | None:
    value = value.strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return value


class EmergencyNotifier(Protocol):
    def send_sos_message(self, number: str) -> object: ...


class VoiceAudio(Protocol):
    def play_music(self) -> bool: ...

    def stop_music(self) -> bool: ...

    def speak(self, message: str, manage_music: bool = True) -> None: ...


class EmergencyControl(Protocol):
    def start(self, source: str = "button") -> bool: ...

    def cancel(self, source: str = "button") -> bool: ...


@dataclass(frozen=True)
class VoiceSettings:
    enabled: bool
    model_path: Path
    music_file: Path
    input_device: int | str | None
    output_device: str
    sample_rate: int
    sos_cooldown_seconds: float
    emergency_numbers: tuple[str, ...]

    @classmethod
    def from_environment(cls) -> "VoiceSettings":
        base = Path(__file__).resolve().parent

        def resolve_path(name: str, default: str) -> Path:
            configured = Path(os.getenv(name, default)).expanduser()
            return configured if configured.is_absolute() else base / configured

        settings = cls(
            enabled=env_bool("VOICE_ASSISTANT_ENABLED", True),
            model_path=resolve_path("VOSK_MODEL_PATH", "models/vosk-model-small-en-us-0.15"),
            music_file=resolve_path("MUSIC_FILE", "media/demo.mp3"),
            input_device=audio_device(os.getenv("VOICE_INPUT_DEVICE", "")),
            output_device=os.getenv("VOICE_OUTPUT_DEVICE", "").strip(),
            sample_rate=int(os.getenv("VOICE_SAMPLE_RATE", "16000")),
            sos_cooldown_seconds=float(os.getenv("VOICE_SOS_COOLDOWN_SECONDS", "300")),
            emergency_numbers=tuple(
                number.strip()
                for number in os.getenv("EMERGENCY_TO_NUMBERS", "").split(",")
                if number.strip()
            ),
        )
        if settings.sample_rate <= 0:
            raise ValueError("VOICE_SAMPLE_RATE must be positive")
        if settings.sos_cooldown_seconds < 0:
            raise ValueError("VOICE_SOS_COOLDOWN_SECONDS cannot be negative")
        return settings


class VoiceCommandRouter:
    """Small if/elif command router, intentionally not a general assistant."""

    def __init__(
        self,
        audio: VoiceAudio,
        notifier: EmergencyNotifier,
        emergency_numbers: tuple[str, ...],
        sos_cooldown_seconds: float,
        emergency: EmergencyControl,
    ) -> None:
        self.audio = audio
        self.notifier = notifier
        self.emergency_numbers = emergency_numbers
        self.sos_cooldown_seconds = sos_cooldown_seconds
        self.emergency = emergency
        self._last_sos = float("-inf")

    def _say(self, message: str) -> None:
        try:
            self.audio.speak(message)
        except (OSError, RuntimeError):
            LOGGER.exception("Could not deliver spoken response: %s", message)

    def handle(self, recognized_text: str, now: float | None = None) -> str:
        command = " ".join(recognized_text.lower().strip().split())
        now = time.monotonic() if now is None else now
        if command in {"play music", "play song"}:
            self._say("Playing music")
            try:
                self.audio.play_music()
            except OSError:
                LOGGER.exception("Could not start music; voice listening will continue")
                self._say("I could not play the music")
                return "music_error"
            return "play_music"
        elif command in {"stop music", "stop song"}:
            try:
                stopped = self.audio.stop_music()
            except OSError:
                LOGGER.exception("Could not stop music; voice listening will continue")
                self._say("I could not stop the music")
                return "music_error"
            self._say("Music stopped" if stopped else "Music is already stopped")
            return "stop_music"
        elif command in {"start emergency alert", "initiate emergency alert"}:
            if not self.emergency.start("voice command"):
                self._say("Emergency alert is already active")
            return "start_emergency"
        elif command in {
            "stop emergency alert",
            "cancel emergency alert",
            "stop emergency",
            "cancel emergency",
            "stop sos",
            "cancel sos",
        }:
            if not self.emergency.cancel("voice command"):
                self._say("No emergency alert is active")
            return "cancel_emergency"
        elif command in {"send sos", "send emergency sos", "emergency sos"}:
            if now - self._last_sos < self.sos_cooldown_seconds:
                LOGGER.warning("SOS command ignored during %.0fs cooldown", self.sos_cooldown_seconds)
                self._say("Emergency SOS was already sent. Please wait")
                return "sos_cooldown"
            if not self.emergency_numbers:
                LOGGER.error("SOS command heard, but EMERGENCY_TO_NUMBERS is empty")
                self._say("Emergency contacts are not configured")
                return "sos_no_contacts"
            self._say("Sending emergency SOS")
            sent = 0
            for number in self.emergency_numbers:
                try:
                    self.notifier.send_sos_message(number)
                    sent += 1
                except Exception:
                    LOGGER.exception("Could not send voice SOS to %s", number)
            if sent == 0:
                self._say("Emergency message failed")
                return "sos_failed"
            self._last_sos = now
            LOGGER.warning("Voice SOS processed for %d contact(s)", sent)
            self._say("Emergency SOS sent")
            return "send_sos"
        LOGGER.debug("Ignoring unrecognized command: %r", command)
        self._say("Command not recognized")
        return "unknown"


def list_audio_devices() -> None:
    import sounddevice as sd

    print(sd.query_devices())


def run_voice_assistant(
    settings: VoiceSettings,
    stop_event: threading.Event | None = None,
    notifier: TwilioService | None = None,
    audio: AudioCoordinator | None = None,
    emergency: EmergencyController | None = None,
) -> None:
    if not settings.enabled:
        LOGGER.info("Voice assistant is disabled")
        return
    if not settings.model_path.is_dir():
        raise FileNotFoundError(
            f"Vosk model not found at {settings.model_path}. Run download_voice_model.py first."
        )

    owns_stop_event = stop_event is None
    stop_event = stop_event or threading.Event()
    if owns_stop_event:
        signal.signal(signal.SIGINT, lambda *_: stop_event.set())
        signal.signal(signal.SIGTERM, lambda *_: stop_event.set())

    import sounddevice as sd
    from vosk import KaldiRecognizer, Model, SetLogLevel

    SetLogLevel(-1)
    audio_queue: queue.Queue[bytes] = queue.Queue(maxsize=24)

    def audio_callback(indata: bytes, frames: int, callback_time: object, status: object) -> None:
        del frames, callback_time
        if status:
            LOGGER.warning("Microphone status: %s", status)
        try:
            audio_queue.put_nowait(bytes(indata))
        except queue.Full:
            LOGGER.warning("Microphone queue full; dropping one audio block")

    notifier = notifier or TwilioService()
    audio = audio or AudioCoordinator(
        Mpg123Player(settings.music_file, settings.output_device),
        EspeakFeedback(settings.output_device),
    )
    emergency = emergency or EmergencyController(
        audio,
        notifier,
        settings.emergency_numbers,
    )
    router = VoiceCommandRouter(
        audio,
        notifier,
        settings.emergency_numbers,
        settings.sos_cooldown_seconds,
        emergency,
    )
    model = Model(str(settings.model_path))
    grammar = json.dumps([*COMMAND_PHRASES, "[unk]"])
    recognizer = KaldiRecognizer(model, settings.sample_rate, grammar)

    LOGGER.info(
        "Voice assistant listening at %d Hz on input %r; commands: %s",
        settings.sample_rate,
        settings.input_device,
        ", ".join(COMMAND_PHRASES),
    )
    try:
        with sd.RawInputStream(
            samplerate=settings.sample_rate,
            blocksize=4000,
            device=settings.input_device,
            dtype="int16",
            channels=1,
            callback=audio_callback,
        ):
            while not stop_event.is_set():
                try:
                    data = audio_queue.get(timeout=0.25)
                except queue.Empty:
                    continue
                if recognizer.AcceptWaveform(data):
                    text = str(json.loads(recognizer.Result()).get("text", "")).strip()
                    if text:
                        LOGGER.info("Heard: %s", text)
                        router.handle(text)
    finally:
        if owns_stop_event:
            emergency.close()
            audio.close()
        LOGGER.info("Voice assistant stopped")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Offline voice commands for the helmet prototype")
    parser.add_argument("--list-devices", action="store_true", help="list microphone/audio devices")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).with_name(".env"))
        if args.list_devices:
            list_audio_devices()
            return 0
        run_voice_assistant(VoiceSettings.from_environment())
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        LOGGER.error("Voice assistant failure: %s", error)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
