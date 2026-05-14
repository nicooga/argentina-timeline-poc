// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import defaultExportName from "./eslint-rules/default-export-name.js";

export default tseslint.config(
  { ignores: ["dist", "**/node_modules/**", "coverage/**", "*.md"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "local-architecture": {
        rules: {
          "default-export-name": defaultExportName,
        },
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      ...reactRefresh.configs.vite.rules,
      "local-architecture/default-export-name": "error",
    },
  },
  {
    files: ["**/*.stories.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
    rules: {
      "local-architecture/default-export-name": "off",
    },
  },
  storybook.configs["flat/recommended"]
);
