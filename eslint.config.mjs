// @ts-check

import love from 'eslint-config-love'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

const files = ['**/*.mjs', '**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
const testFiles = [
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.test.ts',
  '**/*.test.tsx',
]

export default [
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    ...love,
    files,
  },
  // test overrides
  {
    rules: {
      // spying in test files is fine, so we disable this
      '@typescript-eslint/unbound-method': ['off'],
    },
    files: testFiles,
  },
  eslintPluginPrettierRecommended,
]
