export type PracticePrincipal = 'admin' | 'analyst' | 'operator';
export interface IndexSettings {
  homePath: string;
  coldPath: string;
  thawedPath: string;
  datatype: 'event' | 'metric';
  frozenTimePeriodInSecs: number;
  maxTotalDataSizeMB: number;
  disabled: boolean;
  remotePath?: string;
  repFactor: 'auto' | '0';
  maxHotIdleSecs?: number;
  maxWarmDBCount?: number;
  coldToFrozenDir?: string;
}
export interface IndexCatalogEntry {
  name: string;
  host: string;
  app: string;
  owner: string;
  sourcePath: string;
  deployment: 'standalone' | 'cluster-peer';
  settings: IndexSettings;
  pending: boolean;
  currentDBSizeMB: number;
  issues: string[];
}
