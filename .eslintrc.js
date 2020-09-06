module.exports = {
  extends: ["@kachkaev/eslint-config-base"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
    "func-style": "error",
    "import/no-default-export": "error",
    "import/no-unresolved": ["error", { ignore: ["^unist$"] }],
  },
};
