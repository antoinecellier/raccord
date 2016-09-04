/* eslint no-extend-native: "off" */
Array.prototype.flatMap = Array.prototype.flatMap || function (fn) {
  return Array.prototype.concat.apply([], this.map(fn))
}
