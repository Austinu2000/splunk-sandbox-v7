export type TrainingValue = string | number | boolean;
export interface TrainingQuestion {
  id: string;
  topic: string;
  question: string;
  reportedSessionCount: number;
  proposedWorkstreams: string[];
  relatedExistingScenarioIds: string[];
  relayedOrReconstructedWordingPresent: boolean;
}
export interface TrainingResource {
  id: string;
  kind:
    | 'aws'
    | 'hec'
    | 'cribl'
    | 'cluster'
    | 'shc'
    | 'kvstore'
    | 'monitor'
    | 'storage'
    | 'otel'
    | 'itsi'
    | 'security'
    | 'dashboard'
    | 'migration';
  title: string;
  config: Record<string, TrainingValue>;
  running: Record<string, TrainingValue>;
  revision: number;
  appliedRevision: number;
  metrics: Record<string, TrainingValue>;
  queue: string[];
  delivered: string[];
  retained: string[];
  logs: string[];
}
export interface TrainingEvidence {
  id: number;
  tick: number;
  kind: string;
  target: string;
  revision: number;
  success: boolean;
  detail: string;
}
export interface TrainingAttempt {
  id: string;
  scenario: string;
  fromEvidence: number;
  started: number;
  closed?: number;
  notes: Record<string, string>;
  score?: { recovery: number; process: number; communication: number; feedback: string[] };
}
export interface PracticeAnswer {
  text: string;
  basis: 'work experience' | 'sandbox practice';
  updated: number;
}
export interface TrainingState {
  buckets?: {
    id: string;
    copies: { host: string; searchable: boolean }[];
    stage: 'hot' | 'warm' | 'cold' | 'frozen';
    ageDays: number;
  }[];
  retiredPeers?: string[];
  version: 1;
  nextId: number;
  resources: TrainingResource[];
  evidence: TrainingEvidence[];
  attempts: TrainingAttempt[];
  answers: Record<string, PracticeAnswer>;
  lookups: Record<string, Record<string, string | number | null | string[]>[]>;
  macros: Record<string, string>;
  summaries: Record<
    string,
    { search: string; rows: Record<string, string | number | null | string[]>[]; tick: number }
  >;
  learners: string[];
  learner: string;
}
export interface TrainingCasePublic {
  id: string;
  title: string;
  track: string;
  questionIds: string[];
  resource: string;
  impact: string;
  evidence: string[];
  followups: string[];
}
export interface TrainingView {
  state: TrainingState;
  cases: TrainingCasePublic[];
  questions: TrainingQuestion[];
  resolved: Record<string, boolean>;
}
export interface CodeReview {
  fixture?: boolean;
  id: number;
  repo: string;
  branch: string;
  title: string;
  status: 'open' | 'merged';
  head: string;
  base: string;
  approved?: string;
  check?: { head: string; base: string; passed: boolean; messages: string[] };
  comments: string[];
  deployed?: string;
}
export interface AutomationRun {
  id: string;
  revision: string;
  check: boolean;
  syntax: boolean;
  changed: number;
  failed: number;
  unreachable: number;
  hosts: { host: string; changed: number; failed: boolean; unreachable: boolean; messages: string[] }[];
  logs: string[];
}
export interface CodeState {
  schedules?: {
    id: number;
    repo: string;
    branch: string;
    path: string;
    interval: number;
    nextTick: number;
    limit: string;
    enabled: boolean;
    lastResult?: string;
  }[];
  nextId: number;
  reviews: CodeReview[];
  runs: AutomationRun[];
}
