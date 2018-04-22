module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx,js}"],
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["**/?(*.)(spec|test).(j|t)s?(x)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
