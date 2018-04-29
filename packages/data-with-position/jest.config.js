const jestBase = require("../../jest.config.js");

module.exports = {
  ...jestBase,
  rootDir: ".",
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!**/fixtures/**"
  ]
};
