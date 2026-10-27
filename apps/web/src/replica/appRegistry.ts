import { profileStorage, currentProfile } from '../environment';
import { useEffect, useState } from 'react';
export interface AppEntry {
  id: string;
  label: string;
  version: string;
  visible: boolean;
  enabled: boolean;
}
const defaults: AppEntry[] = [
  {
    id: 'alert_logevent',
    label: 'Log Event Alert Action',
    version: '9.2.2',
    visible: false,
    enabled: true,
  },
  {
    id: 'alert_webhook',
    label: 'Webhook Alert Action',
    version: '9.2.2',
    visible: false,
    enabled: true,
  },
  {
    id: 'appsbrowser',
    label: 'Apps Browser',
    version: '9.2.2',
    visible: false,
    enabled: true,
  },
  {
    id: 'introspection_generator_addon',
    label: 'introspection_generator_addon',
    version: '9.2.2',
    visible: false,
    enabled: true,
  },
  {
    id: 'launcher',
    label: 'Home',
    version: '9.2.2',
    visible: true,
    enabled: true,
  },
  {
    id: 'python_upgrade_readiness_app',
    label: 'Upgrade Readiness App',
    version: '4.3.0',
    visible: true,
    enabled: true,
  },
  {
    id: 'sample_app',
    label: 'sample data',
    version: '9.2.2',
    visible: false,
    enabled: false,
  },
  {
    id: 'search',
    label: 'Search & Reporting',
    version: '9.2.2',
    visible: true,
    enabled: true,
  },
  {
    id: 'splunk-dashboard-studio',
    label: 'Splunk Dashboard Studio',
    version: '1.13.4',
    visible: true,
    enabled: true,
  },
  {
    id: 'splunk_assist',
    label: 'Splunk Assist',
    version: '1.0.61',
    visible: false,
    enabled: true,
  },
  {
    id: 'splunk_gdi',
    label: 'Splunk Get Data In',
    version: '1.0.6',
    visible: false,
    enabled: true,
  },
  {
    id: 'splunk_instrumentation',
    label: 'Instrumentation',
    version: '6.0.10',
    visible: true,
    enabled: true,
  },
  {
    id: 'splunk_internal_metrics',
    label: 'Clones Internal Metrics into Metrics Index',
    version: '9.2.2',
    visible: false,
    enabled: true,
  },
  {
    id: 'splunk_metrics_workspace',
    label: 'Splunk Analytics Workspace',
    version: '2.49.0',
    visible: true,
    enabled: true,
  },
  {
    id: 'splunk_monitoring_console',
    label: 'Monitoring Console',
    version: '10.0.2',
    visible: true,
    enabled: true,
  },
  {
    id: 'splunk_secure_gateway',
    label: 'Splunk Secure Gateway',
    version: '3.6.17',
    visible: true,
    enabled: true,
  },
];
const key = 'splunk-v3-apps';
let memory: AppEntry[] | undefined;
export function readApps(): AppEntry[] {
  try {
    const a = JSON.parse(profileStorage.getItem(key) || 'null');
    if (Array.isArray(a) && a.every((v) => typeof v.id === 'string' && typeof v.label === 'string')) return a;
  } catch {
    /* Use the local default if storage is unavailable. */
  }
  const p = currentProfile();
  const base =
    p && p.id !== 'default'
      ? [
          ...defaults.filter((a) =>
            ['launcher', 'search', 'splunk-dashboard-studio', 'splunk_monitoring_console'].includes(a.id),
          ),
          ...p.apps.map((id) => ({
            id,
            label: id === 'SplunkEnterpriseSecuritySuite' ? 'Enterprise Security' : id,
            version: 'Profile',
            visible: true,
            enabled: true,
          })),
        ]
      : defaults;
  return memory ?? base;
}
export function saveApps(apps: AppEntry[]) {
  memory = apps;
  try {
    profileStorage.setItem(key, JSON.stringify(apps));
  } catch {
    /* Use the local default if storage is unavailable. */
  }
  window.dispatchEvent(new Event('splunk-apps-changed'));
}
export function useApps() {
  const [a, s] = useState(readApps);
  useEffect(() => {
    const u = () => s(readApps());
    window.addEventListener('splunk-apps-changed', u);
    return () => window.removeEventListener('splunk-apps-changed', u);
  }, []);
  return a;
}
