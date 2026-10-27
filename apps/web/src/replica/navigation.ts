import { settingsGroups } from './settingsCatalog';
import { installedViews } from './viewCatalog';

export const searchNavigation = [
  ['Search', 'search'],
  ['Analytics', 'analytics'],
  ['Datasets', 'datasets'],
  ['Reports', 'reports'],
  ['Alerts', 'alerts'],
  ['Dashboards', 'dashboards'],
] as const;
export const practiceNavigation = [
  ['Automation Operations', 'automation'],
  ['Interview workbench', 'training'],
  ['Code & Ansible', 'code'],
  ['Learn', 'learn'],
  ['KV Store', 'kvstore'],
  ['Fleet Overview', 'fleet'],
  ['Terminal', 'terminal'],
  ['Incidents & Tickets', 'tickets'],
  ['Interview', 'interview'],
  ['Sessions', 'sessions'],
  ['Environments', 'environments'],
  ['Operations', 'operations'],
] as const;
export const appLinks = [
  { label: 'Search & Reporting', href: '#/search', icon: 'search' },
  { label: 'Splunk Secure Gateway', href: '#/settings/mobile-settings', icon: 'splunk_secure_gateway' },
  { label: 'Upgrade Readiness App', href: '#/upgrade', icon: 'python_upgrade_readiness_app' },
];
export function viewHref(app: string, id: string): string {
  if (app === 'launcher') return '#/home';
  if (app === 'search') {
    const map: Record<string, string> = {
      search: 'search',
      flashtimeline: 'search',
      analytics_workspace: 'analytics',
      datasets: 'datasets',
      reports: 'reports',
      alerts: 'alerts',
      dashboards: 'dashboards',
      job_manager: 'jobs',
      triggered_alerts: 'triggered-alerts',
      data_model_manager: 'settings/data-models',
    };
    if (map[id]) return '#/' + map[id];
  }
  if (app === 'splunk-dashboard-studio')
    return id === 'example-hub-nav-visualizations' ? '#/studio' : `#/studio/${encodeURIComponent(id)}`;
  if (app === 'splunk_monitoring_console' && id === 'monitoringconsole_overview') return '#/monitoring';
  return `#/view/${encodeURIComponent(app)}/${encodeURIComponent(id)}`;
}
export function nativePathToHash(path: string, query = ''): string | null {
  if (path === '/' || /^\/en-US\/?$/.test(path)) return '#/home';
  if (path.includes('/account/login')) return '#/login';
  const normalized = path.replace(/\/manager\/[^/]+\//, '/manager/search/');
  const setting = settingsGroups
    .flatMap((g) => g.items)
    .find((s) => s.sourcePath.replace(/\/manager\/[^/]+\//, '/manager/search/') === normalized);
  if (setting) return setting.href;
  if (/\/apps\/local$/.test(path)) return '#/apps';
  if (/\/appsremote$/.test(path)) return '#/find-apps';
  const match = /\/(?:en-US\/)?app\/([^/]+)(?:\/([^/]+))?/.exec(path);
  if (match) {
    const app = match[1]!,
      id = match[2] ?? (app === 'launcher' ? 'home' : app === 'search' ? 'search' : '');
    if (app === 'splunk_secure_gateway' && !id) return '#/settings/mobile-settings';
    if (app === 'python_upgrade_readiness_app' && !id) return '#/upgrade';
    return viewHref(app, id) + (app === 'search' && id === 'search' && query ? query : '');
  }
  return null;
}
export function initializeLocation(): void {
  if (window.location.hash.startsWith('#/')) return;
  const hash = nativePathToHash(window.location.pathname, window.location.search) ?? '#/home';
  window.history.replaceState(null, '', '/' + hash);
}
export const findDestinations = [
  { label: 'Home', href: '#/home', group: 'App' },
  ...searchNavigation.map(([label, id]) => ({ label, href: '#/' + id, group: 'Search & Reporting' })),
  ...practiceNavigation.map(([label, id]) => ({ label, href: '#/' + id, group: 'Engineer Sandbox' })),
  ...settingsGroups.flatMap((g) => g.items.map((s) => ({ label: s.label, href: s.href, group: g.title }))),
  ...installedViews.map((v) => ({ label: v.label, href: viewHref(v.app, v.id), group: v.app })),
];
