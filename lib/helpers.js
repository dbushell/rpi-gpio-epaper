/**
 * Asynchronous sleep function
 * @param {int} ms - number of milliseconds to sleep
 * @example
 * // sleep for one second
 * await sleep(1000);
 */

function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

module.exports = {
  sleep: sleep
};
