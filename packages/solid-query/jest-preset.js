const solidPreset = require('solid-jest/preset/browser/jest-preset')
const tanStackPreset = require('../../jest-preset')

module.exports = {
  ...tanStackPreset,
  ...solidPreset,
}
