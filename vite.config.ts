import { recommended } from '@effect/tsgo/oxlint-presets';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
  },
  lint: {
    extends: [recommended],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    categories: { correctness: 'error', suspicious: 'error', perf: 'error' },
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'typescript/no-non-null-assertion': 'error',
    },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ['**/*.test.ts'],
        rules: { 'eslint/no-shadow': ['error', { allow: ['it'] }] },
      },
    ],
  },
  run: {
    cache: true,
  },
});
