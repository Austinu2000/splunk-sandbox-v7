import { profileStorage } from '../environment';
import { useEffect, useState } from 'react';
import type { SearchJobDto } from '@sandbox/shared';

export type {
  KnowledgeKind,
  PanelType,
  DashboardPanel,
  KnowledgeObject,
  KnowledgeState,
} from '@sandbox/shared';
import type { KnowledgeObject, KnowledgeState } from '@sandbox/shared';
const STORAGE_KEY = 'splunk-sandbox-v3-knowledge-v1';
const EVENT = 'splunk-knowledge-changed';

const REPORTS: [string, string, string?][] = [
  ['403_by_clientip', 'index=app status=403 | stats count by clientip', 'uname'],
  ['403_by_clientip Clone', 'index=app status=403 | stats count by clientip', 'admin'],
  [
    'Bucket Merge Retrieve Conf Settings',
    '| rest /services/server/info | table splunk_server version server_roles',
  ],
  ['Errors in the last 24 hours', 'index=_internal log_level=ERROR | stats count by component'],
  ['Errors in the last hour', 'index=_internal log_level=ERROR | stats count by component'],
  ['Internal Report', 'index=_internal | stats count by sourcetype', 'admin'],
  ['License Usage Data Cube', 'index=_internal source=*license_usage.log | stats sum(b) as bytes by st'],
  ['Messages by minute last 3 hours', 'index=_internal | timechart span=1m count'],
  [
    'Orphaned scheduled searches',
    'index=_internal sourcetype=scheduler status=skipped | stats count by savedsearch_name',
  ],
  ['Splunk errors last 24 hours', 'index=_internal log_level=ERROR | table _time host component _raw'],
];
const DASHBOARDS = [
  'Integrity Check of Installed Files',
  'Job Details Dashboard',
  'jQuery Upgrade',
  'Orphaned Scheduled Searches, Reports, and Alerts',
];
export function knowledgeId(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'untitled'
  );
}
export function makeKnowledgeObject(
  input: Partial<KnowledgeObject> & Pick<KnowledgeObject, 'title' | 'kind'>,
): KnowledgeObject {
  return {
    id: knowledgeId(input.title),
    description: '',
    owner: 'admin',
    app: 'search',
    sharing: 'Private',
    search: '',
    earliest: '-15m',
    latest: 'now',
    enabled: true,
    type: 'Classic',
    panels: [],
    updated: new Date().toISOString(),
    ...input,
  };
}
function defaults(): KnowledgeState {
  return {
    objects: [
      ...REPORTS.map(([title, search, owner]) =>
        makeKnowledgeObject({
          kind: 'report',
          title,
          search,
          owner: owner ?? 'nobody',
          sharing: owner === 'admin' ? 'Private' : 'App',
          earliest: '-24h',
          description: 'Search runs against this sandbox’s simulated data.',
        }),
      ),
      ...DASHBOARDS.map((title) =>
        makeKnowledgeObject({
          kind: 'dashboard',
          title,
          owner: 'nobody',
          sharing: 'App',
          description:
            'Reference dashboard from the installed Search & Reporting app. Add panels to explore the sandbox data.',
        }),
      ),
    ],
    jobs: [],
    recent: [],
  };
}
function validObject(item: unknown): item is KnowledgeObject {
  if (!item || typeof item !== 'object') return false;
  const o = item as Partial<KnowledgeObject>;
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.description === 'string' &&
    typeof o.search === 'string' &&
    typeof o.owner === 'string' &&
    typeof o.app === 'string' &&
    typeof o.earliest === 'string' &&
    typeof o.latest === 'string' &&
    typeof o.updated === 'string' &&
    typeof o.enabled === 'boolean' &&
    ['Private', 'App', 'Global'].includes(o.sharing ?? '') &&
    ['report', 'alert', 'dashboard', 'dataset'].includes(o.kind ?? '') &&
    ['Classic', 'Dashboard Studio'].includes(o.type ?? '') &&
    Array.isArray(o.panels) &&
    o.panels.every(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.title === 'string' &&
        typeof p.search === 'string' &&
        ['column', 'bar', 'line', 'area', 'pie', 'single', 'table'].includes(p.type),
    )
  );
}
export function readKnowledge(): KnowledgeState {
  if (storageWriteFailed && fallback) return fallback;
  try {
    const raw = profileStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw) as KnowledgeState;
      if (
        Array.isArray(value.objects) &&
        value.objects.every(validObject) &&
        Array.isArray(value.jobs) &&
        value.jobs.every(
          (j) => j && typeof j.sid === 'string' && typeof j.search === 'string' && Array.isArray(j.messages),
        ) &&
        Array.isArray(value.recent) &&
        value.recent.every((r) => typeof r === 'string')
      )
        return value;
    }
  } catch {
    /* A blocked browser store still permits an in-memory session. */
  }
  fallback ??= defaults();
  return fallback;
}
let fallback: KnowledgeState | undefined;
let storageWriteFailed = false;
export function saveKnowledge(state: KnowledgeState): void {
  fallback = state;
  try {
    profileStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageWriteFailed = false;
  } catch {
    /* In-memory fallback. */
    storageWriteFailed = true;
  }
  window.dispatchEvent(new Event(EVENT));
}
export function addKnowledgeObject(
  input: Partial<KnowledgeObject> & Pick<KnowledgeObject, 'title' | 'kind'>,
): KnowledgeObject {
  const state = readKnowledge();
  const item = makeKnowledgeObject(input);
  const base = item.id;
  for (let n = 2; state.objects.some((o) => o.id === item.id); n++) item.id = `${base}_${n}`;
  saveKnowledge({ ...state, objects: [...state.objects, item] });
  return item;
}
export function updateKnowledgeObject(item: KnowledgeObject): void {
  const state = readKnowledge();
  saveKnowledge({
    ...state,
    objects: state.objects.map((o) =>
      o.id === item.id ? { ...item, updated: new Date().toISOString() } : o,
    ),
  });
}
export function deleteKnowledgeObject(id: string): void {
  const state = readKnowledge();
  saveKnowledge({
    ...state,
    objects: state.objects.filter((o) => o.id !== id),
    recent: state.recent.filter((r) => r !== id),
    homeDashboard: state.homeDashboard === id ? undefined : state.homeDashboard,
  });
}
export function recordSearchJob(job: SearchJobDto): void {
  const state = readKnowledge();
  saveKnowledge({ ...state, jobs: [job, ...state.jobs.filter((j) => j.sid !== job.sid)].slice(0, 100) });
}
export function recordKnowledgeVisit(id: string): void {
  const state = readKnowledge();
  saveKnowledge({ ...state, recent: [id, ...state.recent.filter((r) => r !== id)].slice(0, 30) });
}
export function useKnowledge(): KnowledgeState {
  const [state, setState] = useState(readKnowledge);
  useEffect(() => {
    const update = () => setState(readKnowledge());
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return state;
}

// Labels and route identifiers from the REA browser link inventory.
export const REFERENCE_DATASETS = [
  {
    id: 'internal_audit_logs.Audit',
    title: "Splunk's Internal Audit Logs - SAMPLE > Audit",
    type: 'Data Model',
  },
  {
    id: 'internal_audit_logs.Audit.modify',
    title: "Splunk's Internal Audit Logs - SAMPLE > Audit > Modify Splunk Configs",
    type: 'Data Model',
  },
  {
    id: 'internal_audit_logs.Audit.searches',
    title: "Splunk's Internal Audit Logs - SAMPLE > Audit > Searches",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.acceleration',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Acceleration",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.acceleration.dm_acceleration',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Acceleration > Data Model Acceleration",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.acceleration.report_acceleration',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Acceleration > Report Acceleration",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.licenser',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Licenser",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.licenser.slave_warn_summary',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Licenser > Daily Slave Warning Summary",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.licenser.daily_usage',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Licenser > Daily Usage Summary",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.licenser.pool_warnings',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Licenser > Pool Warnings",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.licenser.quota',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Licenser > Quota Usage",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics.pipeline',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data > Pipeline",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics.queue',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data > Queue",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics.systemwide_search_load_',
    title:
      "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data > Search Load - Systemwide",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics.user_search_load',
    title:
      "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data > Search Load - Users",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.metrics.Thruput',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Performance and System Data > Thruput",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.splunkdaccess',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > REST API Calls",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.splunkdaccess.job_endpoint',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > REST API Calls > Job Endpoint",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.scheduler',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Scheduler",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.scheduler.alerts',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Scheduler > Alerts",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.scheduler.scheduled_reports',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Scheduler > Scheduled Reports",
    type: 'Data Model',
  },
  {
    id: 'internal_server.server.scheduler.summaryindexing',
    title: "Splunk's Internal Server Logs - SAMPLE > Splunk Server > Scheduler > Summary Indexing Searches",
    type: 'Data Model',
  },
  {
    id: 'geo_attr_countries',
    title: 'geo_attr_countries',
    type: 'Lookup',
  },
  {
    id: 'geo_attr_countries.csv',
    title: 'geo_attr_countries.csv',
    type: 'Lookup',
  },
  {
    id: 'geo_attr_us_states',
    title: 'geo_attr_us_states',
    type: 'Lookup',
  },
  {
    id: 'geo_attr_us_states.csv',
    title: 'geo_attr_us_states.csv',
    type: 'Lookup',
  },
];

export const STUDIO_EXAMPLES = [
  {
    id: 'example-hub-submit-button',
    title: 'Submit Button',
    description: 'Submit all input selections at once',
    tags: ['Tokens'],
    group: 'New',
  },
  {
    id: 'example-hub-search-tokens',
    title: 'Evaluate Tokens Using Search',
    description: 'Perform token manipulation with SPL',
    tags: ['Tokens'],
    group: 'New',
  },
  {
    id: 'example-hub-advanced-showhide',
    title: 'Advanced Show/Hide',
    description: 'Define your own logic for conditionally visible dashboard panels',
    tags: [],
    group: 'New',
  },
  {
    id: 'example-hub-trellis-layout',
    title: 'Trellis Layout',
    description: 'Organize your search results with the trellis layout for a holistic view of your data',
    tags: ['Comparison'],
    group: 'New',
  },
  {
    id: 'example-hub-column-chart-visualization',
    title: 'Column Chart',
    description:
      'Column charts can be used for time series data when comparing magnitudes over time. They can also be used in a similar way to bar charts to compare field values across a dataset',
    tags: ['Trend'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-bar-chart-visualization',
    title: 'Bar Chart',
    description:
      'Bar charts are used to compare data of one period or point in time across multiple categories',
    tags: ['Comparison'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-line-chart-visualization',
    title: 'Line Chart',
    description: 'Use Line charts to track values and identify trends over a period of time',
    tags: ['Trend'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-area-chart-visualization',
    title: 'Area Chart',
    description:
      'Use Area charts to track values and identify trends over a period of time. Stacked area charts can represent the accumulation of more than one data series',
    tags: ['Trend'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-bubble-chart-visualization',
    title: 'Bubble Chart',
    description:
      'Bubble charts can represent correlation for up to four dimensions of data. The first two dimensions are visualized as coordinates, the third as size, and the fourth as color',
    tags: ['Correlation'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-scatter-chart-visualization',
    title: 'Scatter Chart',
    description:
      'Scatter charts plot points on a graph, where the data point distribution can represent the correlation across the two dimensions being shown. Multiple categories can also be compared by using colors',
    tags: ['Correlation'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-pie-chart-visualization',
    title: 'Pie Chart',
    description:
      'Pie charts are used to show how different field values combine ver an entire data set. The size of the slice represents relative importance of one category out of a whole',
    tags: ['Comparison'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-punchcard-chart-visualization',
    title: 'Punchcard Chart',
    description: 'Aggregate metrics over two dimensions to visualize cyclical trends in your data',
    tags: ['Correlation'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-sankey-diagram-visualization',
    title: 'Sankey Diagram',
    description:
      'Sankey Diagrams are used to depict flows from a set of elements to another using nodes and links',
    tags: ['Flow'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-parallel-coordinates-visualization',
    title: 'Parallel Coordinates',
    description:
      'Parallel coordinates are used to depict relationships in high-dimensional datasets. The advantage lies in being able to compare multiple variables all in a single chart',
    tags: ['Correlation'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-link-graph-visualization',
    title: 'Link Graph',
    description:
      'Link graphs show connections between distinct values in various fields. Certain relationships can be highlighted to see every link',
    tags: ['Flow'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-chart-overlays',
    title: 'Chart Overlays',
    description:
      'Specify a field to be represented as an overlay on your chart. This is useful when representing averages or bounds to your data',
    tags: ['Advanced'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-event-annotations',
    title: 'Chart Annotations',
    description:
      'Mark important discrete events on time-series charts. This is useful when providing context behind a visible change in your data',
    tags: ['Advanced'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-chart-coloring',
    title: 'Chart Coloring',
    description: 'Customize chart colors to reflect your preferred aesthetic and branding',
    tags: ['Coloring'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-chart-scaling',
    title: 'Chart Scaling',
    description: 'Adjust chart scaling properties to help fit your data correctly',
    tags: [],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-chart-display',
    title: 'Display Axes, Labels and Legends',
    description: 'Adjust how chart properties such as axes and legends frame your data',
    tags: [],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-punchcard-chart-sizing',
    title: 'Punchcard Sizing',
    description: 'Adjust sizing for punchcard visualizations',
    tags: [],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-punchcard-chart-coloring',
    title: 'Punchcard Coloring',
    description: 'Adjust coloring for punchcard visualizations',
    tags: ['Coloring'],
    group: 'Chart Elements',
  },
  {
    id: 'example-hub-filler-gauge-visualization',
    title: 'Filler Gauge',
    description:
      'Visualize a single numeric value and represent it in relation to a limit with a filler gauge',
    tags: [],
    group: 'Gauges',
  },
  {
    id: 'example-hub-filler-gauge-coloring',
    title: 'Filler Gauge Coloring Options',
    description: 'Adjust coloring for filler gauges',
    tags: ['Coloring'],
    group: 'Gauges',
  },
  {
    id: 'example-hub-marker-gauge-visualization',
    title: 'Marker Gauge',
    description:
      'Visualize a single numeric value and display it in relation to ranges representing different statuses',
    tags: [],
    group: 'Gauges',
  },
  {
    id: 'example-hub-marker-gauge-coloring',
    title: 'Marker Gauge Coloring Options',
    description: 'Adjust coloring for marker gauges',
    tags: ['Coloring'],
    group: 'Gauges',
  },
  {
    id: 'example-hub-single-value-radial-visualization',
    title: 'Single Value Radial',
    description: 'Represent a single metric in relation to a radial gauge representing a limit',
    tags: [],
    group: 'Gauges',
  },
  {
    id: 'example-hub-single-value-radial-coloring',
    title: 'Single Value Radial with Dynamic Coloring',
    description:
      'Dynamically color various parts of the Single Value Radial visualization based on your data',
    tags: ['Coloring'],
    group: 'Gauges',
  },
  {
    id: 'example-hub-single-value-visualization',
    title: 'Basic Single Value',
    description:
      'Represent a discrete metric with the option of also showing the latest trend value and change over time with a sparkline',
    tags: [],
    group: 'Single Value',
  },
  {
    id: 'example-hub-single-value-coloring',
    title: 'Single Value Coloring',
    description:
      'Dynamically color various parts of the Single Value visualization to show overall status and signify positive and negative change',
    tags: ['Coloring'],
    group: 'Single Value',
  },
  {
    id: 'example-hub-single-value-emojis',
    title: 'Single Value Emojis',
    description:
      'Emojis can serve as a good at-a-glance representation of status instead of relying on numbers',
    tags: [],
    group: 'Single Value',
  },
  {
    id: 'example-hub-single-value-icon-visualization',
    title: 'Single Value with Icons',
    description:
      'Use Icons to indicate important changes or to provide more context to your Single Value metrics',
    tags: [],
    group: 'Single Value',
  },
  {
    id: 'example-hub-table-chart-visualization',
    title: 'Basic Table',
    description: 'Use Tables to simply display field and row data from your data sources',
    tags: [],
    group: 'Table',
  },
  {
    id: 'example-hub-table-chart-coloring',
    title: 'Table Coloring',
    description: 'Dynamically color table elements to contextualize and emphasize data',
    tags: ['Coloring'],
    group: 'Table',
  },
  {
    id: 'example-hub-table-chart-formatting',
    title: 'Advanced Table Formatting',
    description: 'Adjust column formatting and add sparklines to tables',
    tags: ['Advanced'],
    group: 'Table',
  },
  {
    id: 'example-hub-choropleth-svg-visualization',
    title: 'Basic Choropleth SVG',
    description:
      'Represent values by coloring predefined regions in an SVG. Custom SVG images are great for introducing an extra bit of design flair to the dashboard',
    tags: ['Spatial'],
    group: 'Spatial Elements',
  },
  {
    id: 'example-hub-map-visualization',
    title: 'Interactive Maps',
    description: 'Visualize geo data on an interactive map area',
    tags: ['Spatial'],
    group: 'Spatial Elements',
  },
  {
    id: 'example-hub-moving-svg-visualization',
    title: 'Moving Choropleth SVG',
    description:
      'Some SVG images can move depending on how they are made. These also work as expected in dashboards, and tokens can be used to control their movement',
    tags: ['Advanced\nSource Only'],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-image-visualization',
    title: 'Images',
    description: 'Use Images to add visual context and personalize your dashboard',
    tags: [],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-shape-visualization',
    title: 'Shapes and Lines',
    description: 'Use shapes and lines to direct flow, frame visualizations, and tell a story with your data',
    tags: [],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-markdown-visualization',
    title: 'Markdown Element',
    description:
      'Write Markdown directly in your dashboard to provide descriptions, labels, and additional information',
    tags: [],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-icon-visualization',
    title: 'Basic Icons',
    description:
      'Icons without values can be used to indicate change or status without needing to display a metric',
    tags: [],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-icon-coloring',
    title: 'Icons with Dynamic Coloring and Values',
    description: 'Adjust coloring for single value icon visualizations to help indicate status at a glance',
    tags: ['Coloring'],
    group: 'Design Elements',
  },
  {
    id: 'example-hub-trellis-layout',
    title: 'Trellis Layout',
    description: 'Organize your search results with the trellis layout for a holistic view of your data',
    tags: ['Comparison'],
    group: 'Trellis',
  },
  {
    id: 'example-hub-ad-hoc-data',
    title: 'Ad Hoc Search',
    description: 'Populate a visualization with the results of an ad-hoc Splunk search query',
    tags: [],
    group: 'Datasources',
  },
  {
    id: 'example-hub-base-chain-data',
    title: 'Base and Chain Searches',
    description: 'Optimize your dashboard by using base and chain searches to remove repitition',
    tags: [],
    group: 'Datasources',
  },
  {
    id: 'example-hub-saved-data',
    title: 'Saved Searches',
    description:
      'Use saved searches from various apps to use in your Dashboard, such as reports from Search and Reporting',
    tags: [],
    group: 'Datasources',
  },
  {
    id: 'example-hub-test-data',
    title: 'Test Data Source',
    description:
      'Use a JSON object with static data to populate visualizations without running searches. This is best for testing or displaying static visualizations for design purposes',
    tags: ['Source Only'],
    group: 'Datasources',
  },
  {
    id: 'example-hub-progress-bar-defaults',
    title: 'Progress Bar Defaults',
    description:
      'Progress bars can be revealed per visualization instance, for every visualization of a certain type, or at a default global level',
    tags: ['Tokens\nSource Only'],
    group: 'Defaults',
  },
  {
    id: 'example-hub-refresh-defaults',
    title: 'Refresh Defaults',
    description:
      'Data sources of different types can refresh at different intervals, or a global default can be set for all data sources',
    tags: ['Source Only'],
    group: 'Defaults',
  },
  {
    id: 'example-hub-set-token-drilldown-default',
    title: 'Token Defaults',
    description: 'Populate token-dependent charts on page load by setting a static default value',
    tags: ['Source Only'],
    group: 'Defaults',
  },
  {
    id: 'example-hub-cascading-inputs',
    title: 'Cascading Inputs',
    description: 'Power a form input from other input values to further narrow search results',
    tags: ['Advanced\nTokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-dropdown-input',
    title: 'Dropdown',
    description: 'Set a token to a single value by using a form populated with static or dynamic options',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-multiselect-input',
    title: 'Multiselect',
    description: 'Set a token to multiple values by using a form populated with static or dynamic options',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-text-input',
    title: 'Text',
    description: 'Set tokens based on text entries',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-number-input',
    title: 'Number',
    description: 'Set tokens by selecting a number from a dropdown',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-timerange-input',
    title: 'Timerange',
    description:
      'Select the time range used by datasources powering your visualizations. By default, every dashboard comes with a time range input',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-submit-button',
    title: 'Submit Button',
    description: 'Submit all input selections at once',
    tags: ['Tokens'],
    group: 'Inputs',
  },
  {
    id: 'example-hub-set-token-drilldown',
    title: 'Set Token on Click',
    description:
      'Set tokens based on certain interactions taking place on a visualization. Setting tokens opens the opportunity for more dynamic workflows on the dashboard',
    tags: ['Tokens'],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-set-token-search',
    title: 'Set Token from Search',
    description: 'Set tokens from search results or search job metadata',
    tags: ['Tokens'],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-custom-url-drilldown',
    title: 'Link to Custom URL',
    description: 'Direct users to external or relative URLs from interacting with a visualization',
    tags: ['Tokens'],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-set-token-drilldown-default',
    title: 'Token Defaults',
    description: 'Populate token-dependent charts on page load by setting a static default value',
    tags: ['Source Only'],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-search-tokens',
    title: 'Evaluate Tokens Using Search',
    description: 'Perform token manipulation with SPL',
    tags: ['Tokens'],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-advanced-showhide',
    title: 'Advanced Show/Hide',
    description: 'Define your own logic for conditionally visible dashboard panels',
    tags: [],
    group: 'Interactions & Tokens',
  },
  {
    id: 'example-hub-airport-kpis-dashboard',
    title: "Airport KPI's",
    description:
      'This classic example is an excellent use case for background images and simple, colored visualizations',
    tags: ['Basic'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-assembly-line-dashboard',
    title: 'Assembly Line',
    description:
      'Consistent labelling, multiple charts and dynamic SVGs combine to show a factory management dashboard',
    tags: ['Advanced'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-buttercup-games-dashboard',
    title: 'Buttercup Games',
    description: 'A simple thematic dashboard with simple complimentary charts',
    tags: ['Basic'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-customer-satisfaction-dashboard',
    title: 'Customer Satisfaction',
    description:
      'This example uses grid layout to show colored visualizations to show high level customer KPIs',
    tags: ['Basic\nGrid'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-security-summary-dashboard',
    title: 'Cybersecurity Executive Summary',
    description:
      'This dashboard shows a global cybersecurity executive summary of threats and security posture',
    tags: ['Intermediate\nSecurity'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-datacenter-dashboard',
    title: 'Datacenter Sensors',
    description:
      'This dashboard shows a thematic example of dynamic SVG options to track server room temperatures',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-data-command-dashboard',
    title: 'Data Command and Control',
    description:
      'A complex, data centric dashboard that pushes the limit in the visual control Dashboard Studio provides',
    tags: ['Advanced'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-data-governance-dashboard',
    title: 'Data Governance',
    description: 'A data governance dashboard showing high level enterprise metrics',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-data-streaming-dashboard',
    title: 'Data Streaming',
    description:
      'A strong showcase of how simple visualizations with proper layout make for an effective dashboard',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-ecommerce-monitoring-dashboard',
    title: 'E-Commerce Monitoring',
    description: 'A vibrant, thematic dashboard showing e-commerce metrics and use of SVGs',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-security-devices-dashboard',
    title: 'Employee Device Security',
    description: 'This dashboard shows a global cybersecurity view on employee devices',
    tags: ['Intermediate\nSecurity'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-security-network-dashboard',
    title: 'Employee Network Access',
    description:
      'This dashboard shows a global view of employee network accesses in the context of cybersecurity',
    tags: ['Intermediate\nSecurity'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-europe-telecom-network-hub-dashboard',
    title: 'Europe Telecom Network Hub',
    description: 'This example shows one of the most intricate and effective uses of SVG coloring',
    tags: ['Advanced'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-healthcare-dashboard',
    title: 'Healthcare Dashboard',
    description:
      'This dashboard shows how effective coloring and layering can combine simple visuals to an effective information flow',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-vpn-health-by-region-dashboard',
    title: 'VPN Health by Region',
    description: 'An effective use of icons and coloring to showcase a VPN infrastructure flow',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-workplace-readiness',
    title: 'Workforce Readiness',
    description: 'An effective use of images, icons, and visualizations to show office capacity metrics',
    tags: ['Intermediate'],
    group: 'Complete Dashboards',
  },
  {
    id: 'example-hub-workplace-readiness-detail',
    title: 'Workforce Readiness Detail',
    description: 'A detailed version of office capacity metrics by using SVGs to color office floor maps',
    tags: ['Advanced'],
    group: 'Complete Dashboards',
  },
];

export const STUDIO_THUMBNAILS: Record<string, string> = {
  'example-hub-column-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/column.png',
  'example-hub-bar-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/bar.png',
  'example-hub-line-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/line.png',
  'example-hub-area-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/area.png',
  'example-hub-bubble-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/bubble.png',
  'example-hub-scatter-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/scatter.png',
  'example-hub-pie-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/pie.png',
  'example-hub-punchcard-chart-visualization':
    '/replica/studio-images/examples-hub/nav-thumbnails/punchcard.png',
  'example-hub-sankey-diagram-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/sankey.png',
  'example-hub-parallel-coordinates-visualization':
    '/replica/studio-images/examples-hub/nav-thumbnails/parallel.png',
  'example-hub-link-graph-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/link.png',
  'example-hub-choropleth-svg-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/svg.png',
  'example-hub-moving-svg-visualization':
    '/replica/studio-images/examples-hub/nav-thumbnails/moving_svg_1.png',
  'example-hub-map-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/map.png',
  'example-hub-filler-gauge-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/filler.png',
  'example-hub-filler-gauge-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/filler_color.png',
  'example-hub-marker-gauge-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/marker.png',
  'example-hub-marker-gauge-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/marker_color.png',
  'example-hub-single-value-radial-visualization':
    '/replica/studio-images/examples-hub/nav-thumbnails/svr_new.png',
  'example-hub-single-value-radial-coloring':
    '/replica/studio-images/examples-hub/nav-thumbnails/svr_new_color.png',
  'example-hub-single-value-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/sv.png',
  'example-hub-single-value-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/sv_color.png',
  'example-hub-single-value-emojis': '/replica/studio-images/examples-hub/nav-thumbnails/sv_emoji.png',
  'example-hub-single-value-icon-visualization':
    '/replica/studio-images/examples-hub/nav-thumbnails/sv_icon.png',
  'example-hub-cascading-inputs': '/replica/studio-images/examples-hub/nav-thumbnails/cascading_input.png',
  'example-hub-dropdown-input': '/replica/studio-images/examples-hub/nav-thumbnails/dropdown_input.png',
  'example-hub-multiselect-input': '/replica/studio-images/examples-hub/nav-thumbnails/multiselect_input.png',
  'example-hub-text-input': '/replica/studio-images/examples-hub/nav-thumbnails/text_input.png',
  'example-hub-number-input': '/replica/studio-images/examples-hub/nav-thumbnails/number_input.png',
  'example-hub-timerange-input': '/replica/studio-images/examples-hub/nav-thumbnails/timerange.png',
  'example-hub-ad-hoc-data': '/replica/studio-images/examples-hub/search/inline.png',
  'example-hub-base-chain-data': '/replica/studio-images/examples-hub/search/post.png',
  'example-hub-saved-data': '/replica/studio-images/examples-hub/search/report.png',
  'example-hub-test-data': '/replica/studio-images/examples-hub/search/test.png',
  'example-hub-chart-overlays': '/replica/studio-images/examples-hub/nav-thumbnails/overlays.png',
  'example-hub-event-annotations': '/replica/studio-images/examples-hub/nav-thumbnails/annotations.png',
  'example-hub-chart-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/chart_colors.png',
  'example-hub-chart-scaling': '/replica/studio-images/examples-hub/nav-thumbnails/chart_scale.png',
  'example-hub-chart-display': '/replica/studio-images/examples-hub/nav-thumbnails/chart_display.png',
  'example-hub-punchcard-chart-sizing':
    '/replica/studio-images/examples-hub/nav-thumbnails/punchcard_size.png',
  'example-hub-punchcard-chart-coloring':
    '/replica/studio-images/examples-hub/nav-thumbnails/punchcard_color.png',
  'example-hub-table-chart-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/table.png',
  'example-hub-table-chart-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/table_color.png',
  'example-hub-table-chart-formatting': '/replica/studio-images/examples-hub/nav-thumbnails/table_format.png',
  'example-hub-image-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/image.png',
  'example-hub-shape-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/shapes.png',
  'example-hub-markdown-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/markdown.png',
  'example-hub-icon-visualization': '/replica/studio-images/examples-hub/nav-thumbnails/icon.png',
  'example-hub-icon-coloring': '/replica/studio-images/examples-hub/nav-thumbnails/icon_color.png',
  'example-hub-set-token-drilldown': '/replica/studio-images/examples-hub/nav-thumbnails/set_token.png',
  'example-hub-set-token-search': '/replica/studio-images/examples-hub/nav-thumbnails/search_token.png',
  'example-hub-custom-url-drilldown': '/replica/studio-images/examples-hub/nav-thumbnails/url.png',
  'example-hub-progress-bar-defaults': '/replica/studio-images/examples-hub/nav-thumbnails/progress_bar.png',
  'example-hub-refresh-defaults': '/replica/studio-images/examples-hub/images/default.png',
  'example-hub-set-token-drilldown-default':
    '/replica/studio-images/examples-hub/nav-thumbnails/token_default.png',
  'example-hub-airport-kpis-dashboard': '/replica/studio-images/examples-hub/complete_examples/airport.jpeg',
  'example-hub-assembly-line-dashboard': '/replica/studio-images/examples-hub/complete_examples/assembly.png',
  'example-hub-buttercup-games-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/buttercup.jpeg',
  'example-hub-customer-satisfaction-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/customer.jpeg',
  'example-hub-security-summary-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/security-summary.png',
  'example-hub-datacenter-dashboard': '/replica/studio-images/examples-hub/complete_examples/datacenter.png',
  'example-hub-data-command-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/data-command.png',
  'example-hub-data-governance-dashboard': '/replica/studio-images/examples-hub/complete_examples/mdg.png',
  'example-hub-data-streaming-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/data-streaming.png',
  'example-hub-ecommerce-monitoring-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/ecom-monitor.png',
  'example-hub-security-devices-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/security-devices.png',
  'example-hub-security-network-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/security-network.png',
  'example-hub-europe-telecom-network-hub-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/telecom.png',
  'example-hub-healthcare-dashboard': '/replica/studio-images/examples-hub/complete_examples/health.jpeg',
  'example-hub-vpn-health-by-region-dashboard':
    '/replica/studio-images/examples-hub/complete_examples/VPN.jpeg',
  'example-hub-workplace-readiness':
    '/replica/studio-images/examples-hub/complete_examples/workplace-health.png',
  'example-hub-workplace-readiness-detail':
    '/replica/studio-images/examples-hub/complete_examples/workplace-detail.jpeg',
  'example-hub-submit-button': '/replica/studio-images/examples-hub/nav-thumbnails/submit_button.png',
  'example-hub-search-tokens': '/replica/studio-images/examples-hub/nav-thumbnails/eval_search.png',
  'example-hub-advanced-showhide': '/replica/studio-images/examples-hub/nav-thumbnails/advanced_showhide.png',
  'example-hub-trellis-layout': '/replica/studio-images/examples-hub/nav-thumbnails/trellis_layout.png',
};
