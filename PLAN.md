# Splunk Engineer Sandbox — Plan

Status: **all milestones implemented** (2026-10-23). Milestones 1–8 are implemented; the architecture below records the original design. See README.md for current behavior and simulation limits. The spec is in `SPEC.md`; project rules are in `CLAUDE.md`.

Decisions already made: localhost only, single user, no auth. Claude API grading is optional and off by default.

---

## 1. Architecture

```
┌──────────────────────── Browser (React + Vite) ───────────────────────┐
│  Splunk-style Web UI        Terminal (xterm.js)       Tickets / Interview│
│  search · dashboards ·      one WS channel per         timer · notes ·   │
│  settings · fleet           SSH session                 debrief          │
└──────────────┬───────────────────────┬───────────────────────┬─────────┘
               │ REST (JSON)           │ WebSocket              │ REST + WS push
┌──────────────▼───────────────────────▼───────────────────────▼─────────┐
│ apps/server  (Fastify, binds 127.0.0.1)                                  │
│   routes: /api/fleet, /api/search, /api/settings, /api/tickets,          │
│           /api/interview, /ws/term, /ws/events                           │
│   ActionLogger (every command / search / page view → SQLite)             │
└──────────────┬───────────────────────────────────────────────────────────┘
               │ in-process calls only (pure functions over World)
┌──────────────▼───────────────────────────────────────────────────────────┐
│ packages/sim     ── the world ──                                          │
│   rng · clock · fleet (columnar) · infra nodes · config store (btool)     │
│   derivation (config → fleet health) · event generator · VFS · shell      │
│   SPL parser/executor · scenario engine · grader                         │
└──────────────────────────────────────────────────────────────────────────┘
```

Key idea: **everything visible is a function of `World`**. The server holds one `World` in memory, advances it on a timer, and every API, shell command and search reads from it. Nothing is cached separately per view.

### Time model

- The world has its own **sim clock** (`world.now`, epoch ms). The server advances it by a fixed tick (default 10 s of sim time every 10 s of real time, so 1×). A speed multiplier (1×, 5×, 30×) and a pause are available from the UI. Recovery curves and interview timers can then run fast in tests.
- Tick `n` evolves the fleet using `rng.fork("tick", n)`, so evolution depends only on the seed and the tick number, not on wall-clock timing.
- User mutations (config edits, restarts, reloads) are stamped with the sim time and tick they happened at.

### Determinism and save/load (event sourcing)

`World = replay(seed, config, mutationLog)`. A save file is the seed, the world config and the ordered list of mutations (`{tick, kind, payload}`). Load replays it. This makes "the same seed gives the same world" testable, and gives reset and save (milestone 8) almost for free. Periodic in-memory snapshots keep replay fast.

---

## 2. Data models (TypeScript sketches)

### 2.1 Fleet: columnar, 35,000 rows

```ts
// packages/sim/src/fleet/types.ts
type HealthState = 'healthy' | 'stale_phonehome' | 'blocked_queue'
                 | 'offline' | 'version_drift' | 'wrong_serverclass';

interface FleetTables {
  size: number;
  // dictionary-encoded string columns (index into a small string table)
  site: Uint8Array;           // → sites[]
  os: Uint8Array;             // → oses[]   (windows | linux)
  serverClass: Uint8Array;    // → serverClasses[] (the one it SHOULD be in)
  version: Uint8Array;        // → versions[]
  outputGroup: Uint8Array;    // → outputGroups[]
  // numeric columns
  health: Uint8Array;         // HealthState enum
  lastPhoneHome: Float64Array;// sim epoch ms
  queueFill: Float32Array;    // 0..1
  throughputKBps: Float32Array;
  // hostnames are derived, not stored: hostname(i) = `${sitePrefix}-${osTag}-${role}${pad(i)}`
}
```

Hostnames, IPs and other identity data come from the row index plus the seed, so they never need storing. A `ForwarderRecord` object is built only for the rows a view or search actually returns.

**Health history.** A ring buffer of transitions (`{tick, row, from, to}`) covering the retention window (24 h sim time by default). The event generator uses it to know a host's state at any past time. This is what creates the gap in a blocked forwarder's events.

**Aggregates.** Counts by `(site, serverClass, os, health)` are kept up to date incrementally on every transition. Dashboards read these, and tests check they always equal a full scan.

### 2.2 Infrastructure nodes

```ts
type InfraRole = 'indexer' | 'search_head' | 'deployment_server' | 'cluster_manager'
               | 'license_manager' | 'heavy_forwarder';

interface InfraNode {
  hostname: string; role: InfraRole; site: string; ip: string;
  status: 'up' | 'down' | 'restarting';
  queues?: { parsing: number; aggregation: number; typing: number; indexing: number }; // fill 0..1
  licenseUsageGB?: number;          // license manager
  retired?: boolean;                // e.g. the indexer outputs.conf still points at
}
```

There are about 15 infra nodes: 6 indexers across 2 sites, 3 search heads, plus the DS, CM, LM and 3 HFs. These are ordinary objects.

### 2.3 Hosts, the config store and btool

Every host, whether hot or thin, has a **config view**:

```ts
interface ConfFile {             // one .conf file on one host
  path: string;                  // /opt/splunk/etc/apps/foo/local/props.conf
  layer: { scope: 'system' | 'app'; app?: string; kind: 'default' | 'local' };
  stanzas: Stanza[];             // parsed, with line numbers kept for btool --debug
  raw: string;                   // source of truth for edits (vi/nano write this)
}

interface HostConfig {
  files: Map<string, ConfFile>;          // on-disk state (edits land here immediately)
  effective: Map<ConfName, MergedConf>;  // snapshot taken at last restart/reload
  pendingRestart: boolean;
}
```

- `btool` merges `files` using real precedence (global context: system/local → app/local (ASCII order) → app/default → system/default). With `--debug` it prints the winning file path per line.
- `effective` is recomputed only on `splunk restart`, or on the matching reload (`reload deploy-server` for `serverclass.conf`, and so on). **All simulation behaviour reads `effective`, never `files`.** This is how the "edits only count after reload/restart" rule works.
- Base files come from templates in `packages/sim/templates/` (per role), rendered with seeded values. Generated files are not stored. Only user edits are stored, as an overlay of `{path → raw}` (part of the mutation log).

### 2.4 Derivation: config → fleet health

This is what links an edit on one machine to the dashboard numbers. A set of pure **derivation rules** runs each tick:

| Rule | Reads | Affects |
|---|---|---|
| `deploymentClientMatch` | DS effective `serverclass.conf` whitelists/blacklists | Which rows are `wrong_serverclass` / `stale_phonehome` (vectorised match over hostnames) |
| `outputReachability` | each output group's servers vs infra node status/retired | `offline` / `blocked_queue` for rows in that group |
| `indexerBackpressure` | indexer queue fills | `blocked_queue` probability for rows routed there |
| `licenseUsage` | per-sourcetype volume × filters in effective props/transforms | LM usage, license warnings |

A scenario does not set "1,200 hosts stale" directly. It breaks a config, and the derivation produces the symptom. Fixing the config and reloading heals it, following the scenario's recovery curve. Scenarios can also apply direct overrides (`fleet.setHealth where site=X`) for incidents with no config cause, but config-driven causes are preferred.

### 2.5 Events (logs and search data)

Events are **never stored in bulk**. One generator produces them on demand:

```ts
generateEvents(world, { index, sourcetype?, hosts?: HostFilter, earliest, latest }): AsyncIterable<SplunkEvent>
```

- Each (host, sourcetype, time bucket) uses `rng.fork(host, sourcetype, bucket)`, so asking twice gives identical events.
- The generator checks the host's state at that time (health history, effective config). A blocked host emits nothing. A host with broken `LINE_BREAKER` emits merged events. Bad `TIME_FORMAT` shifts `_time`.
- **The same generator feeds `tail /opt/splunk/var/log/splunk/splunkd.log` in the shell and `index=_internal sourcetype=splunkd host=X` in search.** That keeps the shell and search consistent.
- Scenario-injected log lines (clues, red herrings) are stored explicitly and merged in.

### 2.6 World

```ts
interface World {
  seed: string; config: WorldConfig;     // fleet size, sites, server classes, tick length
  clock: { now: number; tick: number; speed: number; paused: boolean };
  rng: Rng;
  fleet: FleetTables; health: HealthHistory; aggregates: FleetAggregates;
  infra: Map<string, InfraNode>;
  hosts: Map<string, HostConfig>;        // lazily created on first touch, hot or thin
  injectedEvents: InjectedEvent[];
  scenarios: ActiveScenario[];
  tickets: Ticket[];
  mutationLog: Mutation[];
}
```

### 2.7 Scenarios: one YAML file each

YAML, validated by a zod schema at load time (a bad scenario fails fast with a clear message). Fix checks use a small declarative predicate language, not code, so scenarios stay data:

```yaml
id: ds-serverclass-typo
title: Forwarders stop phoning home
topics: [deployment-server, forwarder-management]
difficulty: medium
trigger:
  at: { afterMinutes: 5 }            # or { onDemand: true } for interview mode
  ticket:
    requester: { name: "Priya (Windows Platform)", persona: impatient }
    urgency: high
    text: "Half of our Windows servers in DAL stopped showing in Forwarder Management."
  alert: { savedSearch: "DS client count drop" }
changes:
  - config.edit:
      host: ds01
      path: /opt/splunk/etc/system/local/serverclass.conf
      stanza: "serverClass:win_servers"
      set: { whitelist.0: "dal-wn-*" }          # was "dal-win-*"
      applied: true                              # already reloaded → effective now
clues:
  - { where: "ds01:splunkd.log", text: "DeploymentServer - ... 0 clients matched serverClass=win_servers" }
  - { where: "dashboard:forwarder-management", note: "client count drops" }
redHerrings:
  - { inject: { host: idx03, sourcetype: splunkd, level: WARN, text: "TcpInputProc - Stopping ... connection reset" } }
fixChecks:
  all:
    - effectiveConf: { host: ds01, conf: serverclass, stanza: "serverClass:win_servers", key: whitelist.0, matches: "^dal-win-\\*$" }
recovery: { curve: linear, minutes: 10 }        # phone-homes return over 10 sim minutes
interview:
  prompt: "Forwarders at one site went quiet an hour ago. Walk me through it."
  expectedPath:                                  # evidence milestones, not a strict sequence
    - { id: scope,   any: [ { page: forwarder-management }, { search: "index=_internal.*DeploymentServer" } ] }
    - { id: ds-logs, any: [ { cmd: "^tail .*splunkd.log", host: ds01 }, { search: "host=ds01" } ] }
    - { id: btool,   any: [ { cmd: "splunk btool serverclass list", host: ds01 } ] }
  unsafe: [ { cmd: "splunk restart", hostRole: indexer } ]
  modelAnswer: "..."
  hints: [ { cost: 10, text: "Which component decides what a forwarder is told to do?" } ]
```

When a scenario needs something the predicate language can't express, add a new generic predicate to the engine (see CLAUDE.md rule 4).

### 2.8 Tickets, action log, grading (persisted in SQLite)

```sql
sessions(id, seed, mode, started_at, world_config_json, mutation_log_json)
actions(id, session_id, sim_time, wall_time, kind /*cmd|search|page|edit|hint*/, host, payload_json)
tickets(id, session_id, scenario_id, opened_at, closed_at, urgency, resolution_note)
interviews(id, session_id, scenario_id, prompt, notes, answer_json, score_json, debrief_json)
```

Grader: deterministic rubric scoring from the action log against `expectedPath`, `unsafe` and `fixChecks`. This covers triage, evidence, fix, verification and safety. Root cause and communication use keyword/concept matching offline. When `ANTHROPIC_API_KEY` is set, they are also scored by Claude against the model answer, and the debrief shows both.

### 2.9 Shell emulator

- Parser: tokenizer with quotes, pipes, `&&`, `;`, `>` (writes to the VFS overlay), `sudo`, and `~`. No subshells or `$()`, which return a bash-like syntax error.
- Commands are pure functions `(args, stdin, ctx) → { stdout, stderr, exitCode }`, registered in a table. Unknown → `bash: foo: command not found`. Permission model: files have owner/mode, and `splunk` vs `root` matters (needed for the "unreadable by the splunk user" incident).
- `tail -f` and `top` stream over the WS until Ctrl-C. `vi`/`nano` take over the terminal with a small full-screen editor.
- Windows forwarders: see question Q3.

### 2.10 SPL engine

Hand-written lexer → parser → AST → pipeline of streaming operators (`AsyncIterable<Row>`). The leading `search` pushes `index/sourcetype/host/earliest/latest` down to the event generator. `rest`, `metadata`, `inputlookup` and later `tstats` read world tables directly (fast, no event generation). `eval`/`where` share one expression evaluator (arithmetic, comparison, `if`, `case`, `coalesce`, `len`, `lower`, `upper`, `substr`, `round`, `strftime`, `relative_time`, `like`, `match`, `isnull`). The job inspector reports real scan counts and run time.

---

## 3. Folder layout

```
splunk-sandbox/
├─ SPEC.md  PLAN.md  CLAUDE.md  README.md
├─ package.json                # npm workspaces; "dev" runs server + web together
├─ tsconfig.base.json
├─ packages/
│  ├─ shared/                  # types shared by server & web (DTOs, enums)
│  └─ sim/                     # pure simulation, no framework deps
│     ├─ src/
│     │  ├─ rng.ts             # seeded PRNG (sfc32 + string hashing), fork()
│     │  ├─ clock.ts
│     │  ├─ world.ts           # createWorld, tick, applyMutation, replay
│     │  ├─ fleet/             # generator, tables, aggregates, health history, evolution
│     │  ├─ infra/
│     │  ├─ conf/              # .conf parser, btool merge, precedence, effective snapshots
│     │  ├─ derive/            # config → fleet health rules
│     │  ├─ events/            # event generator per sourcetype
│     │  ├─ vfs/               # virtual filesystem + permissions
│     │  ├─ shell/             # tokenizer, commands/*, splunk CLI
│     │  ├─ spl/               # lexer, parser, commands/*, eval
│     │  ├─ scenario/          # schema (zod), loader, runner, predicates
│     │  └─ grader/
│     ├─ templates/            # conf + log templates per host role
│     └─ test/
├─ apps/
│  ├─ server/                  # Fastify + @fastify/websocket, SQLite (better-sqlite3)
│  └─ web/                     # React + Vite + react-router + xterm.js + ECharts
├─ scenarios/                  # *.yaml, one per incident
└─ docs/
   └─ writing-scenarios.md     # milestone 8
```

---

## 4. Milestone 1 scope (what I'll build after you approve)

- npm-workspaces monorepo, strict TS, ESLint + Prettier, Vitest.
- `packages/sim`: seeded PRNG, world config, fleet generator (35k default, 3 sites × ~6 server classes, Windows/Linux mix, version spread), health evolution on tick with a 1–2 % unhealthy background, incremental aggregates, health history ring buffer, minimal infra node list.
- `apps/server`: Fastify on `127.0.0.1:5174`, sim ticking, endpoints `GET /api/fleet/summary`, `GET /api/fleet/hosts?site=&class=&health=&q=&offset=&limit=`, `GET /api/world` (seed, clock), plus `POST /api/world/clock` (pause/speed).
- `apps/web`: Splunk-like shell (top bar, app nav) and a **Fleet Overview** page: KPI tiles (total, healthy, stale, blocked, offline, drift), health by site and by server class (ECharts), and a virtualised, filterable host table. It polls every 5 s. Clicking a tile filters the table.
- Tests: same seed gives identical tables, different seeds differ; distribution checks; the background unhealthy rate stays in band over 1,000 ticks; **aggregates always equal a full scan**; the summary count for a filter equals the host-list total for that filter (the consistency rule).
- `npm run dev` starts both. README with setup and run instructions.

---

## 5. Risks and questions

**Q1. Node version: needs action from you.** You have Node **18.16**, which reached end of life in April 2025. Current Vite and Fastify 5 need Node 20+. I recommend installing **Node 22 LTS** (for example `brew install node@22` or nvm) before milestone 1. I'll add an `engines` field and an `.nvmrc`.

**Q2. Sim speed.** I've proposed 1× by default, with 5×/30× and pause available. Should the interview timer count **wall-clock** time (like a real interview) while recovery curves follow sim time? That's my recommendation.

**Q3. Windows forwarders.** The spec has you SSH into Windows UFs, but real admins use RDP or PowerShell. My recommendation: Windows hosts show a PowerShell-style prompt (`PS C:\Program Files\SplunkUniversalForwarder>`) with aliases (`dir`, `type`, `Get-Content -Wait`, `Get-Service SplunkForwarder`) mapped onto the same command engine, and Windows paths. It's a bit more work in milestone 2, but it adds realism. The alternative is to treat them as bash for now.

**Q4. Concurrent incidents in sandbox mode.** Should several scenarios be able to run at once (realistic, harder), or one at a time? I recommend allowing up to 2 in sandbox mode, and exactly 1 in interview mode.

**Risks**

- **Search scale.** About 35k hosts emitting `_internal` metrics every 30 s comes to roughly 4 M events per sim hour. A raw search across the whole fleet over 24 h can't be fully generated in JS within a reasonable time. Mitigation: push host/sourcetype/time filters down to the generator. `tstats`/`metadata`/`rest` read aggregates without generating events. Raw searches have a scan budget with a Splunk-like "search results may be incomplete" warning. Business indexes (`os`, `network`, `app`) are modelled for a sampled subset of hosts. **This means counts from very broad raw-event searches can be approximate, while counts from `rest`/`tstats`/fleet views are always exact.** The consistency rule holds because both read the same state, but please confirm this trade-off is acceptable.
- **Open-ended fixes** ("resolve the cause" for blocked queues, "filter or route" for license) have several valid solutions. Fix checks support `any:` alternatives, and each scenario must list the accepted fixes. Anything else the user tries is graded as "not recognised", not "wrong".
- **btool precedence fidelity.** Global vs app/user context precedence differs by conf type. I'll implement the global context properly (it covers all incidents in the spec) and document the gaps.
- **Regex dialect.** SPL `rex` uses PCRE, and I'll run it on JS regex. Named groups work the same, but a few PCRE-only constructs (possessive quantifiers, `\K`) will give a Splunk-style error.
- **vi emulation** is a deep hole. I'll start with a nano-style editor plus a minimal vi (`i`, `Esc`, `:w`, `:q`, `:wq`, `:q!`, `dd`, `/search`, arrows).
- **Branding.** The UI imitates the layout and workflow, not Splunk's logos, name or assets. The app will have a neutral name in the UI ("Sandbox Web").
- **Consistency drift.** This is the biggest long-term risk. Mitigations are the derivation layer, a single event generator, and a test helper that asserts dashboard numbers equal the matching search results for every scenario at several points in its timeline.
