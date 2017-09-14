const SPI = require('spi');
const {SPIDEV_MAXPATH, SPIDEV_MAXSPEED} = require('./constants');

const spi = new SPI.Spi('/dev/spidev0.0', {
  mode: SPI.MODE['MODE_0']
});

spi.maxSpeed(SPIDEV_MAXSPEED);

/**
 * Open the device
 */
function open() {
  return new Promise(async (resolve, reject) => {
    try {
      spi.open();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Close the device
 */
function close() {
  return new Promise(async (resolve, reject) => {
    try {
      spi.close();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * @returns {Buffer}
 */
function read() {
  return new Promise((resolve, reject) => {
    try {
      spi.read(buf, (device, buf2) => {
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
function write(buf) {
  return new Promise((resolve, reject) => {
    try {
      spi.write(buf, (device, buf2) => {
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
function safeWrite(data) {
  return new Promise(async (resolve, reject) => {
    try {
      while (data.length) {
        await write(Buffer.from(data.splice(0, SPIDEV_MAXPATH)));
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  spi: spi,
  open: open,
  close: close,
  read: read,
  write: safeWrite
};
