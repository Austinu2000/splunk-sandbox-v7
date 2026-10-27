# V3 — REA UI reconstruction

Implemented October 25, 2026 in `/Users/austinu/projectsv3/splunk-sandbox`.

V3 now opens with the dark Splunk Enterprise Home interface and reconstructs the captured Search & Reporting, Settings, Analytics and Dashboard Studio navigation. The existing simulated enterprise remains the data source. This is a broad reconstruction of the observed UI, not complete 1:1 parity with all Splunk features.

## Open and run

Open **http://127.0.0.1:5473/#/home**. The API runs on loopback port 5474. Start both with `npm run dev` from this repository using Node 22.

The original training tools are under **Apps → Engineer Sandbox**: Fleet Overview, Terminal, Incidents & Tickets, Interview, and Sessions. The practice login page is available through **Administrator → Logout**; it requires no credentials and does not store passwords.

The original Claude Code sandbox, v2, and installed Splunk server are independent from v3.

## Implemented coverage

| Area | Behavior |
|---|---|
| Global shell | Captured dark layout, local Proxima fonts, installed app icons, Home link, Apps, Administrator, Messages, Settings, Activity, Help and working Find. Escape and outside-click dismissal; skip navigation; dialog focus management. |
| Home | Apps filter; five tabs; captured common-task and resource cards with extracted installed SVG icons; object filtering, sorting and pagination; home dashboard selection and recently viewed objects. |
| Search | Captured blank screen, SPL editor, time-picker categories, history, Data Summary, modes, retained-event sampling, results/fields/timeline/statistics/visualization, paging, job inspector, CSV/JSON export and Save As. Searches use the existing engine. |
| Reports, alerts, dashboards | Captured lists, object scope/filtering, row expansion, edit menus, clone/delete/permissions, creation dialog, and saved panel-based dashboards. Changes persist across reload. |
| Studio | Captured example hub with installed previews and categorized cards; seven working chart examples including the observed Column page. Source view and cloning to a local dashboard. Other examples link to their installed-view entry. |
| Analytics | Data pane, chart selection, time range, site filter, refresh, layout controls, analysis pane and save-to-dashboard. Chart values come from simulated searches. |
| Activity | Saved search-job inventory and triggered-alert views derived from the sandbox's recorded jobs/incidents. |
| Settings | All 34 captured top-level destinations open. Dedicated hubs, tables, tabs, forms, search/sort/page controls, local practice CRUD, input drafts, token settings, authentication choices, workload/ingest views, and shared saved-search management. |
| Operational views | Indexes and licensing read simulation state; populated Forwarder Management and Monitoring Console preserve the existing working fleet views. Monitoring overview uses the same data sources as Search. |
| App management | Installed app metadata, filter, local properties/visibility/status and launch links. |
| Installed views | 260 XML definitions cataloged, containing 1,177 panel definitions. Generic XML views preserve declared inputs, rows, labels and inline searches. Unsupported queries or compiled-only screens show their limitations. |
| Native URLs | Common `/en-US/app/...` and every captured Settings URL resolve to the matching local route. Search query/time parameters are retained. |

The machine-readable [coverage map](v3-ui-coverage.json) maps each of the 57 captured states to its v3 destination. The in-app **Help → UI coverage** page offers a searchable installed-view directory.

## Data and persistence

The engine, shell, scenarios, clock and fleet derivation are unchanged. Operational values are not copied from screenshots. For example, the reference deployment had no forwarder clients, while the sandbox correctly shows its simulated fleet. This intentional difference preserves agreement between searches, dashboards and the terminal.

Simulation saves, action logs and interviews use the existing `data/sandbox.db`. UI objects and practice Settings entries use browser-local storage on v3's origin. Browser-local objects are separate from SQLite simulation-session saves and do not follow a simulation reset. Use the same browser/origin to retain them.

Settings practice forms explicitly distinguish local UI metadata from effective engine configuration. Configuration changes that must affect fleet behavior remain in the simulated terminal and require the proper simulated reload/restart. No form writes to `/Applications/Splunk` or contacts its administration service.

## Remaining limits

- This is not a pixel-certified 1:1 implementation of every screen. The REA record verified 57 UI states, not every editor, nested dialog, save path or installed view.
- The full Dashboard Studio free-position canvas and complete Splunk Studio JSON schema are not implemented. The local editor supports panels, layout and its own editable dashboard definition.
- Seven Studio chart examples are executable. Other compiled app-only views expose their source-inventory entry and related navigation; they are not functional replacements for those app runtimes.
- Shipped Monitoring Console searches commonly depend on macros, base searches, tokens, REST endpoints and SPL commands outside the simulator. Generic panels identify those dependencies or display the engine error. A catalog entry is not a claim of operational completeness.
- Scheduled searches/alerts store metadata but do not gain a new automatic scheduling or outbound-delivery engine. Real-time search is periodic polling, sampling applies to retained displayed events, and exports are bounded to 500 rows.
- Authentication, authorization enforcement, real ingestion, deployment, executable app installation, mobile pairing, external notification delivery and the real Splunk service remain outside this simulation. These screens do not claim such actions succeeded.
- The source login's expired license and standalone deployment metrics are not imposed on the simulated enterprise. Login is a practice entry point.
- Production build succeeds with a bundle-size advisory (approximately 1.93 MB main JavaScript, 461 KB gzip); additional code splitting is possible.

## Evidence

The captured report and screenshots are retained in `docs/splunk-ui-reference/`. Main REA records:

- Login scenario: `ev_3da57a6dd8cc5d6584ed6c052b0c40f46116a986af83a10985eb4a9917a00a5f`
- Core page analysis: `ev_e2abedfb14de67a8cd59d66219d7fbf3b3a3f97ad83f8bc745099728aa962f20`
- Dashboard Studio analysis: `ev_a4179b19643dde7bc7bc520aae64eb74df24da85297141522a0f0f3a0911c713`

Post-login screenshots are separate browser observations, not REA runtime Evidence records. View XML, selected local app metadata, source-type definitions, fonts and preview icons were read from the installed 9.2.2 package. Home SVG assets were extracted from literal element data in `build/pages/home.js` without executing that bundle. [Asset manifest](rea-ui-assets.json) records each imported asset's digest.

## Validation

- **152 tests passed across 19 files**, including existing scenario, deterministic fleet, shell, search, sessions and interview checks, plus new persistent-object and native-route tests.
- TypeScript checks passed in every workspace.
- Repository-wide ESLint passed.
- Production web build passed.
- Browser navigation walk opened all 34 captured Settings destinations with no page errors.
- Nested field-alias creation, navigation persistence, editing and deletion passed; QA object removed.
- Search time ranges, 35,000-host aggregate, history, Data Summary, results pagination/expansion, job inspector, modes, charts and export were exercised.
- Dashboard create → add a real SPL panel → save → reload passed. The chart total equaled the world's 35,000 hosts.
- Reports filtering, Studio Column charts and Analytics site filtering/layout controls passed.
- Home tabs, global Find, native search URL conversion, login-to-Home, original Fleet navigation and terminal mounting passed.
- Home had no horizontal overflow at 2123, 1366 and 768 pixels. Representative screenshots were visually compared with the captured reference.

Functional QA used a separate temporary database. The final running instance uses v3's existing `data/sandbox.db`.
