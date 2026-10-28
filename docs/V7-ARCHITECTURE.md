# V7 shared architecture and persistence

## Frozen release update

The sections below retain the Milestone 0 architecture decision and its original
gap audit. They are historical, not the current delivery checklist. The frozen
169-lesson release uses save schema 15, operational indexes/knowledge objects,
shared schedules and the maintenance engine. See the current
[frozen-release audit](V7-FROZEN-RELEASE-AUDIT.md) and
[implementation status](V7-IMPLEMENTATION-STATUS.md). Eight capstones remain deferred.

## Milestone 0 decision

Continue the V6 world, virtual filesystems, journal, terminal, search engine,
Git/Ansible interpreters, scenario engine and Learn sessions. Preserve save schema
5 at this gate: the preflight adds no new persisted operational state. Versions
1–5 continue through the existing loader. Product version 7 is independent of save
schema numbering.

The explicit user request creates a separate V7 copy despite the supplied brief's
instruction against renaming V6 merely for a planning prefix. V6 is unchanged.

## Current state audit

| Feature | Current source | Gap and planned owner |
| --- | --- | --- |
| Fleet, services, effective config, logs | `World`, columnar fleet, VFS/running snapshots | Retain; all new operations use these primitives |
| Settings → Indexes | REST-shaped SPL inspection of simulated idx01; read-only | M2 adds catalog and correct host/scope selection; remove hardcoded idx01 assumption |
| Other editable Settings tables | `splunk-v3-settings:*` values in `World.uiState` via `profileStorage` | These are practice drafts, not effective config; migrate only supported fields through host-scoped services |
| Add Data | `splunk-v3-settings:last-input-draft` | Draft only; M2 must connect to input activation, routing and events |
| Reports, alerts, dashboards, datasets | `splunk-sandbox-v3-knowledge-v1` in `World.uiState` | Server-backed persistence exists, but operations are driven by UI JSON; M3/M6 provide operational knowledge-object services |
| Knowledge job history, recent items, home dashboard | Same legacy knowledge JSON | Preserve all fields, including unknown properties and malformed data |
| Search history, preferences, app toggles | Other profile UI keys | Remain UI metadata; app toggles are not installed-package state |
| Macros, writable lookups, collected summary snapshots | `World.training`, journaled by existing engines | Integrate existing objects instead of creating parallel lookup/macro stores |
| Existing Ansible schedules | Simulation-clock training scheduler | Automation runs only; not a saved-report scheduler |
| Saved reports with schedule strings | Legacy knowledge JSON | Stored intent only; do not claim a report executed |
| Learner attempts and notes | `World.lesson`, SQLite `lesson:<learner>:<id>` slots | Preserve all existing IDs/slots. New versioned attempts must not collide with them |
| Environment catalog/topology | Profile YAML plus saved profile config | Existing saved topology wins; APL/Erie catalog edits cannot silently rewrite saved worlds |

`profileStorage` normally saves into the active server world through
`/api/profile/ui`; describing all of it as browser local storage is inaccurate.
Its startup fallback uses localStorage, and much older browser-only artifacts may
still exist on a previous origin. A server database snapshot cannot capture those.

## Implemented migration preflight

`planLegacyImport(profileId, uiState, existing)` is pure and repeatable. It retains
every original key/value byte for byte, even invalid JSON, empty strings, unknown
fields and invalid individual objects. It validates candidates separately and
reports duplicate IDs and conflicting kind/app/owner/title identities. Nothing is
deleted, merged, activated, scheduled or sent to another environment.

Legacy records lack a target simulated host. Every candidate requires explicit
host/scope review before activation; the importer must not assume idx01 or sh01.
The read-only `GET /api/engineering/migration` endpoint returns counts and issues
for the current world only. It does not return source record contents or raw notes.
The planner's preserved source is a recovery value, not a second operational store.

## Cutover design for subsequent milestones

1. Checkpoint the current world and retain a pre-migration save/SQLite backup.
2. Preview source records. Keep malformed/unrecognized records recoverable and show
   actionable conflicts. Do not seed defaults over a user's malformed source.
3. Resolve target host, deployment scope, app, owner and permissions. Legacy Settings
   rows remain drafts until translated through a supported configuration service.
4. Create canonical objects through the same service Web, CLI/config and simulated
   REST use. Validate the full mutation before writing. Configuration writes go
   through VFS, retaining the disk/effective boundary and correct reload/bundle.
5. Atomically record a versioned import receipt, canonical IDs, old-to-new mapping
   and ordered evidence. Preserve original raw values in a migration archive.
6. Switch Web reads/writes to the canonical service. UI metadata remains UI metadata.
   Retire legacy object writes at this point; never synchronize two writable stores.
7. Verify configuration/REST/search independently, then reopen the saved world.
   Repeating an import receipt must be a no-op. Roll back to the retained snapshot
   if verification fails. Reset and another profile must not alter the archive.

The cutover is **designed, not executed** at Milestone 0. No migration receipt or
canonical operational catalog is falsely manufactured by the preflight.

## Shared contracts

`packages/shared/src/knowledge.ts` now owns the existing knowledge-record types
used by the UI. `engineering.ts` defines host/profile/app/owner scope, declared and
effective index revisions, operational knowledge objects, scheduled-search runs,
ordered revision-bound evidence, and lossless preflight results. These contracts
are design boundaries, not declarations that their operations already exist.

Index creation must never manufacture events. Cluster peers must reject direct
creation; manager-apps definitions require validation and bundle application.
Saved reports execute only when the implemented scheduler runs them. Summary
events require a successful supported write and a real destination catalog entry.
Existing `collect` snapshot behavior is not accepted as the new summary pipeline.

## Lesson and coverage contracts

The new strict Zod schema defines versioned fixtures, objectives, environment,
level, prerequisites, capabilities, tasks/interface paths, hints, documentation,
outcomes, feedback, reset and persistence. Command-string checks alone are not an
allowed new outcome. A verified definition needs success, incorrect-action,
false-completion, reset, resume and isolation test references. `lessonReadiness`
also requires available capabilities and passing test evidence from a trusted
implementation registry. It is a readiness helper, not a new execution engine.

Keep the existing Learn section. Register new exercises only when their fixture,
operations and outcome evaluator pass the acceptance tests; planned manifests
must never appear as completed lessons. The question map is explicitly candidate
coverage until individual behavior and documentation are verified.

## Intentional boundaries

The virtual terminal never runs native commands. YAML/Jinja stay bounded and
interpreted. No arbitrary code, plugins, SSH, Python, Ansible jobs or external
services execute from learner input. All servers bind to loopback; offline mode
remains default. No new learning-progress dashboard is added.

Optimistic concurrency for future mutations must bind to world/attempt identity
and object revision, not profile ID alone. Existing UI state POSTs only guard the
profile ID; this inherited limitation must be resolved before operational cutover
so stale tabs cannot overwrite another attempt in the same profile.
