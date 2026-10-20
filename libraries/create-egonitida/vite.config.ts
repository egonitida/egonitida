import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: { entry: 'src/Entrypoint.ts' },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['src/**/*.test.ts'] },
  },
});
