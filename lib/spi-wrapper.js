const SPI = require('spi');

const {SPIDEV_MAXPATH, SPIDEV_MAXSPEED} = require('./constants');

class SPIWrapper {
  constructor(device = '/dev/spidev0.0', mode = SPI.MODE['MODE_0']) {
    this.spi = new SPI.Spi(device, {
      mode: mode
    });
    this.spi.maxSpeed(SPIDEV_MAXSPEED);
  }

  /**
   * Open the device
   */
  open() {
    return new Promise(async (resolve, reject) => {
      try {
        this.spi.open();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Close the device
   */
  close() {
    return new Promise(async (resolve, reject) => {
      try {
        this.spi.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Read SPI data
   * @returns {Buffer}
   */
  read() {
    return new Promise((resolve, reject) => {
      try {
        this.spi.read(buf, (device, buf2) => {
          resolve(buf2);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Write SPI data
   * @param {Buffer} buf
   */
  unsafeWrite(buf) {
    return new Promise((resolve, reject) => {
      try {
        this.spi.write(buf, (device, buf2) => {
          resolve(buf2);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Write SPI data respecting the buffer length limit
   * @param {Array|Buffer} data - array of bytes to write
   */
  write(data) {
    return new Promise(async (resolve, reject) => {
      if (!(Array.isArray(data) || Buffer.isBuffer(data))) {
        return reject(new Error('data must be Array or Buffer type'));
      }
      if (!data.length) {
        return resolve();
      }
      try {
        data = [...data];
        while (data.length) {
          await this.unsafeWrite(Buffer.from(data.splice(0, SPIDEV_MAXPATH)));
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = SPIWrapper;
