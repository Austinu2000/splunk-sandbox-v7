import { afterEach } from 'vitest';
import { setImmediate as yieldToReporter } from 'node:timers/promises';

// CPU-bound simulation cases otherwise run back-to-back in microtasks and can
// starve the worker's result transport. Yield I/O between cases, without changing
// simulated time, assertions or the per-test timeout.
afterEach(async () => {
  await yieldToReporter();
});
