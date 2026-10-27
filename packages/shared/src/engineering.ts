import type { KnowledgeObject } from './knowledge';

/** V7 contracts; these types do not advertise an implemented operation. */
export type EngineeringCapability =
  | 'component.inspect'
  | 'conf.inspect'
  | 'access.enforce'
  | 'inventory.inspect'
  | 'inventory.target'
  | 'ansible.execute'
  | 'git.review'
  | 'index.standalone'
  | 'index.cluster'
  | 'index.lifecycle'
  | 'input.onboard'
  | 'search.execute'
  | 'report.manage'
  | 'report.schedule'
  | 'summary.persist'
  | 'dashboard.execute'
  | 'alert.evaluate'
  | 'forwarder.deploy'
  | 'cluster.manage'
  | 'kv.manage'
  | 'monitor.inspect'
  | 'security.integrate'
  | 'cloud.integrate'
  | 'upgrade.recover';

export interface ObjectScope {
  profileId: string;
  host: string;
  app: string;
  owner: string;
  sharing: 'Private' | 'App' | 'Global';
}

export interface OperationalIndexDefinition {
  name: string;
  scope: ObjectScope;
  datatype: 'event' | 'metric';
  deployment: 'standalone' | 'cluster-manager';
  sourcePath: string;
  settings: {
    homePath: string;
    coldPath: string;
    thawedPath: string;
    frozenTimePeriodInSecs: number;
    maxTotalDataSizeMB: number;
    disabled: boolean;
    repFactor?: 'auto';
  };
  declaredRevision: number;
  effectiveRevision: number;
}

export interface OperationalKnowledgeObject extends Omit<KnowledgeObject, 'app' | 'owner' | 'sharing'> {
  scope: ObjectScope;
  revision: number;
  sourcePath: string;
  summary?: { enabled: boolean; destinationIndex: string };
}

export interface ScheduledSearchRun {
  id: string;
  objectId: string;
  objectRevision: number;
  host: string;
  scheduledTick: number;
  startedTick?: number;
  completedTick?: number;
  earliest: number;
  latest: number;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped';
  resultCount: number;
  summaryEventIds: string[];
  error?: string;
}

/** Compare both final state and ordered, revision-bound successful evidence. */
export interface OperationalEvidence {
  sequence: number;
  tick: number;
  action: string;
  interface: 'web' | 'cli' | 'config' | 'rest' | 'scheduler';
  scope: ObjectScope;
  targetId: string;
  targetRevision: number;
  success: boolean;
  runId?: string;
}

export interface LegacyImportIssue {
  key: string;
  record?: number;
  code:
    'invalid-json' | 'invalid-shape' | 'invalid-record' | 'duplicate-id' | 'scope-conflict' | 'missing-scope';
  message: string;
}

export interface LegacyKnowledgeCandidate {
  sourceKey: string;
  sourceRecord: number;
  object: KnowledgeObject;
  /** No host can be inferred safely from a legacy browser record. */
  status: 'needs-scope' | 'conflict';
}

export interface LegacyImportPlan {
  version: 1;
  profileId: string;
  mode: 'preview-only';
  /** Byte-for-byte original values, including malformed/unknown data. Never overwrite in place. */
  preservedUiState: Record<string, string>;
  knowledge: LegacyKnowledgeCandidate[];
  settingsKeys: string[];
  issues: LegacyImportIssue[];
}

export interface EngineeringMigrationDto {
  version: 1;
  profileId: string;
  mode: 'preview-only';
  preservedKeys: string[];
  knowledgeCandidates: number;
  settingsKeys: string[];
  issues: LegacyImportIssue[];
  operationalCutover: false;
}
