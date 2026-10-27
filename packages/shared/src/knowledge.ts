import type { SearchJobDto } from './index';

/** Existing UI record contract. Scheduling fields are stored intent until an executor is implemented. */
export type KnowledgeKind = 'report' | 'alert' | 'dashboard' | 'dataset';
export type PanelType = 'column' | 'bar' | 'line' | 'area' | 'pie' | 'single' | 'table';
export interface DashboardPanel {
  id: string;
  title: string;
  search: string;
  type: PanelType;
}
export interface KnowledgeObject {
  id: string;
  kind: KnowledgeKind;
  title: string;
  description: string;
  owner: string;
  app: string;
  sharing: 'Private' | 'App' | 'Global';
  search: string;
  earliest: string;
  latest: string;
  enabled: boolean;
  type: 'Classic' | 'Dashboard Studio';
  panels: DashboardPanel[];
  updated: string;
  schedule?: string;
  condition?: string;
}
export interface KnowledgeState {
  objects: KnowledgeObject[];
  jobs: SearchJobDto[];
  recent: string[];
  homeDashboard?: string;
}
