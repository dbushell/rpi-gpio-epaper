# rpi-gpio-epaper
Control e-paper modules on the Raspberry Pi GPIO with Node.js

This code has been tested with the [Waveshare 1.54inch](http://www.waveshare.com/wiki/1.54inch_e-Paper_Module) but should be adaptable for other sizes.

Coming soon...

## Usage

Coming soon...

## Dependencies

This library uses [**rpi-gpio.js**](https://github.com/JamesBarwell/rpi-gpio.js) and [**node-spi**](https://github.com/RussTheAerialist/node-spi). The former depends on [epoll](https://github.com/fivdi/epoll) which currently only builds on Linux systems. I develop with Node and Vim on the Raspberry Pi itself.

## Sources

This code is based on the [Waveshare python demo](http://www.waveshare.com/wiki/File:1.54inch_e-Paper_Module_code.7z) which provides a handy installation guide:

### Raspberry Pi GPIO Pin map

| BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
|-----|-----|---------|------|---|----------|---|------|---------|-----|-----|
|     |     |    3.3v |      |   |`01 -- 02`|   |      | 5v      |     |     |
|   2 |   8 |   SDA.1 |   IN | 1 |`03 -- 04`|   |      | 5v      |     |     |
|   3 |   9 |   SCL.1 |   IN | 1 |`05 -- 06`|   |      | 0v      |     |     |
|   4 |   7 | GPIO. 7 |   IN | 1 |`07 -- 08`| 1 | ALT5 | TxD     | 15  | 14  |
|     |     |      0v |      |   |`09 -- 10`| 1 | ALT5 | RxD     | 16  | 15  |
|  17 |   0 | GPIO. 0 |   IN | 0 |`11 -- 12`| 0 | IN   | GPIO. 1 | 1   | 18  |
|  27 |   2 | GPIO. 2 |   IN | 0 |`13 -- 14`|   |      | 0v      |     |     |
|  22 |   3 | GPIO. 3 |   IN | 0 |`15 -- 16`| 0 | IN   | GPIO. 4 | 4   | 23  |
|     |     |    3.3v |      |   |`17 -- 18`| 0 | IN   | GPIO. 5 | 5   | 24  |
|  10 |  12 |    MOSI | ALT0 | 0 |`19 -- 20`|   |      | 0v      |     |     |
|   9 |  13 |    MISO | ALT0 | 0 |`21 -- 22`| 0 | IN   | GPIO. 6 | 6   | 25  |
|  11 |  14 |    SCLK | ALT0 | 0 |`23 -- 24`| 1 | OUT  | CE0     | 10  | 8   |
|     |     |      0v |      |   |`25 -- 26`| 1 | OUT  | CE1     | 11  | 7   |
|   0 |  30 |   SDA.0 |   IN | 1 |`27 -- 28`| 1 | IN   | SCL.0   | 31  | 1   |
|   5 |  21 | GPIO.21 |   IN | 1 |`29 -- 30`|   |      | 0v      |     |     |
|   6 |  22 | GPIO.22 |   IN | 1 |`31 -- 32`| 0 | IN   | GPIO.26 | 26  | 12  |
|  13 |  23 | GPIO.23 |   IN | 0 |`33 -- 34`|   |      | 0v      |     |     |
|  19 |  24 | GPIO.24 |  OUT | 1 |`35 -- 36`| 1 | OUT  | GPIO.27 | 27  | 16  |
|  26 |  25 | GPIO.25 |   IN | 0 |`37 -- 38`| 0 | IN   | GPIO.28 | 28  | 20  |
|     |     |      0v |      |   |`39 -- 40`| 0 | IN   | GPIO.29 | 29  | 21  |

Copyright (c) 2017 Waveshare

#### Hardware connection

| EPD  | Raspberry Pi               |
|------|----------------------------|
| VCC  | 3.3                        |
| GND  | GND                        |
| DIN  | MOSI                       |
| CLK  | SCLK                       |
| CS   | 24 (Physical, BCM: CE0, 8) |
| D/C  | 22 (Physical, BCM: 25)     |
| RES  | 11 (Physical, BCM: 17)     |
| BUSY | 18 (Physical, BCM: 24)     |

* * *

Copyright (c) 2017 [David Bushell](https://dbushell.com/) | [MIT License](https://github.com/dbushell/rpi-gpio-epaper/blob/master/LICENSE)
