import { readFileSync, readdirSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import {
  createWorld,
  loadWorld,
  profileWorldConfig,
  configureScenarios,
  lessonProgress,
  TrainingError,
  type LessonCheck,
  setupLesson,
  type LessonSetup,
  kvStartIncident,
  engineeringLessonSchema,
  setupFoundation,
  type FoundationCheck,
  type FoundationSetup,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
import { loadProfiles } from './profiles';
import { loadScenarioDefinitions } from './scenarios';
interface Lesson {
  id: string;
  title: string;
  minutes: number;
  level: number;
  profile: string;
  instructions: string;
  checks: LessonCheck[];
  completionScope: string;
  setup?: LessonSetup[];
  kvIncident?: string;
  foundationSetup?: FoundationSetup[];
  questions?: { id: string; prompt: string }[];
  hints?: string[];
  references?: { url: string; vendorVersion: string; purpose: string }[];
}
const dir = new URL('../../../lessons/', import.meta.url);
const inheritedLessons = readdirSync(dir)
  .filter((n) => n.endsWith('.json'))
  .map((n) => JSON.parse(readFileSync(new URL(n, dir), 'utf8')) as Lesson);
const v7Dir = new URL('v7/', dir);
const v7Lessons: Lesson[] = readdirSync(v7Dir)
  .filter((n) => n.endsWith('.json'))
  .map((n) => {
    const definition = engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, v7Dir), 'utf8')));
    if (definition.status !== 'verified')
      throw new Error('Unverified V7 lesson cannot be registered: ' + definition.id);
    const supported = new Set([
      'cluster-state',
      'cluster-validation',
      'cluster-job',
      'shc-state',
      'smartstore-state',
      'kv-state',
      'dashboard-state',
      'dashboard-render',
      'alert-state',
      'alert-run',
      'forwarder',
      'connection',
      'automation-run',
      'file-state',
      'repository',
      'inspection',
      'answer',
      'configuration',
      'permissions',
      'inventory',
      'index-state',
      'query',
      'access',
      'bucket-state',
      'report-state',
      'report-run',
      'search-job',
    ]);
    if (definition.checks.some((c) => !supported.has(c.kind)))
      throw new Error('Unsupported V7 outcome evaluator: ' + definition.id);
    return {
      id: definition.id,
      title: definition.title,
      minutes: definition.minutes ?? 15,
      level: definition.level,
      profile: definition.environments[0]!,
      instructions: definition.tasks.map((t) => t.instruction).join('\n\n'),
      checks: definition.checks.map((check) => ({
        kind: 'foundation' as const,
        check: check as FoundationCheck,
      })),
      completionScope: definition.feedback.success,
      foundationSetup: definition.setup,
      questions: definition.questions,
      hints: definition.hints,
      references: definition.references,
    };
  });
const lessons = [...inheritedLessons, ...v7Lessons].sort(
  (a, b) => a.level - b.level || a.id.localeCompare(b.id, undefined, { numeric: true }),
);
export function registerLearn(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get('/api/learn', async () => ({
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      minutes: l.minutes,
      level: l.level,
      profile: l.profile,
      instructions: l.instructions,
      completionScope: l.completionScope,
      questions: l.questions,
      references: l.references,
      seeded: !!l.setup?.length || !!l.foundationSetup?.length,
    })),
    active: live.world.lesson ?? null,
    progress: live.world.lesson
      ? lessonProgress(live.world, lessons.find((l) => l.id === live.world.lesson!.id)!.checks)
      : null,
    hint: live.world.lesson
      ? lessons.find((l) => l.id === live.world.lesson!.id)?.hints?.slice(0, live.world.lesson.hints)
      : [],
  }));
  app.post<{ Body: { id: string; learner: string; reset?: boolean } }>(
    '/api/learn/start',
    {
      schema: {
        body: {
          type: 'object',
          required: ['id', 'learner'],
          additionalProperties: false,
          properties: {
            id: { type: 'string', pattern: '^(?:[GAXK][0-9]{1,2}|SP-[0-9]{3}|AU-[0-9]{2})$' },
            learner: { type: 'string', pattern: '^[A-Za-z0-9 _-]{1,50}$' },
            reset: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      if (!store) throw new TrainingError('Lessons require persistence');
      const l = lessons.find((l) => l.id === req.body.id);
      if (!l) throw new TrainingError('Unknown lesson');
      const returnProfile = live.world.lesson?.returnProfile ?? live.world.config.profileId;
      store.checkpoint(live.world);
      const slot = `lesson:${req.body.learner}:${l.id}`;
      const saved = store.slot(slot),
        definitions = loadScenarioDefinitions();
      if (saved && req.body.reset)
        store.save(loadWorld(saved, definitions), `Before resetting ${l.id}`, 'manual', Date.now());
      const next =
        saved && !req.body.reset
          ? loadWorld(saved, definitions)
          : createWorld(profileWorldConfig(loadProfiles().find((p) => p.id === l.profile)!));
      if (!saved || req.body.reset) {
        setupLesson(next, l.setup ?? []);
        setupFoundation(next, l.foundationSetup ?? []);
      }
      if ((!saved || req.body.reset) && l.kvIncident) kvStartIncident(next, l.kvIncident);
      configureScenarios(next, definitions);
      next.lesson ??= {
        id: l.id,
        learner: req.body.learner,
        startedTick: next.clock.tick,
        hints: 0,
        notes: '',
      };
      next.lesson.returnProfile = returnProfile;
      live.swap(next);
      store.checkpoint(next);
      return { id: l.id, profile: l.profile };
    },
  );
  app.post<{ Body: { notes?: string; hint?: boolean; answers?: Record<string, string> } }>(
    '/api/learn/progress',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            notes: { type: 'string', maxLength: 20000 },
            hint: { type: 'boolean' },
            answers: {
              type: 'object',
              maxProperties: 30,
              additionalProperties: { type: 'string', maxLength: 500 },
            },
          },
        },
      },
    },
    async (req) => {
      const current = live.world.lesson;
      if (!current) throw new TrainingError('Start a lesson first');
      const l = lessons.find((l) => l.id === current.id)!;
      if (req.body.hint && l.level === 4) throw new TrainingError('Expert challenges have no hints');
      if (req.body.answers) {
        const ids = new Set(l.questions?.map((q) => q.id));
        if (Object.keys(req.body.answers).some((id) => !ids.has(id)))
          throw new TrainingError('Unknown lesson answer');
      }
      if (req.body.notes !== undefined) current.notes = req.body.notes;
      if (req.body.answers) current.answers = { ...current.answers, ...req.body.answers };
      if (req.body.hint) current.hints++;
      store?.checkpoint(live.world);
      return lessonProgress(live.world, l.checks);
    },
  );
  app.post('/api/learn/leave', async () => {
    if (!store || !live.world.lesson) throw new TrainingError('No active lesson');
    store.checkpoint(live.world);
    const profile = live.world.lesson.returnProfile ?? live.world.config.profileId;
    const saved = store.autosave(profile),
      defs = loadScenarioDefinitions();
    const next = saved
      ? loadWorld(saved, defs)
      : createWorld(profileWorldConfig(loadProfiles().find((p) => p.id === profile)!));
    configureScenarios(next, defs);
    live.swap(next);
    store.checkpoint(next);
    return { ok: true };
  });
}
