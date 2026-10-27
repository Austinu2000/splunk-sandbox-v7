import { z } from 'zod';

const text = z.string().trim().min(1).max(20000);
const id = z.string().regex(/^(?:SP-\d{3}|AU-\d{2}|[GAXK]\d{1,2})$/);
const capability = z.enum([
  'component.inspect',
  'conf.inspect',
  'access.enforce',
  'inventory.inspect',
  'inventory.target',
  'ansible.execute',
  'git.review',
  'index.standalone',
  'index.cluster',
  'index.lifecycle',
  'input.onboard',
  'search.execute',
  'report.manage',
  'report.schedule',
  'summary.persist',
  'dashboard.execute',
  'alert.evaluate',
  'forwarder.deploy',
  'cluster.manage',
  'kv.manage',
  'monitor.inspect',
  'security.integrate',
  'cloud.integrate',
  'upgrade.recover',
]);
const outcome = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('effective-conf'),
      host: text,
      conf: text,
      stanza: text,
      key: text,
      equals: text,
    })
    .strict(),
  z.object({ kind: z.literal('index'), host: text, name: text, effective: z.literal(true) }).strict(),
  z
    .object({
      kind: z.literal('knowledge'),
      host: text,
      app: text,
      owner: text,
      title: text,
      objectKind: z.enum(['report', 'alert', 'dashboard', 'dataset']),
    })
    .strict(),
  z
    .object({
      kind: z.literal('evidence'),
      action: text,
      targetId: text,
      success: z.literal(true),
      afterAction: text.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('search-results'),
      search: text,
      earliest: text,
      latest: text,
      minimumRows: z.number().int().min(1),
    })
    .strict(),
]);
const validationCase = z.enum([
  'solution',
  'incorrect-action',
  'no-false-completion',
  'reset',
  'resume',
  'isolation',
]);
const foundationOutcome = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('file-state'),
      label: text,
      host: text,
      path: text,
      exists: z.boolean(),
      contains: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('automation-run'),
      label: text,
      path: text,
      check: z.boolean().optional(),
      syntax: z.boolean().optional(),
      targets: z.array(text).optional(),
      minimumChanges: z.number().int().min(0).optional(),
      maximumChanges: z.number().int().min(0).optional(),
      handler: text.optional(),
      afterApply: z.boolean().optional(),
      priorFailure: z.boolean().optional(),
      currentSource: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('repository'),
      label: text,
      repo: text,
      branch: text,
      path: text,
      contains: z.string().min(1),
      review: z.enum(['open', 'checked', 'merged']).optional(),
      deployed: z.boolean().optional(),
      reverted: z.boolean().optional(),
    })
    .strict(),

  z
    .object({
      kind: z.literal('report-state'),
      label: text,
      host: text,
      app: text,
      title: text,
      owner: text.optional(),
      sharing: text.optional(),
      search: text.optional(),
      scheduled: z.boolean().optional(),
      summaryIndex: text.optional(),
      cron: text.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('report-run'),
      label: text,
      host: text,
      app: text,
      title: text,
      scheduled: z.boolean().optional(),
      minimumWrites: z.number().int().min(0).optional(),
      cells: z.record(z.union([z.string(), z.number()])).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('search-job'),
      label: text,
      search: text,
      inspected: z.boolean().optional(),
      moreWorkThan: text.optional(),
      minimumRows: z.number().int().min(1).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('index-state'),
      label: text,
      host: text,
      name: text,
      settings: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
      empty: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('query'),
      label: text,
      search: text,
      earliest: text.optional(),
      latest: text.optional(),
      principal: z.enum(['admin', 'analyst', 'operator']).optional(),
      rows: z.number().int().min(0),
      cells: z.record(z.union([z.string(), z.number()])).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('access'),
      label: text,
      host: text,
      principal: z.enum(['admin', 'analyst', 'operator']),
      index: text.optional(),
      capability: text.optional(),
      allowed: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('bucket-state'),
      label: text,
      host: text,
      index: text,
      state: z.enum(['hot', 'warm', 'cold', 'frozen', 'thawed']),
      minimum: z.number().int().positive(),
      archived: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('inspection'),
      label: text,
      command: text,
      host: text.optional(),
      user: text.optional(),
      interface: z.enum(['cli', 'web']).optional(),
      afterChange: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('answer'),
      label: text,
      id: text,
      expected: text.optional(),
      derive: z.enum(['role', 'inventory-count', 'group-count', 'mgmt-port']).optional(),
      host: text.optional(),
      group: text.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('configuration'),
      label: text,
      host: text,
      conf: text,
      stanza: text,
      key: text,
      equals: text,
      source: text.optional(),
      effective: z.boolean(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('permissions'),
      label: text,
      host: text,
      path: text,
      mode: z.number().int().min(0).max(4095),
      owner: text,
    })
    .strict(),
  z
    .object({
      kind: z.literal('inventory'),
      label: text,
      pattern: text,
      expected: z.array(text).optional(),
      noMissing: z.boolean().optional(),
      variable: z.object({ host: text, name: text, value: text }).strict().optional(),
    })
    .strict(),
]);

/** Future exercise authoring contract. It is intentionally not registered as an executable lesson. */
export const engineeringLessonSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    version: z.number().int().positive(),
    title: text,
    track: text,
    objectives: z.array(text).min(1),
    environments: z.array(z.enum(['default', 'lab', 'apl', 'erie'])).min(1),
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    prerequisites: z.array(id),
    requiredCapabilities: z.array(capability).min(1),
    fixture: z.object({ id: text, version: z.number().int().positive(), seed: text }).strict(),
    tasks: z
      .array(
        z
          .object({
            id: text,
            instruction: text,
            paths: z.array(z.enum(['web', 'cli', 'config', 'rest'])).min(1),
          })
          .strict(),
      )
      .min(1),
    hints: z.array(text),
    references: z
      .array(z.object({ url: z.string().url(), vendorVersion: text, purpose: text }).strict())
      .min(1),
    checks: z.array(z.union([outcome, foundationOutcome])).min(1),
    minutes: z.number().int().positive().optional(),
    questions: z.array(z.object({ id: text, prompt: text }).strict()).optional(),
    setup: z
      .array(
        z.discriminatedUnion('kind', [
          z.object({ kind: z.literal('automation-starters') }).strict(),
          z
            .object({
              kind: z.literal('automation-source'),
              path: text,
              text: z.string().max(2000000),
              deploy: z.object({ playbook: text, limit: text }).strict().optional(),
            })
            .strict(),
          z
            .object({
              kind: z.literal('advance'),
              ticks: z.number().int().min(1).max(100),
              paused: z.boolean().optional(),
            })
            .strict(),
          z
            .object({
              kind: z.literal('file'),
              host: text,
              path: text,
              text: z.string().max(2000000),
              mode: z.number().int().min(0).max(4095).optional(),
              owner: text.optional(),
              apply: z.boolean().optional(),
            })
            .strict(),
          z
            .object({ kind: z.literal('remove-inventory-host'), host: text, path: text, target: text })
            .strict(),
        ]),
      )
      .optional(),
    feedback: z.object({ success: text, incomplete: text }).strict(),
    reset: z.literal('restore-attempt-baseline'),
    persistence: z.literal('learner-profile-attempt'),
    status: z.enum(['planned', 'in-development', 'verified']),
    validation: z.array(z.object({ case: validationCase, test: text }).strict()),
  })
  .strict()
  .superRefine((lesson, ctx) => {
    if (!/^(?:SP-(?:00[1-9]|0[1-9]\d|100)|AU-(?:0[1-9]|[1-4]\d|50)|[GAXK]\d{1,2})$/.test(lesson.id))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['id'],
        message: 'ID is outside the approved curriculum.',
      });
    if (lesson.prerequisites.includes(lesson.id))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prerequisites'],
        message: 'A lesson cannot require itself.',
      });
    if (lesson.level === 4 && lesson.hints.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hints'],
        message: 'Enterprise challenges do not expose hints.',
      });
    if (lesson.status === 'verified')
      for (const check of validationCase.options)
        if (!lesson.validation.some((v) => v.case === check))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['validation'],
            message: `Missing ${check} test evidence.`,
          });
  });

export type EngineeringLessonDefinition = z.infer<typeof engineeringLessonSchema>;

/** A claimed status or file count cannot make a lesson executable. */
export function lessonReadiness(
  definition: unknown,
  implementedCapabilities: ReadonlySet<z.infer<typeof capability>>,
  passingTests: ReadonlySet<string>,
): { ready: boolean; reasons: string[] } {
  const parsed = engineeringLessonSchema.safeParse(definition);
  if (!parsed.success) return { ready: false, reasons: parsed.error.issues.map((i) => i.message) };
  const lesson = parsed.data;
  const reasons: string[] = [];
  if (lesson.status !== 'verified') reasons.push('Lesson implementation has not been verified.');
  for (const needed of lesson.requiredCapabilities)
    if (!implementedCapabilities.has(needed)) reasons.push(`Missing capability: ${needed}`);
  for (const test of lesson.validation)
    if (!passingTests.has(test.test)) reasons.push(`Test has not passed: ${test.test}`);
  return { ready: reasons.length === 0, reasons };
}
