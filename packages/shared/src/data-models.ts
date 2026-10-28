import type { ResultValue } from './index';
export interface DataModelSummary {
  id: string;
  host: string;
  app: string;
  model: string;
  dataset: string;
  revision: string;
  inputRevision: number;
  earliest: number;
  latest: number;
  built: number;
  rows: Record<string, ResultValue>[];
  sourceIndexes: string[];
  sourceScan: number;
}
export interface DataModelRuntime {
  version: 1;
  nextId: number;
  summaries: DataModelSummary[];
  builds: {
    id: string;
    tick: number;
    host: string;
    model: string;
    status: 'completed' | 'failed' | 'skipped';
    rows: number;
    error?: string;
  }[];
}
