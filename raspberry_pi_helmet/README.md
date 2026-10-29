# Raspberry Pi smart helmet prototype

This prototype runs four independent workers: an ADXL345 detects sustained
helmet tilt, an MQ-3 detects alcohol vapour, an offline voice assistant handles
a fixed command set through a headset, and a touch switch provides a
cancellable emergency countdown. A shared Twilio service sends bounded alerts
to configured family contacts. A hardware failure in one worker does not stop
the others.

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
- MQ-3 module with a digital `DO` output
- 3.3 V-compatible active buzzer module
- USB headset with microphone and speakers (the demo uses Hammer X)
- Three-pin digital touch-switch module (commonly TTP223-style)
- Jumper wires

## Complete Raspberry Pi 3B+ connection map

The table uses **BCM GPIO numbering**, matching the `.env` configuration. Turn
the Pi off and disconnect power while wiring.

| Device | Device pin | Raspberry Pi 3B+ connection | Physical pin |
| --- | --- | --- | --- |
| ADXL345 | VCC/VIN | 3.3 V | 1 |
| ADXL345 | GND | GND | 6 |
| ADXL345 | SDA | BCM GPIO2 / SDA1 | 3 |
| ADXL345 | SCL | BCM GPIO3 / SCL1 | 5 |
| ADXL345 | CS | 3.3 V for I²C mode | 17 |
| ADXL345 | SDO/ALT | GND for address `0x53` | 9 |
| MQ-3 module | VCC | 5 V | 2 or 4 |
| MQ-3 module | GND | GND | 14 |
| MQ-3 module | DO | BCM GPIO27 **through a 5 V-to-3.3 V level shifter/divider** | 13 |
| MQ-3 module | AO | Not connected without an ADC | — |
| Touch switch | VCC | 3.3 V | 17 |
| Touch switch | GND | GND | 20 |
| Touch switch | OUT/SIG | BCM GPIO22 | 15 |
| Active buzzer module | SIG/IN | BCM GPIO17 | 11 |
| Active buzzer module | GND | GND | 25 |
| USB headset | USB | Any Pi USB port | — |

All modules must share ground. Different physical GND pins are electrically
common, so using a breadboard ground rail is fine. A 3.3 V breadboard rail can
likewise feed the ADXL345 VCC/CS pins and touch-switch VCC. Do not connect any
5 V signal directly to a GPIO pin.

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
pull resistors, so check the board's own pinout. If your breakout is labelled
`VIN` and explicitly includes a regulator/level shifter, follow its board
documentation; otherwise use 3.3 V.

### Buzzer wiring

The default signal pin is BCM GPIO17 (physical pin 11). Connect a compatible
active buzzer module according to its pinout. Do not drive a raw or high-current
buzzer directly from a GPIO pin; use a transistor/driver and flyback protection
where the buzzer hardware requires it.

### MQ-3 digital wiring

The Raspberry Pi has no analog input, so the current hardware should use the
MQ-3 module's digital comparator output:

- Power the module from 5 V and GND.
- Leave `AO` disconnected.
- Connect `DO` to BCM GPIO27 through a logic-level shifter. If a shifter is not
  available, a divider suitable for a 5 V digital output can be made with a
  10 kΩ resistor from `DO` to GPIO27 and a 15 kΩ resistor from GPIO27 to GND.
- Keep `MQ3_MODE=digital` and `MQ3_DIGITAL_ACTIVE_LOW=true` in `.env`. Common
  LM393-based modules pull `DO` low when their adjustable threshold is crossed.
- Turn the module potentiometer to set its digital trigger point while watching
  the monitor logs.

Power the heater according to the exact module data sheet. Many modules use 5 V
and may output up to 5 V on `AO`/`DO`; **never feed 5 V into a Raspberry Pi GPIO
or MCP3008 input**. Use a proper divider/level shifter and verify voltage with a
meter. Keep the hot sensor away from the wearer's face during bench testing.

MQ-3 readings indicate nearby alcohol vapour, not blood-alcohol concentration.
They are not suitable for medical, legal, or driving-safety decisions. Smoke,
sanitizer, perfume, temperature, airflow, and sensor age can affect readings.

`MQ3_WARMUP_SECONDS=60` is only a quick demonstration delay. A new MQ-series
sensor can require a much longer initial burn-in and must be calibrated for any
repeatable measurement. Never place liquid alcohol on the sensor or test near
an open flame; the heater becomes hot and alcohol vapour is flammable.

### Touch-switch emergency input

The default configuration targets a common three-pin, momentary, active-high
touch module:

- `VCC` → Pi 3.3 V, physical pin 17
- `GND` → Pi GND, physical pin 20
- `OUT`/`SIG` → BCM GPIO22, physical pin 15
- `.env`: `EMERGENCY_BUTTON_ACTIVE_LOW=false`

Power the touch module from 3.3 V so its output is GPIO-safe. Some touch modules
have solder bridges for momentary/toggle and active-high/active-low behaviour;
use momentary mode. If your module drives `OUT` low when touched, change
`EMERGENCY_BUTTON_ACTIVE_LOW=true`. If it remains latched after one touch,
change the module's hardware mode rather than relying on software debouncing.

- First press: pause music and start the spoken eight-second countdown.
- Second press before zero: cancel the alert and resume music.
- At zero: send SOS to every configured contact, speak the result, and resume
  music from its paused position.

### USB headset connection

The Raspberry Pi 3B+ analogue jack is output-only and cannot capture the
headset microphone. Plug the Hammer headset into a Pi USB port. If the headset
has only a combined 3.5 mm plug, use a USB audio adapter that explicitly
supports both headphone output and microphone input.

The headset consumes no GPIO pins. Connect it before starting the Python
service so ALSA and PortAudio can enumerate it consistently.

## Raspberry Pi setup

Enable I2C:

```bash
sudo raspi-config
```

Choose **Interface Options → I2C → Enable**. SPI is not needed while using the
MQ-3 digital output. Install the tools and verify that the ADXL345 appears as
`53` or `1d`:

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip i2c-tools \
  libportaudio2 portaudio19-dev alsa-utils mpg123 espeak-ng
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

For the ADXL345 + MQ-3 digital output + active-high touch switch + USB headset
described above, start with these values:

```dotenv
DRY_RUN=true

ADXL345_I2C_BUS=1
ADXL345_ADDRESS=0x53
BUZZER_GPIO=17

MQ3_ENABLED=true
MQ3_MODE=digital
MQ3_DIGITAL_GPIO=27
MQ3_DIGITAL_ACTIVE_LOW=true

EMERGENCY_BUTTON_ENABLED=true
EMERGENCY_BUTTON_GPIO=22
EMERGENCY_BUTTON_ACTIVE_LOW=false
EMERGENCY_COUNTDOWN_SECONDS=8

VOICE_ASSISTANT_ENABLED=true
VOICE_INPUT_DEVICE=
VOICE_OUTPUT_DEVICE=
```

Grant the normal service user access to the hardware interfaces, then sign out
and back in (or reboot):

```bash
sudo usermod -aG gpio,i2c,audio "$USER"
sudo reboot
```

## Offline voice assistant setup

The voice worker uses Vosk's small English model. It is roughly 40 MB on disk
and typically needs about 300 MB of runtime memory. Download it once:

```bash
python download_voice_model.py
mkdir -p media
```

Copy a legally obtained MP3 to `media/demo.mp3`, or change `MUSIC_FILE` in
`.env`. Models and MP3 files are intentionally ignored by Git.

Connect the headset before starting. List input devices with:

```bash
python voice_assistant.py --list-devices
arecord -l
aplay -l
```

Set `VOICE_INPUT_DEVICE` to the sounddevice ID or a unique part of its name.
Set `VOICE_OUTPUT_DEVICE` to an ALSA device such as `plughw:2,0`, or leave both
blank when the Hammer headset is already the system default input/output.

Test the worker by itself:

```bash
python voice_assistant.py
```

Supported phrases are deliberately limited to improve speed and accuracy:

- `play music` or `play song`
- `stop music` or `stop song`
- `send SOS`, `send emergency SOS`, or `emergency SOS`
- `start emergency alert` or `initiate emergency alert`
- `stop emergency alert`, `cancel emergency alert`, `stop emergency`,
  `cancel emergency`, `stop SOS`, or `cancel SOS`

An SOS is sent once to every configured emergency number. Further voice SOS
commands are ignored for five minutes by default to prevent duplicate texts.
Every accepted command produces a spoken response. If music is playing, it is
paused at its current position while the response is spoken and then resumed.

The touch-switch countdown can be cancelled by touching the switch again or
speaking one of the predefined stop/cancel phrases. Test this with
`DRY_RUN=true` before allowing real SMS delivery.

> The touch switch bypasses microphone and speech-recognition failure, but
> it still depends on the Raspberry Pi, this Python service, power, networking,
> and Twilio. A fail-safe that works after a complete Pi/OS failure requires an
> independent microcontroller and cellular/GSM communication path.

## Recommended hardware bring-up order

Do not connect every part and immediately enable real alerts. Verify one layer
at a time:

1. **Power off and inspect wiring.** Confirm the ADXL345 and touch switch use
   3.3 V, the MQ-3 module uses its required 5 V heater supply, all grounds are
   common, and MQ-3 `DO` is level-shifted before GPIO27.
2. **Verify the ADXL345.** Boot, enable I²C, and run `i2cdetect -y 1`. Expect
   `53` with the documented SDO wiring. Change `ADXL345_ADDRESS=0x1D` only if
   the scan actually shows `1d`.
3. **Verify the USB headset.** Run `arecord -l`, `aplay -l`, and
   `python voice_assistant.py --list-devices`. Record and replay five seconds:

   ```bash
   arecord -f S16_LE -r 16000 -c 1 -d 5 /tmp/asonyx-mic-test.wav
   aplay /tmp/asonyx-mic-test.wav
   ```

   If the wrong device is used, select the headset in the OS audio settings or
   set `VOICE_INPUT_DEVICE` and `VOICE_OUTPUT_DEVICE` in `.env`.
4. **Verify spoken commands.** Download the Vosk model, add `media/demo.mp3`,
   keep `DRY_RUN=true`, and run `python voice_assistant.py`. Confirm play,
   pause-for-response, resume, stop, and SOS cooldown behaviour.
5. **Verify the touch switch.** Run `python smart_helmet_monitor.py`, touch once
   to start the eight-second countdown, then touch again before zero. It must
   speak that the alert was cancelled and must not log an SMS attempt after
   cancellation.
6. **Verify MQ-3 digital detection.** Allow the sensor to warm, observe
   `mq3_level` logs, and adjust its comparator potentiometer. In digital mode
   logs are `0.000` or `1.000`. If detection is inverted, first confirm the
   module documentation and then change `MQ3_DIGITAL_ACTIVE_LOW`.
7. **Test Twilio last.** Add only verified trial recipients, trigger each alert
   with `DRY_RUN=true`, inspect the message bodies, and only then set
   `DRY_RUN=false`.

Use a stable 5 V / 2.5 A Raspberry Pi 3B+ supply. The MQ-3 heater and USB
headset add load. If the Pi reports undervoltage or disconnects the headset,
use a better supply or a powered USB hub. Check throttling/undervoltage with:

```bash
vcgencmd get_throttled
```

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

## Run the complete prototype

Place the helmet upright in the same orientation it will normally be worn, keep
it still during calibration, and run:

```bash
source .venv/bin/activate
python smart_helmet_monitor.py
```

The default behavior is:

- Calibrate from 50 readings (about five seconds).
- Start the buzzer above 55 degrees from the calibrated upright vector.
- Send one SMS after the tilt remains above 55 degrees for two seconds.
- Require the helmet to remain below 20 degrees before re-arming.
- Enforce a five-minute notification cooldown.
- Suppress MQ-3 alerts during warm-up.
- Require the MQ-3 reading to remain high for three seconds.
- Send at most two alcohol alert rounds during one continuous incident.
- Rearm alcohol alerts only after the reading stays clear for 30 seconds.
- Listen for the fixed offline voice commands while both sensors keep running.
- Monitor the emergency touch switch and provide a cancellable countdown.

All values can be changed in `.env`. Start with conservative tests on a bench;
do not tune thresholds while riding.

For individual hardware troubleshooting, run `python helmet_monitor.py`,
`python alcohol_monitor.py`, or `python voice_assistant.py` instead.

### Start automatically and recover after a process crash

The touch switch requires this program to be running. For the prototype, install the
included systemd service so it starts at boot and restarts after a software
process crash. First edit `asonyx-helmet.service.example` if the repository is
not located at `/home/pi/Asonyx.ai` or the Linux user is not `pi`, then run:

```bash
sudo cp asonyx-helmet.service.example /etc/systemd/system/asonyx-helmet.service
sudo systemctl daemon-reload
sudo systemctl enable --now asonyx-helmet.service
sudo systemctl status asonyx-helmet.service
```

Follow its logs with:

```bash
journalctl -u asonyx-helmet.service -f
```

## Twilio service functions

`twilio_services.py` exposes reusable helpers. Each accepts an optional
`(latitude, longitude)` tuple and includes a Google Maps link when provided:

```python
from twilio_services import (
    send_accident_sms,
    send_custom_sos_message,
    send_sms_alcohol,
    send_sos_message,
)

location = (28.6139, 77.2090)
send_sms_alcohol("+919876543210", location)
send_accident_sms("+919876543210", location)
send_sos_message("+919876543210", location)
send_custom_sos_message("+919876543210", "Bike stopped near the highway", location)
```

Each recipient consumes a separate Twilio SMS. Two rounds sent to three family
numbers therefore consume six trial messages.

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
- **MQ-3 always active:** allow its required burn-in/warm-up, check output
  voltage, adjust the comparator potentiometer in digital mode, and observe a
  sober baseline before changing analog thresholds.
- **No headset audio:** connect the headset before launching, inspect devices
  with `voice_assistant.py --list-devices`, `arecord -l`, and `aplay -l`, then
  set `VOICE_INPUT_DEVICE` and `VOICE_OUTPUT_DEVICE` in `.env`.
- **Voice worker says model missing:** run `python download_voice_model.py`.
- **Music command fails:** ensure `mpg123` is installed and `MUSIC_FILE` points
  to a readable MP3.
- **No spoken confirmation:** install `espeak-ng` and `alsa-utils`, then verify
  that `VOICE_OUTPUT_DEVICE` is an output accepted by `aplay -D`.
- **Button does nothing:** confirm BCM numbering, connect GPIO22 to GND only
  while pressed, and check that `EMERGENCY_BUTTON_ENABLED=true`.

## Primary references

- [ADXL345 data sheet](https://www.analog.com/media/en/technical-documentation/data-sheets/adxl345.pdf)
- [MQ-3 data sheet](https://www.winsen-sensor.com/d/files/manual/mq-3.pdf)
- [Vosk models](https://alphacephei.com/vosk/models)
- [Vosk microphone example](https://github.com/alphacep/vosk-api/blob/master/python/example/test_microphone.py)
- [Raspberry Pi I2C configuration](https://www.raspberrypi.com/documentation/computers/configuration.html#enable-or-disable-i2c)
- [Twilio SMS quickstart](https://www.twilio.com/docs/messaging/quickstart)
- [Twilio trial restrictions](https://www.twilio.com/docs/usage/trials)
