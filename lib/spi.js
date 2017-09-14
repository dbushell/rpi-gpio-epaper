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
   * @param {Buffer} buf
   */
  write(data) {
    return new Promise(async (resolve, reject) => {
      try {
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
