import unittest

from helmet_monitor import TiltAlarm, Vector3


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


if __name__ == "__main__":
    unittest.main()
