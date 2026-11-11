import { recommended } from '@effect/tsgo/oxlint-presets';
import foldkit from '@foldkit/oxlint-plugin';
import { defineConfig } from 'vite-plus';

/** Where the website lives, whose code Foldkit's own rules hold to as well. */
const website = 'applications/website/';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['.claude/**'], // Skills formatted once, under `.agents`, which `.claude` links to.
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['.claude/**'], // Skills checked once, under `.agents`, which `.claude` links to.
    extends: [recommended],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    categories: { correctness: 'error', suspicious: 'error', perf: 'error' },
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'typescript/no-non-null-assertion': 'error',
      'eslint/no-fallthrough': 'error',
      'eslint/no-unreachable': 'error',
      'eslint/no-unused-labels': 'error',
      'eslint/no-unused-vars': 'error',
      'typescript/consistent-return': 'error',
    },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: [`${website}**`],
        jsPlugins: foldkit.configs.recommended.jsPlugins,
        rules: foldkit.configs.recommended.rules,
      },
      ...foldkit.configs.recommended.overrides.map(({ files, excludeFiles, rules }) => ({
        files: files.map((file) => `${website}${file}`),
        excludeFiles: excludeFiles?.map((file) => `${website}${file}`) ?? [],
        rules,
      })),
    ],
  },
  test: {
    projects: ['applications/*', 'examples/*', 'libraries/*'],
  },
  run: {
    cache: true,
  },
});
