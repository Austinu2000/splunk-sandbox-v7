import type { ResultValue } from './index';
/** Local evidence produced by actual completed alert results. No external ES/SOAR service. */
export interface SecurityNotable {
  id: string;
  host: string;
  reportId: string;
  revision: string;
  runId: string;
  notificationId: string;
  tick: number;
  title: string;
  description: string;
  securityDomain: string;
  severity: string;
  rows: Record<string, ResultValue>[];
  eventId: string;
  status: 'new' | 'in-progress' | 'resolved';
  owner: 'unassigned' | 'admin' | 'analyst' | 'operator';
  notes: { tick: number; principal: string; note: string; status: string }[];
}
export interface ResponseAttempt {
  id: string;
  notableId: string;
  tick: number;
  sourceRevision: string;
  status: 'failed' | 'created' | 'existing';
  error?: string;
  ticketId?: string;
}
export interface ResponseTicket {
  id: string;
  notableId: string;
  createdTick: number;
  summary: string;
  severity: string;
  sourceNotificationId: string;
}
export interface SecurityRuntime {
  version: 1;
  nextId: number;
  notables: SecurityNotable[];
  attempts: ResponseAttempt[];
  tickets: ResponseTicket[];
}
