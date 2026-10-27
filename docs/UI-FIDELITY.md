# UI Fidelity Spec — match Splunk Enterprise 9.2.2 (dark theme)

Source of truth: `docs/splunk-ui-reference/` (57 screenshots `*.jpg`, accessibility snapshots `*.txt`, link inventories `*-links.json`, `splunk-ui-analysis.md`, `splunk-ui-catalog.md`). When this spec and a screenshot disagree, the screenshot wins.

Goal: a Splunk engineer opening the sandbox should not notice they are not in Splunk Web. Layout, labels, menu structure, table columns, spacing and colors should match the reference screens. All data must still come from the sandbox world state (CLAUDE.md rules unchanged).

## Ground rules

- Rebuild the look from screenshots and snapshots. Do not copy Splunk's JavaScript bundles, templates, CSS files, icon fonts or images out of the reference folder or any Splunk install.
- Fonts: Splunk uses Proxima Nova, which is licensed. Use a close free substitute (Figtree or Montserrat for UI text, a system monospace for SPL).
- Logo: render a text wordmark in the same position and style (white word, green suffix, ~16px). Do not embed Splunk's logo file. The wordmark text lives in one config constant so it can be changed.
- Every label, column name, menu entry and preset below is taken verbatim from the reference. Do not paraphrase them.
- Screens the reference shows empty (Forwarder Management, Jobs, Triggered Alerts, Tokens, Federated search) get the same layout, populated from the simulated world.

## Design tokens

Sampled from the JPEG screenshots (approximate, ±6 per channel). Check visually against the screenshots and adjust.

| Token | Value | Used for |
|---|---|---|
| `--bg-page` | `#171b1e` | Page, top bar, panels, menus, cards |
| `--bg-appbar` | `#343b43` | App navigation bar (Search / Analytics / …) |
| `--bg-input` | `#262a2d` | Search bar, text inputs |
| `--bg-button-secondary` | `#5e6a76` | "No Event Sampling", "Smart Mode", accordion headers |
| `--bg-timepicker` | `#505c68` | Time picker button |
| `--bg-table-alt` | `#1e2226` | Alternating table rows (compare with indexes.jpg) |
| `--border-panel` | `#34393f` | Panel and section borders |
| `--border-card` | `#6d7278` | Launcher cards, secondary buttons |
| `--accent-green` | `#05862c` | Primary buttons (Search, New Index, Create Table View) |
| `--accent-green-bright` | `#56b95f` | Active app-nav underline, wordmark suffix, app icon |
| `--accent-blue` | `#1774b7` | Active tab underline (launcher), message badge `#026bbc` |
| `--link` | blue, compare search.jpg "Learn more" | Links, Settings menu entries, table name links |
| `--status-ok` | `#288534` | Health dot, "Enabled" check |
| `--status-critical` | `#eb4547` | "Disabled" lock icon, errors |
| `--text-primary` | `#ffffff` | Headings, body |
| `--text-nav` | `#d4dbe3` | Inactive app-nav items, top-bar menus |
| `--text-placeholder` | `#a1a5a8` | Input placeholders |

Type: page title ~22px semibold ("Search", "Indexes"); section headings ~14px semibold; body and tables ~13px; Settings-menu group headings 11px uppercase bold. Corners are square or ~2px. No shadows except flyout menus.

## Global chrome (every screen)

**Top bar** (height ~32px, `--bg-page`, bottom border `--border-panel`), left to right:

- Wordmark (links to launcher home)
- `Apps ▾`
- right side: health dot (green, tooltip "Health: green"), `Administrator ▾`, `2 Messages ▾` (blue count badge), `Settings ▾`, `Activity ▾`, `Help ▾`, `Find` search box

Health dot and message count are driven by world state: dot turns yellow or red during incidents; messages list real sandbox warnings (license, skipped searches, peer down).

**Menus** (match the screenshots of the same name):

- Apps: Search & Reporting, Splunk Secure Gateway, Upgrade Readiness App, then Manage Apps, Find More Apps. Add a sandbox app entry only if needed.
- Administrator: Account Settings, Preferences, Logout
- Activity: Jobs, Triggered Alerts (each with an open-in-new-window icon)
- Help: What's New, Tutorials, Splunk Answers, Contact Support, File a Bug, page help, privacy, About, documentation search
- Settings: mega-menu, below

**Settings mega-menu** (settings-menu.jpg). Left column has two large tiles, `Add Data` and `Monitoring Console`. Then two link columns:

- KNOWLEDGE: Searches, reports, and alerts · Data models · Event types · Tags · Fields · Lookups · User interface · Alert actions · Advanced search · All configurations
- SYSTEM: Server settings · Server controls · Health report manager · Instrumentation · Licensing · Workload management · Mobile settings
- DATA: Data inputs · Forwarding and receiving · Indexes · Report acceleration summaries · Source types · Ingest actions
- DISTRIBUTED ENVIRONMENT: Indexer clustering · Forwarder management · Federated search · Distributed search
- USERS AND AUTHENTICATION: Roles · Users · Tokens · Password management · Authentication methods

**App bar** (Search & Reporting, height ~40px, `--bg-appbar`): Search · Analytics · Datasets · Reports · Alerts · Dashboards. Active item has a 3px `--accent-green-bright` underline. Right side: green app icon plus "Search & Reporting".

## Routes

Use Splunk's URL shapes so muscle memory and bookmarks transfer:

- `/en-US/app/launcher/home`
- `/en-US/app/search/{search|analytics_workspace|datasets|reports|alerts|dashboards|job_manager}`
- `/en-US/manager/search/{adddata|saved/searches|data/indexes|datainputstats|forwardreceive|sourcetypes|authorization/roles|authentication/users|...}`
- `/en-US/manager/system/{licensing|clustering|deploymentserver|health/manager|workload_management}`
- `/en-US/app/splunk_monitoring_console/monitoringconsole_overview`

The full list is in `splunk-ui-analysis.md`, "Every top-level Settings destination". Page `<title>` follows `"{Page} | Splunk 9.2.2"`.

## Screens, in priority order

### P1 — used in every scenario

1. **Launcher home** (home.jpg). Left Apps sidebar with "Manage" link, app search, app list, "Find more apps". Main area: "Hello, Administrator"; tabs Quick links · Dashboard · Recently viewed · Created by you · Shared with you; "Common tasks" cards (Add data, Search your data, Visualize your data, Add team members, Manage permissions, Configure mobile devices) and "Learning and resources" cards. Cards are bordered, with an icon at the left, bold title and one-line description.
2. **Search, empty state** (search.jpg). Title "Search"; full-width SPL input (monospace, placeholder `enter search here...`), time picker button, green magnifier button. Below: `No Event Sampling ▾` on the left, `Smart Mode ▾` on the right. Collapsible "› Search History". Two panels: "How to Search" (Documentation, Tutorial, Data Summary buttons) and "Analyze Your Data with Table Views" (Create Table View button).
3. **Time picker** (search-time-picker.jpg). Flyout with an expanded "Presets" section in four columns:
   - REAL-TIME: 30 second window, 1 minute window, 5 minute window, 30 minute window, 1 hour window, All time (real-time)
   - RELATIVE: Today, Week to date, Business week to date, Month to date, Year to date, Yesterday, Previous week, Previous business week, Previous month, Previous year
   - (unlabelled): Last 15 minutes, Last 60 minutes, Last 4 hours, Last 24 hours, Last 7 days, Last 30 days
   - OTHER: All time

   Below that, collapsed accordions: Relative, Real-time, Date Range, Date & Time Range, Advanced (earliest/latest). All must work against the simulated clock.
4. **Search results.** These were not captured in the reference. Build them from standard Splunk 9.x behavior, styled with the tokens above: job status line (event count, time range, `Job ▾`, pause, stop, share, export, print, `Smart Mode ▾`), tabs Events · Patterns · Statistics · Visualization, timeline histogram with zoom controls, left fields sidebar (Selected Fields / Interesting Fields, `#` and `a` type markers, field popover with top values), event list with List/Raw/Table format, expandable events and field tables, pagination. Job Inspector modal shows scan count and run time from the SPL engine.
5. **Data Summary modal.** Hosts / Sources / Sourcetypes tabs with counts and last update, computed from world state.

### P2 — infrastructure screens scenarios depend on

6. **Indexes** (indexes.jpg). Title, description line with "Learn more", green "New Index" button, count label ("15 Indexes"), filter box, "20 per page ▾". Columns: Name · Actions (Edit Delete Disable/Enable) · Type (Events / Metrics icon) · App · Current Size · Max Size · Event Count · Earliest Event · Latest Event · Home Path · Frozen Path · Status (green check Enabled / red lock Disabled). Sortable headers with arrows. Rows come from the world's `indexes.conf` state, including the internal indexes in the screenshot plus the profile's business indexes.
7. **Forwarder management** (forwarder-management.jpg shows the empty state). Keep the page header and empty-state copy for zero clients. Populated: Apps · Server Classes · Clients tabs; clients table with host, client name, IP, machine type, deployed apps, phone-home time, and a filter. Fed from the 35,000-forwarder fleet with server-side pagination.
8. **Monitoring Console** (monitoring-console.jpg). Overview layout and panel style; mode label reflects the sandbox topology (distributed, not standalone). Add the indexing, forwarders, search and resource views from the catalog's `splunk_monitoring_console` list as scenarios need them.
9. **Licensing** (licensing.jpg). License group, status, expiration, daily volume, usage bar, warnings, and links to details. Driven by simulated ingest so license scenarios show real pressure.
10. **Data inputs, Forwarding and receiving, Source types** (matching screenshots). Input catalog with counts and "Add new"; Forward data / Receive data sections.
11. **Indexer clustering** (indexer-clustering.jpg). Keep the introduction / "Enable indexer clustering" state when clustering is off. When the profile has a cluster, show the cluster manager dashboard: peers, indexes, search heads, replication and search factor status, bucket fixup.
12. **Jobs** (jobs.jpg). Columns: Owner · App · Events · Size · Created at · Expires · Runtime · Status · Actions. Populated from the sandbox's real search jobs.
13. **Server controls** (server-controls.jpg). "Restart Splunk" triggers the simulated restart on the current instance.

### P3 — complete the map

14. Reports, Alerts, Dashboards listings and the Create Dashboard dialog (Classic / Dashboard Studio choice).
15. Searches, reports, and alerts; Triggered Alerts; Health report manager.
16. Users, Roles, Tokens, Password management, Authentication methods.
17. All remaining Settings destinations. Each must at least render its reference layout with realistic content. No dead menu links: an unimplemented page shows its real header and a sandbox notice, never a 404.

## Interaction details

- Dropdown carets are `▾`. Menus open on click, close on outside click or Esc.
- Tables: header row `--bg-appbar`-tinted, rows ~31px, alternating backgrounds, name column is a link, row actions are plain text links.
- Keyboard: Ctrl+P / Ctrl+N cycle search history (as the Search History tooltip states); Enter runs the search; Ctrl+\\ formats SPL.
- Loading states use Splunk-style "Waiting for data..." text in panels.

## Acceptance check

Add a Playwright script (`npm run ui:compare`) that, for each P1 and P2 screen:

1. Sets the viewport to 2123×974 (the reference capture size).
2. Navigates to the sandbox route in the matching state.
3. Saves a screenshot to `docs/ui-compare/{screen}-sandbox.png`.
4. Builds a side-by-side HTML report (`docs/ui-compare/index.html`) with the reference on the left and the sandbox on the right.

A screen is done when, side by side, the structure, labels, colors and spacing match, and differences remain only in data values.
