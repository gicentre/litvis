// this config is extended in packages/*/jest.config.js
module.exports = {
  collectCoverageFrom: ["**/src/**/*.{ts,tsx,js}", "!**/__fixtures__/**"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  testMatch: ["**/src/**/?(*.)(spec|test).(j|t)s?(x)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  rootDir: ".",
};
