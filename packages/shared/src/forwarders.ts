/** Bounded virtual package and Deployment Server delivery state. No native installers. */
export interface ForwarderClientState {
  installed: boolean;
  version: string;
  licenseAccepted: boolean;
  bootStart: boolean;
  owner: string;
  lastPhoneHome: number;
  nextPhoneHome: number;
  downloadedCatalog: number;
  runningCatalog: number;
  error?: string;
  changes: { time: number; kind: string; detail: string }[];
}
export interface DeploymentCatalog {
  id: number;
  time: number;
  apps: Record<string, Record<string, string>>;
  serverclass: string;
  revision: string;
}
export interface ForwarderRuntime {
  version: 1;
  nextCatalog: number;
  clients: Record<string, ForwarderClientState>;
  catalogs: DeploymentCatalog[];
}
