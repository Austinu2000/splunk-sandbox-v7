/** Explicit, bounded V7 cluster operations. Configuration remains in the virtual files. */
export interface ClusterOperationJob {
  id: string;
  kind: 'indexer-restart' | 'indexer-bundle' | 'shc-bundle' | 'shc-restart';
  manager: string;
  targets: string[];
  completed: string[];
  cursor: number;
  phase: 'queued' | 'draining' | 'stopped' | 'verifying';
  status: 'running' | 'paused' | 'completed' | 'aborted';
  started: number;
  finished?: number;
  error?: string;
  checksum?: string;
  files?: Record<string, string>;
  sourceRevisions: Record<string, string>;
  priorMaintenance: boolean;
  events: { tick: number; host: string; phase: string; detail: string }[];
}
export interface ClusterManagementState {
  version: 1;
  siteFaults?: Record<string, { hosts: string[]; started: number; restored?: number }>;
  manualMaintenance?: boolean;
  nextId: number;
  jobs: ClusterOperationJob[];
  validations: {
    id: string;
    tick: number;
    manager: string;
    checksum: string;
    valid: boolean;
    issues: string[];
  }[];
  receipts: { id: string; tick: number; kind: string; host: string; detail: string }[];
  peerBundles: Record<string, { checksum: string; paths: string[] }>;
  shc: {
    captain: string | null;
    term: number;
    elections: { tick: number; captain: string | null; term: number }[];
    bundles: Record<string, { checksum: string; paths: string[] }>;
    replication: {
      id: string;
      source: string;
      targets: string[];
      files: { path: string; text: string; stanza?: string; deleted?: boolean }[];
      completed: string[];
      error?: string;
    }[];
  };
  smartstore: {
    objects: Record<
      string,
      {
        bucketId: string;
        key: string;
        uploaded: number;
        bytes: number;
        cached: string[];
        accessed?: Record<string, number>;
      }
    >;
    remoteAvailable: boolean;
    fetches: { tick: number; bucketId: string; host: string; bytes: number }[];
    evictions: { tick: number; bucketId: string; host: string }[];
  };
}
