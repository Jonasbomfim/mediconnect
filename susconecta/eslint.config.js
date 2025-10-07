// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import unicornPlugin from "eslint-plugin-unicorn";
import prettierConfig from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  // Base JS/TS config
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },
    plugins: {
        "@next/next": nextPlugin,
    },
    rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
    }
  },
  // TypeScript specific config
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
        "unicorn": unicornPlugin,
    },
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: "./tsconfig.json",
        },
    },
    rules: {
        ...tseslint.configs.recommended.rules,
        ...unicornPlugin.configs.recommended.rules,
        // Disable noisy unicorn rules
        "unicorn/prevent-abbreviations": "off",
        "unicorn/filename-case": "off",
        "unicorn/no-null": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/no-array-for-each": "off",
        "unicorn/catch-error-name": "off",
        "unicorn/explicit-length-check": "off",
        "unicorn/no-array-reduce": "off",
        "unicorn/prefer-spread": "off",
        "unicorn/no-document-cookie": "off",
        "unicorn/prefer-query-selector": "off",
        "unicorn/prefer-add-event-listener": "off",
        "unicorn/prefer-string-slice": "off",
        "unicorn/prefer-string-replace-all": "off",
        "unicorn/prefer-number-properties": "off",
        "unicorn/consistent-existence-index-check": "off",
        "unicorn/no-negated-condition": "off",
        "unicorn/switch-case-braces": "off",
        "unicorn/prefer-global-this": "off",
        "unicorn/no-useless-undefined": "off",
        "unicorn/no-array-callback-reference": "off",
        "unicorn/no-array-sort": "off",
        "unicorn/numeric-separators-style": "off",
        "unicorn/prefer-optional-catch-binding": "off",
        "unicorn/prefer-ternary": "off",
        "unicorn/prefer-code-point": "off",
        "unicorn/prefer-single-call": "off",
      }
  },
  prettierConfig,
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
