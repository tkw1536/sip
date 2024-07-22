// @ts-check

import love from 'eslint-config-love'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import react from 'eslint-plugin-react'

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
  {
    rules: {
      '@typescript-eslint/no-invalid-void-type': ['off'],
    },
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
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/jsx-key': ['error'],
      'react/no-unused-state': ['error'],
      'react/prefer-stateless-function': ['error'],
      'react/no-unsafe': ['error'],
    },
    settings: {
      react: {
        version: '16.0',
        pragma: 'h',
      },
    },
  },
]
