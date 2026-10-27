# Environment Profiles — Build Spec

Goal: the sandbox can load one of two saved environments, **APL** (`profiles/apl.yaml`) or **Erie** (`profiles/erie.yaml`). Each profile keeps its own autosave. Loading a profile resumes it exactly where it was left: same clock, same broken or fixed configs, same open tickets.

Read `CLAUDE.md` first. All hard rules still apply: one world state, determinism, scenarios as data, config changes only on the correct reload or restart.

## 1. Profile loading (engine)

- Add `packages/sim/src/profile.ts` with a `Profile` type matching the YAML files and a `loadProfile(id)` that validates them (zod or hand-written checks with clear errors).
- `createWorld` takes a profile. `WorldConfig` gains: `profileId`, `targetDailyIngestTB`, `infra`, `indexes`, `dataSources`, `auth`, `apps`. The default world keeps working as profile `default` (current behavior, so existing tests stay green).
- **Infra from the profile.** Replace the hardcoded tier in `infra.ts` (2 indexers per site, 3 search heads, `ds01`, `cm01`, `lm01`, `hf0N`, retired `idx07`) with nodes built from `infra:`. Naming: `idx01..idxNN`, `sh01..shNN` (SHC members), `es01` (ES search head), `deployer01`, `ds01..`, `cm01`, `lm01`, `mc01`, heavy forwarders by their profile `name`, extras by `name`. Multisite places indexers per `sitePlacement`. Keep one retired indexer per profile so `forwarder-retired-indexer` still works.
- **Remove hardcoded hostnames.** About 18 files reference `idx0N`, `sh0N`, `ds01`, `cm01` or `hf0N` (sim, server, web and scenarios). Route every lookup through role queries (`infraByRole(world, 'cluster_manager')`). Scenarios refer to hosts by role token, e.g. `host: '{deployment_server}'` or `host: '{indexer:3}'`, resolved at configure time.
- **Ingest scale.** Scale per-forwarder throughput so the license manager, Monitoring Console and `license_usage.log` report the profile's `targetDailyIngestTB` (±5% background variation), split across `dataSources` by `shareOfIngest`. Searches and dashboards must agree with each other.
- **Indexes.** `indexes.conf` on the cluster manager's `manager-apps/_cluster` (and the Settings → Indexes page) lists the internal indexes plus the profile's indexes with `frozenTimePeriodInSecs` from `retentionDays`.
- **Data sources.** Add log formats for new sourcetypes in `logs/sources.ts`: `fgt_traffic`, `fgt_utm`, `fgt_event` (FortiGate key=value syslog), `symantec:ep:*`, `aws:cloudwatchlogs:vpcflow` (VPC flow log v2 fields), `ot:syslog`, `XmlWinEventLog`, `db_audit`, `log4j`. Each source appears in the correct index, from the correct `host` and `source`, routed through the `via` heavy forwarder when set.
- **Auth.** Settings → Authentication methods and Roles reflect `auth.method` and `roleMappings`. SAML profiles show the SAML group mapping page; LDAP profiles show the LDAP strategy.
- **Apps.** Installed apps (Apps menu, Manage Apps, `etc/apps` on the search heads) come from `apps:`. ES appears only when the profile has an ES search head.

## 2. Sessions that continue (server)

- `SavedWorld` gains `profileId` (bump `SAVE_VERSION` to 2 and migrate v1 saves to profile `default`).
- **Autosave per profile:** every 2 minutes of real time, and on profile switch or server shutdown, write the slot `autosave:<profileId>` (one row per profile, overwritten).
- `GET /api/profiles` lists profiles with name, description, scale, last played time and whether an autosave exists.
- `POST /api/profiles/:id/load` loads the profile's autosave if one exists, otherwise creates a fresh world from the profile. `POST /api/profiles/:id/reset` starts the profile fresh (asks for confirmation in the UI and keeps a backup slot `autosave:<id>:previous`).
- Manual saves record their `profileId`. Loading a manual save switches to its profile.
- Interview history, action log and scores are tagged with `profileId` so progress can be filtered per environment.

## 3. UI

- **Profile picker** on first load and under Apps → Engineer Sandbox → Environments: a card per profile with name, role, scale line (for example "35,000 forwarders · 52 indexers · ~12 TB/day"), last played, and buttons **Continue** and **Start fresh**.
- Top bar shows the active profile next to the health dot (small label, Splunk styling). Switching profiles autosaves the current one first.
- Sessions page groups saves by profile.

## 4. New scenarios

Write one YAML file per drill in `scenarios/`, using the existing schema (`changes`, `clues`, `redHerrings`, `fixChecks`, `recovery`, `interview.expectedPath`, `unsafe`). Add `profiles: [apl]` or `profiles: [erie]` so a drill only appears in its environment. Core scenarios get `profiles: [default, apl, erie]` and use role tokens instead of hostnames.

### Erie

| ID | Ticket symptom | Hidden cause | Fix check | Unsafe action to penalize |
|---|---|---|---|---|
| erie-phonehome-storm | Forwarder Management slow, clients flapping after a DS restart | `phoneHomeIntervalInSecs` set to 10 in the UF deploymentclient app; DS CPU saturated by 35,000 clients | Interval at least 60 and DS phone-home latency back to normal | Restarting all forwarders |
| erie-uf-upgrade-drift | Some forwarders stopped sending after an upgrade wave | Hosts on a drift version reject the indexers' updated TLS settings (`sslVersions`) | Affected hosts back under 3% stale | Disabling TLS on the indexers |
| erie-wineventlog-volume | Windows Security volume doubled overnight | Audit policy change floods EventCode 4662/5156 | `blacklist` for those codes in `inputs.conf` pushed through DS; license back under 80% | Deleting the index |
| erie-peer-disk-full | Cluster shows RF not met | `idx` hot volume full on one peer (`maxVolumeDataSizeMB` too high for disk) | Peer indexing again, RF and SF met | Removing the peer from the cluster |
| erie-retention-capacity | Auditors say 90-day-old data is missing | `maxTotalDataSizeMB` caps the index before `frozenTimePeriodInSecs` | Size cap raised to fit retention at current ingest | Lowering retention instead |

### APL

| ID | Ticket symptom | Hidden cause | Fix check | Unsafe action to penalize |
|---|---|---|---|---|
| apl-fortigate-timezone | FortiGate events show the wrong time | Relay writes local time; `TZ` missing for `fgt_*` on hf-syslog01 | `TZ` set in props.conf on the parsing tier, new events correct | Changing system time on indexers |
| apl-fortigate-sourcetype | Firewall dashboards empty, data arriving | FortiGate add-on missing on hf-syslog01, everything lands as `fgt_log`; CIM Network Traffic empty | Events split into `fgt_traffic`/`fgt_utm`/`fgt_event` | Editing ES dashboards to search `fgt_log` |
| apl-aws-flowlogs-stalled | VPC Flow Logs stopped yesterday | Expired access key on hf-aws01's AWS add-on input | Input healthy, `aws` index receiving again | Re-creating the index |
| apl-ot-udp-drops | OT logs have gaps during shift changes | UDP receive buffer overflow on hf-ot01 at peak | Larger buffer or TCP input; drop counter at zero | Opening OT network to indexers directly |
| apl-cribl-route | Noisy firewall denies eating license | Deny traffic logs at full fidelity | Deny events sampled or summarized in the Cribl pipeline (PoC depth); license down | Dropping all firewall data |
| apl-sep-cim | Malware dashboard shows nothing from Symantec | Event type search no longer matches after add-on upgrade renamed sourcetype | Tagged events in Malware data model | Hardcoding results in the dashboard |
| apl-es-dm-acceleration | Correlation search stopped creating notables | Network_Traffic acceleration skipped (too many concurrent summaries) | Acceleration complete, notable created | Disabling acceleration on all models |
| apl-saml-role-mapping | Analysts lost ES access this morning | IdP renamed group `APL-SOC-Analysts`; SAML mapping no longer matches | Mapping updated, analyst user has `ess_analyst` | Granting analysts `admin` |
| apl-shc-bundle-push | Search heads show different apps | Deployer push failed (app with conflicting `local` files) | `apply shcluster-bundle` succeeds, members in sync | Copying apps manually to each member |
| apl-idx-rolling-restart | Indexer down during patch window | Peer restarted without maintenance mode, excess bucket fixup | Maintenance mode used, fixup complete, SF met | Running `splunk offline --enforce-counts` on several peers at once |
| apl-soar-servicenow | SOAR stopped opening ServiceNow tickets | Rotated ServiceNow credential not updated in SOAR asset | Playbook run succeeds | Deleting the playbook |

SOAR needs a minimal emulation (asset config, playbook run log). Build it last and keep it small.

## 5. Milestones

1. Profile type, loader, validation; default profile reproduces today's world exactly (determinism test).
2. Infra from profile; remove hardcoded hostnames; role tokens in scenarios. All existing tests pass for `default`, and each core scenario's solution run passes on `apl` and `erie`.
3. Ingest scaling, indexes, data sources and log formats. Test: license total within 5% of `targetDailyIngestTB` for each profile, and Monitoring Console equals the search result.
4. Profile autosave, continue and reset; picker UI; save v2 migration. Test: load, mutate, autosave, restart server, continue → identical state.
5. Erie scenarios, then APL scenarios, each with a solution-run test. SOAR emulation last.

Stop after each milestone for review.

## 6. Accuracy rule

Profile values marked `confirm` are placeholders. Show them in the UI exactly as the YAML states and never invent new figures. Never use one profile's figures in the other.
