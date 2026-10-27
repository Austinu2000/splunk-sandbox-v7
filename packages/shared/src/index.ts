// Types shared by the server and the web UI. Keep this file free of runtime dependencies.

export const HEALTH_STATES = [
  'healthy',
  'stale_phonehome',
  'blocked_queue',
  'offline',
  'version_drift',
  'wrong_serverclass',
] as const;
export type HealthState = (typeof HEALTH_STATES)[number];
export type UnhealthyState = Exclude<HealthState, 'healthy'>;

export const HEALTH_LABELS: Record<HealthState, string> = {
  healthy: 'Healthy',
  stale_phonehome: 'Stale phone-home',
  blocked_queue: 'Blocked queue',
  offline: 'Offline',
  version_drift: 'Version drift',
  wrong_serverclass: 'Wrong server class',
};

export type OsFamily = 'windows' | 'linux';

export type DeploymentClientStatus = 'connected' | 'not_phoning_home' | 'mismatched';

export interface ForwarderRecord {
  hostname: string;
  ip: string;
  os: OsFamily;
  site: string;
  serverClass: string;
  /** The server class the deployment server actually maps this client to. */
  assignedServerClass: string;
  version: string;
  outputGroup: string;
  health: HealthState;
  healthSince: number;
  deploymentClientStatus: DeploymentClientStatus;
  lastPhoneHome: number;
  queueFillPct: number;
  throughputKBps: number;
}

export interface FleetFilter {
  site?: string;
  serverClass?: string;
  health?: HealthState;
  os?: OsFamily;
  /** Case-insensitive hostname substring. */
  q?: string;
}

export type HealthCounts = Record<HealthState, number>;

export interface GroupSummary {
  id: string;
  name: string;
  total: number;
  byHealth: HealthCounts;
}

export interface FleetSummary {
  at: number;
  total: number;
  byHealth: HealthCounts;
  bySite: GroupSummary[];
  byServerClass: GroupSummary[];
}

export type HostSortKey = 'hostname' | 'lastPhoneHome' | 'health' | 'site';

export interface HostPage {
  total: number;
  offset: number;
  limit: number;
  rows: ForwarderRecord[];
}

export type InfraRole =
  | 'indexer'
  | 'search_head'
  | 'deployment_server'
  | 'cluster_manager'
  | 'license_manager'
  | 'heavy_forwarder'
  | 'deployer'
  | 'monitoring_console'
  | 'soar'
  | 'cribl_poc'
  | 'automation';

export interface InfraNodeInfo {
  hostname: string;
  role: InfraRole;
  site: string;
  ip: string;
  status: 'up' | 'down' | 'restarting';
}

export interface WorldInfo {
  profileId?: string;
  profileName?: string;
  seed: string;
  fleetSize: number;
  now: number;
  tick: number;
  tickMs: number;
  speed: number;
  paused: boolean;
  sites: { id: string; name: string }[];
  serverClasses: { id: string; os: OsFamily }[];
  infra: InfraNodeInfo[];
}

export const CLOCK_SPEEDS = [1, 5, 30] as const;
export type ClockSpeed = (typeof CLOCK_SPEEDS)[number];

// ---------------------------------------------------------------- search (milestone 4)

export type ResultValue = string | number | null | string[];

export interface SearchRequestDto {
  search: string;
  earliest: string;
  latest: string;
}

export interface SearchEventDto {
  /** Epoch seconds. */
  time: number;
  raw: string;
  host: string;
  source: string;
  sourcetype: string;
  index: string;
  fields: Record<string, ResultValue>;
}

export interface FieldSummaryDto {
  name: string;
  count: number;
  distinct: number;
  numeric: boolean;
  top: { value: string; count: number }[];
}

export interface SearchMessageDto {
  type: 'info' | 'warn' | 'error';
  text: string;
}

export interface SearchJobDto {
  sid: string;
  search: string;
  /** Epoch ms of the resolved time range. */
  earliest: number;
  latest: number;
  status: 'done' | 'failed';
  kind: 'events' | 'statistics';
  eventCount: number;
  resultCount: number;
  scanCount: number;
  hostsScanned: number;
  truncated: boolean;
  runMs: number;
  workUnits?: number;
  messages: SearchMessageDto[];
  timeline: { time: number; count: number }[];
  timelineSpanMs: number;
  fields: FieldSummaryDto[];
  columns: string[];
  phases: { name: string; ms: number; rows: number }[];
}

export interface PageDto<T> {
  offset: number;
  total: number;
  items: T[];
}

export interface ScenarioDto {
  id: string;
  title: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}
export interface TicketDto {
  interviewQuestionIds?: string[];
  followups?: string[];
  requestedEvidence?: string[];
  id: string;
  scenarioId: string;
  title: string;
  requester: string;
  persona: string;
  urgency: 'low' | 'medium' | 'high';
  text: string;
  openedAt: number;
  fixedAt?: number;
  closedAt?: number;
  status: 'open' | 'recovering' | 'resolved' | 'closed';
  resolutionNote?: string;
  /** The incident's fix checks have failed at least once (the symptom really appeared). */
  symptomSeen?: boolean;
  /** Set when an interview ended the ticket: whether the fix had held by then. */
  outcome?: 'resolved' | 'unresolved';
}

// ---------------------------------------------------------------- Monitoring Console

export const MC_VIEWS = ['indexing', 'forwarders', 'license', 'scheduler'] as const;
export type McView = (typeof MC_VIEWS)[number];

export interface McStatDto {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'bad';
  hint?: string;
}

/** One dashboard panel: an SPL search run on the server (or a fleet query), with the SPL to open it in Search. */
export interface McPanelDto {
  id: string;
  title: string;
  /** line/area: a timechart (first column _time); table: rows as-is. */
  chart: 'line' | 'area' | 'table';
  unit?: string;
  search: string;
  earliest: string;
  latest: string;
  columns: string[];
  rows: Record<string, ResultValue>[];
  messages: SearchMessageDto[];
  /** Shown when there are no rows. */
  empty?: string;
}

export interface McViewDto {
  view: McView;
  generatedAt: number;
  stats: McStatDto[];
  panels: McPanelDto[];
}

// ---------------------------------------------------------------- Forwarder Management

export interface DsClientDto {
  hostname: string;
  ip: string;
  os: OsFamily;
  build: string;
  lastPhoneHome: number;
  health: HealthState;
  serverClasses: string[];
  apps: string[];
}

export interface DsServerClassDto {
  name: string;
  whitelist: string[];
  blacklist: string[];
  apps: string[];
  clients: number;
}

export interface DsAppDto {
  name: string;
  serverClasses: string[];
  clients: number;
  /** Whether a change saved on disk is waiting for `splunk reload deploy-server`. */
  pendingReload: boolean;
}

export interface DsOverviewDto {
  server: string;
  phoneHomeIntervalSeconds: number;
  totalClients: number;
  /** Clients that match no server class (so receive no apps). */
  unmatchedClients: number;
  serverClasses: DsServerClassDto[];
  apps: DsAppDto[];
}

// ---------------------------------------------------------------- Interview mode

export type ActionKind = 'cmd' | 'search' | 'page' | 'hint' | 'submit';

/** One thing the user did. Recorded for every session; interviews read the slice since they started. */
export interface ActionDto {
  success?: boolean;
  seq: number;
  kind: ActionKind;
  /** Sim time, epoch ms. */
  simTime: number;
  /** Wall-clock time, epoch ms (the interview timer runs on wall time). */
  wallTime: number;
  /** cmd: the host the command ran on (for `ssh host cmd`, the target). */
  host?: string;
  user?: string;
  /** The command line, SPL search, page id or hint text. */
  text: string;
}

export interface InterviewOptionsDto {
  scenarioId?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimitMinutes?: number;
  /** Incidents to pass over when picking one (practised in earlier sessions), if any others are left. */
  avoid?: string[];
}

export interface InterviewAnswerDto {
  rootCause: string;
  fix: string;
  verification: string;
  prevention: string;
}

export const RUBRIC_DIMENSIONS = [
  'triage',
  'evidence',
  'rootCause',
  'fix',
  'verification',
  'safety',
  'communication',
] as const;
export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];

export interface DimensionScoreDto {
  dimension: RubricDimension;
  label: string;
  /** 0–100 within the dimension. */
  score: number;
  /** Points this dimension can contribute to the total. */
  weight: number;
  notes: string[];
}

/** The optional Claude assessment of the free-text answer, shown next to the offline score. */
export interface AiAssessmentDto {
  model: string;
  rootCause: number;
  communication: number;
  feedback: string;
}

export interface TimelineEntryDto {
  /** Seconds since the interview started (wall clock). */
  at: number;
  kind: ActionKind;
  host?: string;
  text: string;
  /** Expected-path milestone ids this action satisfied (first time only). */
  milestones: string[];
  tags: ('change' | 'unsafe' | 'verification' | 'fixed')[];
  note?: string;
}

export interface DebriefDto {
  scores: DimensionScoreDto[];
  hintPenalty: number;
  total: number;
  timeUsedSeconds: number;
  overtime: boolean;
  fixed: boolean;
  timeline: TimelineEntryDto[];
  missed: { id: string; label: string }[];
  modelAnswer: InterviewAnswerDto;
  spokenAnswer: string;
  ai?: AiAssessmentDto;
  aiError?: string;
}

export interface InterviewDto {
  id: string;
  scenarioId: string;
  ticketId: string;
  title: string;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  startedAt: number;
  deadline: number;
  timeLimitMinutes: number;
  notes: string;
  hintsAvailable: number;
  hintsUsed: { text: string; cost: number }[];
  status: 'running' | 'submitted';
  submittedAt?: number;
  answer?: InterviewAnswerDto;
  debrief?: DebriefDto;
}

export interface InterviewCatalogDto {
  topics: string[];
  scenarios: {
    id: string;
    title: string;
    topics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    /** Already used in this world (can't be started again until a reset). */
    seen: boolean;
    /** Submitted in an interview in any saved session. */
    practised: boolean;
  }[];
  aiGrading: boolean;
}

// ---------------------------------------------------------------- Sessions (save, load, reset)

export interface SavedSessionDto {
  profileId?: string;
  slot?: string | null;
  id: number;
  name: string;
  kind: 'manual' | 'autosave';
  seed: string;
  fleetSize: number;
  tick: number;
  simTime: number;
  /** Wall-clock time of the save. */
  savedAt: number;
  interviews: number;
  bestScore: number | null;
}

export interface InterviewHistoryDto {
  profileId?: string;
  scenarioId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  startedAt: number;
  submittedAt: number;
  total: number;
  session: string;
  sessionId: number;
}

export interface SessionInfoDto {
  /** Whether saving is available (the server has a database). */
  persistence: boolean;
  /** User changes since the world was created or loaded. */
  changes: number;
  saves: SavedSessionDto[];
  history: InterviewHistoryDto[];
}

export interface EnvironmentProfileDto {
  id: string;
  name: string;
  description: string;
  role: string;
  seed: string;
  scale: { fleetSize: number; targetDailyIngestTB: number | null; users: number };
  infra: {
    indexerCluster: { indexers: number };
    searchHeadCluster: { members: number };
    esSearchHead: boolean;
    deploymentServers: number;
  };
  auth: { method: string; roleMappings: { group: string; roles: string[] }[] };
  apps: string[];
  indexes: { name: string; retentionDays: number }[];
  confirmations: { path: string; note: string }[];
  warnings: string[];
  hasAutosave?: boolean;
  lastPlayed?: number | null;
}

export * from './training';

export * from './kvstore';
export * from './splSyntax';
