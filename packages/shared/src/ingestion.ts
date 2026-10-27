import type { ResultValue } from './index';
export interface RecordedEvent {
  id: string;
  time: number;
  indexTime: number;
  raw: string;
  host: string;
  source: string;
  sourcetype: string;
  index: string;
  receiver: string;
  /** Ephemeral search-serving replica; never replaces the original indexing provenance. */
  searchPeer?: string;
  fields: Record<string, ResultValue>;
  provenance: 'input' | 'hec' | 'summary';
  operationId: string;
  bytes: number;
}
export interface InputCheckpoint {
  offset: number;
  prefixHash: number;
}
export interface IngestionState {
  version: 1;
  nextId: number;
  events: RecordedEvent[];
  checkpoints: Record<string, InputCheckpoint>;
  status: Record<
    string,
    {
      host: string;
      source: string;
      index: string;
      read: number;
      written: number;
      error?: string;
      tick: number;
    }
  >;
  frozen?: Record<string, { archived: boolean; tick: number }>;
  thawed?: string[];
}
