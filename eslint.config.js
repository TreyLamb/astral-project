import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Stamped into the bundle by vite.config.js `define` (and by
        // vitest.config.js for tests), so it is a real global at runtime even
        // though nothing declares it in source.
        __BUILD_ID__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Vercel serverless functions (api/*.js) run in Node, not the browser —
    // process/console/etc. aren't undefined globals there. See CLAUDE.md's
    // "Backend / serverless functions" section.
    files: ['api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
