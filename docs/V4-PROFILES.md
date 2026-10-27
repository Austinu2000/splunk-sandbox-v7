# V4 environments

Implemented October 25, 2026 in `/Users/austinu/projectsv4/splunk-sandbox`. V3 remains at `/Users/austinu/projectsv3/splunk-sandbox` and was not edited by this implementation. V4 is local; no GitHub publication was requested in this turn.

## Use

Run `npm run dev` from the v4 folder with Node 22, then open <http://127.0.0.1:5573/#/environments>. The API uses port 5574. Both services bind to loopback.

Choose **Continue** to restore an environment, or **Start environment** for its first run. **Start fresh** asks for confirmation and keeps the previous state in the named backup `autosave:<id>:previous`. Load that backup from **Sessions**, using the environment filter. Switching environments saves the one you are leaving and closes its terminals. The active environment appears beside the health indicator.

Progress saves every two minutes and on graceful server shutdown, including clock-only progress. Restart restores the last active autosave. Manual saves include the environment and its validated configuration snapshot; later edits to profile YAML do not silently change a saved world's figures. Older v1 saves and the v3 SQLite autosave migrate to the default environment. V4's database is `data/sandbox.db` and is excluded from Git.

Reports, dashboards, app selections, settings drafts, preferences and search history are scoped to the active environment and included in its server-backed save. UI changes are sent to the server after a short debounce; save/switch waits for pending changes. A failed UI write displays a retry notice. Browser-local v3 objects on port 5473 are not automatically imported into port 5573. Existing settings drafts retain the v3 behavior: they do not execute configuration changes on simulated hosts; use the terminal for operational fixes.

## Environment data

| Environment | Forwarders | Active indexers | Target daily ingest | Available drills |
| --- | ---: | ---: | ---: | ---: |
| Default | 35,000 by default | 6 | Original model | 8 inherited |
| Johns Hopkins APL | 6,000 (confirm) | 20 | 3.5 TB | 4 inherited + 11 new |
| Erie Insurance | 35,000 | 52 | 12 TB | 8 inherited + 5 new |

All supplied YAML values and comments remain intact. The picker exposes confirmation notes. APL class weights total 0.95; the engine preserves them and allocates them as relative weights, with a visible warning. APL's single-site indexer cluster is placed at its first listed site; AWS forwarders can route to that cluster. Erie uses the supplied 40/12 placement. Retired peers are `idx21` and `idx53`, avoiding collisions with active indexers. Disabled Cribl remains down until its explicit evaluation drill is selected.

TB means decimal terabytes. Profile license allowances are a **simulation policy** of normal target volume at 70% utilization, not claimed company license figures. A shared deterministic minute variation and actual collection/delivery state drive license volume. Profile Monitoring Console license tables run their linked SPL searches. Windows XML, FortiGate, Symantec, VPC flow v2, OT, application, web and database audit streams use the profile's indexes and routing hosts. Event streams are representative samples, not trillions of materialized bytes.

Authentication mappings and installed app lists come from the active profile. SAML/LDAP do not contact an external provider. ES is shown only in the APL environment with its dedicated search head. The current implementation supplies focused operational models; it does not embed the real ES, Cribl or SOAR products or their complete UIs.

## Drills and operations

Open **Engineer Sandbox → Incidents & Tickets** for an environment's allowed drills. Core infrastructure references use role tokens resolved for the active world. APL's four-core allowlist takes precedence over the broad core-scenario profile support declaration.

New Erie drills cover phone-home storms, TLS compatibility after an upgrade wave, Windows event volume, peer disk capacity and retention capacity. New APL drills cover FortiGate time and classification, stalled AWS input, OT receive buffers, Cribl sampling, Symantec CIM mapping, ES acceleration, SAML groups, SHC bundle deployment, coordinated indexer recovery and SOAR credentials.

**Operations** shows the same service metrics used by incident checks. In the terminal, run `splunk show profile-status` on an affected host. Config edits require restart or deployment-server reload as appropriate. The SHC drill uses the deployer's `etc/shcluster/apps/profile_search/local/savedsearches.conf`; `splunk apply shcluster-bundle` validates the schedule and distributes the app. The SOAR drill uses the simulated `assets.conf`; after correcting and restarting the asset configuration, run `splunk run playbook create_ticket`. Results are retained in `var/log/splunk/playbook.log`. Only placeholder credentials are used, and no real ServiceNow request occurs.

Operational models intentionally have bounded scope: phone-home saturation and TLS compatibility use representative thresholds; disk/retention checks compare configured capacity with modeled demand; CIM and acceleration expose a focused health outcome rather than implementing all data-model commands. Core scenarios and their default behavior remain covered by the existing solution tests.

## Verification

The automated suite covers the captured v3 default fleet/infrastructure and its evolution, profile validation, unique node names/addresses, ingest tolerance, linked-search agreement, save-v1 migration, configuration snapshot replay, independent per-profile UI/ticket/clock state, SQLite reopen/continue/reset backup, all 16 new drill solutions and replay, and all 12 allowed core/profile combinations.

The complete suite passed **190 tests in 21 files**. TypeScript, lint, and the production web build passed. The build retains a large-bundle warning. Browser verification covered picker rendering, profile load, active-label changes, authentication mappings, incident availability, and fresh-load console checks without new errors. Both the v4 UI and API returned HTTP 200.

Input specifications are in `profiles/apl.yaml`, `profiles/erie.yaml`, and `docs/PROFILES-SPEC.md`. `docs/V4-PROFILES-PLAN.md` retains the historical preparation plan. The user's later instruction superseded its approval pauses.
