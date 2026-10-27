export type KvValue = string | number | boolean | null;
export type KvRecord = Record<string, KvValue> & { _key: string };
export interface KvNode {
  host: string;
  domain: string;
  serverVersion: string;
  networkOpen: boolean;
  appliedRevision: number;
  rows: Record<string, KvRecord[]>;
}
export interface KvState {
  version: 1;
  nextId: number;
  nodes: KvNode[];
  domains: Record<string, { revision: number; rows: Record<string, KvRecord[]> }>;
  backups: { name: string; domain: string; tick: number; rows: Record<string, KvRecord[]> }[];
  evidence: { id: number; tick: number; action: string; host: string; target: string; detail: string }[];
  incidents: {
    id: string;
    kind: string;
    host: string;
    started: number;
    recoveryArchive?: string;
    closed?: number;
    notes?: string;
  }[];
}
export interface KvStatus {
  host: string;
  splunkVersion: string;
  serverVersion: string;
  storageEngine: string;
  status: 'ready' | 'disabled' | 'failed';
  replicationStatus: 'standalone' | 'primary' | 'secondary' | 'disconnected';
  primary: string | null;
  port: number;
  appliedRevision: number;
  latestRevision: number;
  membersInSync: boolean;
  writable: boolean;
  reason: string;
}
