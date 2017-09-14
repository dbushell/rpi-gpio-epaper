const chalk = require('chalk');
const GPIOWrapper = require('./gpio-wrapper');
const SPIWrapper = require('./spi-wrapper');
const {PINS, EPD_MODES, COMMANDS, EPD1X54} = require('./constants');

class EPD {
  constructor(options = {}) {
    this._options = Object.assign(
      Object.assign(
        {},
        {
          mode: EPD_MODES.FULL,
          display: EPD1X54
        }
      ),
      options
    );

    this._ready = false;
    this._closed = false;
    this._terminated = false;

    this._spi = new SPIWrapper();

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

  /**
   * Asynchronous sleep function
   * @param {int} ms - number of milliseconds to sleep
   * @example
   * // sleep for one second
   * await sleep(1000);
   */
  static sleep(ms) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
  }

  static get MODES() {
    return EPD_MODES;
  }

  get spi() {
    return this._spi;
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

  get display() {
    return this.getOption('display');
  }

  get xSize() {
    return this.getOption('display').xSize;
  }

  get ySize() {
    return this.getOption('display').ySize;
  }

  get xySize() {
    return [this.xSize, this.ySize];
  }

  init() {
    return new Promise(async (resolve, reject) => {
      try {
        // setup pins
        await GPIOWrapper.setDirOut(PINS.RST);
        await GPIOWrapper.setDirOut(PINS.DC);
        await GPIOWrapper.setDirOut(PINS.CS);
        await GPIOWrapper.setDirIn(PINS.BUSY);
        // open spi
        await this.spi.open();
        // setup display mode
        if (this.mode === EPD_MODES.FULL) {
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
        await this.spi.close();
        await GPIOWrapper.destroy();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  readBusy() {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < 400; i++) {
        let busy = await GPIOWrapper.input(PINS.BUSY);
        if (busy === false) {
          resolve(true);
          return;
        }
        await this.sleep(10);
      }
      resolve(false);
    });
  }

  writeCommand(command, para = false) {
    return new Promise(async (resolve, reject) => {
      if (para !== false) {
        await this.readBusy();
      }
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.LOW); // not required?
      await GPIOWrapper.output(PINS.DC, GPIOWrapper.LOW);
      await this.spi.write([command]);
      if (para !== false) {
        await GPIOWrapper.output(PINS.DC, GPIOWrapper.HIGH);
        await this.spi.write([para]);
      }
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.HIGH); // not required?
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
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.LOW); // not required?
      await GPIOWrapper.output(PINS.DC, GPIOWrapper.LOW);
      await this.sleep(10);
      await this.spi.write([data.shift()]);
      await GPIOWrapper.output(PINS.DC, GPIOWrapper.HIGH);
      if (data.length > 0) {
        await this.spi.write(data);
      }
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.HIGH); // not required?
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
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.LOW); // not required?
      await GPIOWrapper.output(PINS.DC, GPIOWrapper.LOW);
      await this.spi.write([0x24]);
      await GPIOWrapper.output(PINS.DC, GPIOWrapper.HIGH);
      await this.spi.write(data);
      // await GPIOWrapper.output(PINS.CS, GPIOWrapper.HIGH); // not required?
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
        // await GPIOWrapper.output(PINS.CS, GPIOWrapper.LOW); // not required?
        await GPIOWrapper.output(PINS.RST, GPIOWrapper.LOW);
        await this.sleep(100);
        await GPIOWrapper.output(PINS.RST, GPIOWrapper.HIGH);
        await this.sleep(100);
        let reset = await GPIOWrapper.input(PINS.RST);
        await this.writeData(this.display.GDO_CONTROL);
        await this.writeData(COMMANDS.SOFT_START);
        await this.writeData(COMMANDS.VCOM_VOL);
        await this.writeData(COMMANDS.DUMMY_LINE);
        await this.writeData(COMMANDS.GATE_TIME);
        await this.writeData(COMMANDS.RAM_DATA_ENTRY_MODE);
        await this.setRAMArea(
          0x00,
          Math.floor((this.xSize - 1) / 8),
          (this.ySize - 1) % 256,
          Math.floor((this.ySize - 1) / 256),
          0x00,
          0x00
        );
        await this.setRAMPointer(
          0x00,
          (this.ySize - 1) % 256,
          Math.floor((this.ySize - 1) / 256)
        );
      } catch (err) {
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
        reject(err);
        return;
      }
    });
  }

  initDisplayFull() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.initDisplay();
        await this.writeData(this.display.LUT_DEFAULT_FULL);
        await this.powerOn();
      } catch (err) {
        reject(err);
        return;
      }
      await this.sleep(1500);
      resolve();
    });
  }

  initDisplayPart() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.initDisplay();
        await this.writeData(this.display.LUT_DEFAULT_PART);
        await this.powerOn();
      } catch (err) {
        reject(err);
        return;
      }
      await this.sleep(1500);
      resolve();
    });
  }

  writeDisplayFull(data = 0xff) {
    if (this.mode !== EPD_MODES.FULL) {
      throw new Error('writeDisplayFull: cannot use while in "partial" mode');
    }
    return new Promise(async (resolve, reject) => {
      await this.setRAMPointer(
        0x00,
        (this.ySize - 1) % 256,
        Math.floor((this.ySize - 1) / 256)
      );
      await this.writeDisplayRAM(this.xSize, this.ySize, data);
      await this.updateDisplayFull();
      await this.sleep(1500);
      resolve();
    });
  }

  writeDisplayPart(xStart, xEnd, yStart, yEnd, data = 0xff) {
    if (this.mode !== EPD_MODES.PARTIAL) {
      throw new Error('writeDisplayPart: cannot use while in "full" mode');
    }
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
      await this.sleep(100);
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
      await this.writeDisplayPart2(xStart, yStart, xSize, ySize, data);
      resolve();
    });
  }
}

module.exports = EPD;
