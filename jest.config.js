// this config is used in "test" npm script
module.exports = {
  collectCoverageFrom: ["**/src/**/*.{ts,tsx,js}", "!**/fixtures/**"],
  projects: ["<rootDir>/packages/*"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
