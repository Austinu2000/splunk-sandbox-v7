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

it('accounts for every source question without claiming untested candidate mappings as coverage', () => {
  const source = read('V4-INTERVIEW-QUESTION-MAP.json');
  const coverage = read('V7-INTERVIEW-QUESTION-COVERAGE.json');
  const planned = new Set(read('V7-CURRICULUM-PLAN.json').lessons.map((l: { id: string }) => l.id));
  expect(coverage.questions).toHaveLength(235);
  expect(coverage.verifiedCovered).toBe(0);
  expect(coverage.unverified).toBe(235);
  expect(coverage.questions.map((q: { questionId: string }) => q.questionId)).toEqual(
    source.questions.map((q: { id: string }) => q.id),
  );
  for (const row of coverage.questions) {
    expect(row.coverage).toBe('unverified');
    expect(row.simulatorFunctionality).toBe('not-yet-verified');
    for (const candidate of row.candidateLessons) expect(planned.has(candidate)).toBe(true);
  }
});
