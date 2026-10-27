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
    checks: z.array(outcome).min(1),
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
