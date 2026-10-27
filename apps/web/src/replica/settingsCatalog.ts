/** Routes observed in the local Splunk 9.2.2 Settings menu. */
export interface SettingsLink {
  id: string;
  label: string;
  href: string;
  sourcePath: string;
}
export interface SettingsGroup {
  title: string;
  items: SettingsLink[];
}
export const settingsGroups: SettingsGroup[] = [
  {
    title: 'Shortcuts',
    items: [
      {
        id: 'add-data',
        label: 'Add Data',
        href: '#/settings/add-data',
        sourcePath: '/en-US/manager/search/adddata',
      },
      {
        id: 'monitoring-console',
        label: 'Monitoring Console',
        href: '#/monitoring',
        sourcePath: '/en-US/app/splunk_monitoring_console/monitoringconsole_overview',
      },
    ],
  },
  {
    title: 'Knowledge',
    items: [
      {
        id: 'searches-reports-and-alerts',
        label: 'Searches, reports, and alerts',
        href: '#/settings/searches-reports-and-alerts',
        sourcePath: '/en-US/manager/search/saved/searches',
      },
      {
        id: 'data-models',
        label: 'Data models',
        href: '#/settings/data-models',
        sourcePath: '/en-US/manager/search/data_model_manager',
      },
      {
        id: 'event-types',
        label: 'Event types',
        href: '#/settings/event-types',
        sourcePath: '/en-US/manager/search/saved/eventtypes',
      },
      {
        id: 'tags',
        label: 'Tags',
        href: '#/settings/tags',
        sourcePath: '/en-US/manager/search/tags',
      },
      {
        id: 'fields',
        label: 'Fields',
        href: '#/settings/fields',
        sourcePath: '/en-US/manager/search/fields',
      },
      {
        id: 'lookups',
        label: 'Lookups',
        href: '#/settings/lookups',
        sourcePath: '/en-US/manager/search/lookups',
      },
      {
        id: 'user-interface',
        label: 'User interface',
        href: '#/settings/user-interface',
        sourcePath: '/en-US/manager/search/ui',
      },
      {
        id: 'alert-actions',
        label: 'Alert actions',
        href: '#/settings/alert-actions',
        sourcePath: '/en-US/manager/search/alert_actions',
      },
      {
        id: 'advanced-search',
        label: 'Advanced search',
        href: '#/settings/advanced-search',
        sourcePath: '/en-US/manager/search/advancedsearch',
      },
      {
        id: 'all-configurations',
        label: 'All configurations',
        href: '#/settings/all-configurations',
        sourcePath: '/en-US/manager/search/admin/directory',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        id: 'server-settings',
        label: 'Server settings',
        href: '#/settings/server-settings',
        sourcePath: '/en-US/manager/search/systemsettings',
      },
      {
        id: 'server-controls',
        label: 'Server controls',
        href: '#/settings/server-controls',
        sourcePath: '/en-US/manager/search/control',
      },
      {
        id: 'health-report-manager',
        label: 'Health report manager',
        href: '#/settings/health-report-manager',
        sourcePath: '/en-US/manager/system/health/manager',
      },
      {
        id: 'instrumentation',
        label: 'Instrumentation',
        href: '#/settings/instrumentation',
        sourcePath: '/en-US/manager/splunk_instrumentation/instrumentation_index',
      },
      {
        id: 'licensing',
        label: 'Licensing',
        href: '#/settings/licensing',
        sourcePath: '/en-US/manager/system/licensing',
      },
      {
        id: 'workload-management',
        label: 'Workload management',
        href: '#/settings/workload-management',
        sourcePath: '/en-US/manager/system/workload_management',
      },
      {
        id: 'mobile-settings',
        label: 'Mobile settings',
        href: '#/settings/mobile-settings',
        sourcePath: '/en-US/app/splunk_secure_gateway/administration#/',
      },
    ],
  },
  {
    title: 'Data',
    items: [
      {
        id: 'data-inputs',
        label: 'Data inputs',
        href: '#/settings/data-inputs',
        sourcePath: '/en-US/manager/search/datainputstats',
      },
      {
        id: 'forwarding-and-receiving',
        label: 'Forwarding and receiving',
        href: '#/settings/forwarding-and-receiving',
        sourcePath: '/en-US/manager/search/forwardreceive',
      },
      {
        id: 'indexes',
        label: 'Indexes',
        href: '#/settings/indexes',
        sourcePath: '/en-US/manager/search/data/indexes',
      },
      {
        id: 'report-acceleration-summaries',
        label: 'Report acceleration summaries',
        href: '#/settings/report-acceleration-summaries',
        sourcePath: '/en-US/manager/system/summarization',
      },
      {
        id: 'source-types',
        label: 'Source types',
        href: '#/settings/source-types',
        sourcePath: '/en-US/manager/search/sourcetypes',
      },
      {
        id: 'ingest-actions',
        label: 'Ingest actions',
        href: '#/settings/ingest-actions',
        sourcePath: '/en-US/manager/search/ingest_rulesets',
      },
    ],
  },
  {
    title: 'Distributed Environment',
    items: [
      {
        id: 'indexer-clustering',
        label: 'Indexer clustering',
        href: '#/settings/indexer-clustering',
        sourcePath: '/en-US/manager/system/clustering',
      },
      {
        id: 'forwarder-management',
        label: 'Forwarder management',
        href: '#/forwarders',
        sourcePath: '/en-US/manager/system/deploymentserver',
      },
      {
        id: 'federated-search',
        label: 'Federated search',
        href: '#/settings/federated-search',
        sourcePath: '/en-US/manager/search/federated_search',
      },
      {
        id: 'distributed-search',
        label: 'Distributed search',
        href: '#/settings/distributed-search',
        sourcePath: '/en-US/manager/search/distsearch',
      },
    ],
  },
  {
    title: 'Users and Authentication',
    items: [
      {
        id: 'roles',
        label: 'Roles',
        href: '#/settings/roles',
        sourcePath: '/en-US/manager/search/authorization/roles',
      },
      {
        id: 'users',
        label: 'Users',
        href: '#/settings/users',
        sourcePath: '/en-US/manager/search/authentication/users',
      },
      {
        id: 'tokens',
        label: 'Tokens',
        href: '#/settings/tokens',
        sourcePath: '/en-US/manager/search/authorization/tokens',
      },
      {
        id: 'password-management',
        label: 'Password management',
        href: '#/settings/password-management',
        sourcePath: '/en-US/manager/search/password/management',
      },
      {
        id: 'authentication-methods',
        label: 'Authentication methods',
        href: '#/settings/authentication-methods',
        sourcePath: '/en-US/manager/search/authoverview',
      },
    ],
  },
];
export const settingsPages: Record<string, SettingsLink> = Object.fromEntries(
  settingsGroups.flatMap((group) => group.items).map((item) => [item.id, item]),
);
export const settingsByPath: Record<string, string> = Object.fromEntries(
  Object.values(settingsPages).map((item) => [item.sourcePath.split('#')[0]!, item.href]),
);
