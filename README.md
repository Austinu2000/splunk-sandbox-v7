# Splunk Engineer Sandbox v6

V6 adds persistent KV Store administration, collection schemas and records, configuration apply/restart behavior, replica health, backups/restores, four guided lessons and three recovery incidents. Open **KV Store** in the practice navigation.

- **V6:** http://127.0.0.1:5773 — independent source, ports and saved sessions.
- **V5:** http://127.0.0.1:5673 — remains available and unchanged.
- [V6 setup, commands, supported behavior and limits](docs/V6-KVSTORE.md).

To start V6: `cd /Users/austinu/projectsv6/splunk-sandbox`, `nvm use 22`, then `npm run dev`. Ctrl+C stops only that process. V6 begins with fresh sessions; V5 source and sessions are backed up under `/Users/austinu/projectsv6/backups`.

The operational practice target is Splunk Enterprise 9.4.1 with a synthetic KV server 7.0.0 fixture. This does not upgrade the installed Splunk application or install MongoDB.

## Inherited V5 features

V5 adds interview-driven engineering practice based on the supplied 235-question collection. Open **Interview workbench**, **Code & Ansible**, or **Learn** from the practice navigation or Home quick links.

- **Interview workbench:** 14 new incident exercises covering cloud ingestion, HEC, Cribl queues, clustering, SHC/KV Store, monitoring, storage, migration, dashboard cost, OpenTelemetry, ITSI and security response. Inspect, stage/apply, verify recovery and submit an evidence-backed debrief.
- **Existing tickets:** all 24 scenario definitions have related interview questions, follow-ups and requested evidence. Failed commands do not earn investigation credit.
- **Code & Ansible:** feature commits, revision-bound PR checks/approval, protected main, reviewed app deployment, bounded simulated playbooks, previews, handlers, serial batches, schedules and run history. Select Practice Lab or APL for these tools.
- **Search practice:** persisted writable lookups, additional SPL operators, summaries/macros and deterministic comparison of query results and work.
- **Answer practice:** all 235 questions, two-minute timers and saved learner notes distinguished as employment experience or sandbox practice.
- **Learn:** 23 G/A/X lesson entries, isolated learner sessions, terminal instructions, notes and workflow checks. Six fault-based lessons include seeded repository problems. Advanced manual outcome checks remain limited; see the scope record below.

V5 is independent at `/Users/austinu/projectsv5/splunk-sandbox`, with ports **5673 / 5674** and its own `data/sandbox.db`. V4 remains in `/Users/austinu/projectsv4/splunk-sandbox` on **5573 / 5574**. No existing v4 progress was imported or overwritten.

[Delivered functionality, verification and limitations](docs/V5-IMPLEMENTATION.md) records the exact scope. The [interview roadmap](docs/V4-INTERVIEW-ROADMAP.md) remains the original planning document, and the [tutorial PDF](docs/TUTORIAL.pdf) remains the authoritative manual. These models support practice; they do not provide full Splunk, AWS, Cribl, OpenTelemetry or Ansible product parity.

A browser-based, fully simulated Splunk environment for practising engineer work and interview scenarios. It looks like a 35,000-forwarder enterprise, but nothing is real: no Splunk binaries, no real shell, no networking beyond localhost.

- `SPEC.md`: what we're building
- `PLAN.md`: architecture, data models, risks
- `CLAUDE.md`: rules every change must follow
- [`docs/writing-scenarios.md`](docs/writing-scenarios.md): how to add a new incident
- [`docs/roadmap.md`](docs/roadmap.md): what's left to build, known issues, and how to check against a real Splunk install

**Inherited original sandbox:** its 8 original milestones are built:
- Fleet Overview, simulated SSH and running config;
- Search & Reporting;
- an incident engine with eight solution-tested incidents;
- the Monitoring Console and Forwarder Management;
- interview mode with a timer, action log, rubric grader and debrief;
- save, load and reset backed by SQLite.

## V3: REA-based Splunk Web UI

V3 opens on the Splunk Home page. The dark interface is reconstructed from the local Splunk Enterprise 9.2.2 captures. Use **Apps → Engineer Sandbox** for the original fleet, terminal, incidents, interviews and saved sessions.

Home, global menus, Search & Reporting, Analytics, reports, alerts, dashboards, Studio examples, app management and all 34 captured Settings destinations are available. Searches and operational metrics use the existing simulation. Saved reports, dashboards and practice settings persist in this browser; simulation sessions continue to use SQLite.

This is a broad UI reconstruction, **not complete 1:1 Splunk parity**. The full Studio editor, compiled app-only screens, and Splunk features beyond the simulator remain limited. See [the coverage and validation record](docs/V3-REA-UI.md) for exact supported behavior and gaps. No installed Splunk processes or configuration are changed.

## Requirements

Node 20.19 or newer. Node 22 LTS is recommended (`.nvmrc`).

## Run it

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:5773>. The API server listens on `127.0.0.1:5774`, and Vite proxies `/api` to it. Both bind to loopback only.

| Env var | Default | Meaning |
|---|---|---|
| `SANDBOX_SEED` | `sandbox` | World seed. The same seed always gives the same world. |
| `SANDBOX_FLEET_SIZE` | `35000` | Number of simulated forwarders |
| `SANDBOX_PORT` | `5774` | API port |
| `SANDBOX_DB` | `data/sandbox.db` | SQLite file for saved sessions, action logs and scores (git-ignored) |
| `ANTHROPIC_API_KEY` | unset | Turns on optional Claude grading of interview answers. Nothing else uses the network. |

## Other commands

```bash
npm test            # Vitest, all packages
npm run typecheck   # tsc in every workspace
npm run lint        # ESLint (also blocks child_process, eval, Math.random/Date.now in sim code)
```

## Layout

```
packages/shared   types shared by server and web
packages/sim      the simulated world: seeded RNG, fleet tables, health evolution, queries,
                  host profiles, log generators, virtual filesystem, shell emulator,
                  .conf parser/btool, running config, config → fleet derivation,
                  SPL parser/executor and the indexed-event view (src/spl), scenario and
                  interview engines, license and scheduler models, the journal and save/replay
apps/server       Fastify API, ticks the world in wall-clock time, SQLite session store,
                  optional Claude grading
apps/web          React + Vite UI (Fleet Overview, Terminal, Search & Reporting, Incidents & Tickets,
                  Interview, Monitoring Console, Forwarder Management, Sessions)
scenarios/        validated YAML incidents
docs/             writing-scenarios.md
data/             the SQLite database (created on first run, git-ignored)
```

## How the fleet works (milestone 1)

- The fleet is a set of typed-array columns (site, server class, version, health and so on), not 35,000 objects. Hostnames, IPs, output groups, phone-home times, queue fill and throughput are computed from the row and the seed when they're read.
- Every tick (10 s of sim time), a small random slice of forwarders fails or recovers. The long-run unhealthy rate is about 1.5 %, so the fleet is never perfectly clean.
- Counts by site, server class and health are updated on every transition. Tests check they always equal a full scan, and that every dashboard number equals the matching host-list total.
- A ring buffer keeps 24 h of health transitions, so later milestones can answer "what state was this host in at time T" (for example, gaps in a blocked forwarder's events).
- The clock control in the top bar pauses the sim or runs it at 1×, 5× or 30×. Speed only changes pacing: tick N is identical at any speed.

## Terminal (milestone 2)

Open **Terminal** in the top bar. You start on `bastion01` as `engineer`; `cat README.txt` lists the hosts.

```
ssh splunk@ds01            # deployment server (detailed)
ssh splunk@idx01           # indexer (detailed)
ssh splunk@dal-app-0001    # Linux universal forwarder (detailed)
ssh splunk@ash-web-0012    # any other Linux forwarder or infra node: same layout, thinner
```

The terminal is an emulator in `packages/sim/src/shell`. Every command is parsed and answered from the simulated world. Nothing runs on your machine, and lint plus a test check that no source can spawn processes or evaluate code.

**Login:** only the bastion has keys, and only the `splunk` account accepts them. Root SSH is refused, Windows forwarders refuse port 22, and unknown names fail DNS. `splunk` has passwordless sudo (`sudo -i`, `sudo cmd`). The bastion user does not have sudo.

**Shell:** quotes, `$VAR` (expanded per command, so `$?` works), `~`, globs, `|`, `;`, `&&`, `||`, `>`, `>>`, `<`, `2>`, `2>&1`, aliases, history (↑/↓), tab completion, and Ctrl-C/D/L/U/W/A/E. Command substitution and background jobs are rejected with a bash-style message.

**Commands:** `pwd cd ls cat head tail (-f) less more grep egrep find wc sort uniq cut awk tee echo touch mkdir rm cp mv chmod chown stat vi vim nano ps top df free uptime systemctl ss netstat ping nc ip uname hostname whoami id date env which history export alias type source clear sudo su ssh exit`, plus the `splunk` CLI (see below).

**Filesystem:** each host's tree is generated from the seed and hostname (`/etc`, `/home/splunk`, `/var/log`, and `/opt/splunk` or `/opt/splunkforwarder` with `etc/system/{default,local}`, apps, `deployment-apps` on the DS, `peer-apps` on indexers, and `var/log/splunk`). Your edits are stored as an overlay in the world, so they survive logging out and back in. Permissions apply: for example, `splunk` can't write `/etc/hosts` or read `/etc/shadow`.

**Logs are live and consistent with the fleet.** `splunkd.log`, `metrics.log`, `/var/log/messages`, `/var/log/secure` and the app logs are generated for any time range from the same state the dashboards use:
- a blocked forwarder logs `TcpOutputProc ... blocked_seconds=` and `blocked=true` queues;
- an offline forwarder logs a shutdown, then nothing, and `splunk status`, `systemctl`, `ps` and `ss` all agree it is down;
- a wrong-server-class forwarder logs installing the other class's app, which then appears under `etc/apps`.

`tail -f` prints new lines on every simulation tick. Try it at 30×.

A PowerShell-style shell for Windows forwarders is deferred to when Windows hosts join the detailed roster.

## Config layer (milestone 3)

**Files on disk vs. running config.** Saving a `.conf` file changes the disk immediately, and `btool` sees it straight away, as in real Splunk. What splunkd *runs* is a snapshot taken when it last started. Only these change the running config:

| Action | Re-reads |
|---|---|
| `splunk restart` / `splunk start`, `sudo systemctl restart Splunkd` / `SplunkForwarder` | everything on that host |
| `splunk reload deploy-server` (on `ds01`) | `serverclass.conf` and `etc/deployment-apps` |

**Precedence (global context):** `peer-apps/*/local` (indexers) → `system/local` → `apps/*/local` (ASCII order, so `A` beats `a`) → `peer-apps/*/default` → `apps/*/default` → `system/default`. Every stanza inherits `[default]` settings it doesn't set itself.

**`splunk` CLI:**

| Command | Reads |
|---|---|
| `splunk btool <conf> list [stanza] [--debug] [--app=X]` | disk; `--debug` prefixes each line with its source file |
| `splunk btool check` | disk; flags unknown keys (typos) for inputs, outputs, props, server, serverclass, deploymentclient |
| `splunk start / stop / restart / status / version` | `restart` also runs the conf check and prints any invalid keys |
| `splunk list forward-server` | running outputs, split into active and inactive by real reachability |
| `splunk list monitor` | running `inputs.conf` monitor stanzas, expanded against the filesystem |
| `splunk show deploy-poll` | running `deploymentclient.conf` |
| `splunk reload deploy-server [-class X]` | deployment server only |

**Config drives the fleet** (`packages/sim/src/derive`). The 35,000 forwarders share the deployment server's config instead of each having their own:
- Each forwarder is matched against `ds01`'s running `serverclass.conf`. Patterns are case-insensitive; `.` is a literal dot and `*` is a wildcard. A forwarder whose class loses its inputs app shows as *wrong server class* with no assigned class, and its `etc/apps` loses the app.
- The deployed outputs app decides where each forwarder sends data. A forwarder is *blocked* when none of its servers resolves to a running indexer or heavy forwarder that listens on that port. Listening ports come from the receiver's running `inputs.conf` (`[splunktcp://9997]`).
- `splunk stop` on a forwarder makes it *offline* at once. On an indexer it removes that indexer as a target.
- Changes reach each forwarder at its next check-in, so a reload rolls across the fleet over about a minute of sim time. Rows held in a state by config are excluded from background churn.
- Logs follow the same state. Blocked forwarders log `Unable to resolve host=...` or `Cooked connection to ip=... timed out`. Restarts log shutdown and startup lines. `ds01` logs each reload with the client count per server class, which is the clue for a whitelist typo.

The Fleet Overview, the terminal and the logs all read this one state. For example, stop `idx01` and `idx02` at 30× and the Dallas forwarders turn blocked within a minute.

## Search & Reporting (milestone 4)

Open **Search & Reporting**, or click any hostname in the Fleet Overview. The page has:
- a search bar and time-range presets (default: last 15 minutes of sim time);
- an events view with a timeline histogram, a fields sidebar (top values, click to add to the search) and expandable events;
- Statistics and Visualization tabs (line, column, bar, pie, single value);
- a job inspector showing scan count, run time and per-phase costs.

**Data.** Events are generated on demand by the same log generators the terminal reads, so `tail` on a host and a search for that host return the same lines. Indexes:

| Index | Contents |
|---|---|
| `_internal` | `splunkd.log`, `metrics.log` and `health.log` from every forwarder and infrastructure node (sourcetype `splunkd`, as in real Splunk) |
| `_audit` | `audit.log` (`audittrail`) |
| `os` | `/var/log/messages` (`syslog`) and `/var/log/secure` (`linux_secure`) from Linux forwarders with `Splunk_TA_nix`; `WinEventLog:*` from Windows forwarders |
| `app` | `app:log`, `access_combined` and `mysqld` from the class's monitored file |
| `network` | ASA syslog via the syslog relays (`host` is the firewall, from `host_segment`) |

What gets indexed follows the world:
- Nothing arrives while a forwarder is offline.
- A blocked forwarder delivers nothing until it unblocks, and then its backlog arrives with the original timestamps.
- Removing an inputs app on the deployment server stops that data, while `_internal` carries on.
- `splunk_server` is the indexer the forwarder was connected to at the time.

**SPL subset.** The base search supports terms, `"phrases"`, `field=value` with wildcards, `!= < <= > >=`, `AND`/`OR`/`NOT` (OR binds tighter than AND, as in Splunk), and `earliest=`/`latest=` (relative, snapped, epoch or absolute). `latest` may be up to two days ahead (`latest=+1d`), so events with wrongly extracted future timestamps can be found; `_indextime` holds when each event arrived. Commands:

| Kind | Commands |
|---|---|
| Streaming | `search` `where` `eval` `rex` (named groups, `field=`, `max_match=`) `rename` |
| Ordering and reshaping | `fields` `table` `sort` `head` `tail` `dedup` `fillnull` `lookup` |
| Transforming | `stats` (count dc sum avg min max range median mode stdev var values list first last earliest latest percN, `by`) `timechart` (span, limit, OTHER) `top` `rare` |
| Generating | `inputlookup` `rest` `metadata` `makeresults` |

- `eval`/`where` support arithmetic, `.` concatenation, comparisons, `AND`/`OR`/`NOT`/`XOR`, `LIKE`, and functions such as `if` `case` `coalesce` `len` `lower` `upper` `substr` `replace` `match` `like` `round` `tonumber` `tostring` `strftime` `strptime` `relative_time` `now` `split` `mvcount` `mvindex` `mvjoin` `cidrmatch` `isnull` `isnotnull`.
- Unsupported commands, subsearches and `tstats` return Splunk-style errors (`tstats` is planned).
- Lookups: `forwarder_inventory` (built live from the fleet, so it agrees with the dashboard), `site_contacts` and `indexer_inventory`.
- `rest` endpoints: `server/info`, `search/distributed/peers`, `cluster/manager/peers`, `data/indexes` and `deployment/server/clients`.
- `metadata type=hosts|sources|sourcetypes`: `lastTime` is exact; `totalCount` is an estimate from the recent event rate.

**Scale.** A full fleet-wide raw scan is too much to generate, so the scan uses pushdown. If a search still exceeds the budget (3M events or 8 s), it stops with Splunk's "results may be incomplete" warning.
- **Indexed-field filtering:** `index`, `sourcetype`, `source` and `host` constraints skip hosts and sources before any events are generated.
- **Gates:** words such as `blocked`, `WARN` or `HttpPubSubConnection` only appear while a host is in certain states. Hosts that were never in those states during the time range are skipped. Tests check that this never changes results.

Typical full-scale times (35,000 forwarders, 15 minutes): fleet-wide `blocked=true` about 0.6 s, `log_level=WARN | stats count by component` about 1 s, `| metadata type=hosts index=_internal` about 2.5 s.

## Incidents & Tickets (milestone 5)

Open **Incidents & Tickets** and start an incident. Investigate with the fleet, search and terminal views, fix the cause, apply the right restart or reload, and close the ticket with a resolution note.

**Nothing starts on its own.** Every incident is manual by default. A scenario file can opt in to a scheduled start with `trigger: { afterMinutes: N }`.

**Limits:**
- At most two tickets can be active at once.
- Two scenarios that edit the same config file can't overlap.
- Each incident can start once per world. A reset (see Sessions) makes them all available again.
- Tickets and changes belong to the current world. Save it on the Sessions page to keep it (the server also autosaves).

**What you see is the symptom, not the cause.**
- Cards and tickets show the requester's view ("Dallas web access logs went quiet") and the difficulty only.
- Each scenario's `summary` holds the root cause for authors and the future debrief. The API never returns it, nor the changes or fix checks.

### Scenario files

`scenarios/*.yaml` are read at server startup and checked with Zod. Writing a new incident means writing one file:

| Field | Purpose |
|---|---|
| `title`, `ticket` | The symptom: what the requester reports |
| `summary` | The root cause (hidden from the UI) |
| `changes` | Stanza edits (`set`, `unset`) through the virtual filesystem, applied with `restart`, `deploy-server` (reload) or `none` (disk only, such as the manager's copy of the cluster bundle). Several changes may edit one file; each host restarts or reloads once. A `file` change sets the mode and owner of an existing file instead. |
| `redHerrings` | Real log lines written to a host's `splunkd.log` or `/var/log/messages` every N minutes until the ticket closes. They are greppable and searchable like any other line. A forwarder with injected lines skips search gating, so search results stay exact. |
| `fixChecks` | Outcomes, combinable with `all` / `any` |
| `clues` | Notes for authors and hints |
| `recovery` | Seconds the fix must hold before the ticket counts as resolved |

**Fix checks test outcomes, so any correct fix passes:**
- `fleet`: at most N% of a site or server class is in a given health state.
- `parsingQueue`: whether an indexer's parsing queue is blocked.
- `eventBreaking`: whether an indexer's running props keep consecutive events of a sourcetype separate.
- `license`: projected daily license usage at most N% of the quota.
- `timestamps`: every running indexer stamps a fresh event of a sourcetype within N seconds of when it was written.
- `forwarderDelivering`: a forwarder is neither blocked nor offline.
- `collecting`: a forwarder is reading a given file.
- `scheduler`: at most N skipped runs on a search head over the next M minutes, under its running config.
- `effectiveConf`: one exact running setting, for incidents where that really is the point.

All checks read running state, so saving a file alone never resolves a ticket.

**Ticket states:** open → recovering → resolved → closed. If the problem comes back before the ticket is closed, it reopens and the recovery timer resets.

### The incidents (spoilers)

| Ticket | Cause | One correct fix |
|---|---|---|
| Dallas web access logs went quiet | `serverClass:linux_web` whitelist typo `dal-wbe-*` on ds01 | Fix the whitelist (`dal-web-*` or any pattern matching the Dallas web servers), then `splunk reload deploy-server` |
| Dallas forwarders are backing up | idx01 `[queue=parsingQueue] maxSize = 1KB` in system/local/server.conf | Give the queue an adequate size (for example the 6MB default or more), then restart idx01 |
| Application search results look jumbled | idx01 cluster props for `app:log` set to `SHOULD_LINEMERGE = true` with a `LINE_BREAKER` that never matches | Turn line merging off or restore a working `LINE_BREAKER`, then restart idx01 |
| License usage is heading for a violation | A `[monitor:///var/log/app/debug.log]` stanza added to `org_linux_app_inputs/local` on ds01; every linux_app forwarder ships DEBUG dumps | Disable or remove the stanza and `splunk reload deploy-server`, or send `app:debug` to `nullQueue` in the cluster bundle |
| Application events are showing up in the future | Cluster bundle props for `app:log`: `TIME_FORMAT` stops before the trailing `Z` and `TZ = America/New_York`, so events land four hours ahead | On cm01, remove `TZ` or add `%z` to the format in manager-apps, then `splunk apply cluster-bundle` |
| An Ashburn app server stopped sending data | ash-app-0001 has a local `outputs.conf` pointing `ash_indexers` at retired idx07 | Remove the override (or point it at live indexers), then restart the forwarder |
| MySQL logs from a Dallas database server are missing | `/var/log/mysql/mysqld.log` on dal-db-0001 is `mysql:mysql 0600`; the splunk user can't read it | `chmod 644`, or `chgrp splunk` plus `chmod 640` (no restart needed) |
| Security alerts are arriving late or not at all | Twelve new hourly `-24h` searches on sh01 share `cron_schedule = 0 * * * *` and exceed the scheduler limit (9) | Stagger the crons, add `schedule_window`, shorten the ranges or raise the limit, then restart sh01 |

Each has a solution-run test, including alternative fixes: the first three in `packages/sim/test/scenario.test.ts`, the rest in `packages/sim/test/incidents.test.ts`. At 30×, recovery takes a few wall-clock seconds. Events indexed before a parsing fix stay merged, so check new data. The original application files always keep their individual lines.

**Simulation limits:**
- Line merging models an unmatched breaker in fixed two-minute windows on the receiving indexer. It isn't a full implementation of Splunk parsing.
- Queues below 512KB saturate under the simulated steady load. Backpressure blocks the whole upstream output group, even when another receiver is reachable.
- Timestamp extraction supports common `strptime` codes (`%Y %m %d %H %M %S %3N %z %Z %b %p %s` and more) and a fixed table of time zones with their late-October 2026 offsets. When the format doesn't match, the event keeps its write time; Splunk would guess from nearby events.
- License usage uses each server class's mean throughput, not a sum over individual events.
- The scheduler runs each search for a fixed time based on its range. Only the instance-wide concurrency limit can cause a skip.
- File permissions are checked against the splunk user and group only. ACLs and supplementary groups are not modelled.
- Monitoring Console alerting (email or webhook actions) isn't simulated.

## Monitoring Console and Forwarder Management (milestone 6)

**Monitoring Console** has four views:
- **Indexing performance:** parsing queue fill and indexing rate per indexer.
- **Forwarders:** which forwarders are sending, blocked or missing, by site.
- **License usage:** usage today, projected daily total and volume by sourcetype.
- **Scheduler activity:** runs and skips per search head, with reasons.

Each panel runs an SPL search on the server over the same data as Search & Reporting, and **Open in Search** opens that search. Two kinds of panel read world state directly, as Splunk's own console reads REST:
- the forwarder tables, because a fleet-wide `| metadata` search takes several seconds at 35,000 hosts;
- the projected license table.

**Forwarder Management** is read-only. It shows ds01's clients, server classes and deployment apps as the deployment server is running them:
- An edit to `serverclass.conf` appears only after `splunk reload deploy-server`.
- An app whose files changed on disk shows **reload pending**.
- Client records also back `| rest /services/deployment/server/clients`.

**Indexer cluster bundle.** On cm01:
- `splunk apply cluster-bundle` (confirm `y`, or pass `--answer-yes`) copies `etc/manager-apps` to every live peer's `etc/peer-apps` and restarts those peers.
- `splunk show cluster-bundle-status` compares each peer's active bundle checksum with the manager's.
- idx07 is a decommissioned indexer. Its OS and service account remain, but Splunk is uninstalled.

## Interview mode (milestone 7)

Open **Interview**. Pick a topic and difficulty, choose a specific incident, or let the app pick one you haven't seen. You can also change the time limit. Then:
1. A prompt appears, phrased the way an interviewer would ask it, and a **wall-clock** timer starts. A strip under the menu keeps the prompt and the time left visible on every page. The sandbox keeps running on sim time.
2. Investigate anywhere in the sandbox. Use the notes box to think out loud. **Hints** cost points.
3. Fix the incident and submit your root cause, fix, verification and prevention. Submitting ends the incident whether or not it is fixed.
4. Read the score and debrief.

**Action log.** Every command (with its host and user), every search (with its time range) and every page you open is recorded with sim time and wall time. `ssh host command` is attributed to the target host. Interview mode allows one incident at a time, so close any open sandbox tickets first.

**Rubric (100 points).** The grader is deterministic and runs offline:

| Dimension | Points | How it's measured |
|---|---|---|
| Triage | 15 | Met a milestone of the expected path before the first change (edit, restart, reload, chmod, rm…) |
| Evidence | 20 | Share of the expected-path milestones met, in any order |
| Root cause | 20 | Concepts named in the written root cause and fix (each concept has alternative phrasings) |
| Fix | 20 | The incident's fix checks pass at submission (100 once the recovery period held, 85 while still recovering) |
| Verification | 10 | A matching search or command after the fix took effect (30 for only describing one) |
| Safety | 10 | Minus 50 per risky move: generic ones (`splunk clean`, deleting index data or config directories, `kill -9`) plus the incident's own (for example restarting unrelated indexers) |
| Communication | 5 | All four parts answered, 30–300 words, names the hosts, components or files involved |

Hint costs are subtracted from the total.

**Debrief:**
- the score per dimension, with reasons;
- a timeline of what you did, marking the milestones met, the change that fixed it, verification and risky moves;
- the checks you missed;
- the model answer next to yours;
- a 60-second spoken answer.

**Optional Claude grading.** Off by default. If the server starts with `ANTHROPIC_API_KEY` set, the written answer is also sent to Claude (`claude-opus-5-5`, with Anthropic's default refusal fallback). Claude scores root cause and communication against the model answer and gives short feedback. The debrief shows that next to the offline score, which stays the total. If the call fails, the debrief says why and the offline score stands. Nothing else uses the network.

**Scenario files** add an `interview` block:
- `prompt` and `timeLimitMinutes`;
- `expectedPath`: milestones, each met by any one `cmd`, `search` or `page` matcher (case-insensitive regexes, optionally limited by `host` or `role`);
- `verification` and `unsafe` matchers;
- `rootCause` concepts;
- `hints` with point costs;
- `modelAnswer` and `spokenAnswer`.

All eight incidents have one. Grading tests are in `packages/sim/test/interview.test.ts`, including a perfect-score run that fixes the incident with the simulated `vi`.

**Limits:**
- Each incident can be used once per world. After a reset, "Surprise me" prefers incidents you haven't submitted in any saved session.
- Root-cause and communication scoring offline is keyword and heuristic matching. It can miss an unusual but correct phrasing; the Claude assessment is there for that.

## Sessions: save, load and reset (milestone 8)

Open **Sessions** (top right) to save the current world, load a saved one, or start over with any seed and fleet size.

**How saving works.** Every change you make is journaled with the tick it happened on:
- file edits and permission changes;
- splunkd stops, starts, restarts and reloads (a cluster-bundle push records its file copies and restarts);
- SSH logins;
- incidents, tickets and interview steps;
- the action log, including the Claude assessment.

Searches and page views change nothing except the action log. Ticks are not journaled, because they are deterministic for a seed.

A save is the seed, the fleet size, the tick and that journal. **Loading builds a fresh world from the seed and replays the journal tick by tick**, so it comes back exactly as it was, then carries on the same way. `packages/sim/test/save.test.ts` checks this. It builds a busy world, saves it, loads it, and compares:
- fleet health and file overlays;
- running config and services;
- tickets, interviews and the action log;
- license usage and search results;
- the same again after 20 more ticks.

**Storage.** SQLite (`better-sqlite3`, file in `SANDBOX_DB`):
- `sessions` holds each save's journal, which is the source of truth;
- `actions` and `interviews` are queryable copies of the action log and scores;
- interview history and scores survive resets and restarts.

The server **autosaves** to a single slot every minute when something changed, and again when it stops.

**Loading** replays about one sim hour per second at full size (35,000 forwarders), so a day-long session takes roughly 25 seconds. The server is busy while it replays.

**What load and reset replace:** open terminals close (reconnect for a new shell), and search jobs and console caches are cleared.

**Writing new incidents.** See [`docs/writing-scenarios.md`](docs/writing-scenarios.md): a walkthrough of a scenario file, every change and check type, the interview block, and how to write the solution-run test.

## API

### Fleet (milestone 1)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/world` | seed, clock, sites, server classes, infra nodes |
| POST | `/api/world/clock` | `{ "paused"?: boolean, "speed"?: 1 \| 5 \| 30 }` |
| GET | `/api/fleet/summary` | counts by health, site and class; filters: `site`, `serverClass`, `health`, `os`, `q` |
| GET | `/api/fleet/hosts` | same filters plus `offset`, `limit` (≤500), `sort` (`hostname`\|`lastPhoneHome`\|`health`\|`site`), `dir` |

### Terminal (milestone 2)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/hosts/roster` | SSH-able infrastructure hosts and the detailed forwarder |
| WS | `/ws/term?cols=&rows=` | client sends `{type:"input",data}` / `{type:"resize",cols,rows}`; server sends `{type:"output",data}` and `{type:"location",host,user}`. Only local origins are accepted, with at most 8 sessions. |

### Search (milestone 4)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/search/jobs` | `{ search, earliest?, latest? }`; runs synchronously and returns the job summary plus the first page of events and results |
| GET | `/api/search/jobs/:sid/events` | `offset`, `count` (≤500) |
| GET | `/api/search/jobs/:sid/results` | `offset`, `count` (≤500); the last 20 jobs are kept |

### Incidents (milestone 5)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/scenarios` | Public catalog: id, symptom title, topics, difficulty (no cause, changes or fix checks) |
| POST | `/api/scenarios/:id/start` | Apply an incident and open a ticket |
| GET | `/api/tickets` | Tickets and current recovery status |
| POST | `/api/tickets/:id/close` | `{ "note": "Root cause, fix, verification" }`; requires resolved state |

### Monitoring Console and Forwarder Management (milestone 6)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/mc/:view` | `indexing`, `forwarders`, `license` or `scheduler`: stats plus panels (SPL, columns, rows); cached per tick |
| GET | `/api/ds/overview` | Server classes (patterns, apps, client counts), deployment apps, unmatched clients |
| GET | `/api/ds/clients` | `offset`, `limit` (≤500), `q`, `serverClass`, `unmatched` |

### Interview (milestone 7)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/interview/catalog` | Topics, interview incidents (symptom title, difficulty, seen) and whether Claude grading is on |
| POST | `/api/interviews` | `{ scenarioId?, topic?, difficulty?, timeLimitMinutes? }` (5–120); starts the incident and the timer |
| GET | `/api/interviews/current` | The running interview, or `null` |
| GET | `/api/interviews` | All interviews, newest first, with debriefs once submitted |
| POST | `/api/interviews/:id/hint` | Reveal the next hint (costs points) |
| PUT | `/api/interviews/:id/notes` | `{ notes }` (≤20,000 characters) |
| POST | `/api/interviews/:id/submit` | `{ answer: { rootCause, fix, verification, prevention } }`; returns the debrief |
| POST | `/api/actions/page` | `{ page }`: records a page view in the action log (the web app sends these) |

### Sessions (milestone 8)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/sessions` | Saved sessions, interview history across them, the current world's change count, and whether saving is available |
| POST | `/api/sessions` | `{ name }`: save the current world |
| POST | `/api/sessions/:id/load` | Replace the current world with a saved one (replays its journal) |
| DELETE | `/api/sessions/:id` | Delete a saved session |
| POST | `/api/world/reset` | `{ seed?, fleetSize? }` (1,000–50,000): replace the current world with a fresh one |
