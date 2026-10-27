# Splunk Engineer Sandbox — Build Spec

Oct 23, 2026 · @Austo

## Overview

Build a browser-based Splunk engineer sandbox where the scale is faked but the work feels real. It looks like a 35,000-forwarder enterprise, but only the machines you touch are emulated in detail.

**Core principle:** simulate the fleet statistically, emulate a host only when the user drills into it. A dashboard can claim 35,000 forwarders without 35,000 objects living in memory.

Two modes, same engine:

- **Sandbox (primary):** free roam. Incidents arrive as tickets, alerts and user complaints. Investigate, SSH in, fix, and verify at your own pace.
- **Interview prep (secondary):** a layer over the sandbox. It hands you a scenario, runs a timer, tracks what you check, and grades your diagnosis.

**Out of scope:** real Splunk binaries, real SSH, real networking. Everything is simulated in the app. No actual Splunk licence or infrastructure is needed.

## Architecture

The browser holds three views of one simulated world. The backend owns all state: it generates the fleet, emulates only the hosts you open, answers searches, and runs incidents. Nothing runs on real infrastructure.

*(Diagram in original: architecture · browser, backend, world state)*

### Simulated fleet

The fleet is a table of records, not 35,000 running processes. Generate it once from a seed, then evolve it on a simulation tick.

- **Forwarder record:** hostname, OS, forwarder version, site, server class, deployment-client status, last phone-home time, output group, queue fill, and throughput. Total count is configurable (default 35,000), spread across a few sites and server classes such as Windows servers, Linux app tiers and syslog relays.
- **Health states:** healthy, stale phone-home, blocked queue, offline, version drift, wrong server class. Keep a small background rate of unhealthy forwarders at all times so the fleet is never perfectly clean.
- **Evolution:** on each tick, a small random slice of forwarders changes state. Scenarios inject larger, correlated changes (for example, every forwarder in one site going stale).
- **Single source of truth:** fleet views, SPL results and the monitoring console are all computed from the same generated tables. If a dashboard shows 412 forwarders offline, a search for them returns 412 hosts.
- **Infrastructure tier:** model these as named nodes with their own state, not as part of the 35,000: indexers, search heads, a deployment server, a cluster manager, a license manager and a few heavy forwarders.
- **Hot hosts:** a forwarder or infrastructure node becomes fully emulated only when the user SSHs into it. Generate its files and logs deterministically from the seed plus its hostname, so it looks identical every time you return.

### Drill-in hosts and the terminal

**Safety rule first:** the terminal is an emulator written in the backend. It never spawns a real shell or runs a user's command on the real machine. Every command is parsed and answered from simulated state.

- **Roster:** about a dozen hosts you can SSH into, covering a few universal forwarders (Windows and Linux), a heavy forwarder, the deployment server, two indexers, a search head, the cluster manager and the license manager. Any other host in the fleet accepts a login but gives a thin, generic environment.
- **Login flow:** start on a bastion prompt, then `ssh user@host`. Show a realistic banner, last-login line and `splunk` user versus `root` with `sudo`.
- **Shell commands to support:**
  - Navigation and files: `pwd`, `cd`, `ls -la`, `cat`, `head`, `tail` (including `tail -f` with live-updating logs), `less`, `grep`, `find`, `wc`, `sort`, `uniq`, `awk` (basic), pipes, `vi`/`nano` (simple editor)
  - System: `ps`, `df -h`, `free`, `top` (static snapshot), `systemctl status`, `netstat`/`ss`, `ping`, `nc`, `history`
  - Splunk CLI: `splunk status`, `splunk restart`, `splunk btool <conf> list --debug`, `splunk list forward-server`, `splunk show deploy-poll`, `splunk list monitor`, `splunk reload deploy-server`, `splunk cmd`
  - An unsupported command returns a plausible "command not found" or permission error rather than breaking immersion.
- **Virtual filesystem:** a tree under `/opt/splunk` or `/opt/splunkforwarder` with `etc/system/local`, `etc/apps`, `etc/deployment-apps` (deployment server) and `var/log/splunk` holding `splunkd.log`, `metrics.log` and friends. Files are generated from templates plus the host's seeded state.
- **Edits have consequences:** changing a `.conf` file changes simulated state, but takes effect only after the right reload or restart, exactly as in real Splunk. `btool` must show the same merged result a real one would, including the precedence order and file path.

### Splunk-style web UI

The UI should look and behave like Splunk Web closely enough that muscle memory transfers. It does not need to copy Splunk's branding or code.

- **Search and Reporting:** search bar, time range picker, event list with a fields sidebar, Statistics tab and Visualization tab, plus a job inspector showing scan count and run time.
- **SPL subset:** build a real parser and executor over the generated data. Start with `index=`, `sourcetype=`, `host=`, `earliest`/`latest`, `stats`, `timechart`, `table`, `fields`, `eval`, `where`, `rex`, `sort`, `head`, `dedup`, `top`, `rare`, `lookup`, `inputlookup`, `rest` and `metadata`. Add `tstats` later. Unsupported commands return a Splunk-style error.
- **Data:** `_internal` (including `splunkd` and `metrics` sourcetypes), `_audit`, and a few business indexes such as `os`, `network` and `app`. Event volume and timing must match the fleet state, so a blocked forwarder produces a gap in its events.
- **Dashboards:** a Fleet Overview plus Monitoring Console-style views for indexing performance, forwarder status, license usage and skipped searches.
- **Settings pages:** Forwarder Management (clients, server classes, apps), Data Inputs, Indexes, Licensing, and a minimal Users and Roles page.
- **Alerts and saved searches:** a handful of scheduled searches that fire during incidents and open tickets, so problems arrive the way they do at work.

## Scenario engine

A scenario is a data file that mutates the simulated world, then watches whether the user restores it. Adding a new incident should mean writing one file, not changing engine code.

Each scenario defines:

- **Trigger:** when it starts, and the ticket or alert that announces it
- **World changes:** edits to configs, log content, fleet states and metrics
- **Clues:** where the evidence lives (`splunkd.log`, `metrics.log`, `btool` output, a dashboard)
- **Red herrings:** plausible but unrelated noise
- **Fix checks:** state conditions that mean the problem is solved, such as the right setting applied and the service reloaded
- **Recovery curve:** how long the fleet takes to heal after a fix

**Consistency rule:** every symptom the user can see must come from the same underlying state. If a config is broken, the logs, the dashboard and the search results all reflect it.

### Starter incident library

| Incident | Where it surfaces | Root cause | Fix |
|---|---|---|---|
| Forwarders stop phoning home | Forwarder Management client count drops | Typo in server class whitelist on the deployment server | Correct `serverclass.conf`, reload deploy-server |
| Events merged or split wrongly | Search results show multi-line junk | Missing line-breaking settings in `props.conf` | Fix `props.conf` on the parsing tier, restart |
| Blocked queues | Indexing latency alert, forwarders reporting blocked | Parsing queue saturated on one indexer | Trace in `metrics.log`, resolve the cause |
| License warning | License usage spike | One noisy source sending far too much data | Find the top sourcetype, filter or route it |
| Wrong timestamps | Events dated in the future or past | Bad `TIME_FORMAT` or `TIME_PREFIX` | Fix timestamp settings |
| Forwarder cannot send | Host missing from searches | `outputs.conf` points at a retired indexer | Update the output group, restart |
| Input not collecting | A log source goes silent | Monitored path wrong or file unreadable by the splunk user | Fix `inputs.conf` or permissions |
| Skipped scheduled searches | Monitoring Console skipped-search panel | Too many searches scheduled at the same minute | Stagger schedules |

**Tickets:** each incident opens a ticket with a requester persona, urgency and a clock. Closing a ticket requires the user to write a short resolution note, which the interview mode also uses.

## Interview prep mode

This mode reuses the sandbox and adds structure: a prompt, a clock, a record of everything you do, and a score.

Flow:

1. Pick a topic and difficulty, or let the app choose from incidents you have not seen.
2. A prompt appears the way an interviewer would phrase it, for example "Forwarders at one site went quiet an hour ago. Walk me through it."
3. A timer starts (configurable). A notes box lets you think out loud.
4. Investigate in the sandbox. Hints are available but cost points.
5. Submit your root cause, fix, verification and prevention in your own words.
6. Receive the score and debrief.

**Action log:** record every command, search and page visited, with timestamps. The grader compares this with the scenario's expected investigation path.

### Grading rubric

| Dimension | What is measured |
|---|---|
| Triage | Scoped the problem before changing anything |
| Evidence | Checked the right sources (`_internal`, `btool`, logs, fleet views) |
| Root cause | Named the actual cause, not a symptom |
| Fix | Correct and minimal change, applied in the right place |
| Verification | Confirmed recovery with data, not assumption |
| Safety | Avoided risky moves such as needless indexer restarts or deleting data |
| Communication | Clear, concise summary a stakeholder could act on |

**Debrief:** a replay timeline of what you did, what you missed, the model solution, and a 60-second spoken answer you could give in a real interview.

**Optional:** free-text answers can be graded by calling the Claude API. Decide early whether to depend on that, since it adds an API key and ongoing cost. The sandbox itself must work fully offline.

## Stack, milestones and first prompt

Suggested stack (change freely): TypeScript end to end so the shell, SPL parser and UI share types.

| Layer | Choice |
|---|---|
| Frontend | React, Vite, xterm.js, a charting library such as ECharts |
| Backend | Node with Fastify and WebSocket |
| Randomness | Seeded PRNG so every world is reproducible |
| Persistence | SQLite for sessions, action logs and scores |
| Tests | Vitest, including scripted "solution runs" that must resolve each scenario |
| Run | Local only, bound to localhost, started with one command |

Rules to put in the project's CLAUDE.md:

- Never execute user-entered commands on the real machine.
- Fleet, logs, dashboards and searches derive from one world state.
- The same seed always produces the same world.
- New scenarios are data files, not engine changes.

Milestones, in build order:

1. Monorepo skeleton, seeded fleet generator, Fleet Overview page.
2. WebSocket terminal, shell emulator, virtual filesystem, three SSH-able hosts.
3. Config layer and Splunk CLI (`btool`, restart and reload effects).
4. Search UI with an SPL subset over `_internal` and the fleet.
5. Scenario engine, ticket panel and the first three incidents.
6. Remaining incidents, Monitoring Console views, Forwarder Management.
7. Interview mode: timer, action log, grader, debrief.
8. Reset and save, plus a short guide for writing new scenarios.

### First prompt for Claude Code

> I want to build a web-based Splunk engineer sandbox. The full spec is in SPEC.md in this repo. Read it completely before doing anything.
>
> First, do not write code. Produce a plan covering architecture, data models for the fleet, hosts, world state and scenarios, and the folder layout. Flag any questions or risks you see in the spec. Also create a CLAUDE.md capturing the project rules from the spec.
>
> After I approve the plan, build milestone 1 only. Include tests, a one-command dev start, and a short README. Stop after each milestone so I can review it before you continue.

Save this doc's text as SPEC.md in the new project folder before starting. Two open questions to settle with Claude Code during planning: whether grading may call the Claude API, and whether the app ever needs to run anywhere other than your own machine.

## Decisions (settled during planning, 2026-10-23)

- **Claude API grading:** optional and off by default. Rubric and action-log grading run offline; free-text grading via Claude only when an API key is configured.
- **Hosting:** localhost only. Bound to 127.0.0.1, single user, no auth.
