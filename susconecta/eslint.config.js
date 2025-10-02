// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import unicornPlugin from "eslint-plugin-unicorn";
import prettierConfig from "eslint-config-prettier";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "unicorn": unicornPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...unicornPlugin.configs.recommended.rules,
    }
  },
  prettierConfig,
];