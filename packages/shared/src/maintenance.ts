export interface ConfigurationBackup {
  id: string;
  host: string;
  name: string;
  path: string;
  digest: string;
  sourceRevision: string;
  packageVersion: string;
  tick: number;
  verified?: number;
}
export interface UpgradePreflight {
  id: string;
  tick: number;
  targets: string[];
  targetVersion: string;
  valid: boolean;
  issues: string[];
  sourceRevisions: Record<string, string>;
  artifactDigests: Record<string, string>;
  backupIds: Record<string, string>;
}
export interface UpgradeJob {
  id: string;
  targets: string[];
  targetVersion: string;
  preflightId: string;
  cursor: number;
  phase: 'queued' | 'draining' | 'stopped' | 'installed' | 'verifying';
  status: 'running' | 'paused' | 'completed' | 'aborted';
  started: number;
  completed: string[];
  sourceRevisions: Record<string, string>;
  artifactDigests: Record<string, string>;
  acceptTrainingLicense: boolean;
  priorMaintenance: boolean;
  error?: string;
  events: { tick: number; host: string; phase: string; detail: string }[];
}
export interface MaintenanceRuntime {
  version: 1;
  nextId: number;
  tlsWatches?: { host: string; server: string }[];
  tlsProbes?: {
    tick: number;
    host: string;
    server: string;
    reachable: boolean;
    verified: boolean;
    issuer: string;
    caIssuers: string[];
    sourceRevision: string;
    error: string;
  }[];
  installations: Record<string, { version: string; licenseAccepted: boolean; installedTick: number }>;
  backups: ConfigurationBackup[];
  restores: {
    id: string;
    host: string;
    backupId: string;
    tick: number;
    packageVersion: string;
    beforeArchive: string;
  }[];
  preflights: UpgradePreflight[];
  jobs: UpgradeJob[];
  receipts: { id: string; host: string; tick: number; kind: string; detail: string }[];
}
