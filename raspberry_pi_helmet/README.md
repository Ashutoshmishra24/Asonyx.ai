# Raspberry Pi helmet tilt prototype

This prototype reads an ADXL345 accelerometer over I2C, compares its gravity
vector with an upright reference captured at startup, activates a buzzer when
the configured tilt threshold is crossed, and sends a Twilio SMS after the tilt
has remained excessive for a short hold period.

It is intentionally isolated from the Expo app. The sensor and alarm classes
are small interfaces so additional sensors and notification channels can be
added later.

> This is a prototype, not a certified crash detector or emergency service.
> Do not rely on it as the only safety mechanism. SMS delivery needs power,
> internet access, Twilio availability, and carrier delivery, and is not
> guaranteed.

## Hardware assumed

- Raspberry Pi with Raspberry Pi OS and internet access
- ADXL345 breakout board configured for I2C
- 3.3 V-compatible active buzzer module
- Jumper wires

### ADXL345 wiring

| ADXL345 | Raspberry Pi |
| --- | --- |
| VCC/VIN | 3.3 V (physical pin 1) |
| GND | GND (physical pin 6) |
| SDA | GPIO2/SDA (physical pin 3) |
| SCL | GPIO3/SCL (physical pin 5) |
| CS | 3.3 V for I2C mode |
| SDO/ALT | GND for address `0x53`, or 3.3 V for `0x1D` |

The official ADXL345 data sheet requires CS to be driven high for I2C mode; do
not leave CS or SDO/ALT floating. Some breakout boards already provide these
pull resistors, so check the board's own pinout.

### Buzzer wiring

The default signal pin is BCM GPIO17 (physical pin 11). Connect a compatible
active buzzer module according to its pinout. Do not drive a raw or high-current
buzzer directly from a GPIO pin; use a transistor/driver and flyback protection
where the buzzer hardware requires it.

## Raspberry Pi setup

Enable I2C:

```bash
sudo raspi-config
```

Choose **Interface Options → I2C → Enable**, then install the tools and verify
that the sensor appears as `53` or `1d`:

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip i2c-tools
i2cdetect -y 1
```

Create an isolated Python environment:

```bash
cd raspberry_pi_helmet
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`. Keep `DRY_RUN=true` for the first tests. The real `.env` is
ignored by the repository and must never be committed.

## Twilio trial setup

1. Create a Twilio trial and open **Messaging → Try out SMS**.
2. Verify the emergency recipient number. Trial accounts can message only
   verified recipients and have country, time, message-content, and usage
   restrictions.
3. Copy the Account SID, Auth Token, assigned SMS sender number, and verified
   recipient into `.env` using E.164 format such as `+919876543210`.
4. Tilt-test with `DRY_RUN=true` and watch the log first.
5. Change `DRY_RUN=false` only when the physical test setup is safe.

Example configuration:

```dotenv
DRY_RUN=false
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=replace-with-the-real-token
TWILIO_FROM_NUMBER=+10000000000
EMERGENCY_TO_NUMBERS=+919876543210
```

Multiple verified recipients may be comma-separated, although the current
trial limit is up to five verified recipients. Current Twilio trials expire
after 30 days and include a limited SMS allowance; check the Console because
availability and permitted content vary by country and trial type.

## Run

Place the helmet upright in the same orientation it will normally be worn, keep
it still during calibration, and run:

```bash
source .venv/bin/activate
python helmet_monitor.py
```

The default behavior is:

- Calibrate from 50 readings (about five seconds).
- Start the buzzer above 55 degrees from the calibrated upright vector.
- Send one SMS after the tilt remains above 55 degrees for two seconds.
- Require the helmet to remain below 20 degrees before re-arming.
- Enforce a five-minute notification cooldown.

All values can be changed in `.env`. Start with conservative tests on a bench;
do not tune thresholds while riding.

Run the hardware-independent tests on any computer:

```bash
python -m unittest -v test_helmet_monitor.py
```

## Troubleshooting

- **No device in `i2cdetect`:** confirm I2C is enabled, CS is high, SDO/ALT is
  not floating, and `ADXL345_ADDRESS` matches `0x53` or `0x1D`.
- **Permission denied for I2C/GPIO:** add the service user to the relevant
  `i2c` and `gpio` groups, then sign out and back in. Avoid running the whole
  monitor as root when group permissions are sufficient.
- **Twilio error 14111:** the destination is not verified for the trial.
- **No SMS:** confirm internet access, E.164 phone formatting, trial expiry,
  geographic permissions, permitted trial message content, and Twilio logs.
- **False alarms:** increase `TILT_HOLD_SECONDS` before increasing the angle;
  helmet vibration and a dropped-but-empty helmet need separate future sensor
  logic to distinguish them reliably.

## Primary references

- [ADXL345 data sheet](https://www.analog.com/media/en/technical-documentation/data-sheets/adxl345.pdf)
- [Raspberry Pi I2C configuration](https://www.raspberrypi.com/documentation/computers/configuration.html#enable-or-disable-i2c)
- [Twilio SMS quickstart](https://www.twilio.com/docs/messaging/quickstart)
- [Twilio trial restrictions](https://www.twilio.com/docs/usage/trials)
