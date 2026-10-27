import type { ActionKind, AiAssessmentDto, InterviewAnswerDto, InterviewOptionsDto } from '@sandbox/shared';
import type { OverlayEntry } from './vfs/vfs';
import type { World } from './world';

/**
 * The mutation journal: every change the user makes to a world, tagged with the tick it happened
 * on. Because ticks are deterministic for a seed, `replay(seed, config, journal)` rebuilds the same
 * world (PLAN.md: World = replay(seed, config, mutationLog)). That is what save and load store.
 *
 * Only the outermost operation is recorded: a scenario start is one entry, not the file writes and
 * restarts it performs, and nothing that happens inside a tick is recorded at all.
 */
export type Mutation =
  | { t: number; k: 'index.thaw'; id: string }
  | { t: number; k: 'inputs.activate'; host: string }
  | {
      t: number;
      k: 'ingestion.append';
      records: import('@sandbox/shared').RecordedEvent[];
      checkpoints: Record<string, import('@sandbox/shared').InputCheckpoint>;
      nextId: number;
    }
  | { t: number; k: 'indexes.activate'; host: string }
  | { t: number; k: 'kv.state'; state: import('@sandbox/shared').KvState }
  | { t: number; k: 'config.reload'; host: string; app: string }
  | { t: number; k: 'code.state'; state: import('@sandbox/shared').CodeState }
  | { t: number; k: 'training.state'; state: import('@sandbox/shared').TrainingState }
  | { t: number; k: 'git.patch'; patches: import('./git/journal').GitPatch[] }
  | { t: number; k: 'git.state'; state: import('./git/state').GitState }
  | { t: number; k: 'automation.enable' }
  | { t: number; k: 'fs'; host: string; path: string; entry: OverlayEntry }
  | { t: number; k: 'svc'; host: string; op: 'stop' | 'start' | 'restart' | 'reload'; cls?: string }
  | { t: number; k: 'login'; host: string }
  | { t: number; k: 'license.start' }
  | { t: number; k: 'scenario.start'; id: string }
  | { t: number; k: 'ticket.close'; id: string; note: string }
  | {
      t: number;
      k: 'action';
      kind: ActionKind;
      text: string;
      host?: string;
      user?: string;
      success?: boolean;
      wall: number;
    }
  | { t: number; k: 'interview.start'; opts: InterviewOptionsDto; wall: number }
  | { t: number; k: 'interview.hint'; id: string; wall: number }
  | { t: number; k: 'interview.notes'; id: string; notes: string }
  | { t: number; k: 'interview.submit'; id: string; answer: InterviewAnswerDto; wall: number }
  | { t: number; k: 'interview.ai'; id: string; ai?: AiAssessmentDto; aiError?: string };

/** Distributes Omit over the union, so each variant keeps its own fields. */
type WithoutTick<T> = T extends unknown ? Omit<T, 't'> : never;
export type MutationInput = WithoutTick<Mutation>;

export interface Journal {
  log: Mutation[];
  /** Nesting depth of journaled operations; only depth 0 records. */
  depth: number;
}

export function newJournal(): Journal {
  return { log: [], depth: 0 };
}

/** Record a top-level mutation (no-op inside another journaled operation or a tick). */
export function journal(world: World, m: MutationInput): void {
  if (world.journal.depth === 0) world.journal.log.push({ t: world.clock.tick, ...m } as Mutation);
}

/** Run `fn` as part of an operation that is already journaled (or deterministic, like a tick). */
export function nested<T>(world: World, fn: () => T): T {
  world.journal.depth++;
  try {
    return fn();
  } finally {
    world.journal.depth--;
  }
}

/**
 * Run a top-level operation without journaling what it does inside, then journal it if it
 * succeeded (a rejected operation changes nothing, so there is nothing to replay).
 */
export function op<T>(world: World, m: MutationInput, fn: () => T): T {
  const tick = world.clock.tick;
  const result = nested(world, fn);
  if (world.journal.depth === 0) world.journal.log.push({ t: tick, ...m } as Mutation);
  return result;
}
