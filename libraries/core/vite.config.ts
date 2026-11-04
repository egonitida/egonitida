import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // Entries bundled by tsdown, one for each subpath of the exports.
    entry: {
      Machine: 'src/Machine.generated.ts',
    },
  },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['src/**/*.test.ts'] },
  },
});
