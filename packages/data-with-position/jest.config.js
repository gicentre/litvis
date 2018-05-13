const jestBase = require("../../jest.config.js");

module.exports = Object.assign({}, jestBase, {
  rootDir: ".",
  collectCoverageFrom: ["src/**/*.ts", "!**/fixtures/**"],
});
