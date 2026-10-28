import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../../docs/${name}`, import.meta.url), 'utf8'));

it('keeps planned AU/SP lessons out of executable Learn and preserves all existing lesson IDs', () => {
  const plan = read('V7-CURRICULUM-PLAN.json');
  const existing = readdirSync(new URL('../../../lessons/', import.meta.url))
    .filter((n) => n.endsWith('.json'))
    .map((n) => n.slice(0, -5))
    .sort();
  expect(existing).toEqual(plan.existingLessonIds);
  expect(existing).toHaveLength(27);
  expect(plan.lessons).toHaveLength(150);
  const expected = [
    ...Array.from({ length: 100 }, (_, n) => `SP-${String(n + 1).padStart(3, '0')}`),
    ...Array.from({ length: 50 }, (_, n) => `AU-${String(n + 1).padStart(2, '0')}`),
  ];
  expect(plan.lessons.map((l: { id: string }) => l.id)).toEqual(expected);
  expect(
    readdirSync(new URL('../../../lessons/v7/', import.meta.url))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.slice(0, -5))
      .sort(),
  ).toEqual(
    plan.lessons
      .filter((lesson: { executable: boolean }) => lesson.executable)
      .map((lesson: { id: string }) => lesson.id)
      .sort(),
  );
  for (const lesson of plan.lessons) {
    const file = new URL('../../../lessons/v7/' + lesson.id + '.json', import.meta.url);
    if (lesson.executable) {
      const definition = JSON.parse(readFileSync(file, 'utf8'));
      expect(definition.status).toBe('verified');
      expect(lesson.fixtureVersion).toBe(definition.fixture.version);
    } else {
      expect(lesson.status).toBe('planned');
      expect(lesson.functionalCoverageVerified).toBe(false);
    }
  }
});

it('accounts for every source question with reviewed evidence and keeps deferred work out of verified coverage', () => {
  const source = read('V4-INTERVIEW-QUESTION-MAP.json');
  const coverage = read('V7-INTERVIEW-QUESTION-COVERAGE.json');
  const plan = read('V7-CURRICULUM-PLAN.json');
  const available = new Set(
    plan.lessons.filter((l: { executable: boolean }) => l.executable).map((l: { id: string }) => l.id),
  );
  const deferred = new Set(
    plan.lessons.filter((l: { executable: boolean }) => !l.executable).map((l: { id: string }) => l.id),
  );
  const counts: Record<string, number> = {};
  expect(coverage.schemaVersion).toBe(2);
  expect(coverage.questions).toHaveLength(235);
  expect(coverage.reviewed).toBe(235);
  expect(coverage.unverified).toBe(0);
  expect(coverage.releaseScope.availableLessons).toBe(available.size + plan.existingLessonIds.length);
  expect(coverage.releaseScope.deferredLessons).toEqual([...deferred]);
  expect(coverage.questions.map((q: { questionId: string }) => q.questionId)).toEqual(
    source.questions.map((q: { id: string }) => q.id),
  );
  const categories = [
    'verified-practice',
    'partial-practice',
    'conceptual-only',
    'not-implemented',
    'personal-response',
  ];
  for (const [index, row] of coverage.questions.entries()) {
    expect(row.question).toBe(source.questions[index].question);
    expect(categories).toContain(row.coverage);
    expect(row.reviewNote.length).toBeGreaterThan(30);
    counts[row.coverage] = (counts[row.coverage] ?? 0) + 1;
    expect(row.candidateLessons).toEqual([...row.availableLessons, ...row.deferredLessons]);
    expect(row.testEvidence.map((e: { lessonId: string }) => e.lessonId)).toEqual(row.availableLessons);
    for (const id of row.deferredLessons) expect(deferred.has(id)).toBe(true);
    for (const evidence of row.testEvidence) {
      expect(available.has(evidence.lessonId)).toBe(true);
      const definition = JSON.parse(
        readFileSync(new URL('../../../lessons/v7/' + evidence.lessonId + '.json', import.meta.url), 'utf8'),
      );
      expect(definition.status).toBe('verified');
      expect(evidence.fixtureVersion).toBe(definition.fixture.version);
      expect(evidence.tests).toEqual(definition.validation.map((v: { test: string }) => v.test));
      for (const environment of definition.environments)
        expect(row.suitableEnvironments).toContain(environment);
      for (const reference of definition.references)
        expect(row.supportingDocumentation).toContainEqual(reference);
    }
    if (row.coverage === 'verified-practice') {
      expect(row.availableLessons.length).toBeGreaterThan(0);
      expect(row.simulatorFunctionality).toBe('bounded-tested');
    }
  }
  expect(coverage.coverageCounts).toEqual(counts);
  expect(coverage.verifiedCovered).toBe(counts['verified-practice']);
  expect(available.size).toBe(142);
  expect([...deferred]).toEqual(Array.from({ length: 8 }, (_, n) => 'SP-' + String(n + 93).padStart(3, '0')));
  expect(
    plan.lessons
      .filter((l: { executable: boolean }) => !l.executable)
      .every((l: { deferred: boolean }) => l.deferred),
  ).toBe(true);
});
