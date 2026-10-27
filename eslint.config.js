import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Rule 1 in CLAUDE.md: the sandbox never runs real commands.
      'no-restricted-imports': [
        'error',
        {
          paths: ['child_process', 'node:child_process'].map((name) => ({
            name,
            message: 'The sandbox never executes real commands.',
          })),
        },
      ],
      'no-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // Rule 3: simulation code must be deterministic.
    files: ['packages/sim/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng.' },
        { object: 'Date', property: 'now', message: 'Use the world clock.' },
      ],
    },
  },
);
