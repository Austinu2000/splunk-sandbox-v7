export interface ServiceKpiResult {
  id: string;
  value: number | null;
  score: number | null;
  state: 'healthy' | 'warning' | 'critical' | 'unknown';
  source: string;
  sourceRows: number;
  error?: string;
}
export interface ServiceHealthResult {
  id: string;
  name: string;
  baseScore: number | null;
  score: number | null;
  state: 'healthy' | 'degraded' | 'critical' | 'unknown';
  dependencies: string[];
  dependencyImpact: boolean;
  kpis: ServiceKpiResult[];
}
export interface ServiceHealthEvaluation {
  id: string;
  tick: number;
  revision: string;
  configurationRevision: number;
  inputRevision: number;
  services: ServiceHealthResult[];
}
export interface ServiceHealthRuntime {
  version: 1;
  nextId: number;
  host: string;
  activeSource?: string;
  evaluations: ServiceHealthEvaluation[];
}
