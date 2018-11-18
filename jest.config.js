// this config is used in "test" and "test:coverage" npm scripts
module.exports = {
  collectCoverageFrom: ["**/src/**/*.{ts,tsx,js}", "!**/fixtures/**"],
  projects: ["<rootDir>/packages/*"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
