import type { PracticePrincipal, ResultValue } from './index';
export interface AlertConfiguration {
  notable?: { title: string; description: string; securityDomain: string; severity: string };
  type: 'number of events' | 'number of hosts' | 'number of sources' | 'custom' | 'always';
  relation: 'greater than' | 'less than' | 'equal to' | 'not equal to';
  threshold: number;
  condition: string;
  digest: boolean;
  suppress: boolean;
  period: string;
  fields: string[];
  track: boolean;
  severity: number;
  actions: string[];
}
export interface AlertNotification {
  id: string;
  reportId: string;
  runId: string;
  title: string;
  time: number;
  severity: number;
  actions: string[];
  resultCount: number;
  tracked: boolean;
}
export interface SavedReport {
  alert?: AlertConfiguration;
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
  alert?: { matched: boolean; triggered: number; suppressed: number; notificationIds: string[] };
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
  nextRun?: number;
  alerts?: { notifications: AlertNotification[]; suppression: Record<string, number> };
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
