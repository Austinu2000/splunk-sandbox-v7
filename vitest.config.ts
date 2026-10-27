import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
    environment: 'node',
    // Bound fleet-heavy workers so CPU time budgets remain meaningful on a local workstation.
    maxWorkers: 3,
    setupFiles: ['./vitest.setup.ts'],
    // Simulation tests build 35k-row worlds and scan generated logs; they are slow under parallel load.
    testTimeout: 30_000,
  },
});
