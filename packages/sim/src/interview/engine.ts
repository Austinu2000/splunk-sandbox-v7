import { op } from '../journal';
import type {
  ActionDto,
  AiAssessmentDto,
  ActionKind,
  DebriefDto,
  DimensionScoreDto,
  InterviewAnswerDto,
  InterviewCatalogDto,
  InterviewDto,
  InterviewOptionsDto,
  RubricDimension,
  TimelineEntryDto,
} from '@sandbox/shared';
import { hashString } from '../rng';
import { resolveHost } from '../hosts/profile';
import {
  endTicket,
  fixed,
  refreshTickets,
  ScenarioError,
  startScenario,
  type ActionMatcher,
  type InterviewSpec,
  type Scenario,
} from '../scenario/engine';
import type { World } from '../world';

/**
 * Interview mode: one incident at a time, posed as an interviewer would, with a wall-clock timer,
 * hints that cost points, and a deterministic rubric grade from the action log and the world state.
 * Wall-clock times come from the caller (the server); nothing here reads the real clock.
 */

export interface InterviewRecord extends InterviewDto {
  /** The first action (seq) that belongs to this interview. */
  fromSeq: number;
}

// ---------------------------------------------------------------- action log

export function logAction(
  world: World,
  a: { kind: ActionKind; text: string; host?: string; user?: string; success?: boolean },
  wallTime: number,
): ActionDto {
  return op(world, { k: 'action', ...a, wall: wallTime }, () => appendAction(world, a, wallTime));
}

function appendAction(
  world: World,
  a: { kind: ActionKind; text: string; host?: string; user?: string; success?: boolean },
  wallTime: number,
): ActionDto {
  const text = a.text.slice(0, 2000);
  const entry: ActionDto = { seq: world.actionSequence = (world.actionSequence ?? world.actions.at(-1)?.seq ?? 0) + 1, simTime: world.clock.now, wallTime, ...a, text };
  // `ssh host command` runs the command on the target, so that is where it counts.
  if (a.kind === 'cmd') {
    const m = /^ssh\s+(?:-\S+\s+)*(?:([\w.-]+)@)?([\w.-]+)\s+(.+)$/.exec(text);
    if (m && resolveHost(world, m[2]!))
      Object.assign(entry, { host: m[2], user: m[1] ?? a.user, text: m[3] });
  }
  world.actions.push(entry);
  // Keep the log bounded; an interview only ever needs its own slice.
  if (world.actions.length > 50_000) world.actions.splice(0, 10_000);
  return entry;
}

function actionsSince(world: World, seq: number): ActionDto[] {
  return world.actions.filter((a) => a.seq >= seq);
}

const re = (s: string) => new RegExp(s, 'i');

export function matches(world: World, m: ActionMatcher, a: ActionDto): boolean {
  if (a.success === false) return false;
  if (m.cmd !== undefined) {
    if (a.kind !== 'cmd' || !re(m.cmd).test(a.text)) return false;
  } else if (m.search !== undefined) {
    if (a.kind !== 'search' || !re(m.search).test(a.text)) return false;
  } else if (m.page !== undefined) {
    if (a.kind !== 'page' || !re(m.page).test(a.text)) return false;
  }
  if (m.host !== undefined && !(a.host && re(m.host).test(a.host))) return false;
  if (m.role !== undefined) {
    const role = a.host ? resolveHost(world, a.host)?.role : undefined;
    if (!role || !re(m.role).test(role)) return false;
  }
  return true;
}

// ---------------------------------------------------------------- generic classification

/** Commands that change something: config edits, file changes, service actions. */
const CHANGE =
  /(^|[;&|]\s*)(sudo\s+)?(vi|vim|nano|tee|rm|mv|cp|chmod|chown|chgrp|touch|mkdir|sed\s+-i\S*)\b|[^2]>{1,2}\s*\S|\bsplunk\s+(restart|stop|start|reload|apply|enable|disable|set|edit|add|remove|clean)\b/i;

/** Risky everywhere, whatever the incident. */
const GENERIC_UNSAFE: { label: string; test: RegExp }[] = [
  { label: 'Deleted indexed data (splunk clean)', test: /\bsplunk\s+clean\b/i },
  { label: 'Deleted files under the index database', test: /\brm\b.*\/var\/lib\/splunk/i },
  {
    label: 'Deleted a Splunk configuration directory',
    test: /\brm\s+-\w*r\w*\s+.*\/etc\/(system|apps|deployment-apps|manager-apps|peer-apps)\/?\s*$/i,
  },
  { label: 'Killed splunkd instead of stopping it cleanly', test: /\bkill\s+-(9|KILL)\b/i },
];

/** Pages that don't investigate anything. */
const NON_INVESTIGATIVE_PAGES = /^(interview|tickets)\b/;

export function isChange(a: ActionDto): boolean {
  return a.kind === 'cmd' && CHANGE.test(a.text);
}

function isInvestigation(a: ActionDto): boolean {
  if (a.success === false) return false;
  if (a.kind === 'search') return true;
  if (a.kind === 'page') return !NON_INVESTIGATIVE_PAGES.test(a.text);
  if (a.kind === 'cmd')
    return !isChange(a) && !/^(ssh|exit|logout|clear|cd|pwd|whoami|history|sudo\s+-i|help)\b/.test(a.text);
  return false;
}

// ---------------------------------------------------------------- lifecycle

function interviewable(world: World): (Scenario & { interview: InterviewSpec })[] {
  return world.scenarios.definitions.filter(
    (s): s is Scenario & { interview: InterviewSpec } => !!s.interview,
  );
}

function seen(world: World, id: string): boolean {
  return world.scenarios.tickets.some((t) => t.scenarioId === id);
}

export function interviewCatalog(
  world: World,
  aiGrading: boolean,
  practised: string[] = [],
): InterviewCatalogDto {
  const list = interviewable(world);
  return {
    topics: [...new Set(list.flatMap((s) => s.topics))].sort(),
    scenarios: list.map((s) => ({
      id: s.id,
      title: s.title,
      topics: s.topics,
      difficulty: s.difficulty,
      seen: seen(world, s.id),
      practised: practised.includes(s.id),
    })),
    aiGrading,
  };
}

function current(world: World): InterviewRecord | undefined {
  return world.interviews.find((i) => i.status === 'running');
}

export function startInterview(world: World, opts: InterviewOptionsDto, wallNow: number): InterviewRecord {
  return op(world, { k: 'interview.start', opts, wall: wallNow }, () => begin(world, opts, wallNow));
}

function begin(world: World, opts: InterviewOptionsDto, wallNow: number): InterviewRecord {
  if (current(world)) throw new ScenarioError('Finish the running interview first');
  if (world.scenarios.tickets.some((t) => t.status !== 'closed'))
    throw new ScenarioError(
      'Close the open sandbox tickets before starting an interview (one incident at a time)',
    );
  let pool = interviewable(world).filter((s) => !seen(world, s.id));
  if (opts.scenarioId) {
    const s = interviewable(world).find((x) => x.id === opts.scenarioId);
    if (!s) throw new ScenarioError('Unknown interview scenario');
    if (seen(world, s.id)) throw new ScenarioError('That incident was already used in this session');
    pool = [s];
  }
  if (opts.topic) pool = pool.filter((s) => s.topics.includes(opts.topic!));
  if (opts.difficulty) pool = pool.filter((s) => s.difficulty === opts.difficulty);
  if (!pool.length) throw new ScenarioError('No unseen incident matches that topic and difficulty');
  // Prefer incidents not practised in earlier sessions, when any are left.
  const fresh = pool.filter((s) => !opts.avoid?.includes(s.id));
  if (fresh.length) pool = fresh;
  // Deterministic for a seed and a session's history, without consuming the world RNG.
  const pick = pool[hashString(`${world.config.seed}:interview:${world.interviews.length}`) % pool.length]!;
  const spec = pick.interview;
  const ticket = startScenario(world, pick.id);
  const minutes = opts.timeLimitMinutes ?? spec.timeLimitMinutes;
  if (!(minutes >= 5 && minutes <= 120)) throw new ScenarioError('Time limit must be 5–120 minutes');
  const record: InterviewRecord = {
    id: `IV-${String(world.interviews.length + 1).padStart(3, '0')}`,
    scenarioId: pick.id,
    ticketId: ticket.id,
    title: pick.title,
    topics: pick.topics,
    difficulty: pick.difficulty,
    prompt: spec.prompt,
    startedAt: wallNow,
    deadline: wallNow + minutes * 60_000,
    timeLimitMinutes: minutes,
    notes: '',
    hintsAvailable: spec.hints.length,
    hintsUsed: [],
    status: 'running',
    fromSeq: (world.actionSequence ?? world.actions.at(-1)?.seq ?? 0) + 1,
  };
  world.interviews.push(record);
  return record;
}

function running(world: World, id: string): InterviewRecord {
  const i = world.interviews.find((x) => x.id === id);
  if (!i) throw new ScenarioError('Unknown interview');
  if (i.status !== 'running') throw new ScenarioError('This interview has already been submitted');
  return i;
}

function specFor(world: World, i: InterviewRecord): InterviewSpec {
  return world.scenarios.definitions.find((s) => s.id === i.scenarioId)!.interview!;
}

export function takeHint(world: World, id: string, wallNow: number): InterviewRecord {
  return op(world, { k: 'interview.hint', id, wall: wallNow }, () => hint(world, id, wallNow));
}

function hint(world: World, id: string, wallNow: number): InterviewRecord {
  const i = running(world, id);
  const hint = specFor(world, i).hints[i.hintsUsed.length];
  if (!hint) throw new ScenarioError('No more hints for this incident');
  i.hintsUsed.push({ text: hint.text, cost: hint.cost });
  logAction(world, { kind: 'hint', text: hint.text }, wallNow);
  return i;
}

export function saveNotes(world: World, id: string, notes: string): InterviewRecord {
  return op(world, { k: 'interview.notes', id, notes }, () => notesFor(world, id, notes));
}

function notesFor(world: World, id: string, notes: string): InterviewRecord {
  const i = running(world, id);
  if (notes.length > 20_000) throw new ScenarioError('Notes are limited to 20,000 characters');
  i.notes = notes;
  return i;
}

const ANSWER_LIMIT = 4000;

export function submitInterview(
  world: World,
  id: string,
  answer: InterviewAnswerDto,
  wallNow: number,
): InterviewRecord {
  return op(world, { k: 'interview.submit', id, answer, wall: wallNow }, () =>
    submit(world, id, answer, wallNow),
  );
}

function submit(world: World, id: string, answer: InterviewAnswerDto, wallNow: number): InterviewRecord {
  const i = running(world, id);
  const fields = ['rootCause', 'fix', 'verification', 'prevention'] as const;
  for (const f of fields)
    if (typeof answer[f] !== 'string' || answer[f].length > ANSWER_LIMIT)
      throw new ScenarioError(`Each answer field is limited to ${ANSWER_LIMIT} characters`);
  if (fields.every((f) => !answer[f].trim()))
    throw new ScenarioError('Write at least a root cause before submitting');
  logAction(world, { kind: 'submit', text: 'Submitted answer' }, wallNow);
  refreshTickets(world);
  i.answer = { ...answer };
  i.debrief = grade(world, i, wallNow);
  i.status = 'submitted';
  i.submittedAt = wallNow;
  endTicket(world, i.ticketId, `${answer.rootCause}\n\nFix: ${answer.fix}`);
  return i;
}

// ---------------------------------------------------------------- grading

const WEIGHTS: Record<RubricDimension, number> = {
  triage: 15,
  evidence: 20,
  rootCause: 20,
  fix: 20,
  verification: 10,
  safety: 10,
  communication: 5,
};
const LABELS: Record<RubricDimension, string> = {
  triage: 'Triage',
  evidence: 'Evidence',
  rootCause: 'Root cause',
  fix: 'Fix',
  verification: 'Verification',
  safety: 'Safety',
  communication: 'Communication',
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Concrete names a stakeholder can act on: hosts, components, config files. */
const CONCRETE =
  /\b(idx\d+|ds01|cm01|lm01|sh\d+|hf\d+|[a-z]{3}-[a-z]+-\d{4}|serverclass|props|transforms|outputs|inputs|limits|savedsearches|server\.conf|deployment server|cluster bundle|scheduler|license|forwarder|indexer)\b/i;

export function grade(world: World, i: InterviewRecord, wallNow: number): DebriefDto {
  const scenario = world.scenarios.definitions.find((s) => s.id === i.scenarioId)!;
  const spec = scenario.interview!;
  const ticket = world.scenarios.tickets.find((t) => t.id === i.ticketId)!;
  const answer = i.answer!;
  const actions = actionsSince(world, i.fromSeq).filter((a) => a.kind !== 'submit');

  // Milestones: the first action that meets each one.
  const hitBy = new Map<string, number>();
  for (const step of spec.expectedPath) {
    const a = actions.find((x) => step.any.some((m) => matches(world, m, x)));
    if (a) hitBy.set(step.id, a.seq);
  }
  const firstChange = actions.find(isChange);
  const changeSeq = firstChange?.seq ?? Infinity;

  // Unsafe moves: generic plus the incident's own.
  const unsafe = new Map<number, string>();
  for (const a of actions) {
    if (a.kind !== 'cmd') continue;
    const g = GENERIC_UNSAFE.find((u) => u.test.test(a.text));
    const s = spec.unsafe.find((u) => matches(world, u.match, a));
    if (g || s) unsafe.set(a.seq, (s ?? g)!.label);
  }

  const isFixed = fixed(world, scenario.fixChecks) && ticket.symptomSeen === true;
  const fixedAt = isFixed ? ticket.fixedAt : undefined;
  // The change that fixed it: the last change before the fix checks first passed.
  const fixingSeq =
    fixedAt !== undefined
      ? actions.filter((a) => isChange(a) && a.simTime <= fixedAt).at(-1)?.seq
      : undefined;
  const verifying =
    fixedAt !== undefined
      ? actions.filter(
          (a) => a.simTime >= fixedAt && !isChange(a) && spec.verification.some((m) => matches(world, m, a)),
        )
      : [];

  const scores: DimensionScoreDto[] = [];
  const add = (dimension: RubricDimension, score: number, notes: string[]) =>
    scores.push({
      dimension,
      label: LABELS[dimension],
      score: Math.round(Math.max(0, Math.min(100, score))),
      weight: WEIGHTS[dimension],
      notes,
    });

  // Triage: scope the problem (meet a milestone) before changing anything.
  {
    const evidenceBefore = [...hitBy.values()].some((s) => s < changeSeq);
    const lookedBefore = actions.some((a) => a.seq < changeSeq && isInvestigation(a));
    if (evidenceBefore)
      add('triage', 100, [
        firstChange
          ? 'Gathered relevant evidence before the first change.'
          : 'Investigated without making any changes.',
      ]);
    else if (lookedBefore)
      add('triage', 60, [
        'Looked around before changing anything, but not at the evidence that scopes this incident.',
      ]);
    else if (firstChange)
      add('triage', 0, [
        `Changed something first: \`${firstChange.text}\` on ${firstChange.host ?? 'the bastion'}.`,
      ]);
    else add('triage', 0, ['No investigation was recorded.']);
  }

  // Evidence: the expected milestones, in any order.
  {
    const missed = spec.expectedPath.filter((s) => !hitBy.has(s.id));
    add('evidence', (hitBy.size / spec.expectedPath.length) * 100, [
      `${hitBy.size} of ${spec.expectedPath.length} key checks made.`,
      ...missed.map((m) => `Missed: ${m.label}.`),
    ]);
  }

  // Root cause: concepts named in the written answer.
  {
    const text = `${answer.rootCause}\n${answer.fix}`;
    const named = spec.rootCause.filter((c) => c.any.some((p) => re(p).test(text)));
    const notes = named.length ? [`Named: ${named.map((c) => c.label).join('; ')}.`] : [];
    const missing = spec.rootCause.filter((c) => !named.includes(c));
    if (missing.length) notes.push(`Not named: ${missing.map((c) => c.label).join('; ')}.`);
    add('rootCause', (named.length / spec.rootCause.length) * 100, notes);
  }

  // Fix: judged on the world, not the description.
  if (!isFixed) add('fix', 0, ['The incident was not fixed when the answer was submitted.']);
  else if (ticket.status === 'resolved')
    add('fix', 100, ['Fixed, and the fix held through the recovery period.']);
  else add('fix', 85, ['Fixed, but recovery had not been confirmed yet when the answer was submitted.']);

  // Verification: data checked after the fix went in.
  if (!isFixed) add('verification', 0, ['Nothing to verify: the incident was not fixed.']);
  else if (verifying.length)
    add('verification', 100, [`Confirmed recovery with data: \`${verifying[0]!.text}\`.`]);
  else if (words(answer.verification) >= 5)
    add('verification', 30, ['Described a verification, but no check after the fix was recorded.']);
  else add('verification', 0, ['No check after the fix was recorded.']);

  // Safety.
  {
    const labels = [...new Set(unsafe.values())];
    add(
      'safety',
      100 - 50 * unsafe.size,
      labels.length ? labels.map((l) => `Risky: ${l}.`) : ['No risky actions.'],
    );
  }

  // Communication: a complete, concise, concrete summary.
  {
    const filled = (['rootCause', 'fix', 'verification', 'prevention'] as const).filter(
      (f) => words(answer[f]) >= 3,
    );
    const total = words(Object.values(answer).join(' '));
    const notes: string[] = [];
    let s = filled.length * 15;
    if (filled.length < 4) notes.push('Answer every part: root cause, fix, verification and prevention.');
    if (total >= 30 && total <= 300) s += 20;
    else
      notes.push(
        total < 30 ? 'Too brief for a stakeholder to act on.' : 'Too long: aim for under 300 words.',
      );
    if (CONCRETE.test(Object.values(answer).join(' '))) s += 20;
    else notes.push('Name the hosts, components or files involved.');
    if (!notes.length) notes.push('Complete, concise and specific.');
    add('communication', s, notes);
  }

  const hintPenalty = i.hintsUsed.reduce((s, h) => s + h.cost, 0);
  const weighted = scores.reduce((s, d) => s + (d.score * d.weight) / 100, 0);

  // Timeline.
  const milestoneAt = new Map<number, string[]>();
  for (const [id, seq] of hitBy) milestoneAt.set(seq, [...(milestoneAt.get(seq) ?? []), id]);
  const timeline: TimelineEntryDto[] = actions.map((a) => {
    const tags: TimelineEntryDto['tags'] = [];
    if (isChange(a)) tags.push('change');
    if (unsafe.has(a.seq)) tags.push('unsafe');
    if (verifying.some((v) => v.seq === a.seq)) tags.push('verification');
    if (a.seq === fixingSeq) tags.push('fixed');
    return {
      at: Math.max(0, Math.round((a.wallTime - i.startedAt) / 1000)),
      kind: a.kind,
      host: a.host,
      text: a.text,
      milestones: milestoneAt.get(a.seq) ?? [],
      tags,
      note: unsafe.get(a.seq),
    };
  });

  return {
    scores,
    hintPenalty,
    total: Math.max(0, Math.round(weighted - hintPenalty)),
    timeUsedSeconds: Math.round((wallNow - i.startedAt) / 1000),
    overtime: wallNow > i.deadline,
    fixed: isFixed,
    timeline,
    missed: spec.expectedPath.filter((s) => !hitBy.has(s.id)).map((s) => ({ id: s.id, label: s.label })),
    modelAnswer: spec.modelAnswer,
    spokenAnswer: spec.spokenAnswer,
  };
}

/** Store the optional Claude assessment on a submitted interview's debrief (journaled: it can't be recomputed offline). */
export function attachAiAssessment(
  world: World,
  id: string,
  result: { ai?: AiAssessmentDto; aiError?: string },
): InterviewRecord {
  return op(world, { k: 'interview.ai', id, ...result }, () => {
    const i = world.interviews.find((x) => x.id === id);
    if (!i?.debrief) throw new ScenarioError('Unknown or unsubmitted interview');
    if (result.ai) i.debrief.ai = result.ai;
    if (result.aiError) i.debrief.aiError = result.aiError;
    return i;
  });
}

export function interviewDto(i: InterviewRecord): InterviewDto {
  const dto: InterviewDto & { fromSeq?: number } = { ...i };
  delete dto.fromSeq;
  return dto;
}
