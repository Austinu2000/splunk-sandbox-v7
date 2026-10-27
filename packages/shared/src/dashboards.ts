import type { PracticePrincipal, ResultValue } from './index';
export interface DashboardInput {
  token: string;
  label: string;
  type: 'text' | 'dropdown';
  defaultValue: string;
  choices: { label: string; value: string }[];
}
export interface OperationalDashboardPanel {
  id: string;
  title: string;
  type: 'table' | 'single' | 'column' | 'bar' | 'line' | 'area' | 'pie';
  search?: string;
  report?: string;
  earliest: string;
  latest: string;
  dataSource?: string;
}
export interface SavedDashboard {
  id: string;
  host: string;
  app: string;
  owner: string;
  sharing: 'Private' | 'App' | 'Global';
  name: string;
  title: string;
  description: string;
  format: 'classic' | 'studio';
  source: string;
  sourcePath: string;
  revision: string;
  inputs: DashboardInput[];
  panels: OperationalDashboardPanel[];
  issues: string[];
}
export interface DashboardRender {
  id: string;
  dashboardId: string;
  revision: string;
  tick: number;
  principal: PracticePrincipal;
  tokens: Record<string, string>;
  panels: {
    id: string;
    search: string;
    status: 'done' | 'failed';
    rows: Record<string, ResultValue>[];
    error?: string;
    workUnits: number;
  }[];
}
export interface DashboardRuntime {
  version: 1;
  renders: DashboardRender[];
  nextRender?: number;
  imports: Record<string, { dashboardId: string; archive: string }>;
  archives: Record<string, string>;
}
