import { kvState, kvRead, kvCollections, kvStatus, kvDefaultHost, KV_APP } from '../kvstore/engine';
import type { World } from '../world';
import { codeState } from '../git/code';
import { training } from './engine';
export type LessonCheck =
  | {
      kind: 'kv';
      label: string;
      operation?: string;
      collection?: string;
      minRecords?: number;
      schema?: Record<string, string>;
      healthy?: boolean;
      resolved?: boolean;
    }
  | { kind: 'command'; pattern: string }
  | { kind: 'commits'; min: number }
  | { kind: 'merged'; min: number }
  | { kind: 'run'; check?: boolean; changed?: number; maxFailed?: number; minHosts?: number }
  | { kind: 'deployed' }
  | { kind: 'cleanCheck' };
export function lessonChecks(world: World, checks: LessonCheck[]): { label: string; passed: boolean }[] {
  const commands = world.actions.filter((a) => a.kind === 'cmd' && a.success !== false);
  const state = codeState(world);
  return checks.map((c) => {
    switch (c.kind) {
      case 'kv': {
        const kv = kvState(world);
        let passed = true;
        if (c.operation) passed = passed && kv.evidence.some((e) => e.action === c.operation);
        if (c.collection) {
          try {
            passed =
              passed &&
              kvRead(world, kvDefaultHost(world), KV_APP, c.collection).length >= (c.minRecords ?? 0);
          } catch {
            passed = false;
          }
        }
        if (c.schema && c.collection) {
          const settings = kvCollections(world, kvDefaultHost(world), KV_APP).find(
            (x) => x.collection === c.collection,
          )?.settings;
          passed =
            passed && !!settings && Object.entries(c.schema).every(([key, value]) => settings[key] === value);
        }
        if (c.healthy) passed = passed && kv.nodes.every((n) => kvStatus(world, n.host).membersInSync);
        if (c.resolved) passed = passed && kv.incidents.some((i) => i.closed !== undefined);
        return { label: c.label, passed };
      }
      case 'command':
        return {
          label: `Successful command: ${c.pattern}`,
          passed: commands.some((a) => new RegExp(c.pattern).test(a.text)),
        };
      case 'commits':
        return {
          label: `Create at least ${c.min} commits`,
          passed: Object.values(world.git?.repos ?? {}).some(
            (r) => Object.keys(r.commits).length >= c.min + 1,
          ),
        };
      case 'merged':
        return {
          label: `Merge ${c.min} reviewed PR`,
          passed: state.reviews.filter((p) => !p.fixture && p.status === 'merged').length >= c.min,
        };
      case 'deployed':
        return {
          label: 'Deploy a reviewed revision',
          passed: state.reviews.some((p) => !p.fixture && p.deployed === p.head),
        };
      case 'cleanCheck':
        return {
          label: 'Final check run has no changes or failures',
          passed:
            !!state.runs.at(-1)?.check &&
            state.runs.at(-1)?.changed === 0 &&
            state.runs.at(-1)?.failed === 0 &&
            state.runs.at(-1)?.unreachable === 0,
        };
      case 'run':
        return {
          label: `${c.check ? 'Preview' : 'Execute'} a successful playbook${c.changed === 0 ? ' idempotently' : ''}`,
          passed: state.runs.some(
            (r) =>
              r.check === !!c.check &&
              !r.syntax &&
              r.failed <= (c.maxFailed ?? 0) &&
              r.unreachable === 0 &&
              (c.changed === undefined || r.changed === c.changed) &&
              r.hosts.length >= (c.minHosts ?? 1),
          ),
        };
    }
  });
}
export function lessonProgress(world: World, checks: LessonCheck[]) {
  const results = lessonChecks(world, checks);
  return {
    checks: results,
    completed: results.length > 0 && results.every((c) => c.passed),
    unsafeAttempts: world.git?.unsafe.length ?? 0,
    evidence: training(world).evidence.length,
  };
}
