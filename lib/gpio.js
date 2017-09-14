const GPIO = require('rpi-GPIO');

GPIO.setMode(GPIO.MODE_RPI);

/**
 * @param {int} pin - GPIO physical pin number
 * @param {boolean} direction
 */
function setup(pin, direction) {
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
function input(pin) {
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
function output(pin, value) {
  return new Promise((resolve, reject) => {
    GPIO.output(pin, value, err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function destroy() {
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

module.exports = {
  GPIO: GPIO,
  setup: setup,
  input: input,
  output: output,
  destroy: destroy
};
