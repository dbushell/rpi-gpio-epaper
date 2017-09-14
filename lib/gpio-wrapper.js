const GPIO = require('rpi-gpio');

GPIO.setMode(GPIO.MODE_RPI);

class GPIOWrapper {
  static get DIR_IN() {
    return GPIO.DIR_IN;
  }

  static get DIR_OUT() {
    return GPIO.DIR_OUT;
  }

  static get DIR_LOW() {
    return GPIO.DIR_LOW;
  }

  static get DIR_HIGH() {
    return GPIO.DIR_HIGH;
  }

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
