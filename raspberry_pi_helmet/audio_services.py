"""Low-resource music and spoken-feedback services."""

from __future__ import annotations

import logging
import os
import signal
import subprocess
import threading
from pathlib import Path

LOGGER = logging.getLogger("asonyx.audio")


class Mpg123Player:
    """Play one local MP3 and support position-preserving pause/resume."""

    def __init__(self, music_file: Path, output_device: str = "") -> None:
        self.music_file = music_file
        self.output_device = output_device.strip()
        self._process: subprocess.Popen[bytes] | None = None
        self._paused = False
        self._lock = threading.RLock()

    @property
    def is_playing(self) -> bool:
        with self._lock:
            return self._process is not None and self._process.poll() is None

    @property
    def is_paused(self) -> bool:
        with self._lock:
            return self.is_playing and self._paused

    def play(self) -> bool:
        with self._lock:
            if self.is_playing:
                if self._paused:
                    return self.resume()
                LOGGER.info("Music is already playing")
                return False
            if not self.music_file.is_file():
                raise FileNotFoundError(f"Music file not found: {self.music_file}")
            command = ["mpg123", "-q"]
            if self.output_device:
                command.extend(["-a", self.output_device])
            command.append(str(self.music_file))
            self._process = subprocess.Popen(
                command,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            self._paused = False
            LOGGER.info("Playing %s", self.music_file)
            return True

    def pause(self) -> bool:
        with self._lock:
            if not self.is_playing or self._paused:
                return False
            assert self._process is not None
            os.kill(self._process.pid, signal.SIGSTOP)
            self._paused = True
            return True

    def resume(self) -> bool:
        with self._lock:
            if not self.is_playing or not self._paused:
                return False
            assert self._process is not None
            os.kill(self._process.pid, signal.SIGCONT)
            self._paused = False
            return True

    def stop(self) -> bool:
        with self._lock:
            if not self.is_playing:
                self._process = None
                self._paused = False
                LOGGER.info("Music is already stopped")
                return False
            assert self._process is not None
            self._process.terminate()
            try:
                self._process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self._process.kill()
                self._process.wait(timeout=2)
            self._process = None
            self._paused = False
            LOGGER.info("Music stopped")
            return True


class EspeakFeedback:
    """Speak through espeak-ng piped to an ALSA output device."""

    def __init__(self, output_device: str = "", speed: int = 165) -> None:
        self.output_device = output_device.strip()
        self.speed = speed

    def speak(self, message: str) -> None:
        if not message.strip():
            return
        espeak = subprocess.Popen(
            ["espeak-ng", "--stdout", "-s", str(self.speed), message],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
        assert espeak.stdout is not None
        aplay_command = ["aplay", "-q"]
        if self.output_device:
            aplay_command.extend(["-D", self.output_device])
        aplay = subprocess.Popen(
            aplay_command,
            stdin=espeak.stdout,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        espeak.stdout.close()
        aplay_result = aplay.wait()
        espeak_result = espeak.wait()
        if espeak_result != 0 or aplay_result != 0:
            raise RuntimeError("Spoken feedback command failed")


class AudioCoordinator:
    """Prevent music and spoken responses from playing over each other."""

    def __init__(self, player: Mpg123Player, feedback: EspeakFeedback) -> None:
        self.player = player
        self.feedback = feedback
        self._speech_lock = threading.Lock()

    def play_music(self) -> bool:
        return self.player.play()

    def stop_music(self) -> bool:
        return self.player.stop()

    def pause_music(self) -> bool:
        return self.player.pause()

    def resume_music(self) -> bool:
        return self.player.resume()

    def speak(self, message: str, manage_music: bool = True) -> None:
        with self._speech_lock:
            resume_after = manage_music and self.player.pause()
            try:
                LOGGER.info("Speaking: %s", message)
                self.feedback.speak(message)
            finally:
                if resume_after:
                    self.player.resume()

    def close(self) -> None:
        self.player.stop()
