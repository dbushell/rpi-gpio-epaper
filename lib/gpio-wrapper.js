const GPIO = require('rpi-gpio');

GPIO.setMode(GPIO.MODE_RPI);

class GPIOWrapper {
  /**
   * @param {int} pin - GPIO physical pin number
   * @param {boolean} direction
   */
  static setup(pin, direction) {
    return new Promise((resolve, reject) => {
      GPIO.setup(pin, direction, err => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  static get LOW() {
    return false;
  }

  static get HIGH() {
    return true;
  }

  /**
   * Setup pin for read mode
   * @param {int} pin - GPIO physical pin number
   */
  static setDirIn(pin) {
    return GPIOWrapper.setup(pin, GPIO.DIR_IN);
  }

  /**
   * Setup pin for write mode
   * @param {int} pin - GPIO physical pin number
   */
  static setDirOut(pin) {
    return GPIOWrapper.setup(pin, GPIO.DIR_OUT);
  }

  /**
   * Setup pin for write mode (start "off")
   * @param {int} pin - GPIO physical pin number
   */
  static setDirLow(pin) {
    return GPIOWrapper.setup(pin, GPIO.DIR_LOW);
  }

  /**
   * Setup pin for write mode (start "on")
   * @param {int} pin - GPIO physical pin number
   */
  static setDirHigh(pin) {
    return GPIOWrapper.setup(pin, GPIO.DIR_HIGH);
  }

  /**
   * @param {int} pin - GPIO physical pin number
   */
  static input(pin) {
    return new Promise((resolve, reject) => {
      GPIO.input(pin, (err, value) => {
        if (err) {
          reject(err);
        }
        resolve(value);
      });
    });
  }

  /**
   * @param {int} pin - GPIO physical pin number
   * @param {boolean} value - on or off
   */
  static output(pin, value) {
    return new Promise((resolve, reject) => {
      GPIO.output(pin, value, err => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * The point of no return
   */
  static destroy() {
    return new Promise((resolve, reject) => {
      try {
        GPIO.destroy(() => {
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = GPIOWrapper;
