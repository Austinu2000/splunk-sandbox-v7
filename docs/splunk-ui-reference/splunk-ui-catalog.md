# Splunk installed UI catalog

This catalog documents the installed UI declarations in `/Applications/Splunk`. It is a static complement to the live UI inspection. No screen in this catalog is claimed to have been visited or rendered at runtime.

## Coverage and interpretation

The inventory contains **260 XML view definitions** across **9 app directories**, **13 navigation XML files**, **96 top-level Enterprise JavaScript page bundles**, **185 web template files**, and **35 controller Python files**.

- These counts describe packaged files, not distinct accessible screens. View aliases, legacy views, demonstrations, details screens, and alternative deployment modes can overlap.
- A navigation entry can reference a shared view without a local XML definition. Conversely, a local view can exist without appearing in a menu.
- Application enablement, user capabilities, licensing, deployment mode, local overrides, and current data can affect actual availability and content. This catalog does not establish those runtime conditions.
- Proposed app URLs below follow the observed `/en-US/app/{app}/{view}` route shape. They are **candidate paths**, not verified links or proof of access.
- UI labels and descriptions are quoted artifact data. Panel and input counts are literal XML tag counts and do not resolve dynamic rendering, post-processing, or dashboard JSON definitions.

## Feature map

| App directory | View files | Navigation files | Packaged UI scope |
|---|---:|---:|---|
| `launcher` | 1 | 1 | Application home/launcher with one declared Home view. |
| `python_upgrade_readiness_app` | 5 | 1 | Compatibility and upgrade checks: settings, Splunk platform compatibility, Python, jQuery, and Python version selection. |
| `search` | 32 | 1 | Search and Reporting workspace: search, reports, alerts, dashboards, datasets/data models, jobs, field extraction, live tail, source display, and legacy report-building views. |
| `splunk-dashboard-studio` | 79 | 1 | Dashboard Studio navigation and 78 other packaged views, largely demonstration dashboards for visualizations, interactions, data sources, and layout. The count is view definitions, not 79 distinct navigation entries. |
| `splunk_assist` | 1 | 1 | Assist entry view. |
| `splunk_instrumentation` | 0 | 1 | Navigation references a search view; no local XML view definition is present in this inventory. Sharing or inheritance is not established by this artifact inventory. |
| `splunk_metrics_workspace` | 3 | 1 | Metrics/Analytics workspace with Home and two Analytics definitions. |
| `splunk_monitoring_console` | 125 | 5 | Operational monitoring dashboards for indexing, search, resource usage, forwarders, clustering, scheduler activity, KV Store, SmartStore, workload management, and monitoring configuration. Five nav variants exist; runtime selection is unverified. |
| `splunk_secure_gateway` | 14 | 1 | Mobile/Secure Gateway home and administration, gateway health/activity, SAML and subscription/request troubleshooting dashboards. |

## Complete app navigation and view catalog

### launcher

Application home/launcher with one declared Home view.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/launcher/default/data/ui/nav/default.xml`

```text
nav
  View: Home [home] (default)
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `home` | Home | view | 0 / 0 | `/en-US/app/launcher/home` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

### python_upgrade_readiness_app

Compatibility and upgrade checks: settings, Splunk platform compatibility, Python, jQuery, and Python version selection.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/python_upgrade_readiness_app/default/data/ui/nav/default.xml`

```text
nav
  View: Setting Scan [setting_scan]
  View: Splunk Platform Compatibility Scan [splunk9x_scan] (default)
  View: Python Version [setting]
  View: jQuery Scan [jquery_scan]
  View: Python Scan [python_scan]
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `jquery_scan` | jQuery Scan | view | 0 / 0 | `/en-US/app/python_upgrade_readiness_app/jquery_scan` |
| `python_scan` | Python Scan | view | 0 / 0 | `/en-US/app/python_upgrade_readiness_app/python_scan` |
| `setting` | Python Version | view | 0 / 0 | `/en-US/app/python_upgrade_readiness_app/setting` |
| `setting_scan` | Setting Scan | view | 0 / 0 | `/en-US/app/python_upgrade_readiness_app/setting_scan` |
| `splunk9x_scan` | Splunk Platform Compatibility Scan | view | 0 / 0 | `/en-US/app/python_upgrade_readiness_app/splunk9x_scan` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

### search

Search and Reporting workspace: search, reports, alerts, dashboards, datasets/data models, jobs, field extraction, live tail, source display, and legacy report-building views.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/search/default/data/ui/nav/default.xml`

```text
nav (search_view=search, color=#5CC05C)
  View: Search [search] (default)
  View: analytics_workspace [analytics_workspace] — no same-app XML definition in inventory
  View: Datasets [datasets]
  View: Reports [reports]
  View: Alerts [alerts]
  View: Dashboards [dashboards]
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `alert` | Alert | view | 0 / 0 | `/en-US/app/search/alert` |
| `alerts` | Alerts | view | 0 / 0 | `/en-US/app/search/alerts` |
| `charting` | Advanced Charting | view | 0 / 0 | `/en-US/app/search/charting` |
| `dashboard_live` | Summary | view | 0 / 0 | `/en-US/app/search/dashboard_live` |
| `dashboards` | Dashboards | view | 0 / 0 | `/en-US/app/search/dashboards` |
| `data_model_editor` | Data Model Editor | view | 0 / 0 | `/en-US/app/search/data_model_editor` |
| `data_model_explorer` | Datasets | view | 0 / 0 | `/en-US/app/search/data_model_explorer` |
| `data_model_manager` | Data Model Manager | view | 0 / 0 | `/en-US/app/search/data_model_manager` |
| `data_models` | Datasets | view | 0 / 0 | `/en-US/app/search/data_models` |
| `dataset` | Dataset | view | 0 / 0 | `/en-US/app/search/dataset` |
| `datasets` | Datasets | view | 0 / 0 | `/en-US/app/search/datasets` |
| `field_extractor` | Field Extractor | view | 0 / 0 | `/en-US/app/search/field_extractor` |
| `flashtimeline` | Search | view | 0 / 0 | `/en-US/app/search/flashtimeline` |
| `integrity_check_of_installed_files` | Integrity Check of Installed Files | form v1.1 | 4 / 1 | `/en-US/app/search/integrity_check_of_installed_files` |
| `job_details_dashboard` | Job Details Dashboard | form v1.1 | 29 / 1 | `/en-US/app/search/job_details_dashboard` |
| `job_manager` | Job Manager | view | 0 / 0 | `/en-US/app/search/job_manager` |
| `jquery_upgrade` | jQuery Upgrade | form v1.1 | 6 / 3 | `/en-US/app/search/jquery_upgrade` |
| `licenseusage` | License Usage | view | 0 / 0 | `/en-US/app/search/licenseusage` |
| `live_tail` | Live Tail | view | 0 / 0 | `/en-US/app/search/live_tail` |
| `mod_setup` | Mod Setup | view | 0 / 0 | `/en-US/app/search/mod_setup` |
| `orphaned_scheduled_searches` | Orphaned Scheduled Searches, Reports, and Alerts | dashboard v1.1 | 2 / 0 | `/en-US/app/search/orphaned_scheduled_searches` |
| `pivot` | Datasets | view | 0 / 0 | `/en-US/app/search/pivot` |
| `report` | Report | view | 0 / 0 | `/en-US/app/search/report` |
| `report_builder_define_data` | Report Builder | view | 0 / 0 | `/en-US/app/search/report_builder_define_data` |
| `report_builder_display` | Display Report | view | 0 / 0 | `/en-US/app/search/report_builder_display` |
| `report_builder_format_report` | Report Builder | view | 0 / 0 | `/en-US/app/search/report_builder_format_report` |
| `report_builder_print` | Display Report | view | 0 / 0 | `/en-US/app/search/report_builder_print` |
| `reports` | Reports | view | 0 / 0 | `/en-US/app/search/reports` |
| `search` | Search | view | 0 / 0 | `/en-US/app/search/search` |
| `show_source.prod_lite` | Show Source | view | 0 / 0 | `/en-US/app/search/show_source.prod_lite` |
| `show_source` | Show Source | view | 0 / 0 | `/en-US/app/search/show_source` |
| `table` | Table | view | 0 / 0 | `/en-US/app/search/table` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

Artifact descriptions:

- **jQuery Upgrade** (`jquery_upgrade`): The following list of dashboards might be affected by a security update that requires jQuery 3.5 or higher. Version 1.0 Simple XML dashboards use jQuery 2.1 and need to be upgraded to jQuery 3.5 by using version 1.1 of Simple XML dashboards. HTML dashboards also depend on jQuery 2.1, but they cannot be upgraded. Instead, recreate them with Dashboard Studio. Version 1.0 Simple XML dashboards and HTML dashboards will soon no longer be available in future versions of Splunk software.

### splunk-dashboard-studio

Dashboard Studio navigation and 78 other packaged views, largely demonstration dashboards for visualizations, interactions, data sources, and layout. The count is view definitions, not 79 distinct navigation entries.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk-dashboard-studio/default/data/ui/nav/default.xml`

```text
nav (color=#5CC05C)
  View: Home [example-hub-nav-visualizations] (default)
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `dashboard` | (no XML label) | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/dashboard` |
| `example-hub-ad-hoc-data` | Ad Hoc Data Source | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-ad-hoc-data` |
| `example-hub-advanced-showhide` | Advanced Show/Hide | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-advanced-showhide` |
| `example-hub-airport-kpis-dashboard` | Airport KPIs | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-airport-kpis-dashboard` |
| `example-hub-area-chart-visualization` | Area | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-area-chart-visualization` |
| `example-hub-assembly-line-dashboard` | Assembly Line | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-assembly-line-dashboard` |
| `example-hub-bar-chart-visualization` | Bar | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-bar-chart-visualization` |
| `example-hub-base-chain-data` | Base and Chain Data Sources | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-base-chain-data` |
| `example-hub-bubble-chart-visualization` | Bubble | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-bubble-chart-visualization` |
| `example-hub-buttercup-games-dashboard` | Buttercup Games | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-buttercup-games-dashboard` |
| `example-hub-cascading-inputs` | Cascading Inputs | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-cascading-inputs` |
| `example-hub-chart-coloring` | Chart Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-chart-coloring` |
| `example-hub-chart-display` | Display Axis, Labels, Legends | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-chart-display` |
| `example-hub-chart-overlays` | Chart Overlays | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-chart-overlays` |
| `example-hub-chart-scaling` | Chart Scaling | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-chart-scaling` |
| `example-hub-choropleth-svg-visualization` | Choropleth SVG | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-choropleth-svg-visualization` |
| `example-hub-column-chart-visualization` | Column | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-column-chart-visualization` |
| `example-hub-custom-url-drilldown` | Drilldown to Custom URL | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-custom-url-drilldown` |
| `example-hub-customer-satisfaction-dashboard` | Customer Satisfaction | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-customer-satisfaction-dashboard` |
| `example-hub-data-command-dashboard` | Data Command and Control | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-data-command-dashboard` |
| `example-hub-data-governance-dashboard` | Data Governance | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-data-governance-dashboard` |
| `example-hub-data-streaming-dashboard` | Data Streaming | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-data-streaming-dashboard` |
| `example-hub-datacenter-dashboard` | Datacenter Sensors | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-datacenter-dashboard` |
| `example-hub-dropdown-input` | Dropdown | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-dropdown-input` |
| `example-hub-ecommerce-monitoring-dashboard` | E-Commerce Monitoring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-ecommerce-monitoring-dashboard` |
| `example-hub-emergency-department-care-dashboard` | Emergency Department Care | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-emergency-department-care-dashboard` |
| `example-hub-europe-telecom-network-hub-dashboard` | Europe Telecom Network Hub | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-europe-telecom-network-hub-dashboard` |
| `example-hub-event-annotations` | Chart Annotations | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-event-annotations` |
| `example-hub-filler-gauge-coloring` | Filler Gauge Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-filler-gauge-coloring` |
| `example-hub-filler-gauge-visualization` | Filler Gauge | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-filler-gauge-visualization` |
| `example-hub-healthcare-dashboard` | Healthcare Dashboard | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-healthcare-dashboard` |
| `example-hub-icon-coloring` | Icon Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-icon-coloring` |
| `example-hub-icon-visualization` | Icons | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-icon-visualization` |
| `example-hub-image-visualization` | Images | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-image-visualization` |
| `example-hub-line-chart-visualization` | Line | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-line-chart-visualization` |
| `example-hub-link-graph-visualization` | Link Graph | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-link-graph-visualization` |
| `example-hub-map-visualization` | Map | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-map-visualization` |
| `example-hub-markdown-visualization` | Markdown | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-markdown-visualization` |
| `example-hub-marker-gauge-coloring` | Marker Gauge Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-marker-gauge-coloring` |
| `example-hub-marker-gauge-visualization` | Marker Gauge | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-marker-gauge-visualization` |
| `example-hub-moving-svg-visualization` | Moving SVGs | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-moving-svg-visualization` |
| `example-hub-multiselect-input` | Multiselect | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-multiselect-input` |
| `example-hub-nav-visualizations` | Home | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-nav-visualizations` |
| `example-hub-number-input` | Number Input | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-number-input` |
| `example-hub-parallel-coordinates-visualization` | Parallel Coordinates | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-parallel-coordinates-visualization` |
| `example-hub-pie-chart-visualization` | Pie | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-pie-chart-visualization` |
| `example-hub-progress-bar-defaults` | Progress Bar | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-progress-bar-defaults` |
| `example-hub-punchcard-chart-coloring` | Punchcard Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-punchcard-chart-coloring` |
| `example-hub-punchcard-chart-sizing` | Punchcard Sizing | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-punchcard-chart-sizing` |
| `example-hub-punchcard-chart-visualization` | Punchcard | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-punchcard-chart-visualization` |
| `example-hub-refresh-defaults` | Refresh | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-refresh-defaults` |
| `example-hub-sankey-diagram-visualization` | Sankey Diagram | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-sankey-diagram-visualization` |
| `example-hub-saved-data` | Saved Search Data Source | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-saved-data` |
| `example-hub-scatter-chart-visualization` | Scatter | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-scatter-chart-visualization` |
| `example-hub-search-tokens` | Evaluate Tokens Using Search | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-search-tokens` |
| `example-hub-security-devices-dashboard` | Employee Device Security | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-security-devices-dashboard` |
| `example-hub-security-network-dashboard` | VPN Health by Region | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-security-network-dashboard` |
| `example-hub-security-summary-dashboard` | VPN Health by Region | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-security-summary-dashboard` |
| `example-hub-set-token-drilldown-default` | Set a Token Default | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-set-token-drilldown-default` |
| `example-hub-set-token-drilldown` | Set Token Drilldown | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-set-token-drilldown` |
| `example-hub-set-token-search` | Set Token from Search | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-set-token-search` |
| `example-hub-shape-visualization` | Shapes and Lines | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-shape-visualization` |
| `example-hub-single-value-coloring` | Single Value Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-coloring` |
| `example-hub-single-value-emojis` | Single Value Emoji | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-emojis` |
| `example-hub-single-value-icon-visualization` | Single Value Icon | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-icon-visualization` |
| `example-hub-single-value-radial-coloring` | Radial Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-radial-coloring` |
| `example-hub-single-value-radial-visualization` | Single Value Radial | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-radial-visualization` |
| `example-hub-single-value-visualization` | Single Value | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-single-value-visualization` |
| `example-hub-submit-button` | Submit Button | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-submit-button` |
| `example-hub-table-chart-coloring` | Table Coloring | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-table-chart-coloring` |
| `example-hub-table-chart-formatting` | Table Formatting | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-table-chart-formatting` |
| `example-hub-table-chart-visualization` | Table | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-table-chart-visualization` |
| `example-hub-test-data` | Test Data Source | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-test-data` |
| `example-hub-text-input` | Text Input | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-text-input` |
| `example-hub-timerange-input` | Time Range Input | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-timerange-input` |
| `example-hub-trellis-layout` | Trellis Layout | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-trellis-layout` |
| `example-hub-vpn-health-by-region-dashboard` | VPN Health by Region | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-vpn-health-by-region-dashboard` |
| `example-hub-workplace-readiness-detail` | Workforce Readiness Detail | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-workplace-readiness-detail` |
| `example-hub-workplace-readiness` | Workforce Readiness | view | 0 / 0 | `/en-US/app/splunk-dashboard-studio/example-hub-workplace-readiness` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

### splunk_assist

Assist entry view.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk_assist/default/data/ui/nav/default.xml`

```text
nav
  View: Start [start] (default)
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `start` | Start | view | 0 / 0 | `/en-US/app/splunk_assist/start` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

### splunk_instrumentation

Navigation references a search view; no local XML view definition is present in this inventory. Sharing or inheritance is not established by this artifact inventory.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk_instrumentation/default/data/ui/nav/default.xml`

```text
nav (color=#65A637)
  View: search [search] (default) — no same-app XML definition in inventory
```

#### View definitions

No local XML view definitions were inventoried.

### splunk_metrics_workspace

Metrics/Analytics workspace with Home and two Analytics definitions.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk_metrics_workspace/default/data/ui/nav/default.xml`

```text
nav (search_view=search)
  View: Home [home] (default)
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `analysis_workspace` | Analytics | view | 0 / 0 | `/en-US/app/splunk_metrics_workspace/analysis_workspace` |
| `analytics_workspace` | Analytics | view | 0 / 0 | `/en-US/app/splunk_metrics_workspace/analytics_workspace` |
| `home` | Home | view | 0 / 0 | `/en-US/app/splunk_metrics_workspace/home` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

### splunk_monitoring_console

Operational monitoring dashboards for indexing, search, resource usage, forwarders, clustering, scheduler activity, KV Store, SmartStore, workload management, and monitoring configuration. Five nav variants exist; runtime selection is unverified.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk_monitoring_console/default/data/ui/nav/default.distributed.xml`

```text
nav (color=#3C444D)
  View: Overview [monitoringconsole_overview] (default)
  View: Summary [monitoringconsole_landing]
  View: Assist [assist]
  View: Health Check [monitoringconsole_check]
  View: Instances [monitoringconsole_instances]
  Collection: Indexing
    Collection: Performance
      View: Indexing Performance: Instance [indexing_performance_instance]
      View: Indexing Performance: Advanced [indexing_performance_advanced]
      View: Indexing Performance: Deployment [indexing_performance_deployment]
    Collection: Indexer Clustering
      View: Indexer Clustering: Status [indexer_clustering_status]
      View: Indexer Clustering: Service Activity [indexer_clustering_service_activity]
    Collection: Indexes and Volumes
      View: Indexes and Volumes: Instance [indexes_and_volumes_instance]
      View: Indexes and Volumes: Deployment [indexes_and_volumes_deployment]
      View: Index Detail: Instance [index_detail_instance]
      View: Index Detail: Deployment [index_detail_deployment]
      View: Volume Detail: Instance [volume_detail_instance]
      View: Volume Detail: Deployment [volume_detail_deployment]
    Collection: Inputs
      View: HTTP Event Collector: Instance [http_event_collector_instance]
      View: HTTP Event Collector: Deployment [http_event_collector_deployment]
      View: Splunk TCP Input Performance: Instance [splunk_tcpin_performance_instance]
      View: Splunk TCP Input Performance: Deployment [splunk_tcpin_performance_deployment]
      View: Data Quality [data_quality]
    Collection: License Usage
      View: License Usage - Today [license_usage_today]
      View: Historic License Usage [license_usage_historic]
    Collection: SmartStore
      View: SmartStore Activity: Instance [smartstore_activity_instance]
      View: SmartStore Activity: Deployment [smartstore_activity_deployment]
      View: SmartStore Cache Performance: Instance [smartstore_cache_performance_instance]
      View: SmartStore Cache Performance: Deployment [smartstore_cache_performance_deployment]
  Collection: Search
    Collection: Activity
      View: Search Activity: Instance [search_activity_instance]
      View: Search Activity: Deployment [search_activity_deployment]
      View: Search Usage Statistics: Instance [search_usage_statistics_instance]
      View: Search Usage Statistics: Deployment [search_usage_statistics_deployment]
    Collection: Distributed Search
      View: Distributed Search: Instance [distributed_search_instance]
      View: Distributed Search: Deployment [distributed_search_deployment]
    Collection: Search Head Clustering
      View: Search Head Clustering: Status and Configuration [shc_status_and_conf]
      View: Search Head Clustering: Configuration Replication [shc_conf_rep]
      View: Search Head Clustering: Artifact Replication [shc_artifact_replication]
      View: Search Head Clustering: Scheduler Delegation [shc_scheduler_delegation_statistics]
      View: Search Head Clustering: App Deployment [shc_app_deployment]
    Collection: Scheduler Activity
      View: Scheduler Activity: Instance [scheduler_activity_instance]
      View: Scheduler Activity: Deployment [scheduler_activity_deployment]
    Collection: KV Store
      View: KV Store: Instance [kv_store_instance]
      View: KV Store: Deployment [kv_store_deployment]
    Collection: Knowledge Bundle Replication
      View: Knowledge Bundle Replication [bundle_replication]
      View: Cascading Replication [cascading_replication]
  Collection: Resource Usage
    View: Resource Usage: Instance [resource_usage_instance]
    View: Resource Usage: Machine [resource_usage_machine]
    View: Resource Usage: Deployment [resource_usage_deployment]
    View: CPU Usage: Instance [resource_usage_cpu_instance]
    View: CPU Usage: Deployment [resource_usage_cpu_deployment]
    Collection: Workload Management
      View: Workload Management Overview [workload_management]
      View: Workload Management Activity: Instance [workload_management_per_pool_instance]
      View: Workload Management Activity: Deployment [workload_management_per_pool_deployment]
      View: Workload Management Monitoring: Distributed [workload_management_monitoring_distributed]
      View: Workload Management Admission Control: Instance [admission_control_monitoring_instance]
      View: Workload Management Admission Control: Distributed [admission_control_monitoring_distributed]
  Collection: Forwarders
    View: Forwarders: Instance [forwarder_instance]
    View: Forwarders: Deployment [forwarder_deployment]
  Collection: Settings
    View: General Setup [monitoringconsole_configure]
    View: Forwarder Monitoring Setup [monitoringconsole_forwarder_setup]
    View: Alerts Setup [monitoringconsole_alerts_setup]
    View: Overview Preferences [monitoringconsole_overview_preferences]
    View: Health Check Items [monitoringconsole_check_list]
  Link: Run a Search → search
```

Source: `/Applications/Splunk/etc/apps/splunk_monitoring_console/default/data/ui/nav/default.env_cloud.xml`

```text
nav (color=#3C444D)
  View: Overview [monitoringconsole_overview] (default)
  View: Assist [assist]
  View: Search Usage Statistics: Instance [search_usage_statistics_instance]
  View: Scheduler Activity: Instance [scheduler_activity_instance]
  View: HTTP Event Collector: Instance [http_event_collector_instance]
  View: Data Quality [data_quality]
  Collection: Forwarders
    View: Forwarders: Instance [forwarder_instance]
    View: Forwarders: Deployment [forwarder_deployment]
  Collection: Settings
    View: Forwarder Monitoring Setup [monitoringconsole_forwarder_setup]
    View: Alerts Setup [monitoringconsole_alerts_setup]
  Link: Run a Search → search
```

Source: `/Applications/Splunk/etc/apps/splunk_monitoring_console/default/data/ui/nav/default.prod_lite.xml`

```text
nav (search_view=search, color=#3C444D)
  View: search [search] (default) — no same-app XML definition in inventory
  View: Assist [assist]
  View: datasets [datasets] — no same-app XML definition in inventory
  View: Reports [reports]
  View: Alerts [alerts]
  View: Dashboards [dashboards]
```

Source: `/Applications/Splunk/etc/apps/splunk_monitoring_console/default/data/ui/nav/default.single.xml`

```text
nav (color=#3C444D)
  View: Overview [monitoringconsole_overview] (default)
  View: Summary [monitoringconsole_landing]
  View: Assist [assist]
  View: Health Check [monitoringconsole_check]
  Collection: Indexing
    Collection: Performance
      View: Indexing Performance: Instance [indexing_performance_instance]
      View: Indexing Performance: Advanced [indexing_performance_advanced]
    Collection: Indexes and Volumes
      View: Indexes and Volumes: Instance [indexes_and_volumes_instance]
      View: Index Detail: Instance [index_detail_instance]
      View: Volume Detail: Instance [volume_detail_instance]
    Collection: Inputs
      View: HTTP Event Collector: Instance [http_event_collector_instance]
      View: Splunk TCP Input Performance: Instance [splunk_tcpin_performance_instance]
      View: Data Quality [data_quality]
    Collection: License Usage
      View: License Usage - Today [license_usage_today]
      View: Historic License Usage [license_usage_historic]
    Collection: SmartStore
      View: SmartStore Activity: Instance [smartstore_activity_instance]
      View: SmartStore Cache Performance: Instance [smartstore_cache_performance_instance]
  Collection: Search
    View: Search Activity: Instance [search_activity_instance]
    View: Search Usage Statistics: Instance [search_usage_statistics_instance]
    View: KV Store: Instance [kv_store_instance]
    View: Scheduler Activity: Instance [scheduler_activity_instance]
  Collection: Resource Usage
    View: Resource Usage: Instance [resource_usage_instance]
    View: Resource Usage: Machine [resource_usage_machine]
    View: CPU Usage: Instance [resource_usage_cpu_instance]
    Collection: Workload Management
      View: Workload Management Overview [workload_management]
      View: Workload Management Activity: Instance [workload_management_per_pool_instance]
      View: Workload Management Monitoring: Instance [workload_management_monitoring_instance]
      View: Workload Management Admission Control: Instance [admission_control_monitoring_instance]
  Collection: Forwarders
    View: Forwarders: Instance [forwarder_instance]
    View: Forwarders: Deployment [forwarder_deployment]
  Collection: Settings
    View: General Setup [monitoringconsole_configure]
    View: Forwarder Monitoring Setup [monitoringconsole_forwarder_setup]
    View: Alerts Setup [monitoringconsole_alerts_setup]
    View: Overview Preferences [monitoringconsole_overview_preferences]
    View: Health Check Items [monitoringconsole_check_list]
  Link: Run a Search → search
```

Source: `/Applications/Splunk/etc/apps/splunk_monitoring_console/default/data/ui/nav/default.xml`

```text
nav (color=#3C444D)
  View: Overview [monitoringconsole_overview] (default)
  View: Summary [monitoringconsole_landing]
  View: Assist [assist]
  View: Health Check [monitoringconsole_check]
  Collection: Indexing
    Collection: Performance
      View: Indexing Performance: Instance [indexing_performance_instance]
      View: Indexing Performance: Advanced [indexing_performance_advanced]
    Collection: Indexes and Volumes
      View: Indexes and Volumes: Instance [indexes_and_volumes_instance]
      View: Index Detail: Instance [index_detail_instance]
      View: Volume Detail: Instance [volume_detail_instance]
    Collection: Inputs
      View: HTTP Event Collector: Instance [http_event_collector_instance]
      View: Splunk TCP Input Performance: Instance [splunk_tcpin_performance_instance]
      View: Data Quality [data_quality]
    Collection: License Usage
      View: License Usage - Today [license_usage_today]
      View: Historic License Usage [license_usage_historic]
    Collection: SmartStore
      View: SmartStore Activity: Instance [smartstore_activity_instance]
      View: SmartStore Cache Performance: Instance [smartstore_cache_performance_instance]
  Collection: Search
    View: Search Activity: Instance [search_activity_instance]
    View: Search Usage Statistics: Instance [search_usage_statistics_instance]
    View: KV Store: Instance [kv_store_instance]
    View: Scheduler Activity: Instance [scheduler_activity_instance]
  Collection: Resource Usage
    View: Resource Usage: Instance [resource_usage_instance]
    View: Resource Usage: Machine [resource_usage_machine]
    View: CPU Usage: Instance [resource_usage_cpu_instance]
    Collection: Workload Management
      View: Workload Management Overview [workload_management]
      View: Workload Management Activity: Instance [workload_management_per_pool_instance]
      View: Workload Management Activity: Deployment [workload_management_per_pool_deployment]
      View: Workload Management Monitoring: Instance [workload_management_monitoring_instance]
      View: Workload Management Admission Control: Instance [admission_control_monitoring_instance]
  Collection: Forwarders
    View: Forwarders: Instance [forwarder_instance]
    View: Forwarders: Deployment [forwarder_deployment]
  Collection: Settings
    View: General Setup [monitoringconsole_configure]
    View: Forwarder Monitoring Setup [monitoringconsole_forwarder_setup]
    View: Alerts Setup [monitoringconsole_alerts_setup]
    View: Overview Preferences [monitoringconsole_overview_preferences]
    View: Health Check Items [monitoringconsole_check_list]
  Link: Run a Search → search
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `admission_control_monitoring_distributed` | Workload Management Admission Control: Distributed | form v1.1 | 8 / 5 | `/en-US/app/splunk_monitoring_console/admission_control_monitoring_distributed` |
| `admission_control_monitoring_instance` | Workload Management Admission Control: Instance | form v1.1 | 8 / 6 | `/en-US/app/splunk_monitoring_console/admission_control_monitoring_instance` |
| `alerts.prod_lite` | Alerts | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/alerts.prod_lite` |
| `alerts` | Alerts | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/alerts` |
| `assist` | Assist | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/assist` |
| `bundle_replication` | Knowledge Bundle Replication | form v1.1 | 14 / 4 | `/en-US/app/splunk_monitoring_console/bundle_replication` |
| `cascading_replication` | Cascading Replication | form v1.1 | 12 / 5 | `/en-US/app/splunk_monitoring_console/cascading_replication` |
| `dashboards.prod_lite` | Dashboards | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/dashboards.prod_lite` |
| `dashboards` | Dashboards | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/dashboards` |
| `data_quality.env_cloud` | Data Quality | dashboard v1.1 | 5 / 1 | `/en-US/app/splunk_monitoring_console/data_quality.env_cloud` |
| `data_quality` | Data Quality | dashboard v1.1 | 5 / 3 | `/en-US/app/splunk_monitoring_console/data_quality` |
| `disk_usage_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/disk_usage_instance.prod_lite` |
| `distributed_search_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/distributed_search_deployment.prod_lite` |
| `distributed_search_deployment` | Distributed Search: Deployment | form v1.1 | 12 / 12 | `/en-US/app/splunk_monitoring_console/distributed_search_deployment` |
| `distributed_search_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/distributed_search_instance.prod_lite` |
| `distributed_search_instance` | Distributed Search: Instance | form v1.1 | 12 / 5 | `/en-US/app/splunk_monitoring_console/distributed_search_instance` |
| `forwarder_deployment.env_cloud` | Forwarders: Deployment | form v1.1 | 6 / 5 | `/en-US/app/splunk_monitoring_console/forwarder_deployment.env_cloud` |
| `forwarder_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/forwarder_deployment.prod_lite` |
| `forwarder_deployment` | Forwarders: Deployment | form v1.1 | 6 / 6 | `/en-US/app/splunk_monitoring_console/forwarder_deployment` |
| `forwarder_instance.env_cloud` | Forwarders: Instance | form v1.1 | 3 / 3 | `/en-US/app/splunk_monitoring_console/forwarder_instance.env_cloud` |
| `forwarder_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/forwarder_instance.prod_lite` |
| `forwarder_instance` | Forwarders: Instance | form v1.1 | 4 / 3 | `/en-US/app/splunk_monitoring_console/forwarder_instance` |
| `forwarder_overview.prod_lite` | Forwarder Monitoring | form v1.1 | 6 / 3 | `/en-US/app/splunk_monitoring_console/forwarder_overview.prod_lite` |
| `forwarder_overview` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/forwarder_overview` |
| `http_event_collector_deployment` | HTTP Event Collector: Deployment | form v1.1 | 12 / 10 | `/en-US/app/splunk_monitoring_console/http_event_collector_deployment` |
| `http_event_collector_instance.env_cloud` | HTTP Event Collector | form v1.1 | 10 / 8 | `/en-US/app/splunk_monitoring_console/http_event_collector_instance.env_cloud` |
| `http_event_collector_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/http_event_collector_instance.prod_lite` |
| `http_event_collector_instance` | HTTP Event Collector: Instance | form v1.1 | 11 / 9 | `/en-US/app/splunk_monitoring_console/http_event_collector_instance` |
| `index_detail_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/index_detail_deployment.prod_lite` |
| `index_detail_deployment` | Index Detail: Deployment | form v1.1 | 13 / 7 | `/en-US/app/splunk_monitoring_console/index_detail_deployment` |
| `index_detail_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/index_detail_instance.prod_lite` |
| `index_detail_instance` | Index Detail: Instance | form v1.1 | 21 / 10 | `/en-US/app/splunk_monitoring_console/index_detail_instance` |
| `indexer_clustering_service_activity.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexer_clustering_service_activity.prod_lite` |
| `indexer_clustering_service_activity` | Indexer Clustering: Service Activity | form v1.1 | 11 / 5 | `/en-US/app/splunk_monitoring_console/indexer_clustering_service_activity` |
| `indexer_clustering_status.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexer_clustering_status.prod_lite` |
| `indexer_clustering_status` | Indexer Clustering: Status | form v1.1 | 5 / 10 | `/en-US/app/splunk_monitoring_console/indexer_clustering_status` |
| `indexes_and_volumes_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexes_and_volumes_deployment.prod_lite` |
| `indexes_and_volumes_deployment` | Indexes and Volumes: Deployment | form v1.1 | 5 / 2 | `/en-US/app/splunk_monitoring_console/indexes_and_volumes_deployment` |
| `indexes_and_volumes_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexes_and_volumes_instance.prod_lite` |
| `indexes_and_volumes_instance` | Indexes and Volumes: Instance | form v1.1 | 9 / 7 | `/en-US/app/splunk_monitoring_console/indexes_and_volumes_instance` |
| `indexing_performance_advanced.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexing_performance_advanced.prod_lite` |
| `indexing_performance_advanced` | Indexing Performance: Advanced | form v1.1 | 17 / 9 | `/en-US/app/splunk_monitoring_console/indexing_performance_advanced` |
| `indexing_performance_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexing_performance_deployment.prod_lite` |
| `indexing_performance_deployment` | Indexing Performance: Deployment | form v1.1 | 13 / 10 | `/en-US/app/splunk_monitoring_console/indexing_performance_deployment` |
| `indexing_performance_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/indexing_performance_instance.prod_lite` |
| `indexing_performance_instance` | Indexing Performance: Instance | form v1.1 | 8 / 7 | `/en-US/app/splunk_monitoring_console/indexing_performance_instance` |
| `kv_store_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/kv_store_deployment.prod_lite` |
| `kv_store_deployment` | KV Store: Deployment | form v1.1 | 13 / 4 | `/en-US/app/splunk_monitoring_console/kv_store_deployment` |
| `kv_store_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/kv_store_instance.prod_lite` |
| `kv_store_instance` | KV Store: Instance | form v1.1 | 19 / 5 | `/en-US/app/splunk_monitoring_console/kv_store_instance` |
| `license_usage_30days.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/license_usage_30days.prod_lite` |
| `license_usage_historic` | Historic License Usage | form v1.1 | 3 / 4 | `/en-US/app/splunk_monitoring_console/license_usage_historic` |
| `license_usage_today.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/license_usage_today.prod_lite` |
| `license_usage_today` | License Usage - Today | form v1.1 | 5 / 1 | `/en-US/app/splunk_monitoring_console/license_usage_today` |
| `monitoringconsole_alerts_setup.prod_lite` | Platform Alerts Setup | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_alerts_setup.prod_lite` |
| `monitoringconsole_alerts_setup` | Alerts Setup | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_alerts_setup` |
| `monitoringconsole_check.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_check.prod_lite` |
| `monitoringconsole_check` | Health Check | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_check` |
| `monitoringconsole_check_list.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_check_list.prod_lite` |
| `monitoringconsole_check_list` | Health Check Items | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_check_list` |
| `monitoringconsole_configure.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_configure.prod_lite` |
| `monitoringconsole_configure` | General Setup | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_configure` |
| `monitoringconsole_forwarder_setup` | Forwarder Monitoring Setup | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_forwarder_setup` |
| `monitoringconsole_instances.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_instances.prod_lite` |
| `monitoringconsole_instances` | Instances | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_instances` |
| `monitoringconsole_landing.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_landing.prod_lite` |
| `monitoringconsole_landing` | Summary | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_landing` |
| `monitoringconsole_overview.env_cloud` | Overview | form v1.1 | 14 / 7 | `/en-US/app/splunk_monitoring_console/monitoringconsole_overview.env_cloud` |
| `monitoringconsole_overview.prod_lite` | Resource Usage | form v1.1 | 9 / 1 | `/en-US/app/splunk_monitoring_console/monitoringconsole_overview.prod_lite` |
| `monitoringconsole_overview` | Overview | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_overview` |
| `monitoringconsole_overview_preferences.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_overview_preferences.prod_lite` |
| `monitoringconsole_overview_preferences` | Overview Preferences | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/monitoringconsole_overview_preferences` |
| `reports.prod_lite` | Reports | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/reports.prod_lite` |
| `reports` | Reports | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/reports` |
| `resource_usage_cpu_deployment` | CPU Usage: Deployment | form v1.1 | 14 / 13 | `/en-US/app/splunk_monitoring_console/resource_usage_cpu_deployment` |
| `resource_usage_cpu_instance` | CPU Usage: Instance | form v1.1 | 8 / 11 | `/en-US/app/splunk_monitoring_console/resource_usage_cpu_instance` |
| `resource_usage_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/resource_usage_deployment.prod_lite` |
| `resource_usage_deployment` | Resource Usage: Deployment | form v1.1 | 19 / 19 | `/en-US/app/splunk_monitoring_console/resource_usage_deployment` |
| `resource_usage_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/resource_usage_instance.prod_lite` |
| `resource_usage_instance` | Resource Usage: Instance | form v1.1 | 10 / 8 | `/en-US/app/splunk_monitoring_console/resource_usage_instance` |
| `resource_usage_machine.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/resource_usage_machine.prod_lite` |
| `resource_usage_machine` | Resource Usage: Machine | form v1.1 | 15 / 12 | `/en-US/app/splunk_monitoring_console/resource_usage_machine` |
| `scheduler_activity_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/scheduler_activity_deployment.prod_lite` |
| `scheduler_activity_deployment` | Scheduler Activity: Deployment | form v1.1 | 13 / 8 | `/en-US/app/splunk_monitoring_console/scheduler_activity_deployment` |
| `scheduler_activity_instance.env_cloud` | Scheduler Activity | form v1.1 | 23 / 13 | `/en-US/app/splunk_monitoring_console/scheduler_activity_instance.env_cloud` |
| `scheduler_activity_instance.prod_lite` | System activity | form v1.1 | 7 / 4 | `/en-US/app/splunk_monitoring_console/scheduler_activity_instance.prod_lite` |
| `scheduler_activity_instance` | Scheduler Activity: Instance | form v1.1 | 25 / 16 | `/en-US/app/splunk_monitoring_console/scheduler_activity_instance` |
| `scheduler_assistant.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/scheduler_assistant.prod_lite` |
| `search_activity_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/search_activity_deployment.prod_lite` |
| `search_activity_deployment` | Search Activity: Deployment | form v1.1 | 10 / 11 | `/en-US/app/splunk_monitoring_console/search_activity_deployment` |
| `search_activity_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/search_activity_instance.prod_lite` |
| `search_activity_instance` | Search Activity: Instance | form v1.1 | 19 / 12 | `/en-US/app/splunk_monitoring_console/search_activity_instance` |
| `search_usage_statistics_deployment` | Search Usage Statistics: Deployment | form v1.1 | 8 / 3 | `/en-US/app/splunk_monitoring_console/search_usage_statistics_deployment` |
| `search_usage_statistics_instance.env_cloud` | Search Usage Statistics | form v1.1 | 4 / 3 | `/en-US/app/splunk_monitoring_console/search_usage_statistics_instance.env_cloud` |
| `search_usage_statistics_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/search_usage_statistics_instance.prod_lite` |
| `search_usage_statistics_instance` | Search Usage Statistics: Instance | form v1.1 | 4 / 6 | `/en-US/app/splunk_monitoring_console/search_usage_statistics_instance` |
| `shc_app_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/shc_app_deployment.prod_lite` |
| `shc_app_deployment` | Search Head Clustering: App Deployment | form v1.1 | 8 / 13 | `/en-US/app/splunk_monitoring_console/shc_app_deployment` |
| `shc_artifact_replication.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/shc_artifact_replication.prod_lite` |
| `shc_artifact_replication` | Search Head Clustering: Artifact Replication | form v1.1 | 9 / 9 | `/en-US/app/splunk_monitoring_console/shc_artifact_replication` |
| `shc_conf_rep.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/shc_conf_rep.prod_lite` |
| `shc_conf_rep` | Search Head Clustering: Configuration Replication | form v1.1 | 9 / 17 | `/en-US/app/splunk_monitoring_console/shc_conf_rep` |
| `shc_scheduler_delegation_statistics.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/shc_scheduler_delegation_statistics.prod_lite` |
| `shc_scheduler_delegation_statistics` | Search Head Clustering: Scheduler Delegation | form v1.1 | 7 / 7 | `/en-US/app/splunk_monitoring_console/shc_scheduler_delegation_statistics` |
| `shc_status_and_conf.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/shc_status_and_conf.prod_lite` |
| `shc_status_and_conf` | Search Head Clustering: Status and Configuration | form v1.1 | 21 / 7 | `/en-US/app/splunk_monitoring_console/shc_status_and_conf` |
| `smartstore_activity_deployment` | SmartStore Activity: Deployment | form v1.1 | 5 / 6 | `/en-US/app/splunk_monitoring_console/smartstore_activity_deployment` |
| `smartstore_activity_instance` | SmartStore Activity: Instance | form v1.1 | 5 / 7 | `/en-US/app/splunk_monitoring_console/smartstore_activity_instance` |
| `smartstore_cache_performance_deployment` | SmartStore Cache Performance: Deployment | form v1.1 | 10 / 2 | `/en-US/app/splunk_monitoring_console/smartstore_cache_performance_deployment` |
| `smartstore_cache_performance_instance` | SmartStore Cache Performance: Instance | form v1.1 | 10 / 3 | `/en-US/app/splunk_monitoring_console/smartstore_cache_performance_instance` |
| `splunk_tcpin_performance_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/splunk_tcpin_performance_deployment.prod_lite` |
| `splunk_tcpin_performance_deployment` | Splunk TCP Input Performance: Deployment | form v1.1 | 21 / 4 | `/en-US/app/splunk_monitoring_console/splunk_tcpin_performance_deployment` |
| `splunk_tcpin_performance_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/splunk_tcpin_performance_instance.prod_lite` |
| `splunk_tcpin_performance_instance` | Splunk TCP Input Performance: Instance | form v1.1 | 7 / 2 | `/en-US/app/splunk_monitoring_console/splunk_tcpin_performance_instance` |
| `standalone.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/standalone.prod_lite` |
| `standalone` | Not available in standalone mode | form v1.1 | 0 / 0 | `/en-US/app/splunk_monitoring_console/standalone` |
| `volume_detail_deployment.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/volume_detail_deployment.prod_lite` |
| `volume_detail_deployment` | Volume Detail: Deployment | form v1.1 | 7 / 5 | `/en-US/app/splunk_monitoring_console/volume_detail_deployment` |
| `volume_detail_instance.prod_lite` | Error | view | 0 / 0 | `/en-US/app/splunk_monitoring_console/volume_detail_instance.prod_lite` |
| `volume_detail_instance` | Volume Detail: Instance | form v1.1 | 10 / 7 | `/en-US/app/splunk_monitoring_console/volume_detail_instance` |
| `workload_management` | Workload Management Overview | form v1.1 | 5 / 4 | `/en-US/app/splunk_monitoring_console/workload_management` |
| `workload_management_monitoring_distributed` | Workload Management Monitoring: Distributed | form v1.1 | 8 / 5 | `/en-US/app/splunk_monitoring_console/workload_management_monitoring_distributed` |
| `workload_management_monitoring_instance` | Workload Management Monitoring: Instance | form v1.1 | 8 / 5 | `/en-US/app/splunk_monitoring_console/workload_management_monitoring_instance` |
| `workload_management_per_pool_deployment` | Workload Management Activity: Deployment | form v1.1 | 8 / 12 | `/en-US/app/splunk_monitoring_console/workload_management_per_pool_deployment` |
| `workload_management_per_pool_instance` | Workload Management Activity: Instance | form v1.1 | 10 / 13 | `/en-US/app/splunk_monitoring_console/workload_management_per_pool_instance` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

Artifact descriptions:

- **Data Quality** (`data_quality.env_cloud`): This dashboard helps you assess the quality of your incoming data by revealing issues that occur when the data is being indexed. These issues appear as warnings and errors in your splunkd.log.
- **Data Quality** (`data_quality`): This dashboard helps you assess the quality of your incoming data by revealing issues that occur when the data is being indexed. These issues appear as warnings and errors in your splunkd.log.
- **CPU Usage: Deployment** (`resource_usage_cpu_deployment`): This dashboard consolidates panels from other Monitoring Console dashboards to help you assess the CPU usage of your Splunk deployment.
- **CPU Usage: Instance** (`resource_usage_cpu_instance`): This dashboard consolidates panels from other Monitoring Console dashboards to help you assess the CPU usage of a Splunk instance.
- **Not available in standalone mode** (`standalone`): The page you have requested is not available in standalone mode.

### splunk_secure_gateway

Mobile/Secure Gateway home and administration, gateway health/activity, SAML and subscription/request troubleshooting dashboards.

#### Navigation declarations

Source: `/Applications/Splunk/etc/apps/splunk_secure_gateway/default/data/ui/nav/default.xml`

```text
nav
  View: Home [home] (default)
  View: Administration [administration]
  Collection: Dashboards
    View: Secure Gateway Status Dashboard [secure_gateway_status_dashboard]
    View: Recent SSG Dashboard Activity [recent_ssg_dashboard_activity]
    Collection: Troubleshooting Dashboards
      View: Request Tracing [request_tracing_dashboard]
      View: Subscription Tracing [subscription_tracing_dashboard]
      View: Single Value Test [test_dashboard_single_value]
      View: End-to-End Websocket Test [ssg_e2e_wss_test]
      View: KV Store Collections Status [kvstore_dashboard_client]
      View: Secure Gateway Subscription Inspector [subscription_search_inspector]
      View: SAML Troubleshooting Dashboard [saml_troubleshooting_dashboard]
```

#### View definitions

| View ID | Declared label | XML format | Panels / inputs | Candidate app route |
|---|---|---|---|---|
| `administration` | Administration | view | 0 / 0 | `/en-US/app/splunk_secure_gateway/administration` |
| `home` | Home | view | 0 / 0 | `/en-US/app/splunk_secure_gateway/home` |
| `kvstore_dashboard_client` | KV Store Collections Status | form v1.1 | 1 / 5 | `/en-US/app/splunk_secure_gateway/kvstore_dashboard_client` |
| `mdm_saml` | MDM with SAML | view | 0 / 0 | `/en-US/app/splunk_secure_gateway/mdm_saml` |
| `opt_in` | SOC2 Compliance Opt In Page | view | 0 / 0 | `/en-US/app/splunk_secure_gateway/opt_in` |
| `recent_ssg_dashboard_activity` | Recent SSG Dashboard Activity | form v1.1 | 23 / 1 | `/en-US/app/splunk_secure_gateway/recent_ssg_dashboard_activity` |
| `request_tracing_dashboard` | Request Tracing | form v1.1 | 9 / 2 | `/en-US/app/splunk_secure_gateway/request_tracing_dashboard` |
| `saml_troubleshooting_dashboard` | SAML Troubleshooting Dashboard | dashboard v1.1 | 11 / 0 | `/en-US/app/splunk_secure_gateway/saml_troubleshooting_dashboard` |
| `secure_gateway_status_dashboard` | Secure Gateway Status Dashboard | form v1.1 | 11 / 1 | `/en-US/app/splunk_secure_gateway/secure_gateway_status_dashboard` |
| `self_register` | Self Register | view | 0 / 0 | `/en-US/app/splunk_secure_gateway/self_register` |
| `ssg_e2e_wss_test` | End-to-End Websocket Test | form v1.1 | 5 / 2 | `/en-US/app/splunk_secure_gateway/ssg_e2e_wss_test` |
| `subscription_search_inspector` | Secure Gateway Subscription Inspector | form v1.1 | 3 / 1 | `/en-US/app/splunk_secure_gateway/subscription_search_inspector` |
| `subscription_tracing_dashboard` | Subscription Tracing | form v1.1 | 10 / 2 | `/en-US/app/splunk_secure_gateway/subscription_tracing_dashboard` |
| `test_dashboard_single_value` | Single Value Test | dashboard v1.1 | 1 / 0 | `/en-US/app/splunk_secure_gateway/test_dashboard_single_value` |

Every view row maps to its exact path and SHA-256 in `splunk-ui-inventory.json`.

Artifact descriptions:

- **KV Store Collections Status** (`kvstore_dashboard_client`): If you’re running into issues with the Connected Experiences apps, Splunk Support might ask you to use this dashboard to check the KV Store status.
- **Recent SSG Dashboard Activity** (`recent_ssg_dashboard_activity`): Use this dashboard to troubleshoot a Dashboard that isn’t loading. Select a time range to get a list of most recently viewed Dashboards.
- **Request Tracing** (`request_tracing_dashboard`): Troubleshoot and trace a particular request. Select a time range and a request ID to get troubleshooting logs and a stack trace.
- **SAML Troubleshooting Dashboard** (`saml_troubleshooting_dashboard`): Dashboard to help troubleshoot SAML setup issues with Splunk Secure Gateway
- **End-to-End Websocket Test** (`ssg_e2e_wss_test`): Initiate a sample request to run an end-to-end websocket test for Splunk Secure Gateway, device authentication, and Spacebridge messaging. This dashboard requires JSON Web Tokens (JWT) to be enabled.
- **Secure Gateway Subscription Inspector** (`subscription_search_inspector`): This dashboard is intended to help troubleshoot issues with search processing logic within Splunk Secure Gateway. To get started click on one of the subscription iterations.
- **Subscription Tracing** (`subscription_tracing_dashboard`): Use this dashboard to troubleshoot a panel that isn’t loading. Select a time range and a panel ID to get troubleshooting logs and a stack trace.
- **Single Value Test** (`test_dashboard_single_value`): This single-value panel is a test to check if a simple dashboard loads in Splunk Secure Gateway. It helps identify possible causes for issues during troubleshooting.

## Enterprise page bundle catalog

These are compiled page assets in `share/splunk/search_mrsparkle/exposed/build/pages/enterprise`. Names identify packaged page candidates; they are not verified routes or runtime feature claims. Numeric and split bundles may be supporting chunks.

| Bundle | Bytes | Candidate UI family from name |
|---|---:|---|
| `79.js` | 157,086 | Shared/split bundle; standalone screen unknown |
| `80.js` | 240,417 | Shared/split bundle; standalone screen unknown |
| `81.js` | 39,653 | Shared/split bundle; standalone screen unknown |
| `82.js` | 10,980 | Shared/split bundle; standalone screen unknown |
| `83.js` | 15,670 | Shared/split bundle; standalone screen unknown |
| `84.js` | 200,888 | Shared/split bundle; standalone screen unknown |
| `85.js` | 2,206 | Shared/split bundle; standalone screen unknown |
| `86.js` | 6,759 | Shared/split bundle; standalone screen unknown |
| `account.js` | 224,976 | Authentication, account, and access administration |
| `accountstatus.js` | 189,354 | Authentication, account, and access administration |
| `adddatamethods.js` | 463,471 | Data ingestion, storage, and indexes |
| `alert.js` | 29,402 | Search, reports, jobs, and alerts |
| `alert_actions.js` | 23,751 | Search, reports, jobs, and alerts |
| `alerts.js` | 55,135 | Search, reports, jobs, and alerts |
| `apps_local.js` | 53,168 | Applications and app setup |
| `apps_uploaded_apps.js` | 11,785 | Applications and app setup |
| `appsremote.js` | 49,857 | Applications and app setup |
| `archive_management.js` | 22,370 | Data ingestion, storage, and indexes |
| `archive_new.js` | 16,893 | Data ingestion, storage, and indexes |
| `archives.js` | 41,546 | Data ingestion, storage, and indexes |
| `auth_view_capabilities.js` | 27,424 | Authentication, account, and access administration |
| `auth_view_indexes.js` | 30,250 | Authentication, account, and access administration |
| `authentication_changepassword.js` | 15,101 | Authentication, account, and access administration |
| `authentication_users.js` | 64,156 | Authentication, account, and access administration |
| `authorization_roles.js` | 166,034 | Authentication, account, and access administration |
| `authorization_tokens.js` | 170,828 | Authentication, account, and access administration |
| `bulkreassign.js` | 26,822 | Authentication, account, and access administration |
| `clustering.js` | 189,997 | Deployment and distributed infrastructure |
| `clustering_bucket_details.js` | 70,889 | Deployment and distributed infrastructure |
| `clustering_push.js` | 46,689 | Deployment and distributed infrastructure |
| `common.js` | 14,652,229 | Shared/split bundle; standalone screen unknown |
| `dashboard_1.1.js` | 1,258,901 | Dashboards, datasets, and visual analysis |
| `dashboards.js` | 627,733 | Dashboards, datasets, and visual analysis |
| `data_indexes.js` | 91,136 | Data ingestion, storage, and indexes |
| `data_indexes_cloud.js` | 22,252 | Data ingestion, storage, and indexes |
| `data_indexes_cloud_light.js` | 11,644 | Data ingestion, storage, and indexes |
| `data_model_editor.js` | 285,536 | Dashboards, datasets, and visual analysis |
| `data_model_manager.js` | 81,760 | Dashboards, datasets, and visual analysis |
| `data_ui_panels.js` | 39,631 | Dashboards, datasets, and visual analysis |
| `dataset.js` | 199,889 | Dashboards, datasets, and visual analysis |
| `datasets.js` | 58,193 | Dashboards, datasets, and visual analysis |
| `deploymentserver.js` | 52,565 | Deployment and distributed infrastructure |
| `deploymentserver_add_apps.js` | 20,863 | Deployment and distributed infrastructure |
| `deploymentserver_add_clients.js` | 35,677 | Deployment and distributed infrastructure |
| `deploymentserver_apps_detail.js` | 15,679 | Deployment and distributed infrastructure |
| `deploymentserver_edit_app.js` | 25,650 | Deployment and distributed infrastructure |
| `deploymentserveredit.js` | 39,312 | Deployment and distributed infrastructure |
| `embed.js` | 14,603 | Dashboards, datasets, and visual analysis |
| `error.js` | 4,963 | Other page/support asset |
| `explore_data.js` | 119,627 | Dashboards, datasets, and visual analysis |
| `federated_search.js` | 158,766 | Deployment and distributed infrastructure |
| `field_extractor.js` | 202,862 | Data ingestion, storage, and indexes |
| `global_banner.js` | 14,321 | System, health, and licensing |
| `health_manager.js` | 185,452 | System, health, and licensing |
| `home.js` | 78,735 | Other page/support asset |
| `html_dashboard_error.js` | 11,025 | Dashboards, datasets, and visual analysis |
| `http-eventcollector.js` | 82,702 | Data ingestion, storage, and indexes |
| `ingest_rulesets.js` | 779,708 | Data ingestion, storage, and indexes |
| `internal_library_settings.js` | 30,148 | System, health, and licensing |
| `job_inspector.js` | 38,028 | Search, reports, jobs, and alerts |
| `job_manager.js` | 41,770 | Search, reports, jobs, and alerts |
| `licenseusage.js` | 644,078 | System, health, and licensing |
| `licensing.js` | 65,923 | System, health, and licensing |
| `licensing_notes.js` | 10,425 | System, health, and licensing |
| `live_tail.js` | 61,127 | Data ingestion, storage, and indexes |
| `login_page_settings.js` | 235,438 | System, health, and licensing |
| `lookup_geoip.js` | 10,956 | Data ingestion, storage, and indexes |
| `manage_system_config.js` | 11,858 | System, health, and licensing |
| `mod_setup.js` | 51,779 | Applications and app setup |
| `password_management.js` | 18,113 | Authentication, account, and access administration |
| `pivot.js` | 315,163 | Dashboards, datasets, and visual analysis |
| `report.js` | 80,458 | Search, reports, jobs, and alerts |
| `reports.js` | 47,590 | Search, reports, jobs, and alerts |
| `saml.js` | 65,667 | Authentication, account, and access administration |
| `saved_searches.js` | 57,652 | Search, reports, jobs, and alerts |
| `saved_searches_advancededit.js` | 14,468 | Search, reports, jobs, and alerts |
| `search-0.js` | 242,763 | Shared/split bundle; standalone screen unknown |
| `search-2.js` | 157,085 | Shared/split bundle; standalone screen unknown |
| `search-3.js` | 247,650 | Shared/split bundle; standalone screen unknown |
| `search-4.js` | 47,046 | Shared/split bundle; standalone screen unknown |
| `search-5.js` | 13,557 | Shared/split bundle; standalone screen unknown |
| `search-6.js` | 15,669 | Shared/split bundle; standalone screen unknown |
| `search-7.js` | 200,887 | Shared/split bundle; standalone screen unknown |
| `search-8.js` | 6,758 | Shared/split bundle; standalone screen unknown |
| `search.js` | 13,868,983 | Search, reports, jobs, and alerts |
| `search_head_clustering.js` | 42,487 | Deployment and distributed infrastructure |
| `searchprefs.js` | 20,754 | Search, reports, jobs, and alerts |
| `show_source.js` | 12,576 | Search, reports, jobs, and alerts |
| `sourcetypes.js` | 31,902 | Data ingestion, storage, and indexes |
| `style_guide.js` | 119,108 | Other page/support asset |
| `table.js` | 539,636 | Dashboards, datasets, and visual analysis |
| `triggered_alerts.js` | 42,076 | Search, reports, jobs, and alerts |
| `virtual_indexes.js` | 75,544 | Data ingestion, storage, and indexes |
| `vix_index_new.js` | 25,343 | Data ingestion, storage, and indexes |
| `vix_provider_new.js` | 39,514 | Data ingestion, storage, and indexes |
| `workload_management.js` | 157,837 | Deployment and distributed infrastructure |

## Template and controller boundaries

The template inventory contains server-rendered shell and feature templates alongside the compiled browser bundles. Controller-file presence supplies a server-side routing candidate inventory; reading names alone does not prove any handler or endpoint is enabled.

### Controller file inventory

- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/__init__.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/account.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/admin.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/alerts.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/appinstall.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/appnav.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/config.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/custom.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/dashboardshare.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/datamodel.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/debug.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/embed.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/error.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/etb.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/field.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/i18n_catalog.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/ifx.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/licensing.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/lists.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/messages.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/module.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/parser.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/proxy.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/savedsearchredirect.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/savesearchwizard.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/scheduledigestwizard.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/scheduledviews.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/search.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/summarization.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/tags.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/top.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/tree.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/utility.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/view.py`
- `/Applications/Splunk/lib/python3.7/site-packages/splunk/appserver/mrsparkle/controllers/viewmaster.py`

### Complete web template inventory

- `account/sso_error.html`
- `admin/402.html`
- `admin/403.html`
- `admin/_helpers.html`
- `admin/advancedsearch.html`
- `admin/appinstall/already-installed.html`
- `admin/appinstall/app-not-found.html`
- `admin/appinstall/enable-required.html`
- `admin/appinstall/no-internet.html`
- `admin/appinstall/ready-to-install.html`
- `admin/appinstall/restart-required.html`
- `admin/appinstall/sb-login.html`
- `admin/appinstall/setup-required.html`
- `admin/appinstall/upgrade-available.html`
- `admin/appinstall/upload-app.html`
- `admin/authoverview.html`
- `admin/control.html`
- `admin/datainputstats.html`
- `admin/distsearch.html`
- `admin/edit.html`
- `admin/element.html`
- `admin/error.html`
- `admin/fields.html`
- `admin/forwardreceive.html`
- `admin/index.html`
- `admin/list.html`
- `admin/lookups.html`
- `admin/notavailable.html`
- `admin/permissions.html`
- `admin/systemsettings.html`
- `admin/tags.html`
- `admin/ui.html`
- `admin/widgets/accumulator.html`
- `admin/widgets/checkbox.html`
- `admin/widgets/expando_textarea.html`
- `admin/widgets/fieldmapping.html`
- `admin/widgets/fieldset.html`
- `admin/widgets/fileupload.html`
- `admin/widgets/header.html`
- `admin/widgets/helpstring.html`
- `admin/widgets/hidden.html`
- `admin/widgets/multiselect.html`
- `admin/widgets/password.html`
- `admin/widgets/radio.html`
- `admin/widgets/repeatable.html`
- `admin/widgets/savedsearchredirectlink.html`
- `admin/widgets/select.html`
- `admin/widgets/simplepassword.html`
- `admin/widgets/textarea.html`
- `admin/widgets/textfield.html`
- `alertswizard/_steps.html`
- `alertswizard/step1_edit.html`
- `alertswizard/step1_new.html`
- `alertswizard/step2.html`
- `alertswizard/step3.html`
- `alertswizard/success.html`
- `alertswizardv2/_step1.html`
- `alertswizardv2/_steps.html`
- `alertswizardv2/step1_edit.html`
- `alertswizardv2/step1_new.html`
- `alertswizardv2/step2.html`
- `alertswizardv2/step3.html`
- `alertswizardv2/success.html`
- `dashboards/contexts/eventhandler.js`
- `dashboards/contexts/postsearch.js`
- `dashboards/contexts/saved.js`
- `dashboards/contexts/string.js`
- `dashboards/contexts/template.js`
- `dashboards/dashboard.html`
- `dashboards/elements/Chart.js`
- `dashboards/elements/CheckboxGroupInput.js`
- `dashboards/elements/DropdownInput.js`
- `dashboards/elements/Event.js`
- `dashboards/elements/Html.html`
- `dashboards/elements/Html.js`
- `dashboards/elements/LinkInput.js`
- `dashboards/elements/List.html`
- `dashboards/elements/List.js`
- `dashboards/elements/Map.js`
- `dashboards/elements/MultiSelectInput.js`
- `dashboards/elements/RadioInput.js`
- `dashboards/elements/Single.js`
- `dashboards/elements/Table.html`
- `dashboards/elements/Table.js`
- `dashboards/elements/TextInput.js`
- `dashboards/elements/TimeInput.js`
- `dashboards/elements/Viz.js`
- `dashboards/elements/drilldown/drilldown.js`
- `dashboards/elements/drilldown/inputchange.html`
- `dashboardshare/new.html`
- `dashboardshare/success.html`
- `debug/echo.html`
- `debug/pdf.html`
- `debug/reset.html`
- `errors/missing_job.html`
- `etb/index.html`
- `field/summary.html`
- `formset.html`
- `hadoop/base.html`
- `layout/README`
- `layout/admin.html`
- `layout/admin_lite.html`
- `layout/admin_lite_dialog.html`
- `layout/base.html`
- `layout/message.html`
- `layout/view.html`
- `layout/wizard.html`
- `lib.html`
- `licensing/expired.html`
- `licensing/licenses/add.html`
- `licensing/licenses/delete.html`
- `licensing/licenses/details.html`
- `licensing/licenses/list.html`
- `licensing/messages/list.html`
- `licensing/overview.html`
- `licensing/pools/add.html`
- `licensing/pools/delete.html`
- `licensing/self.html`
- `licensing/slave.html`
- `licensing/slaves/list.html`
- `licensing/switch.html`
- `licensing/usage.html`
- `lists/_helpers.html`
- `lists/json.html`
- `lists/li.html`
- `lists/options.html`
- `lists/table.html`
- `module/_helpers.html`
- `pages/app.html`
- `pages/base.html`
- `pages/base_v2.html`
- `pages/blank.html`
- `pages/dashboard_1.1.html`
- `pages/error.html`
- `pages/page.html`
- `pages/page_with_flag.html`
- `pages/search.html`
- `pages/static.html`
- `pages/system.html`
- `paneleditor/edit.html`
- `paneleditor/searchedit.html`
- `prototype/form1.html`
- `prototype/new_layout.html`
- `prototype/scroll_performance.html`
- `prototype/sparklines.html`
- `recipe/index.html`
- `savesearchwizard/new.html`
- `savesearchwizard/success.html`
- `scheduledigestwizard/_step1.html`
- `scheduledigestwizard/_step1_js.html`
- `scheduledigestwizard/_steps.html`
- `scheduledigestwizard/step1_edit.html`
- `scheduledigestwizard/step1_new.html`
- `scheduledigestwizard/step2.html`
- `scheduledigestwizard/step3.html`
- `scheduledigestwizard/success.html`
- `scheduledview/edit.html`
- `scheduledview/success.html`
- `searchhelper/creditframe.html`
- `searchhelper/index.html`
- `searchhelper/rawhtml.html`
- `searchhelper/snippet.html`
- `summarization/dashboard.html`
- `summarization/summary_details.html`
- `summarization/verification_result.html`
- `summarization/verification_success.html`
- `summarization/verify_step1.html`
- `tags/get_field_tags.html`
- `top/help.html`
- `top/info.html`
- `top/modules.html`
- `view/404_app.html`
- `view/_helpers.html`
- `view/app_setup.html`
- `view/builder.html`
- `view/dashboard.html`
- `view/dashboard_escaped_render.html`
- `view/html_dashboards_removed.html`
- `view/jobs.html`
- `view/jsonDefine.html`
- `view/search.html`
- `view/tree.html`
- `viewmaster/create_dashboard.html`
- `viewmaster/edit_dashboard.html`
- `viewmaster/edit_panel.html`

## Sources and remaining verification

- `splunk-ui-inventory.json`: exact source paths, declared labels/descriptions, view SHA-256 values, raw navigation XML, bundle sizes, and template/controller file inventory.
- Packaged navigation XML and view XML in each listed app directory.
- This catalog uses ordinary filesystem/XML inspection. It does not manufacture REA Evidence IDs for these observations. REA analysis and live browser observations are documented separately by the main investigation.

Remaining runtime verification includes rendered menus under the current administrator account, full page layouts and states, actual enabled settings, interaction behavior, role-dependent variants, and license/deployment-dependent availability. Static counts are exhaustive only within the inventory’s declared glob scopes, not every possible dynamically generated Splunk UI.
