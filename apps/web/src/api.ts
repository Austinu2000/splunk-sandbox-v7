import { flushEnvironment } from './environment';
import type { EnvironmentProfileDto } from '@sandbox/shared';
import type {
  ClockSpeed,
  DsClientDto,
  InterviewAnswerDto,
  InterviewCatalogDto,
  InterviewDto,
  InterviewOptionsDto,
  DsOverviewDto,
  McView,
  McViewDto,
  ScenarioDto,
  TicketDto,
  FleetFilter,
  FleetSummary,
  HostPage,
  HostSortKey,
  PageDto,
  SessionInfoDto,
  ResultValue,
  SearchEventDto,
  SearchJobDto,
  SearchRequestDto,
  WorldInfo,
} from '@sandbox/shared';

export interface RosterEntry {
  hostname: string;
  role: string;
  site: string;
  detailed: boolean;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    ...(body !== undefined && {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
}

export const api = {
  operations: () =>
    request<{ host: string; role: string; metrics: Record<string, string | number | boolean> }[]>(
      '/api/operations',
    ),
  profiles: () => request<{ activeId: string; profiles: EnvironmentProfileDto[] }>('/api/profiles'),
  loadProfile: (id: string, reset = false) =>
    post<WorldInfo>(`/api/profiles/${encodeURIComponent(id)}/${reset ? 'reset' : 'load'}`),
  scenarios: () => request<ScenarioDto[]>('/api/scenarios'),
  tickets: () => request<TicketDto[]>('/api/tickets'),
  startScenario: (id: string) =>
    request<TicketDto>(`/api/scenarios/${encodeURIComponent(id)}/start`, { method: 'POST' }),
  closeTicket: (id: string, note: string) =>
    request<TicketDto>(`/api/tickets/${encodeURIComponent(id)}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note }),
    }),
  world: () => request<WorldInfo>('/api/world'),
  sessions: () => request<SessionInfoDto>('/api/sessions'),
  saveSession: async (name: string) => {
    await flushEnvironment();
    return post<{ id: number }>('/api/sessions', { name });
  },
  loadSession: async (id: number) => {
    await flushEnvironment();
    return post<WorldInfo>(`/api/sessions/${id}/load`);
  },
  deleteSession: (id: number) => request<{ ok: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' }),
  resetWorld: (opts: { seed?: string; fleetSize?: number }) => post<WorldInfo>('/api/world/reset', opts),
  logPage: (page: string) => post<{ ok: boolean }>('/api/actions/page', { page }),
  interviewCatalog: () => request<InterviewCatalogDto>('/api/interview/catalog'),
  interviews: () => request<InterviewDto[]>('/api/interviews'),
  currentInterview: () => request<{ interview: InterviewDto | null; now: number }>('/api/interviews/current'),
  startInterview: (opts: InterviewOptionsDto) => post<InterviewDto>('/api/interviews', opts),
  interviewHint: (id: string) => post<InterviewDto>(`/api/interviews/${encodeURIComponent(id)}/hint`),
  interviewNotes: (id: string, notes: string) =>
    request<InterviewDto>(`/api/interviews/${encodeURIComponent(id)}/notes`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes }),
    }),
  submitInterview: (id: string, answer: InterviewAnswerDto) =>
    post<InterviewDto>(`/api/interviews/${encodeURIComponent(id)}/submit`, { answer }),
  monitoring: (view: McView) => request<McViewDto>(`/api/mc/${view}`),
  dsOverview: () => request<DsOverviewDto>('/api/ds/overview'),
  dsClients: (q: { offset: number; limit: number; q?: string; serverClass?: string; unmatched?: boolean }) =>
    request<PageDto<DsClientDto>>(
      `/api/ds/clients${query({ ...q, unmatched: q.unmatched ? 'true' : undefined })}`,
    ),
  search: (req: SearchRequestDto) =>
    request<{
      job: SearchJobDto;
      events: PageDto<SearchEventDto>;
      results: PageDto<Record<string, ResultValue>>;
    }>('/api/search/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    }),
  searchEvents: (sid: string, offset: number, count: number) =>
    request<PageDto<SearchEventDto>>(
      `/api/search/jobs/${encodeURIComponent(sid)}/events${query({ offset, count })}`,
    ),
  searchResults: (sid: string, offset: number, count: number) =>
    request<PageDto<Record<string, ResultValue>>>(
      `/api/search/jobs/${encodeURIComponent(sid)}/results${query({ offset, count })}`,
    ),
  roster: () => request<RosterEntry[]>('/api/hosts/roster'),
  setClock: (patch: { paused?: boolean; speed?: ClockSpeed }) =>
    request<WorldInfo>('/api/world/clock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  summary: (filter: FleetFilter) => request<FleetSummary>(`/api/fleet/summary${query({ ...filter })}`),
  hosts: (
    filter: FleetFilter,
    page: { offset: number; limit: number; sort: HostSortKey; dir: 'asc' | 'desc' },
  ) => request<HostPage>(`/api/fleet/hosts${query({ ...filter, ...page })}`),
};
