// ESLint configuration (post ESLint 9)
//
// Via Claude Opus 4.8

import js from "@eslint/js";

export default [
  {
    ignores: ["eslint.config.mjs"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        clearInterval: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        chrome: "readonly",
        console: "readonly",
        MutationObserver: "readonly",
        requestAnimationFrame: "readonly"
      }
    },
    rules: {
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "warn",
      "no-unused-vars": "warn",
      "no-shadow": "warn",
      "no-implicit-globals": "warn"
    }
  }
];
