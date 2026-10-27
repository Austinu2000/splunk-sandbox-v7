import { afterAll, describe, expect, it } from 'vitest';
import { createWorld } from '@sandbox/sim';
import type { InterviewCatalogDto, InterviewDto } from '@sandbox/shared';
import { buildApp } from '../src/app';
import { aiGradingEnabled, type AiGradeInput } from '../src/aiGrader';

const seen: AiGradeInput[] = [];
const { app } = buildApp(createWorld({ fleetSize: 1000 }), {
  aiGrader: async (input) => {
    seen.push(input);
    if (input.answer.rootCause.includes('fail')) throw new Error('boom');
    return { model: 'stub', rootCause: 70, communication: 80, feedback: 'Name the file.' };
  },
});
afterAll(() => app.close());

const answer = (rootCause: string) => ({
  rootCause,
  fix: 'fixed it',
  verification: 'checked',
  prevention: 'review',
});

describe('interview API', () => {
  it('runs an interview end to end: start, actions, hint, notes, submit with Claude feedback', async () => {
    const cat = (await app.inject('/api/interview/catalog')).json<InterviewCatalogDto>();
    expect(cat.aiGrading).toBe(true);
    expect(cat.scenarios).toHaveLength(8);
    const start = await app.inject({
      method: 'POST',
      url: '/api/interviews',
      payload: { scenarioId: 'ds-serverclass-typo', timeLimitMinutes: 15 },
    });
    expect(start.statusCode).toBe(200);
    const iv = start.json<InterviewDto>();
    expect(iv.deadline - iv.startedAt).toBe(15 * 60_000);
    expect(JSON.stringify(iv)).not.toContain('dal-wbe');
    expect((await app.inject('/api/interviews/current')).json().interview.id).toBe(iv.id);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/actions/page',
          payload: { page: 'forwarders/serverclasses' },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'POST', url: '/api/actions/page', payload: { page: '../etc' } }))
        .statusCode,
    ).toBe(400);
    await app.inject({
      method: 'POST',
      url: '/api/search/jobs',
      payload: { search: 'index=app host=dal-web-*' },
    });
    expect(
      (await app.inject({ method: 'POST', url: `/api/interviews/${iv.id}/hint` })).json<InterviewDto>()
        .hintsUsed,
    ).toHaveLength(1);
    expect(
      (
        await app.inject({ method: 'PUT', url: `/api/interviews/${iv.id}/notes`, payload: { notes: 'DS?' } })
      ).json<InterviewDto>().notes,
    ).toBe('DS?');
    const done = (
      await app.inject({
        method: 'POST',
        url: `/api/interviews/${iv.id}/submit`,
        payload: { answer: answer('serverclass whitelist typo on ds01') },
      })
    ).json<InterviewDto>();
    expect(done.status).toBe('submitted');
    expect(done.debrief!.ai).toEqual({
      model: 'stub',
      rootCause: 70,
      communication: 80,
      feedback: 'Name the file.',
    });
    expect(done.debrief!.timeline.map((e) => e.kind)).toEqual(['page', 'search', 'hint']);
    expect(done.debrief!.timeline[0]!.milestones).toEqual(['scope', 'ds-config']);
    expect(seen[0]!.summary).toContain('dal-wbe');
    expect((await app.inject('/api/interviews/current')).json().interview).toBeNull();
    expect((await app.inject({ method: 'POST', url: `/api/interviews/${iv.id}/hint` })).statusCode).toBe(400);
  });

  it('keeps the offline score when Claude grading fails', async () => {
    const iv = (
      await app.inject({
        method: 'POST',
        url: '/api/interviews',
        payload: { scenarioId: 'input-permissions' },
      })
    ).json<InterviewDto>();
    const done = (
      await app.inject({
        method: 'POST',
        url: `/api/interviews/${iv.id}/submit`,
        payload: { answer: answer('fail') },
      })
    ).json<InterviewDto>();
    expect(done.debrief!.ai).toBeUndefined();
    expect(done.debrief!.aiError).toMatch(/boom/);
    expect(typeof done.debrief!.total).toBe('number');
    expect((await app.inject('/api/interviews')).json<InterviewDto[]>().map((i) => i.id)).toEqual([
      iv.id,
      'IV-001',
    ]);
  });

  it('validates input and turns Claude grading on only with an API key', async () => {
    expect(
      (await app.inject({ method: 'POST', url: '/api/interviews', payload: { timeLimitMinutes: 2 } }))
        .statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/interviews', payload: { scenarioId: 'nope' } }))
        .statusCode,
    ).toBe(400);
    expect(aiGradingEnabled({})).toBe(false);
    expect(aiGradingEnabled({ ANTHROPIC_API_KEY: '  ' })).toBe(false);
    expect(aiGradingEnabled({ ANTHROPIC_API_KEY: 'sk-test' })).toBe(true);
  });
});
