import type { ResultValue } from './index';
export type IntegrationKind = 'aws' | 'otel' | 'cribl' | 'database';
export interface IntegrationRecord {
  id: string;
  fields: Record<string, ResultValue>;
  signal?: 'traces' | 'logs';
}
export interface IntegrationReceipt {
  id: string;
  kind: IntegrationKind;
  tick: number;
  status: 'delivered' | 'failed' | 'duplicate' | 'dropped' | 'empty';
  sourceId: string;
  eventIds: string[];
  error?: string;
  checkpoint?: number;
}
export interface AwsPracticeRuntime {
  host: string;
  objects: { bucket: string; key: string; version: string; raw: string }[];
  messages: { id: string; bucket: string; key: string; version: string; acknowledged: boolean }[];
  processed: string[];
  lastPoll?: number;
}
export interface TelemetryPracticeRuntime {
  host: string;
  activeSource?: string;
  pending: IntegrationRecord[];
  delivered: string[];
}
export interface CriblPracticeRuntime {
  host: string;
  activeSource?: string;
  pending: IntegrationRecord[];
  delivered: string[];
  dropped: string[];
  highWater: number;
}
export interface DatabasePracticeRuntime {
  host: string;
  rows: { id: number; service: string; status: number }[];
  accepted: { key: string; from: number; to: number; eventIds: string[] }[];
  lastPoll?: number;
}
export interface IntegrationRuntime {
  version: 1;
  nextId: number;
  aws?: AwsPracticeRuntime;
  otel?: TelemetryPracticeRuntime;
  cribl?: CriblPracticeRuntime;
  database?: DatabasePracticeRuntime;
  receipts: IntegrationReceipt[];
}
