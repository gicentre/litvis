const jestBase = require("../../jest.config.js");

module.exports = {
  ...jestBase,
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/?(*.)(spec|test).(j|t)s?(x)"],
};
