# Splunk Engineer Sandbox

## V7 continuation

This checkout is the independent V7 copy of V6 baseline `a9d4237`. Follow
`docs/V7-CONSOLIDATED-BUILD-SPEC.md`, `docs/V7-ARCHITECTURE.md` and
`docs/V7-IMPLEMENTATION-STATUS.md` for the current milestone sequence. Milestone 0
is implemented; stop for review before Milestone 1. The original SPEC/PLAN below
remain architectural context, not the current expansion checklist.

V7 uses ports 5873/5874 and its own `data/sandbox.db`. Do not point it at V6's
database or push V7 changes to V6's GitHub repository. Preserve all 27 existing
lesson IDs and saved attempts. AU/SP planning manifests are not executable lessons.

A browser-based, fully simulated Splunk environment for practising engineer work and interview scenarios. The full spec is in `SPEC.md`, and the agreed design is in `PLAN.md`. Read both before making changes.

## Hard rules

1. **Never execute user-entered commands on the real machine.** The terminal is an emulator: every command is parsed and answered from simulated state. No `child_process`, `exec`, `spawn`, `eval`, `new Function` or real filesystem/network access driven by user input, anywhere.
2. **One world state.** Fleet views, logs, dashboards, SPL results, the shell and scenarios all derive from the same `World`. Never compute a number for a UI separately from the data a search would return. If a dashboard says 412 offline, `search` must return 412 hosts.
3. **Determinism.** The same seed always produces the same world. All randomness goes through the seeded PRNG in `packages/sim` (`rng.fork(label)`); never call `Math.random()` or read `Date.now()` inside simulation code. Simulation time comes from the world clock.
4. **Scenarios are data, not engine changes.** A new incident is one file in `scenarios/`. If a scenario needs something the engine can't express, add a generic primitive to the engine; never special-case a scenario ID in engine code.
5. **Config changes take effect only on the correct reload/restart**, like real Splunk. `btool` output must follow real precedence and show source file paths.
6. **Local only.** The server binds to `127.0.0.1`. No auth, no multi-user.
7. **Offline first.** Everything works without network. Claude API grading is optional, off by default, and enabled only when `ANTHROPIC_API_KEY` is set.

## Working conventions

- TypeScript strict mode everywhere. Shared types live in `packages/shared`.
- Simulation logic in `packages/sim` must be pure and framework-free (no Fastify, no React), so it can be tested directly.
- Fleet data is columnar (typed arrays), not 35,000 objects. Materialise records only for the rows a view or search needs.
- Unsupported shell commands produce a realistic `command not found` / permission error; unsupported SPL produces a Splunk-style error. Never throw raw stack traces to the user.
- Tests: Vitest. Every scenario has a scripted "solution run" test that must resolve it. Determinism tests compare snapshots for a fixed seed.
- Build milestone by milestone (see `SPEC.md`) and stop after each one for review.
