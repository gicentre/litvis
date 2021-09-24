/** @type import("eslint").Linter.BaseConfig */
module.exports = {
  extends: ["@kachkaev/eslint-config-base"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
    "func-style": "error",
    "import/no-default-export": "error",
    "import/no-unresolved": ["error", { ignore: ["^unist$"] }],
  },
  overrides: [
    {
      files: "**/*.test.ts",
      rules: {
        "jest/no-disabled-tests": "off",
        "jest/no-export": "off",
        "no-restricted-imports": "off",
      },
    },
  ],
};
