import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import type { LiveWorld } from './live';
import {
  schedulePlaybook,
  compareSearches,
  training,
  trainingAction,
  trainingResolved,
  TRAINING_CASES,
  TrainingError,
  codeView,
  codeCommit,
  reviewAction,
  executePlaybook,
  tickWorld,
  persistTraining,
  automationView,
  inventoryHosts,
  previewStarterPack,
  installStarterPack,
  type AnsibleOptions,
} from '@sandbox/sim';
import type { TrainingQuestion } from '@sandbox/shared';
const questions = (
  JSON.parse(
    readFileSync(new URL('../../../docs/V4-INTERVIEW-QUESTION-MAP.json', import.meta.url), 'utf8'),
  ) as { questions: TrainingQuestion[] }
).questions;
export function registerTraining(app: FastifyInstance, live: LiveWorld, checkpoint: () => void) {
  app.get('/api/automation', async () => {
    const view = automationView(live.world);
    return {
      ...view,
      context: live.context,
      starters: view.enabled ? previewStarterPack(live.world) : undefined,
    };
  });
  app.post<{ Body: { context: string; revision: string } }>(
    '/api/automation/starters',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'revision'],
          properties: {
            context: { type: 'string', maxLength: 300 },
            revision: { type: 'string', maxLength: 100 },
          },
        },
      },
    },
    async (req) => {
      if (req.body.context !== live.context)
        throw new TrainingError('Active environment or lesson changed; reload before adding starter files');
      const result = installStarterPack(live.world, req.body.revision);
      checkpoint();
      return result;
    },
  );
  app.get<{ Querystring: { pattern?: string; limit?: string } }>(
    '/api/automation/targets',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            pattern: { type: 'string', maxLength: 256 },
            limit: { type: 'string', maxLength: 256 },
          },
        },
      },
    },
    async (req) => {
      const view = automationView(live.world);
      if (!view.enabled || !view.inventory)
        throw new TrainingError('No usable automation inventory in this environment');
      const allowed = new Set(inventoryHosts(view.inventory, req.query.limit ?? 'all'));
      return {
        hosts: inventoryHosts(view.inventory, req.query.pattern ?? 'all').filter((h) => allowed.has(h)),
      };
    },
  );
  app.get('/api/training', async () => ({
    state: training(live.world),
    questions,
    cases: TRAINING_CASES.map(({ id, title, track, questionIds, resource, impact, evidence, followups }) => ({
      id,
      title,
      track,
      questionIds,
      resource,
      impact,
      evidence,
      followups,
    })),
    resolved: Object.fromEntries(TRAINING_CASES.map((c) => [c.id, trainingResolved(live.world, c.id)])),
  }));
  app.post<{ Body: { action: string; target: string; value?: unknown } }>(
    '/api/training/action',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action', 'target'],
          additionalProperties: false,
          properties: {
            action: { type: 'string', maxLength: 40 },
            target: { type: 'string', maxLength: 100 },
            value: {},
          },
        },
      },
    },
    async (req) => {
      const { action, target, value } = req.body;
      const result = trainingAction(live.world, action, target, value);
      checkpoint();
      return result;
    },
  );
  app.post<{ Body: { ticks: number } }>(
    '/api/training/advance',
    {
      schema: {
        body: {
          type: 'object',
          required: ['ticks'],
          additionalProperties: false,
          properties: { ticks: { type: 'integer', minimum: 1, maximum: 120 } },
        },
      },
    },
    async (req) => {
      tickWorld(live.world, req.body.ticks);
      checkpoint();
      return training(live.world);
    },
  );
  app.post<{ Body: { name: string; search: string } }>(
    '/api/training/macro',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'search'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', pattern: '^[a-zA-Z][a-zA-Z0-9_]{0,50}$' },
            search: { type: 'string', minLength: 1, maxLength: 8000 },
          },
        },
      },
    },
    async (req) => {
      training(live.world).macros[req.body.name] = req.body.search;
      persistTraining(live.world);
      checkpoint();
      return { ok: true };
    },
  );
  app.post<{ Body: { left: string; right: string } }>(
    '/api/training/compare',
    {
      schema: {
        body: {
          type: 'object',
          required: ['left', 'right'],
          additionalProperties: false,
          properties: {
            left: { type: 'string', maxLength: 8000 },
            right: { type: 'string', maxLength: 8000 },
          },
        },
      },
    },
    async (req) => {
      const result = compareSearches(live.world, req.body.left, req.body.right);
      checkpoint();
      return result;
    },
  );
  app.post<{ Body: { repo: string; branch: string; path: string; interval: number; limit: string } }>(
    '/api/code/schedule',
    {
      schema: {
        body: {
          type: 'object',
          required: ['repo', 'branch', 'path', 'interval', 'limit'],
          additionalProperties: false,
          properties: {
            repo: { type: 'string', maxLength: 100 },
            branch: { type: 'string', maxLength: 100 },
            path: { type: 'string', maxLength: 250 },
            interval: { type: 'integer', minimum: 1, maximum: 8640 },
            limit: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
    async (req) => {
      const b = req.body;
      const r = schedulePlaybook(live.world, b.repo, b.branch, b.path, b.interval, b.limit);
      checkpoint();
      return r;
    },
  );
  app.get('/api/code', async () => ({ ...codeView(live.world), context: live.context }));
  app.post<{ Body: { repo: string; branch: string; path: string; text: string; message: string } }>(
    '/api/code/commit',
    {
      bodyLimit: 3000000,
      schema: {
        body: {
          type: 'object',
          required: ['repo', 'branch', 'path', 'text', 'message'],
          additionalProperties: false,
          properties: Object.fromEntries(
            ['repo', 'branch', 'path', 'text', 'message'].map((k) => [
              k,
              { type: 'string', maxLength: k === 'text' ? 2000000 : 250 },
            ]),
          ),
        },
      },
    },
    async (req) => {
      const b = req.body;
      const r = codeCommit(live.world, b.repo, b.branch, b.path, b.text, b.message);
      checkpoint();
      return r;
    },
  );
  app.post<{ Body: { action: string; id?: number; input?: Record<string, string> } }>(
    '/api/code/review',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action'],
          additionalProperties: false,
          properties: {
            action: { type: 'string', enum: ['open', 'comment', 'check', 'approve', 'merge', 'deploy'] },
            id: { type: 'integer', minimum: 1 },
            input: { type: 'object', additionalProperties: { type: 'string', maxLength: 5000 } },
          },
        },
      },
    },
    async (req) => {
      const r = reviewAction(live.world, req.body.action, req.body.id, req.body.input);
      checkpoint();
      return r;
    },
  );
  app.post<{
    Body: {
      repo: string;
      branch: string;
      path: string;
      context?: string;
      expectedCommit?: string;
      options?: AnsibleOptions;
    };
  }>(
    '/api/code/run',
    {
      schema: {
        body: {
          type: 'object',
          required: ['repo', 'branch', 'path'],
          additionalProperties: false,
          properties: {
            context: { type: 'string', maxLength: 300 },
            expectedCommit: { type: 'string', maxLength: 100 },
            repo: { type: 'string', maxLength: 100 },
            branch: { type: 'string', maxLength: 100 },
            path: { type: 'string', maxLength: 250 },
            options: {
              type: 'object',
              additionalProperties: false,
              properties: {
                check: { type: 'boolean' },
                diff: { type: 'boolean' },
                syntax: { type: 'boolean' },
                limit: { type: 'string', maxLength: 200 },
                inventory: { type: 'string', maxLength: 250 },
                extraVars: {
                  type: 'object',
                  additionalProperties: {
                    anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
                  },
                },
              },
            },
          },
        },
      },
    },
    async (req) => {
      try {
        if (req.body.context !== undefined && req.body.context !== live.context)
          throw new TrainingError('Active environment or lesson changed; reload before running');
        if (
          req.body.expectedCommit !== undefined &&
          live.world.git?.repos[req.body.repo]?.branches[req.body.branch] !== req.body.expectedCommit
        )
          throw new TrainingError('Committed branch changed; inspect its new revision before running');
        const r = executePlaybook(
          live.world,
          req.body.repo,
          req.body.branch,
          req.body.path,
          req.body.options,
        );
        checkpoint();
        return r;
      } catch (e) {
        if (e instanceof TrainingError) throw e;
        throw new TrainingError(e instanceof Error ? e.message : 'Playbook failed');
      }
    },
  );
}
