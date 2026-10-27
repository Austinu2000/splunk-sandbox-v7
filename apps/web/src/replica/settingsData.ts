/** Captured labels and layouts; configurable entries below are UI practice metadata, not World metrics. */
export interface HubItem {
  label: string;
  description?: string;
  add?: boolean;
  href?: string;
}
export interface Hub {
  description: string;
  items: HubItem[];
}
export const hubs: Record<string, Hub> = {
  fields: {
    description:
      'View, edit, and set permissions on field extractions. Define event workflow actions and field aliases. Rename sourcetypes.',
    items: [
      { label: 'Field aliases', description: 'Edit or add one or more aliases to field names', add: true },
      { label: 'Calculated fields', description: 'Edit or add one or more calculated fields', add: true },
      {
        label: 'Field extractions',
        description: 'View and edit all field extractions. Add new field extractions and update permissions.',
        add: true,
      },
      {
        label: 'Field transformations',
        description: 'Edit or add transformations for field extractions that use a transform.',
        add: true,
      },
      {
        label: 'Sourcetype renaming',
        description: 'Rename a source type. Multiple source types can share the same name.',
        add: true,
      },
      { label: 'Workflow actions', description: 'Edit or add workflow actions', add: true },
    ],
  },
  lookups: {
    description: 'Create and configure lookups.',
    items: [
      {
        label: 'Lookup table files',
        description: 'List existing lookup tables or upload a new file.',
        add: true,
      },
      {
        label: 'Lookup definitions',
        description: 'Edit existing lookup definitions or define a new file-based or external lookup.',
        add: true,
      },
      {
        label: 'Automatic lookups',
        description: 'Edit existing automatic lookups or configure a new lookup to run automatically.',
        add: true,
      },
      { label: 'GeoIP lookups file', description: 'Update the file used for GeoIP lookups.' },
    ],
  },
  tags: {
    description: 'Manage tags on field values.',
    items: ['List by field value pair', 'List by tag name', 'All unique tag objects'].map((label) => ({
      label,
      add: true,
    })),
  },
  'user-interface': {
    description: 'Create and edit views, dashboards, and navigation menus.',
    items: [
      { label: 'Time ranges', add: true },
      { label: 'Views', add: true, href: '#/dashboards' },
      { label: 'View PDF scheduling' },
      { label: 'Navigation menus' },
      { label: 'Prebuilt panels', add: true },
      { label: 'Bulletin messages', add: true },
    ],
  },
  'advanced-search': {
    description: 'Create and edit search macros. Edit permissions on search commands.',
    items: [{ label: 'Search macros', add: true }, { label: 'Search commands' }],
  },
  'server-settings': {
    description:
      'Manage system settings including ports, host name, index path, email server, and system logging.',
    items: [
      'General settings',
      'Login background',
      'Global banner',
      'Internal Library Settings',
      'Email settings',
      'Server logging',
      'Deployment client',
      'Search preferences',
    ].map((label) => ({ label })),
  },
  'distributed-search': {
    description: 'Perform a search across multiple Splunk indexers.',
    items: [{ label: 'Distributed search setup' }, { label: 'Search peers', add: true }],
  },
};
export type SettingRow = Record<string, string>;
export interface TableDefinition {
  title: string;
  description?: string;
  columns: string[];
  rows: SettingRow[];
  newLabel?: string;
  actions?: string[];
  empty?: string;
  scoped?: boolean;
  note?: string;
}
const columns = ['Name', 'Actions', 'Owner', 'App', 'Sharing', 'Status'];
const base = (Name: string, extra: SettingRow = {}): SettingRow => ({
  Name,
  Owner: 'nobody',
  App: 'search',
  Sharing: 'App',
  Status: 'Enabled',
  ...extra,
});
export const tableDefinitions: Record<string, TableDefinition> = {
  users: {
    title: 'Users',
    columns: [
      'Name',
      'Actions',
      'Authentication system',
      'Full name',
      'Email address',
      'Time zone',
      'Default app',
      'Default app inherited from',
      'Roles',
      'Last Login',
      'Status',
    ],
    newLabel: 'New User',
    actions: ['Edit', 'Delete'],
    rows: [
      base('admin', {
        'Authentication system': 'Splunk',
        'Full name': 'Administrator',
        'Email address': 'changeme@example.com',
        'Time zone': 'Default',
        'Default app': 'launcher',
        'Default app inherited from': 'system',
        Roles: 'admin',
        'Last Login': 'Local session',
        Status: 'Active',
      }),
      base('uname', {
        'Authentication system': 'Splunk',
        'Time zone': 'America/New_York',
        'Default app': 'launcher',
        'Default app inherited from': 'system',
        Roles: 'power',
        'Last Login': 'Never',
        Status: 'Active',
      }),
    ],
  },
  roles: {
    title: 'Roles',
    columns: ['Name', 'Actions', 'Native Capabilities', 'Inherited Capabilities', 'Default App'],
    newLabel: 'New Role',
    actions: ['Edit', 'Clone', 'Delete'],
    rows: [
      ['admin', '111', '39'],
      ['can_delete', '6', '0'],
      ['power', '11', '28'],
      ['splunk-system-role', '0', '150'],
      ['user', '28', '0'],
    ].map(([Name, native, inherited]) =>
      base(Name!, {
        'Native Capabilities': native!,
        'Inherited Capabilities': inherited!,
        'Default App': '—',
      }),
    ),
  },
  tokens: {
    title: 'Tokens',
    columns: ['Name', 'Actions', 'User', 'Audience', 'Status', 'Created', 'Expires'],
    newLabel: 'New Token',
    actions: ['Edit', 'Disable', 'Delete'],
    rows: [],
    empty: 'No tokens found.',
  },
  'data-models': {
    title: 'Data Models',
    description: 'Data models enable users to easily create reports in the Pivot tool.',
    columns: ['Title', 'Type', 'Accelerate', 'Actions', 'App', 'Owner', 'Sharing'],
    newLabel: 'New Data Model',
    scoped: true,
    actions: ['Edit', 'Pivot', 'Clone', 'Delete'],
    rows: [
      "Splunk's Internal Audit Logs - SAMPLE",
      "Splunk's Internal Server Logs - SAMPLE",
      'Web Application Dataset',
    ].map((Title) => base(Title, { Title, Type: 'data model', Accelerate: '⌁' })),
  },
  'event-types': {
    title: 'Event types',
    columns: ['Name', 'Search string', 'Tag(s)', 'Owner', 'App', 'Sharing', 'Status', 'Actions'],
    newLabel: 'New Event Type',
    scoped: true,
    actions: ['Edit', 'Clone', 'Move', 'Delete'],
    rows: [
      base('internal_search_terms', {
        'Search string':
          '( "After evaluating args" OR "Before evaluating args" OR "context dispatched for search=" OR "SearchParser - PARSING" OR "got search" OR "_dispatchNewSearch - search" OR "search:* - q" OR ( decomposition fullsearch ) OR "PAAAAAARSER! - search" OR "view:* - DECOMPOSITION" OR "Splunk.Module.SearchBar .setInputField" OR ( typeahead prefix ) OR "DEBUG HTTPServer - Deleting request=GET" OR /en-US/api/search/typeahead )',
        App: 'system',
        Sharing: 'Global',
      }),
      base('splunkd-access', {
        'Search string': 'index=_internal source=*splunkd_access.log',
        App: 'system',
        Sharing: 'Global',
      }),
      base('splunkd-log', {
        'Search string': 'index=_internal source=*splunkd.log',
        App: 'system',
        Sharing: 'Global',
      }),
      base('successful_purchase', {
        'Search string': 'index=main sourcetype="access_combined_wcookie" action=purchase status=200',
        Owner: 'uname',
        Sharing: 'Private',
      }),
    ],
  },
  'alert-actions': {
    title: 'Alert Actions',
    description: 'Review and manage available alert actions',
    columns: ['Name', 'App', 'Sharing', 'Status', 'Usage', 'Log', 'Setup', 'Actions'],
    actions: ['Edit', 'Disable'],
    rows: [
      'Log Event',
      'Output results to lookup',
      'Output results to telemetry endpoint',
      'Run a script',
      'Send email',
      'Send to Splunk Mobile',
      'Webhook',
    ].map((Name) =>
      base(Name, {
        App: 'system',
        Sharing: 'Global',
        Usage: 'Usage statistics',
        Log: 'View log events',
        Setup: 'Configure',
      }),
    ),
  },
  'source-types': {
    title: 'Source Types',
    description:
      'Source types are used to assign configurations like timestamp recognition, event breaking, and field extractions to data indexed by Splunk.',
    columns: ['Name', 'Description', 'Actions', 'Category', 'App'],
    newLabel: 'New Source Type',
    actions: ['Edit', 'Clone', 'Delete'],
    rows: [
      ['_json', 'JavaScript Object Notation format.', 'Structured'],
      ['access_combined', 'NCSA combined format HTTP web server logs', 'Web'],
      ['apache_error', 'Error log format produced by the Apache web server', 'Web'],
      ['catalina', 'Output produced by Apache Tomcat Catalina', 'Application'],
      ['cisco:asa', 'Cisco Adaptive Security Appliance Firewall', 'Network & Security'],
      ['collectd_http', 'Collectd daemon metrics format', 'Metrics'],
      ['csv', 'Comma-separated value format', 'Structured'],
      ['db2', 'IBM DB2 diagnostic output', 'Database'],
      ['db2_diag', 'Database Audit', 'Database'],
      ['dmesg', 'Kernel ring buffer', 'Operating System'],
      ['generic_single_line', 'A common log format with a predefined timestamp', 'Miscellaneous'],
      ['iis', 'W3C Extended log format', 'Web'],
      ['json_no_timestamp', 'JSON with support for nonexistent timestamps', 'Structured'],
      ['linux_audit', 'Linux auditd system daemon', 'Operating System'],
      ['linux_messages_syslog', 'Linux /var/log/messages', 'Operating System'],
      ['linux_secure', 'Linux security related messages', 'Operating System'],
      ['log4j', 'J2EE application server log4j format', 'Application'],
      ['splunkd', 'Splunk internal server logs', 'Application'],
      ['splunkd_access', 'Splunk Web access log', 'Web'],
      ['syslog', 'System log format', 'Operating System'],
    ].map(([Name, Description, Category]) =>
      base(Name!, { Description: Description!, Category: Category!, App: 'system' }),
    ),
  },
  'health-report-manager': {
    title: 'Health Report Manager',
    description:
      'Use the health report manager page to set feature indicator thresholds and enable health report monitoring for Splunk components. Threshold values apply to the local instance. For features related to search head clusters, values are replicated across cluster members.',
    columns: ['Name', 'Actions', 'Threshold', 'Alert Status'],
    actions: ['Edit', 'Snooze'],
    rows: [
      'admission_rules_check',
      'batchreader',
      'buckets',
      'cluster_bundles',
      'data_durability',
      'data_searchable',
      'ddaa_archived_buckets',
      'disk_space',
      'indexers',
      'indexing_ready',
      'ingest_actions_output',
      'ingestion_latency',
      'ingestion_latency_reported',
      'iowait',
      'peer_connectivity',
      'peer_state',
      'peer_version',
      'remote_storage_configuration',
      'replication_failures',
      's2s_autolb',
    ].map((feature) => base('feature:' + feature, { Threshold: 'Default', 'Alert Status': 'Enabled' })),
    note: 'Captured feature definitions. Live fleet health is available in Monitoring Console.',
  },
  'report-acceleration-summaries': {
    title: 'Report Acceleration Summaries',
    columns: ['Name', 'App', 'Owner', 'Status', 'Size', 'Actions'],
    rows: [],
    empty: 'There are no report acceleration summaries.',
  },
  'federated-search': {
    title: 'Federated search',
    description: 'Conducts searches and joins across multiple federated providers.',
    columns: ['Name', 'Type', 'Remote URI', 'Mode', 'Actions'],
    rows: [],
    newLabel: 'Add federated provider',
    empty: 'No federated providers',
    actions: ['Edit', 'Delete'],
  },
  'federated-indexes': {
    title: 'Federated search',
    columns: ['Name', 'Federated Provider', 'Remote Index', 'Actions'],
    rows: [],
    newLabel: 'Add federated index',
    empty: 'No federated indexes',
    actions: ['Edit', 'Delete'],
  },
  'workload-management': {
    title: 'Workload Management',
    description:
      'Apply configurations for admission rules, workload pools, workload placement & monitoring rules.',
    columns: ['Name', 'Predicate', 'Action', 'Status', 'Actions'],
    rows: [],
    newLabel: 'Add Admission Rule',
    empty: 'Admission Rules Disabled',
    actions: ['Edit', 'Delete'],
  },
  'workload-pools': {
    title: 'Workload Management',
    columns: ['Name', 'Category', 'CPU Weight', 'Memory Limit', 'Actions'],
    rows: [],
    newLabel: 'Add Workload Pool',
    empty: 'No workload pools',
    actions: ['Edit', 'Delete'],
  },
  'workload-rules': {
    title: 'Workload Management',
    columns: ['Name', 'Predicate', 'Workload Pool', 'Status', 'Actions'],
    rows: [],
    newLabel: 'Add Workload Rule',
    empty: 'No workload rules',
    actions: ['Edit', 'Delete'],
  },
  'ingest-actions': {
    title: 'Ingest Actions',
    description: 'Create ingest-time rulesets to manipulate events based on their patterns.',
    columns: ['Name', 'Source Type', 'Description', 'Status', 'Actions'],
    rows: [],
    newLabel: 'New Ruleset',
    empty: 'No rulesets found.',
    actions: ['Edit', 'Clone', 'Delete'],
  },
  'ingest-destinations': {
    title: 'Ingest Actions',
    columns: ['Name', 'Type', 'Description', 'Actions'],
    rows: [],
    newLabel: 'New Destination',
    empty: 'No destinations found.',
    actions: ['Edit', 'Delete'],
  },
};
export const defaultDefinition = (title: string): TableDefinition => ({
  title,
  columns,
  newLabel: 'New',
  actions: ['Edit', 'Clone', 'Delete'],
  scoped: true,
  rows: [],
  empty: 'No matching entries found.',
});
export const inputGroups = [
  {
    title: 'Local inputs',
    items: [
      ['Files & Directories', 'Index a local file or monitor an entire directory.'],
      ['HTTP Event Collector', 'Receive data over HTTP or HTTPS.'],
      ['TCP', 'Listen on a TCP port for incoming data, e.g. syslog.'],
      ['UDP', 'Listen on a UDP port for incoming data, e.g. syslog.'],
      ['Scripts', 'Run custom scripts to collect or generate more data.'],
      ['Splunk Assist Instance Identifier', 'Assigns an identifier to every node.'],
      ['Systemd Journald Input for Splunk', "Collect systemd's logging output."],
      ['Logd Input for the Splunk platform', 'Collect data from logd on macOS.'],
      ['Splunk Assist Self-Update', 'Detect and download Assist updates.'],
      ['Splunk Assist Supervisor', 'Manage Splunk Assist packages.'],
    ],
  },
  {
    title: 'Forwarded inputs',
    items: [
      ['Windows Event Logs', 'Collect event logs from forwarders.'],
      ['Files & Directories', 'Monitor files or directories on forwarders.'],
      ['Windows Performance Monitoring', 'Collect performance data from forwarders.'],
      ['TCP', 'Configure a forwarder to listen on a TCP port for incoming data.'],
      ['UDP', 'Configure a forwarder to listen on a UDP port for incoming data.'],
      ['Scripts', 'Collect data from scripts installed on forwarders.'],
    ],
  },
];

// Display metadata extracted from installed Splunk 9.2.2 props.conf definitions.
export const installedSourceTypes: SettingRow[] = [
  {
    Name: '_json',
    Description: 'JavaScript Object Notation format. For more information, visit http://json.org/',
    Category: 'Structured',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'access_combined',
    Description:
      'National Center for Supercomputing Applications (NCSA) combined format HTTP web server logs (can be generated by apache or other web servers)',
    Category: 'Web',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'apache_error',
    Description: 'Error log format produced by the Apache web server (typically error_log on *nix systems)',
    Category: 'Web',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'catalina',
    Description: 'Output produced by Apache Tomcat Catalina (System.out and System.err)',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'cisco:asa',
    Description: 'Output produced by the Cisco Adaptive Security Appliance (ASA) Firewall',
    Category: 'Network & Security',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'collectd_http',
    Description:
      'Collectd daemon format. Uses the write_http plugin to send metrics data to a Splunk platform data input via the HTTP Event Collector.',
    Category: 'Metrics',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'csv',
    Description: 'Comma-separated value format. Set header and other settings in "Delimited Settings"',
    Category: 'Structured',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'db2_diag',
    Description: 'Diagnostic output produced by the IBM DB2 database server',
    Category: 'Database',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'dmesg',
    Description: 'Output produced by the "dmesg" *nix command, printing the *nix kernel ring buffer',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'generic_single_line',
    Description:
      'A common log format with a predefined timestamp. Customize timestamp in "Timestamp" options',
    Category: 'Miscellaneous',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'iis',
    Description:
      'W3C Extended log format produced by the Microsoft Internet Information Services (IIS) web server',
    Category: 'Web',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'json_no_timestamp',
    Description: 'A variant of the JSON source type, with support for nonexistent timestamps',
    Category: 'Structured',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'linux_audit',
    Description: 'Output produced by the auditd system daemon used to track changes on a Linux machine',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'linux_messages_syslog',
    Description: 'Format found within the Linux log file /var/log/messages',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'linux_secure',
    Description:
      'Format for the /var/log/secure file containing all security related messages on a Linux machine',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'log2metrics_csv',
    Description:
      'Comma-separated value format. Log-to-metrics processing converts the numeric values in csv events into metric data points.',
    Category: 'Log to Metrics',
    App: 'splunk_internal_metrics',
    _popular: 'true',
  },
  {
    Name: 'log2metrics_json',
    Description:
      'JSON-formatted data. Log-to-metrics processing converts the numeric values in json keys into metric data points.',
    Category: 'Log to Metrics',
    App: 'splunk_internal_metrics',
    _popular: 'true',
  },
  {
    Name: 'log2metrics_keyvalue',
    Description:
      "'<key>=<value>' formatted data. Log-to-metrics processing converts the keys with numeric values into metric data points.",
    Category: 'Log to Metrics',
    App: 'splunk_internal_metrics',
    _popular: 'true',
  },
  {
    Name: 'log4j',
    Description: 'Output produced by any Java 2 Enterprise Edition (J2EE) application server using log4j',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'log4net_xml',
    Description: 'An XML-formatted output of the Apache log4j framework to the Microsoft .NET runtime',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'log4php',
    Description: 'Output produced by a machine that runs the log4php logging utility',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'metrics_csv',
    Description:
      'Comma-separated value format for metrics.  Must have metric_timestamp, metric_name, and _value fields.',
    Category: 'Metrics',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'mysql_slow',
    Description: 'Slow query log output produced by the MySQL database server',
    Category: 'Database',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'mysqld',
    Description: 'Output produced by the MySQL database server',
    Category: 'Database',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'mysqld_bin',
    Description: 'Binary log output produced by the MySQL database server',
    Category: 'Database',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'mysqld_error',
    Description: 'Errors produced by the MySQL database server',
    Category: 'Database',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'postfix_syslog',
    Description: 'Output produced by the Postfix email server',
    Category: 'Email',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'procmail',
    Description: 'Output produced by the Procmail email server',
    Category: 'Email',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'psv',
    Description: 'Pipe-separated value format. Set header and other settings in "Delimited Settings"',
    Category: 'Structured',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'ruby_on_rails',
    Description: 'Output produced by a Ruby On Rails Web application framework',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'search_telemetry',
    Description: 'JSON-formatted file containing search related telemetry.',
    Category: 'Miscellaneous',
    App: 'system',
    _popular: 'false',
  },
  {
    Name: 'secure_gateway_app_internal_log',
    Description: 'Splunk App Secure Gateway Internal Log',
    Category: 'Miscellaneous',
    App: 'splunk_secure_gateway',
    _popular: 'false',
  },
  {
    Name: 'sendmail_syslog',
    Description: 'Output produced by the Sendmail email server',
    Category: 'Email',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'snort',
    Description: 'Output produced by the Snort network intrusion detection/prevention application',
    Category: 'Network & Security',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'splunk_assist_internal_log',
    Description: 'Splunk Assist Internal Log',
    Category: 'Miscellaneous',
    App: 'splunk_assist',
    _popular: 'false',
  },
  {
    Name: 'statsd',
    Description:
      'Statsd daemon output format. Accepts the plain StatsD line metric protocol or the StatsD line metric protocol with dimensions extension.',
    Category: 'Metrics',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'syslog',
    Description: 'Output produced by many syslog daemons, as described in RFC3164 by the IETF',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'tsv',
    Description: 'Tab-separated value format. Set header and other settings in "Delimited Settings"',
    Category: 'Structured',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'weblogic_stdout',
    Description: 'Output produced by the Oracle WebLogic Java EE application server',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'websphere_activity',
    Description: 'Activity logs produced by the Oracle WebLogic Java EE application server',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'websphere_core',
    Description: 'Output produced by the IBM WebSphere application server',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'websphere_trlog',
    Description: 'Trace output produced by the IBM WebSphere application server',
    Category: 'Application',
    App: 'system',
    _popular: 'true',
  },
  {
    Name: 'windows_snare_syslog',
    Description: 'Output produced by the Snare syslog server on Windows',
    Category: 'Operating System',
    App: 'system',
    _popular: 'true',
  },
];
tableDefinitions['source-types']!.rows = installedSourceTypes;
