const gpio = require('./gpio');
const spi = require('./spi');
const {sleep} = require('./helpers');
const {PINS, EPD_MODE, COMMANDS, EPD1X54} = require('./constants');

const logT = () =>
  chalk.dim(
    new Date()
      .toISOString()
      .substr(0, 19)
      .replace('T', ' ')
  );

const logE = str => console.log(`${logT()} ${chalk.bold.red(str)}`);
const log1 = str => console.log(`${logT()} ${chalk.bold.cyan(str)}`);
const log2 = str => console.log(`${logT()} ${chalk.yellow(str)}`);
const log3 = str => console.log(`${logT()} ${chalk.blue(str)}`);
const log4 = str => console.log(`${logT()} ${chalk.dim(str)}`);

class EPD {
  constructor(options = {}) {
    this._options = Object.assign(
      Object.assign(
        {},
        {
          mode: EPD_MODE.FULL,
          display: EPD1X54
        }
      ),
      options
    );

    this._ready = false;
    this._closed = false;
    this._terminated = false;

    const termimate = async () => {
      if (this._terminated) {
        return;
      }
      this._terminated = true;
      await this.exit();
      process.exit(0);
    };

    process.on('SIGINT', termimate);
    process.on('SIGTERM', termimate);
  }

  get isReady() {
    return this._ready;
  }

  get isClosed() {
    return this._closed;
  }

  get isTerminated() {
    return this._terminated;
  }

  getOption(key) {
    if (key in this._options) {
      return this._options[key];
    }
  }

  get mode() {
    return this.getOption('mode');
  }

  get width() {
    return this.getOption('display').xSize;
  }

  get height() {
    return this.getOption('display').ySize;
  }

  get xySize() {
    return [this.xSize, this.ySize];
  }

  init() {
    return new Promise(async (resolve, reject) => {
      try {
        // setup pins
        await GPIO.setup(PINS.RST, GPIO.DIR_OUT);
        await GPIO.setup(PINS.DC, GPIO.DIR_OUT);
        await GPIO.setup(PINS.CS, GPIO.DIR_OUT);
        await GPIO.setup(PINS.BUSY, GPIO.DIR_IN);
        // open spi
        await spi.open();
        // setup display mode
        if (this.mode === EPD_MODE.FULL) {
          await this.initDisplayFull();
          await this.clearDisplayFull();
        } else {
          await this.initDisplayPart();
          await this.clearDisplayPart();
        }
        // ready
        this._ready = true;
        resolve();
      } catch (err) {
        await this.exit();
        reject(err);
      }
    });
  }

  exit() {
    return new Promise(async (resolve, reject) => {
      if (this.isClosed || !this.isReady) {
        resolve();
        return;
      }
      try {
        this._closed = true;
        this._ready = false;
        // if (this.logs) {
        log1(`Shutting down${this.isTerminated ? ' (terminated)' : ''}...`);
        // }
        await spi.close();
        // if (this.logs > 1) {
        log2('SPI closed');
        // }
        await GPIO.destroy();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  readBusy() {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < 400; i++) {
        let busy = await GPIO.input(PINS.BUSY);
        if (busy === false) {
          // if (this.logs > 2) {
          log4(`busy is low ${i}`);
          // }
          resolve(true);
          return;
        }
        await sleep(10);
      }
      resolve(false);
    });
  }

  writeCommand(command, para = false) {
    return new Promise(async (resolve, reject) => {
      // if (this.logs > 2) {
      log4(`write command: ${command} ${para ? para : ''}`);
      // }
      if (para !== false) {
        await this.readBusy();
      }
      // await GPIO.output(PINS.CS, LOW); // not required?
      await PINS(PINS.DC, LOW);
      await spi.write(Buffer.from([command]));
      if (para !== false) {
        await PINS(PINS.DC, HIGH);
        await spi.write(Buffer.from([para]));
      }
      // await PINS(PINS.CS, HIGH); // not required?
      resolve();
    });
  }

  powerOn() {
    return new Promise(async (resolve, reject) => {
      await this.writeCommand(0x22, 0xc0);
      await this.writeCommand(0x20);
      resolve();
    });
  }

  writeData(data) {
    return new Promise(async (resolve, reject) => {
      // await GPIO.output(PINS.CS, LOW); // not required?
      await GPIO.output(PINS.DC, LOW);
      await sleep(10);
      await spi.write(Buffer.from([data.shift()]));
      await GPIO.output(PINS.DC, HIGH);
      if (data.length > 0) {
        await spi.write(data);
      }
      // await GPIO.output(PINS.CS, HIGH); // not required?
      resolve();
    });
  }

  writeDisplayRAM(xSize, ySize, data) {
    return new Promise(async (resolve, reject) => {
      if (xSize % 8 !== 0) {
        throw new Error('writeDisplayRAM: xSize must be multiple of 8');
      }
      if (!Array.isArray(data) && !Buffer.isBuffer(data)) {
        data = Array(xSize / 8 * ySize).fill(data);
      }
      await this.readBusy();
      // await GPIO.output(PINS.CS, LOW); // not required?
      await GPIO.output(PINS.DC, LOW);
      await spi.write(Buffer.from([0x24]));
      await GPIO.output(PINS.DC, HIGH);
      // clone data so buffer does not overrite origin
      await spi.write([...data]);
      // await GPIO.output(PINS.CS, HIGH); // not required?
      resolve();
    });
  }

  setRAMArea(xStart, xEnd, yStart, yStart1, yEnd, yEnd1) {
    return new Promise(async (resolve, reject) => {
      await this.writeData([0x44, xStart, xEnd]);
      await this.writeData([0x45, yStart, yStart1, yEnd, yEnd1]);
      resolve();
    });
  }

  setRAMPointer(xAddr, yAddr, yAddr1) {
    return new Promise(async (resolve, reject) => {
      await this.writeData([0x4e, xAddr]);
      await this.writeData([0x4f, yAddr, yAddr1]);
      resolve();
    });
  }

  setRAMAreaPointer(xStart, xEnd, yStart, yStart1, yEnd, yEnd1) {
    return new Promise(async (resolve, reject) => {
      await this.setRAMArea(xStart, xEnd, yStart, yStart1, yEnd, yEnd1);
      await this.setRAMPointer(xStart, yStart, yStart1);
      resolve();
    });
  }

  initDisplay() {
    return new Promise(async (resolve, reject) => {
      try {
        // await GPIO.output(PINS.CS, LOW);
        await GPIO.output(PINS.RST, LOW);
        await sleep(100);
        await GPIO.output(PINS.RST, HIGH);
        await sleep(100);
        let reset = await GPIO.input(PINS.RST);
        // if (this.logs) {
        log1(`reset is ${reset ? 'complete' : 'false'}`);
        // }
        // if (this.logs > 1) {
        log2('set register start');
        // }
        // Pannel configuration, Gate selection
        await this.writeData(this.display.GDO_CONTROL);
        // X decrease, Y decrease
        await this.writeData(COMMANDS.SOFT_START);
        // VCOM setting
        await this.writeData(COMMANDS.VCOM_VOL);
        // dummy line per gate
        await this.writeData(COMMANDS.DUMMY_LINE);
        // Gage time setting
        await this.writeData(COMMANDS.GATE_TIME);
        // X increase, Y decrease
        await this.writeData(COMMANDS.RAM_DATA_ENTRY_MODE);
        // X-source area, Y-gage area
        await this.setRAMArea(
          0x00,
          Math.floor((this.xSize - 1) / 8),
          (this.ySize - 1) % 256,
          Math.floor((this.ySize - 1) / 256),
          0x00,
          0x00
        );
        // set ram
        await this.setRAMPointer(
          0x00,
          (this.ySize - 1) % 256,
          Math.floor((this.ySize - 1) / 256)
        );
        // if (this.logs > 1) {
        log2('set register end');
        // }
      } catch (err) {
        logE(err);
        await this.exit();
        return;
      }
      resolve();
    });
  }

  updateDisplayFull() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.writeCommand(0x22, 0xc7);
        await this.writeCommand(0x20);
        await this.writeCommand(0xff);
        resolve();
      } catch (err) {
        logE(err);
        reject(err);
        return;
      }
    });
  }

  updateDisplayPart() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.writeCommand(0x22, 0x04);
        await this.writeCommand(0x20);
        await this.writeCommand(0xff);
        resolve();
      } catch (err) {
        logE(err);
        reject(err);
        return;
      }
    });
  }

  initDisplayFull() {
    return new Promise(async (resolve, reject) => {
      try {
        // if (this.logs) {
        log1('Fullscreen refresh mode');
        // }
        await this.initDisplay();
        await this.writeData(this.display.LUT_DEFAULT_FULL);
        await this.powerOn();
      } catch (err) {
        logE(err);
        reject(err);
        return;
      }
      await sleep(1500);
      resolve();
    });
  }

  initDisplayPart() {
    return new Promise(async (resolve, reject) => {
      try {
        // if (this.logs) {
        log1('Partial screen refresh mode');
        // }
        await this.initDisplay();
        await this.writeData(this.display.LUT_DEFAULT_PART);
        await this.powerOn();
      } catch (err) {
        logE(err);
        reject(err);
        return;
      }
      await sleep(1500);
      resolve();
    });
  }

  writeDisplayFull(data = 0xff) {
    return new Promise(async (resolve, reject) => {
      await this.setRAMPointer(
        0x00,
        (this.ySize - 1) % 256,
        Math.floor((this.ySize - 1) / 256)
      );
      await this.writeDisplayRAM(this.xSize, this.ySize, data);
      await this.updateDisplayFull();
      await sleep(1500);
      resolve();
    });
  }

  writeDisplayPart(xStart, xEnd, yStart, yEnd, data = 0xff) {
    return new Promise(async (resolve, reject) => {
      const writeRAM = async () =>
        new Promise(async (resolve, reject) => {
          await this.setRAMAreaPointer(
            Math.floor(xStart / 8),
            Math.floor(xEnd / 8),
            yEnd % 256,
            Math.floor(yEnd / 256),
            yStart % 256,
            Math.floor(yStart / 256)
          );
          await this.writeDisplayRAM(
            xEnd - xStart + 1,
            yEnd - yStart + 1,
            data
          );
          resolve();
        });
      await writeRAM();
      await this.updateDisplayPart();
      await sleep(50 /*500*/);
      await writeRAM();
      resolve();
    });
  }

  /**
   * @param {int} xStart - zero-based X offset from top-left of screen
   * @param {int} yStart - zero-based Y offset from top-left of screen
   * @param {int} xSize - width of image
   * @param {int} ySize - height of image
   * @param {array) data - image data
   */
  writeDisplayPart2(xStart, yStart, xSize, ySize, data) {
    if (xStart % 8 !== 0) {
      throw new Error('writeDisplayRAM: xStart must be multiple of 8');
    }
    if (xSize % 8 !== 0) {
      throw new Error('writeDisplayRAM: xSize must be multiple of 8');
    }
    return new Promise(async (resolve, reject) => {
      // convert from top-left pixel values supplied
      xStart = this.xSize - xSize - xStart;
      yStart = this.ySize - ySize - yStart;
      await this.writeDisplayPart(
        xStart,
        xStart + xSize - 1,
        yStart,
        yStart + ySize - 1,
        data
      );
      resolve();
    });
  }

  clearDisplayFull(data = 0xff) {
    return new Promise(async (resolve, reject) => {
      // await this.initDisplayFull();
      // await sleep(1500);
      // if (this.logs > 1) {
      log2('clear fullscreen');
      // }
      await this.writeDisplayFull(data);
      resolve();
    });
  }

  clearDisplayPart(
    xStart = 0,
    yStart = 0,
    xSize = this.xSize,
    ySize = this.ySize,
    data = 0xff
  ) {
    return new Promise(async (resolve, reject) => {
      // await this.initDisplayPart();
      // await sleep(1500);
      // if (this.logs > 1) {
      log2('clear partial screen');
      // }
      await this.writeDisplayPart2(xStart, yStart, xSize, ySize, data);
      resolve();
    });
  }
}

module.exports = {
  EPD: EPD,
  logT: logT,
  logE: logE,
  log1: log1,
  log2: log2,
  log3: log3,
  log4: log4,
  sleep: sleep
};
