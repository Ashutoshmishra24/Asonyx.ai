import unittest

from alcohol_monitor import AlcoholAlarm
from emergency_system import EmergencyController
from helmet_monitor import TiltAlarm, Vector3
from twilio_services import TwilioConfig, TwilioService
from voice_assistant import VoiceCommandRouter


class VectorTests(unittest.TestCase):
    def test_angle_between_vectors(self) -> None:
        upright = Vector3(0, 0, 1)
        self.assertAlmostEqual(upright.angle_to(Vector3(0, 0, 1)), 0)
        self.assertAlmostEqual(upright.angle_to(Vector3(1, 0, 0)), 90)
        self.assertAlmostEqual(upright.angle_to(Vector3(0, 0, -1)), 180)


class TiltAlarmTests(unittest.TestCase):
    def make_alarm(self) -> TiltAlarm:
        return TiltAlarm(
            threshold_degrees=55,
            hold_seconds=2,
            reset_threshold_degrees=20,
            reset_hold_seconds=5,
            cooldown_seconds=10,
        )

    def test_requires_sustained_tilt_before_notification(self) -> None:
        alarm = self.make_alarm()
        self.assertFalse(alarm.update(60, 0).notify)
        self.assertFalse(alarm.update(60, 1.9).notify)
        decision = alarm.update(60, 2.0)
        self.assertTrue(decision.beep)
        self.assertTrue(decision.notify)
        self.assertFalse(decision.armed)
        self.assertFalse(alarm.update(60, 4.0).notify)

    def test_rearms_after_upright_period_and_cooldown(self) -> None:
        alarm = self.make_alarm()
        alarm.update(60, 0)
        self.assertTrue(alarm.update(60, 2).notify)
        alarm.update(10, 3)
        self.assertFalse(alarm.update(10, 8).armed)
        self.assertTrue(alarm.update(10, 12).armed)
        alarm.update(60, 13)
        self.assertTrue(alarm.update(60, 15).notify)

    def test_brief_tilt_does_not_trigger(self) -> None:
        alarm = self.make_alarm()
        alarm.update(70, 0)
        alarm.update(10, 1)
        self.assertFalse(alarm.update(70, 2).notify)


class AlcoholAlarmTests(unittest.TestCase):
    def make_alarm(self) -> AlcoholAlarm:
        return AlcoholAlarm(
            threshold=0.6,
            hold_seconds=2,
            clear_threshold=0.4,
            clear_hold_seconds=5,
            repeat_seconds=10,
            max_notifications=2,
        )

    def test_sends_only_two_notifications_during_one_incident(self) -> None:
        alarm = self.make_alarm()
        self.assertFalse(alarm.update(0.8, 0).notify)
        self.assertTrue(alarm.update(0.8, 2).notify)
        self.assertFalse(alarm.update(0.8, 11).notify)
        self.assertTrue(alarm.update(0.8, 12).notify)
        self.assertFalse(alarm.update(0.8, 100).notify)
        self.assertEqual(alarm.update(0.8, 200).notification_number, 2)

    def test_rearms_only_after_clear_hold(self) -> None:
        alarm = self.make_alarm()
        alarm.update(0.8, 0)
        alarm.update(0.8, 2)
        alarm.update(0.2, 3)
        alarm.update(0.2, 8)
        alarm.update(0.8, 9)
        self.assertTrue(alarm.update(0.8, 11).notify)


class TwilioServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = TwilioService(TwilioConfig("", "", "", dry_run=True))

    def test_dry_run_accepts_optional_gps_tuple(self) -> None:
        self.assertIsNone(self.service.send_sos_message("+919876543210", (28.6139, 77.2090)))

    def test_rejects_invalid_gps_tuple(self) -> None:
        with self.assertRaises(ValueError):
            self.service.send_sos_message("+919876543210", (120.0, 77.0))


class FakeAudio:
    def __init__(self) -> None:
        self.play_calls = 0
        self.stop_calls = 0
        self.pause_calls = 0
        self.resume_calls = 0
        self.spoken: list[str] = []

    def play_music(self) -> bool:
        self.play_calls += 1
        return True

    def stop_music(self) -> bool:
        self.stop_calls += 1
        return True

    def speak(self, message: str, manage_music: bool = True) -> None:
        del manage_music
        self.spoken.append(message)

    def pause_music(self) -> bool:
        self.pause_calls += 1
        return True

    def resume_music(self) -> bool:
        self.resume_calls += 1
        return True


class FakeNotifier:
    def __init__(self) -> None:
        self.numbers: list[str] = []

    def send_sos_message(self, number: str) -> None:
        self.numbers.append(number)


class FakeEmergency:
    def __init__(self) -> None:
        self.started = 0
        self.cancelled = 0
        self.active = False

    def start(self, source: str) -> bool:
        del source
        if self.active:
            return False
        self.active = True
        self.started += 1
        return True

    def cancel(self, source: str) -> bool:
        del source
        if not self.active:
            return False
        self.active = False
        self.cancelled += 1
        return True


class VoiceCommandTests(unittest.TestCase):
    def setUp(self) -> None:
        self.audio = FakeAudio()
        self.notifier = FakeNotifier()
        self.emergency = FakeEmergency()
        self.router = VoiceCommandRouter(
            self.audio,
            self.notifier,
            ("+919876543210", "+919876543211"),
            sos_cooldown_seconds=300,
            emergency=self.emergency,
        )

    def test_music_commands(self) -> None:
        self.assertEqual(self.router.handle("play music", now=0), "play_music")
        self.assertEqual(self.router.handle("stop music", now=1), "stop_music")
        self.assertEqual(self.audio.play_calls, 1)
        self.assertEqual(self.audio.stop_calls, 1)
        self.assertEqual(self.audio.spoken[:2], ["Playing music", "Music stopped"])

    def test_sos_sends_once_per_contact_and_obeys_cooldown(self) -> None:
        self.assertEqual(self.router.handle("send emergency sos", now=1000), "send_sos")
        self.assertEqual(self.router.handle("send sos", now=1001), "sos_cooldown")
        self.assertEqual(self.notifier.numbers, ["+919876543210", "+919876543211"])

    def test_voice_can_start_and_cancel_emergency_countdown(self) -> None:
        self.assertEqual(
            self.router.handle("start emergency alert", now=0),
            "start_emergency",
        )
        self.assertEqual(
            self.router.handle("stop emergency alert", now=1),
            "cancel_emergency",
        )
        self.assertEqual(self.emergency.started, 1)
        self.assertEqual(self.emergency.cancelled, 1)


class EmergencyControllerTests(unittest.TestCase):
    def test_cancel_during_countdown_prevents_sms_and_resumes_music(self) -> None:
        audio = FakeAudio()
        notifier = FakeNotifier()
        controller = EmergencyController(
            audio,  # type: ignore[arg-type]
            notifier,
            ("+919876543210",),
            countdown_seconds=1,
        )
        self.assertTrue(controller.start("test button"))
        self.assertTrue(controller.cancel("second press"))
        controller.close()
        self.assertEqual(notifier.numbers, [])
        self.assertIn("Emergency alert cancelled", audio.spoken)
        self.assertEqual(audio.pause_calls, 1)
        self.assertEqual(audio.resume_calls, 1)


if __name__ == "__main__":
    unittest.main()
