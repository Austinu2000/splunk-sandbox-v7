import type { PracticePrincipal, ResultValue } from './index';
export interface SavedReport {
  id: string;
  host: string;
  app: string;
  owner: string;
  sharing: 'Private' | 'App' | 'Global';
  title: string;
  description: string;
  search: string;
  earliest: string;
  latest: string;
  enabled: boolean;
  scheduled: boolean;
  cron: string;
  summaryIndex?: string;
  sourcePath: string;
  revision: string;
  managed: boolean;
  issues: string[];
}
export interface ReportRun {
  id: string;
  reportId: string;
  revision: string;
  host: string;
  title: string;
  sourcePath: string;
  tick: number;
  scheduledTime?: number;
  earliest: number;
  latest: number;
  status: 'succeeded' | 'failed' | 'skipped';
  principal: PracticePrincipal;
  resultCount: number;
  rows: Record<string, ResultValue>[];
  summaryEventIds: string[];
  error?: string;
  workUnits: number;
}
export interface ReportRuntime {
  version: 1;
  runs: ReportRun[];
  imports: Record<string, { reportId: string; sourceKey: string; archive: string; tick: number }>;
  archives: Record<string, string>;
}
export interface SearchEvidence {
  id: string;
  search: string;
  earliest: number;
  latest: number;
  status: 'done' | 'failed';
  scanCount: number;
  workUnits: number;
  resultCount: number;
  inspected: boolean;
}
