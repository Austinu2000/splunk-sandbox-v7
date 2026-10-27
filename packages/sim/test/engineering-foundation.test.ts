import { describe, expect, it } from 'vitest';
import type { EngineeringCapability, KnowledgeObject } from '@sandbox/shared';
import {
  createWorld,
  saveWorld,
  loadWorld,
  planLegacyImport,
  LEGACY_KNOWLEDGE_KEY,
  engineeringLessonSchema,
  lessonReadiness,
} from '../src/index';

function report(overrides: Partial<KnowledgeObject> = {}): KnowledgeObject {
  return {
    id: 'errors',
    kind: 'report',
    title: 'Errors',
    description: 'Keep this',
    owner: 'admin',
    app: 'search',
    sharing: 'Private',
    search: 'index=app | stats count',
    earliest: '-1h',
    latest: 'now',
    enabled: true,
    type: 'Classic',
    panels: [],
    updated: '2026-10-27T00:00:00Z',
    schedule: '*/5 * * * *',
    ...overrides,
  };
}

describe('V7 lossless migration preflight', () => {
  it('preserves raw records, unknown fields, notes, jobs, settings and empty values without activation', () => {
    const value = { ...report(), futureProperty: { retain: true } };
    const raw = `  ${JSON.stringify({ objects: [value], jobs: [{ sid: 'job1' }], recent: ['errors'], homeDashboard: 'd1' })}\n`;
    const ui = {
      [LEGACY_KNOWLEDGE_KEY]: raw,
      'splunk-v3-settings:indexes': '[{"Name":"application_logs"}]',
      notes: 'untouched',
      empty: '',
    };
    const before = structuredClone(ui);
    const plan = planLegacyImport('lab', ui);
    expect(ui).toEqual(before);
    expect(plan.preservedUiState).toEqual(before);
    expect(plan.knowledge[0].object).toEqual(value);
    expect(plan.knowledge[0].status).toBe('needs-scope');
    expect(plan.settingsKeys).toEqual(['splunk-v3-settings:indexes']);
    expect(plan.issues.map((i) => i.code)).toEqual(['missing-scope']);
    expect(plan).toEqual(planLegacyImport('lab', ui));
    plan.preservedUiState.notes = 'changed preview';
    plan.knowledge[0].object.title = 'changed preview';
    expect(ui).toEqual(before);
  });

  it('keeps malformed JSON and invalid records available for recovery', () => {
    for (const raw of ['{broken', 'null', '{"objects":{}}']) {
      const plan = planLegacyImport('apl', { [LEGACY_KNOWLEDGE_KEY]: raw });
      expect(plan.knowledge).toEqual([]);
      expect(plan.issues).toHaveLength(1);
      expect(plan.preservedUiState[LEGACY_KNOWLEDGE_KEY]).toBe(raw);
    }
    const raw = JSON.stringify({
      objects: [report(), { id: 'damaged' }, null, report({ id: 'good2', title: 'Good 2' })],
    });
    const plan = planLegacyImport('apl', { [LEGACY_KNOWLEDGE_KEY]: raw });
    expect(plan.knowledge.map((r) => r.sourceRecord)).toEqual([0, 3]);
    expect(plan.issues.filter((i) => i.code === 'invalid-record')).toHaveLength(2);
    expect(plan.preservedUiState[LEGACY_KNOWLEDGE_KEY]).toBe(raw);
  });

  it('detects duplicate IDs and scoped identity collisions without merging either source', () => {
    const target = report();
    const incoming = [report(), report({ id: 'another' }), report({ title: 'Other app', app: 'other' })];
    const plan = planLegacyImport('lab', { [LEGACY_KNOWLEDGE_KEY]: JSON.stringify({ objects: incoming }) }, [
      target,
    ]);
    expect(plan.knowledge).toHaveLength(3);
    expect(plan.knowledge.every((o) => o.status === 'conflict')).toBe(true);
    expect(plan.issues.some((i) => i.code === 'duplicate-id')).toBe(true);
    expect(plan.issues.some((i) => i.code === 'scope-conflict')).toBe(true);
    expect(target).toEqual(report());
    expect(planLegacyImport('erie', {})).toMatchObject({
      profileId: 'erie',
      knowledge: [],
      preservedUiState: {},
    });
  });

  it('retains v6 saves and learner attempts through preview, reload and reset boundaries', () => {
    const world = createWorld({ fleetSize: 1000 });
    world.uiState = {
      [LEGACY_KNOWLEDGE_KEY]: JSON.stringify({ objects: [report()] }),
      notes: 'learner note',
    };
    world.lesson = { id: 'A1', learner: 'Learner', startedTick: 0, hints: 1, notes: 'attempt note' };
    const before = saveWorld(world);
    expect(before.version).toBe(6);
    const loaded = loadWorld({...before, version:5}, []);
    planLegacyImport(loaded.config.profileId, loaded.uiState);
    expect(saveWorld(loaded)).toEqual(before);
    loaded.uiState.notes = 'attempt changed';
    expect(loadWorld(before, []).uiState.notes).toBe('learner note');
    expect(world.uiState.notes).toBe('learner note');
    expect(createWorld({ fleetSize: 1000 }).uiState).toEqual({});
  });
});

const lesson = () => ({
  schemaVersion: 1,
  id: 'SP-007',
  version: 1,
  title: 'Create an index',
  track: 'Indexes',
  objectives: ['Create and verify an events index'],
  environments: ['lab'],
  level: 1,
  prerequisites: ['SP-006'],
  requiredCapabilities: ['index.standalone'],
  fixture: { id: 'standalone-index', version: 1, seed: 'lesson-index' },
  tasks: [
    {
      id: 'create',
      instruction: 'Create application_logs and verify it independently.',
      paths: ['web', 'cli'],
    },
  ],
  hints: ['Inspect Settings → Indexes'],
  references: [{ url: 'https://help.splunk.com/', vendorVersion: '9.4', purpose: 'Index administration' }],
  checks: [{ kind: 'index', host: 'idx01', name: 'application_logs', effective: true }],
  feedback: { success: 'Index is effective.', incomplete: 'Check configuration activation.' },
  reset: 'restore-attempt-baseline',
  persistence: 'learner-profile-attempt',
  status: 'planned',
  validation: [],
});

describe('V7 lesson authoring gate', () => {
  it('accepts planned metadata while refusing to advertise it as executable', () => {
    expect(engineeringLessonSchema.safeParse(lesson()).success).toBe(true);
    expect(lessonReadiness(lesson(), new Set(), new Set()).ready).toBe(false);
  });

  it('rejects superficial command-only checks, absent outcomes, self prerequisites and invalid IDs', () => {
    expect(
      engineeringLessonSchema.safeParse({
        ...lesson(),
        checks: [{ kind: 'command', pattern: 'splunk add index' }],
      }).success,
    ).toBe(false);
    for (const change of [
      { checks: [] },
      { id: 'SP-101' },
      { id: 'AU-51' },
      { prerequisites: ['SP-007'] },
      { level: 4 },
    ])
      expect(engineeringLessonSchema.safeParse({ ...lesson(), ...change }).success).toBe(false);
  });

  it('requires passing solution/failure/reset/resume/isolation tests and real capability support', () => {
    const claimed = { ...lesson(), status: 'verified' };
    expect(engineeringLessonSchema.safeParse(claimed).success).toBe(false);
    const cases = ['solution', 'incorrect-action', 'no-false-completion', 'reset', 'resume', 'isolation'];
    const complete = { ...claimed, validation: cases.map((c) => ({ case: c, test: `index:${c}` })) };
    const capabilities = new Set<EngineeringCapability>(['index.standalone']);
    const tests = new Set(cases.map((c) => `index:${c}`));
    expect(lessonReadiness(complete, new Set(), tests).ready).toBe(false);
    expect(lessonReadiness(complete, capabilities, new Set()).ready).toBe(false);
    expect(lessonReadiness(complete, capabilities, tests)).toEqual({ ready: true, reasons: [] });
  });
});
