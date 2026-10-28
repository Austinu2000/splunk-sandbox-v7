/** Check frozen release claims against actual Vitest JSON results, not test-file existence. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
const root = resolve(import.meta.dirname, '..');
const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const reportPath = process.argv[2];
if (!reportPath) throw new Error('Usage: npm run audit:release -- /absolute/path/to/vitest-results.json');
const report = read(reportPath);
const plan = read('docs/V7-CURRICULUM-PLAN.json');
const coverage = read('docs/V7-INTERVIEW-QUESTION-COVERAGE.json');
const tests = report.testResults.flatMap(
  (file: { name: string; assertionResults: { title: string; status: string }[] }) =>
    file.assertionResults.map((test) => ({ ...test, file: file.name.replace(root + '/', '') })),
) as { title: string; status: string; file: string }[];
const failures: string[] = [];
const available = plan.lessons.filter((lesson: { executable: boolean }) => lesson.executable) as {
  id: string;
  fixtureVersion: number;
}[];
const deferred = plan.lessons.filter((lesson: { executable: boolean }) => !lesson.executable) as {
  id: string;
}[];
const expectedCases = ['solution', 'incorrect-action', 'no-false-completion', 'reset', 'resume', 'isolation'];
if (!report.success || tests.some((test) => test.status !== 'passed') || !tests.length)
  failures.push('Regression contains failed, pending or missing assertions');
const lessons = available.map((lesson) => {
  const definition = read('lessons/v7/' + lesson.id + '.json');
  if (definition.status !== 'verified' || definition.fixture.version !== lesson.fixtureVersion)
    failures.push(lesson.id + ': fixture mismatch');
  if (
    JSON.stringify(definition.validation.map((v: { case: string }) => v.case).sort()) !==
    JSON.stringify([...expectedCases].sort())
  )
    failures.push(lesson.id + ': missing acceptance categories');
  const evidence = definition.validation.map((validation: { test: string }) => {
    const qualified = /^(v7-[a-z-]+):((?:SP-\d{3}|AU-\d{2}):[a-z-]+)$/.exec(validation.test);
    const matches = tests.filter((test) =>
      qualified
        ? test.title === qualified[2] && test.file === 'packages/sim/test/' + qualified[1] + '.test.ts'
        : test.title === validation.test,
    );
    if (matches.length !== 1 || matches[0].status !== 'passed')
      failures.push(validation.test + ': expected one passed assertion');
    return {
      test: validation.test,
      actualTitle: matches[0]?.title ?? null,
      status: matches[0]?.status ?? 'missing',
      file: matches[0]?.file ?? null,
    };
  });
  return { id: lesson.id, fixtureVersion: definition.fixture.version, evidence };
});
const files = readdirSync(resolve(root, 'lessons/v7'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -5))
  .sort();
if (JSON.stringify(files) !== JSON.stringify(available.map((l) => l.id).sort()))
  failures.push('Catalog differs from verified manifest');
const inherited = readdirSync(resolve(root, 'lessons'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -5))
  .sort();
if (JSON.stringify(inherited) !== JSON.stringify(plan.existingLessonIds))
  failures.push('Inherited lesson IDs changed');
const inheritedEvidence = inherited.map((id) => {
  const title = 'inherited:' + id + ':start-resume-reset-isolation';
  const matches = tests.filter((test) => test.title === title);
  if (matches.length !== 1 || matches[0].status !== 'passed')
    failures.push(id + ': missing inherited persistence/isolation regression');
  return { id, test: title, status: matches[0]?.status ?? 'missing', file: matches[0]?.file ?? null };
});
const deferredGuard = tests.filter(
  (test) => test.title === 'rejects all deferred capstones without changing the active free-practice session',
);
if (deferredGuard.length !== 1 || deferredGuard[0].status !== 'passed')
  failures.push('Deferred API rejection guard did not pass');
const evidenceMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
for (const row of coverage.questions) {
  for (const supplemental of row.supportingTests ?? []) {
    const matches = tests.filter(
      (test) => test.title === supplemental.test && test.file === supplemental.file,
    );
    if (matches.length !== 1 || matches[0].status !== 'passed')
      failures.push(row.questionId + ': missing supplemental regression evidence');
  }

  for (const evidence of row.testEvidence) {
    const actual = evidenceMap.get(evidence.lessonId);
    if (
      !actual ||
      actual.fixtureVersion !== evidence.fixtureVersion ||
      JSON.stringify(actual.evidence.map((e: { test: string }) => e.test)) !== JSON.stringify(evidence.tests)
    )
      failures.push(row.questionId + ': stale lesson evidence');
  }
}
if (coverage.reviewed !== 235 || coverage.questions.length !== 235 || coverage.unverified !== 0)
  failures.push('Question review incomplete');
const output = {
  schemaVersion: 1,
  scope: 'Frozen V7 release; eight capstones deferred by user request',
  regression: {
    success: report.success,
    passed: tests.filter((t) => t.status === 'passed').length,
    files: report.testResults.length,
    skipped: tests.filter((t) => t.status !== 'passed').length,
  },
  available: inherited.length + available.length,
  inheritedLessonIds: inherited,
  inheritedEvidence,
  deferredLessonIds: deferred.map((lesson) => lesson.id),
  reviewedQuestions: coverage.reviewed,
  questionClassifications: coverage.coverageCounts,
  limitations:
    'Passing bounded simulations does not prove native vendor parity or real work experience. Inherited lessons retain their existing workflow-based completion semantics. Deferred capstones are not executable.',
  lessons,
  failures,
};
writeFileSync(resolve(root, 'docs/V7-RELEASE-TEST-EVIDENCE.json'), JSON.stringify(output, null, 2) + '\n');
process.stdout.write(
  JSON.stringify({ ...output, lessons: lessons.length, inheritedLessonIds: inherited.length }, null, 2) +
    '\n',
);
if (failures.length) process.exitCode = 1;
