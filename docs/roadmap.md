# Roadmap: what's left

All eight milestones in `SPEC.md` are built. This file lists what the spec still describes but no milestone covered, the known gaps in what is built, and how to check new work against a real Splunk install. Items are in suggested build order.

Status as of 2026-10-24 (commit after milestone 8).

## 1. Alerts that open tickets

**Spec:** "Alerts and saved searches: a handful of scheduled searches that fire during incidents and open tickets, so problems arrive the way they do at work." Sandbox mode should feel like incidents "arrive as tickets, alerts and user complaints".

**Today:** incidents start only from the Incidents & Tickets page (Start incident) or a fixed `trigger: { afterMinutes: N }`. The scheduler simulation and sh01's saved searches exist, but no search has an alert condition, and nothing fires.

**What to build:**
- **Alert settings in `savedsearches.conf`:** `alert_type`, `alert_comparator` and `alert_threshold`, `counttype`, `relation` and `quantity`, `alert.suppress`, `alert.severity`. Use the names in `savedsearches.conf.spec`.
- **Evaluation:** a scheduled alert search runs over its time range when the simulated scheduler dispatches it. Its result decides whether it fires, and a firing is written to `scheduler.log` (`alert_actions="..."`). Skipped runs don't fire, which ties this to the skipped-searches incident.
- **Scenario field:** an `alert:` field names the saved search that announces the incident. With `trigger: { alert: ... }`, the incident's world changes are applied in the background, and the **ticket opens when the alert fires**, not when the changes are applied.
- **UI:** an **Alerts** view (triggered alerts with time, severity and the search that fired), linked from the ticket.
- **Sandbox mode option:** let incidents start on their own at random intervals (off by default, per the earlier decision), so tickets arrive unannounced.

**Done when:** each of the eight incidents has an alert that fires within a few sim minutes of its change and opens its ticket. A test checks it fires after the change, not before, and stops firing after the fix. A test also checks that fixing skipped searches restores alerts that had been skipped.

## 2. Settings pages

**Spec:** "Settings pages: Forwarder Management (clients, server classes, apps), Data Inputs, Indexes, Licensing, and a minimal Users and Roles page."

**Today:** Forwarder Management is built (read-only) as its own menu item. The **Settings** menu item is disabled, and the other four pages don't exist.

**What to build:** a Settings menu with five pages, each a read-only view of running config, like Forwarder Management:

| Page | Shows | Data already in the sim |
|---|---|---|
| Data Inputs | Inputs by type (files and directories, scripts, Windows event logs, TCP/UDP), per host, with whether each is collecting and why not | `hosts/inputs.ts` (effective inputs, unreadable files) |
| Indexes | Cluster indexes: name, paths, retention, size and event count, replication | `clusterIndexesConf`, `metadata` |
| Licensing | Quota, pool, today's usage, warnings and violations, usage by index and sourcetype | `ingest/license.ts` |
| Users and Roles | A minimal list: admin, power, user, a service account, with their capabilities | new, small: from `authorize.conf` defaults |
| Forwarder Management | Moved under Settings | `ds/manage.ts` |

**Done when:** every page's numbers match the matching search (the one-world-state rule). For example, Data Inputs' "not collecting" for dal-db-0001 during the permissions incident matches the TailReader warnings.

## 3. Windows forwarders and a larger detailed roster

**Spec:** "Roster: about a dozen hosts you can SSH into, covering a few universal forwarders (Windows and Linux), a heavy forwarder, the deployment server, two indexers, a search head, the cluster manager and the license manager."

**Planning decision Q3** (PLAN.md): Windows hosts get a PowerShell-style prompt (`PS C:\Program Files\SplunkUniversalForwarder>`), with `dir`, `type`, `Get-Content -Wait` and `Get-Service SplunkForwarder` mapped onto the same command engine, and Windows paths.

**Today:** this was deferred and never built, so Windows forwarders get the Linux shell. Every infrastructure node and forwarder accepts a login, but only ds01, idx01 and dal-app-0001 have the fully detailed environment.

**What to build:**
- the Windows prompt, path handling and commands;
- detailed environments for about a dozen hosts: at least one Windows forwarder, a Linux web forwarder, hf01, idx02, sh01, cm01 and lm01.

## 4. `tstats`

**Spec:** "Add `tstats` later."

**Today:** every other SPL command the spec lists is implemented. Fleet-wide "which hosts went quiet" searches use `metadata`, which takes about 7 seconds at 35,000 hosts, or raw scans that can hit the 8-second search budget.

**What to build:** `| tstats count where index=... by host, sourcetype, _time span=...`, answered from fleet tables and log rates without generating events, like `metadata`.

**Done when:** `tstats` counts equal `stats` counts over the same events, on a fleet small enough to scan fully. A fleet-wide `tstats` at 35,000 hosts runs in under a second.

## 5. Known issues in what's built

- **Search page doesn't re-run when you open a new search link while it's already open,** and it replaces a custom time range such as `-1m` with the last-15-minutes preset. This predates milestone 6; it was noticed while testing interview mode.
- **Settings menu item is disabled** until item 2 is built.
- **Loading a save blocks the server** for about one second per sim hour at 35,000 forwarders. Replay could run in a worker thread with a progress bar.
- **Interview grading offline is keyword matching** for root cause and communication. Each concept has several phrasings, but an unusual correct answer can score low. The optional Claude assessment covers this.
- **Each incident runs once per world;** reset to replay one.
- **SQLite uses `better-sqlite3`,** a native module. On Node 22.13 and later, the built-in `node:sqlite` could replace it and remove the native build.

The README's "Simulation limits" lists also list modelling simplifications, such as line merging in fixed windows and license usage from class mean throughput.

## Checking against a real Splunk install

A local **Splunk Enterprise 9.2.2** install (`/Applications/Splunk`) is available as a reference. The sandbox simulates 9.2.x, so behaviour should match.

**Use it as a user would (black-box):**
- **Spec files:** `etc/system/README/*.conf.spec` (130 files) document every setting, its default and its meaning. Use them as the reference for settings names and defaults in items 1 and 2. **Don't copy their text into this repo**; it's Splunk's copyrighted material. Implement the behaviour instead.
- **Differential tests:** run the same thing in real Splunk and in the sandbox, and record real Splunk's output as a test fixture. Good candidates:
  - `splunk btool <conf> list --debug` precedence on the same config files (no login or running splunkd needed);
  - `TIME_FORMAT` / `TZ` / `TIME_PREFIX` extraction and line breaking on the same sample log lines;
  - SPL results and error messages over the same sample data.
- **Splunk Web** is the visual reference for page layout and wording, as it was for the existing pages.

**Constraints:**
- Searches and REST calls need a Splunk login. The user runs those, or logs in themselves. The agent never enters Splunk credentials.
- Ask before starting or stopping the local splunkd; it's a service on the user's machine.

**Not used: reverse engineering.** REA (github.com/morluto/rea) was considered on 2026-10-23 and rejected. It decompiles binaries and app code, and Splunk's licence prohibits reverse engineering `splunkd` or Splunk Web. It would also go against the project's scope: copy Splunk's layout and workflow, not its code. Everything on this roadmap can be built from public documentation and black-box comparison.
