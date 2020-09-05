// this config is used in "test" npm script
module.exports = {
  collectCoverageFrom: ["**/src/**/*.{ts,tsx,js}", "!**/__fixtures__/**"],
  projects: ["<rootDir>/packages/*"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
