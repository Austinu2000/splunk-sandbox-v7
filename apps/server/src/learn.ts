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
}
const dir = new URL('../../../lessons/', import.meta.url);
const lessons = readdirSync(dir)
  .filter((n) => n.endsWith('.json'))
  .map((n) => JSON.parse(readFileSync(new URL(n, dir), 'utf8')) as Lesson)
  .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id, undefined, { numeric: true }));
export function registerLearn(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get('/api/learn', async () => ({
    lessons,
    active: live.world.lesson ?? null,
    progress: live.world.lesson
      ? lessonProgress(live.world, lessons.find((l) => l.id === live.world.lesson!.id)!.checks)
      : null,
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
            id: { type: 'string', pattern: '^[GAXK][0-9]{1,2}$' },
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
      if (!saved || req.body.reset) setupLesson(next, l.setup ?? []);
      if ((!saved || req.body.reset) && l.kvIncident) kvStartIncident(next, l.kvIncident);
      configureScenarios(next, definitions);
      next.lesson ??= {
        id: l.id,
        learner: req.body.learner,
        startedTick: next.clock.tick,
        hints: 0,
        notes: '',
      };
      live.swap(next);
      store.checkpoint(next);
      return { id: l.id, profile: l.profile };
    },
  );
  app.post<{ Body: { notes?: string; hint?: boolean } }>(
    '/api/learn/progress',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { notes: { type: 'string', maxLength: 20000 }, hint: { type: 'boolean' } },
        },
      },
    },
    async (req) => {
      const current = live.world.lesson;
      if (!current) throw new TrainingError('Start a lesson first');
      const l = lessons.find((l) => l.id === current.id)!;
      if (req.body.notes !== undefined) current.notes = req.body.notes;
      if (req.body.hint) {
        if (l.level === 4) throw new TrainingError('Expert challenges have no hints');
        current.hints++;
      }
      store?.checkpoint(live.world);
      return lessonProgress(live.world, l.checks);
    },
  );
  app.post('/api/learn/leave', async () => {
    if (!store || !live.world.lesson) throw new TrainingError('No active lesson');
    store.checkpoint(live.world);
    const profile = live.world.config.profileId;
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
