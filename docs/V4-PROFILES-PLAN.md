# V4 environment profiles: preparation and milestone 1

Prepared October 25, 2026. **Historical planning record.** The user subsequently authorized implementation without the prompt-builder approval pauses. See [the implemented behavior and validation](V4-PROFILES.md). The preparation-only statements below describe the original checkpoint, not the current implementation.

## Scope and isolation

The user's current request puts this work in **v4**, overriding the attachment's reference to v3. The supplied brief proposes planning and review before implementation, then review after each milestone. Its three supplied files are staged verbatim apart from surrounding separator whitespace:

- `profiles/apl.yaml`
- `profiles/erie.yaml`
- `docs/PROFILES-SPEC.md`

V4 lives at `/Users/austinu/projectsv4/splunk-sandbox`, copied from `/Users/austinu/projectsv3/splunk-sandbox` at commit `1041db76e0107afd6a290dd6667fb22ea734e71b`. The source repository is <https://github.com/Austinu2000/splunk-sandbox-v3>. Git history is retained on local branch `v4`; the copied GitHub remote is removed. V4 has not been published.

V4 uses UI port **5573** and API port **5574**, with its own `data/sandbox.db`. The database was copied using SQLite's backup API while v3 remained available. V3 uses 5473/5474. Its code and database were not changed by this preparation. Browser-local reports, dashboards and settings do not automatically transfer to a different port. The database copy includes saved sessions; it is not a snapshot of unsaved live v3 state.

## Milestone 1 implementation plan

1. **Capture the default baseline first.** Add a regression fixture from the existing v3 engine using a fixed seed, clock and fleet size. Compare all fleet columns, infrastructure, aggregates, representative generated host files and search results at tick zero and after fixed ticks. Preserve existing RNG labels/order, hostnames, defaults, reload behavior and save-v1 compatibility. Merely comparing two newly generated worlds would not prove compatibility with v3.
2. **Define profile types and validation.** Add `packages/sim/src/profile.ts`, using the existing YAML and Zod dependencies. Model metadata, scale, sites, infrastructure, auth mappings, apps, classes, indexes, data sources and scenario allowlists. Keep configuration data separate from mutable world state. Shared client/server metadata types belong in `packages/shared` when introduced.
3. **Separate parsing from file access.** Keep simulation parsing pure: `parseProfile(yamlText)` returns validated values plus diagnostics and confirmation metadata. Provide `loadProfile(id, catalog)` over an explicit in-memory catalog; a server-side loader reads only known repository profile files. Unknown IDs fail clearly; IDs must never become arbitrary filesystem paths. This honors the requested loader while keeping filesystem I/O out of the simulation package.
4. **Validate structure and references.** Check finite positive scale and weights, integer counts and retention, unique IDs/hostnames, valid site references/subnets, placement totals, cluster-factor limits, index references, routing targets, app names and duplicate scenario entries. Source shares must sum to 1 within a documented tolerance. Optional disabled extras remain disabled. Errors identify the source file and field path.
5. **Preserve placeholders.** Read YAML comment metadata through the document AST so `confirm` notes survive parsing, including notes on parent sections. Retain literal values and original comments. Do not replace unknown figures with inferred values or treat one company's data as another's. Return warnings separately from validation failures.
6. **Introduce an explicit default profile compatibility path.** Derive its behavior from existing defaults without changing the legacy `createWorld()`/overrides API. Do not invent an ingestion target for default merely to satisfy the new schema: represent legacy behavior explicitly. Validate APL and Erie in this milestone, but do not expose them as playable environments before infrastructure and data-source support are ready.
7. **Test and stop for review.** Add meaningful fixtures for both supplied profiles, invalid references/counts/shares, confirmation-comment preservation, unknown IDs, isolation between parsed profiles, and default compatibility. Run the existing suite, typecheck and lint. Report changes and remaining limitations before starting milestone 2.

### Acceptance criteria

- Both supplied profiles load without rewriting their figures; APL's class-weight warning is surfaced.
- Invalid profiles fail with useful field-level errors, without partially changing a world.
- Default behavior matches the pre-change fixture, including advancement and representative observations.
- Existing tests pass; YAML parsing consumes no simulation randomness or wall-clock time.
- No profile picker, session migration, new incidents or changes to v3 are included in milestone 1.

## Conflicts and proposed resolutions

| Finding in the current implementation or brief | Proposed handling |
| --- | --- |
| APL class weights sum to **0.95**. Existing `Rng.weighted` treats weights as relative. | Preserve all supplied weights and issue a warning. Continue the existing relative-weight allocation rule; do not invent the missing 5% or silently rewrite the YAML. Source ingestion shares remain a separate sum-to-one constraint. |
| `confirm` annotations live in YAML comments and would be lost by ordinary object parsing. | Preserve path-associated comment metadata, including inherited section annotations, so the UI can show the supplied figures as unconfirmed. |
| The requested `loadProfile(id)` suggests filesystem loading inside a pure simulation package. | Parse and resolve in-memory data in sim; put repository file access in the server, as existing scenario loading does. |
| Infrastructure is fixed at two indexers per site, three search heads, and retired `idx07`. Many features assume specific hostnames. APL/Erie require 20/52 active indexers. | Milestone 2 introduces role lookup, deterministic unique addresses, new role support and a retired host beyond each profile's active range. Keep default naming exactly compatible. Do not simply add nodes while leaving hardcoded callers. |
| APL has two environment sites but a single-site indexer cluster with no placement map. | Before milestone 2, document an explicit simulation placement rule; do not present generated placement as a confirmed real deployment. Preserve the supplied `multisite: false`. |
| Profile allowlists give APL four core drills, while the spec also says all core drills support all profiles and all core solutions pass everywhere. | Treat schema support separately from visibility: eligible drills are the intersection of scenario support and the profile allowlist. Test visible drills in each environment; document this refinement before milestone 2. |
| APL enables the Cribl drill but its Cribl PoC node is disabled. | Keep the baseline node disabled. Before milestone 5, define an explicit drill setup that enables an isolated PoC or show the drill as unavailable. Never silently enable it during profile loading. |
| Current license quota scales with fleet size; profiles supply ingestion targets, not licensed capacity. TB units also need a defined conversion. | Milestone 3 must distinguish ingest from quota and choose a documented unit convention. Do not label an inferred license allowance as a supplied company figure. The Erie "below 80%" drill needs an explicit simulated capacity policy. |
| Saves v1 store seed/fleet size/journal, not the full world configuration. Adding only `profileId` cannot reproduce old sessions after YAML edits. | Milestone 4 stores a validated, versioned configuration snapshot (and profile identity/revision) in save v2, with a migration mapping v1 to default. Replay from the saved configuration, not a changed YAML file. |
| SQLite has one global autosave slot. Autosave runs every minute only when the journal changes, so clock-only progress is not saved. | Replace the uniqueness rule with named per-profile slots; save every two minutes and on switch/shutdown, including clock progress. Make switch/reset/backup transactional and profile-tag history aggregation. |
| Browser reports, dashboards, settings, apps and preferences use global localStorage keys. | Milestone 4 isolates these by profile and defines which data must join server-backed autosave. Otherwise switching profiles can leak settings or lose part of the promised resumable experience. Existing static settings and app catalogs must reflect the active world in milestone 3. |
| Existing scenario primitives do not cover all proposed SSO, CIM, acceleration, bundle, disk, Cribl and SOAR behavior. | Add generic state/config/recovery primitives as needed in milestone 5, then express incidents as YAML. Preserve correct reload/restart behavior and never special-case scenario IDs. SOAR remains last and minimal. |
| Erie reuses `syslog` in multiple index/source contexts. | Key generated sources by source identity and index as well as sourcetype; do not route solely by sourcetype. |

## Remaining milestone boundaries

2. Dynamic infrastructure and role-based references; preserve default behavior and solution-test eligible core drills in both new profiles.
3. Consistent ingestion, indexes, source formats, auth/app presentation; verify search and Monitoring Console agree and volumes meet the target tolerance.
4. Save-v2 migration, configuration snapshots, independent autosaves, safe continue/reset, profile picker and profile-isolated UI state. Verify mutate → autosave → restart → continue restores the same state.
5. Erie drills, then APL drills, each with a solution test; add generic emulation only where needed and implement SOAR last.

Review is requested before milestone 1 implementation, following the supplied brief's “Do not write code yet” and “after I approve” staging instructions. Preparation changes only documentation, copied inputs, local repository isolation and the two default port settings.

## Preparation verification

- Node 22.23.4: all **152 tests across 19 test files passed** in the v4 copy.
- Workspace typecheck and lint passed; tracked-file diff whitespace check passed.
- SQLite backup integrity check returned `ok`.
- No symlinks in v4 point back into the v3 project.
- Compared tracked files with v3: only README and the server/Vite port defaults differ. V3 remains at its original commit with its pre-existing untracked profile/spec files.
- V4 has not been started or published; no new profile behavior is claimed by these baseline checks.
