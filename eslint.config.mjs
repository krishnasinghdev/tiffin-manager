import path from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslintEslintPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import eslintConfigPrettier from "eslint-config-prettier"
import drizzle from "eslint-plugin-drizzle"
import react from "eslint-plugin-react"
import globals from "globals"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const config = [
  {
    ignores: ["**/.tmp", "**/.git", "**/.husky", "**/build", "**/.next", "**/node_modules"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      react,
      "@typescript-eslint": typescriptEslintEslintPlugin,
      drizzle,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    settings: {
      next: {
        rootDir: true,
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      "prefer-const": "warn",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)",
        },
      ],
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        {
          "ts-ignore": "allow-with-description",
          "ts-nocheck": "allow-with-description",
        },
      ],
      "drizzle/enforce-delete-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },
  eslintConfigPrettier,
]

export default config
