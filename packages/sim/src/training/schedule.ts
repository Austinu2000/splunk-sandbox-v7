import type { World } from '../world';
import { codeState, executePlaybook } from '../git/code';
import { journal } from '../journal';
import { TrainingError } from './engine';
export function schedulePlaybook(
  world: World,
  repo: string,
  branch: string,
  path: string,
  interval: number,
  limit: string,
) {
  if (!Number.isInteger(interval) || interval < 1 || interval > 8640)
    throw new TrainingError('Interval must be 1–8640 ticks');
  const r = world.git?.repos[repo];
  if (!r?.commits[r.branches[branch]!]?.tree[path]) throw new TrainingError('Scheduled playbook not found');
  const state = codeState(world);
  const item = {
    id: state.nextId++,
    repo,
    branch,
    path,
    interval,
    nextTick: world.clock.tick + interval,
    limit,
    enabled: true,
  };
  (state.schedules ??= []).push(item);
  journal(world, { k: 'code.state', state: structuredClone(state) });
  return item;
}
export function tickSchedules(world: World) {
  if (!world.code?.schedules) return;
  for (const s of world.code.schedules) {
    if (!s.enabled || world.clock.tick < s.nextTick) continue;
    s.nextTick = world.clock.tick + s.interval;
    try {
      const run = executePlaybook(world, s.repo, s.branch, s.path, { limit: s.limit || undefined });
      s.lastResult = `${run.failed} failed, ${run.changed} changed`;
    } catch (e) {
      s.lastResult = e instanceof Error ? e.message : String(e);
    }
  }
}
