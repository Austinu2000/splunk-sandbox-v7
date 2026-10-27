# V6: persistent KV Store practice

V6 is an independent copy at `/Users/austinu/projectsv6/splunk-sandbox`. V5 remains at `/Users/austinu/projectsv5/splunk-sandbox` and continues on ports 5673/5674. V6 uses 5773/5774 and its own SQLite file, `data/sandbox.db`. V6 begins with fresh practice sessions; V5 progress was backed up, not migrated or overwritten. Browser reports and dashboards also remain separate because the browser origins differ.

## Start and stop

```bash
cd /Users/austinu/projectsv6/splunk-sandbox
nvm use 22
npm run dev
```

Open [V6 KV Store](http://127.0.0.1:5773/#/kvstore) or [guided lessons](http://127.0.0.1:5773/#/learn). Choose Practice Lab for standalone work or APL for replication. Stop this terminal with Ctrl+C; this saves V6 and leaves V5 running. Do not start a second V6 process while its ports are already in use.

Source backup: `/Users/austinu/projectsv6/backups/v5-source-before-kvstore.tar.gz`.
Session backup: `/Users/austinu/projectsv6/backups/v5-sessions.db`, created with SQLite online backup from a read-only V5 connection.

## What is implemented

- Per-environment and per-lesson collection records, typed schemas, revisions, backup snapshots, incident outcomes and operation history. KV actions checkpoint immediately. Clock progress uses the existing two-minute autosave and graceful-shutdown checkpoint.
- `collections.conf` and `transforms.conf` app/default + app/local precedence. App reload applies those definitions; staged edits are not running configuration. `server.conf` uses the existing full configuration precedence and takes effect on restart. `btool` identifies winning disk configuration, which can differ from running state.
- Default app `kv_training`, two synthetic asset records and `assets_lookup`. Custom collections support create, update and deletion. Shipped default collections can be disabled or emptied; their definitions cannot be deleted through this model's REST/UI controls.
- Scalar JSON records with unique `_key`, atomic schema validation, insert/upsert/replace, equality reads and scoped deletion. SPL `inputlookup`, `lookup` and `outputlookup` share the same data. `fields_list` controls exposed lookup fields.
- Ready/disabled/failed service state, server and engine versions, local/latest revisions, standalone/primary/secondary roles, replica catch-up and majority-based write availability. Stale replicas cannot become a primary until current data is available. KV primary is separate from SHC captain.
- Backup and restore with same-deployment scope, validation against existing definitions, stale-backup rejection and an automatic pre-restore safety snapshot. Restores advance data revisions and replicate on ticks.
- Simulated terminal status, REST-shaped curl operations, app reload, resync and backup/restore. `ps` and listening ports reflect running service settings; practice actions appear as `KVStorePractice` entries in the generated `splunkd.log` and `_internal` search data.
- Four guided lessons, K1–K4, with persisted outcome checks. Three seeded incidents cover disabled service, stale replication and accidental record deletion. Recovery closure requires a fix and a written debrief; record recovery checks the original data values.

## Starter exercises

Use **Learn → K1** to create a typed `services` collection. Use **K2** to repair a disabled service, **K3** to compare APL replicas, and **K4** to restore an incident backup. Lessons run in isolated learner sessions. Return to free practice from Learn when finished.

Inside the simulated terminal:

```bash
ssh splunk@sh01
splunk show kvstore-status --verbose
splunk btool server list kvstore --debug
splunk btool collections list assets --debug
curl -k https://localhost:8089/servicesNS/nobody/kv_training/storage/collections/data/assets
splunk backup kvstore -archiveName assets_before_change
splunk restore kvstore -archiveName assets_before_change.tar.gz
```

On an APL search head, use that profile's displayed hostname instead of `sh01`. For configuration editing, use the KV Store Configuration tab or the simulated terminal. The model's `splunk reload collections -app kv_training` / `splunk reload transforms -app kv_training` commands are teaching conveniences, not a statement that these exact commands are supported by vendor Splunk CLI.

Search:

```spl
| inputlookup assets_lookup
| rest /services/kvstore/status
```

Run each search separately. Default SPL app context is `kv_training` on the default search head; use the KV Store page's host selector to inspect another replica's local data.

## Version baseline and explicit boundaries

The operational model targets Splunk Enterprise **9.4.1**. KV server **7.0.0** is a synthetic 7.0-family fixture; it is not the exact MongoDB patch bundled with a real Splunk distribution. The native installation remains Splunk **9.2.2** and was not upgraded, restarted or reconfigured. Original UI captures and app catalog metadata retain their reference versions. V6 does not claim a complete 9.4.1 UI recreation or vendor compatibility certification.

This is a deterministic simulator, not a running MongoDB/Splunk deployment. Learner commands never execute on the user's computer. The local development server remains bound to loopback.

Current bounds:

- At most 10,000 scalar records per collection and 30 snapshots per environment. Nested objects, arbitrary MongoDB operators and indexing/performance tuning are not modeled. `cidr` is validated as a string, not parsed as a network range. `time` uses numeric values.
- Simulated curl uses an administrator context; `-u` is accepted for practicing syntax, not real authentication. Response JSON is simplified. Unsupported endpoints/options fail explicitly; this is not the full vendor REST API.
- APL replication is a deterministic revision model, not MongoDB's consensus implementation. Catch-up happens on simulation ticks. Transport fault controls represent outages; they do not configure a firewall. The model expects peer port 8191 and wiredTiger. `replicate` does not simulate indexer-side lookup distribution.
- Collection REST changes distribute only when all members are healthy; otherwise the operation is rejected. Disk edits on one member stay local until applied/distributed. This is a simplified teaching rule, not Splunk SHC's complete configuration replication protocol.
- Backup snapshots are persisted in the simulation's SQLite save, not physical `.tar.gz` files. Operations are atomic and synchronous. Real maintenance mode, point-in-time coordination, static-captain procedures, scheduler quiescence and archive transfer are not implemented. Unsupported CLI flags are rejected rather than silently accepted. The pre-restore snapshot is an extra practice safeguard.
- Certificates/TLS renewal, native binaries, database migrations and real OS resource exhaustion still require a real disposable Splunk lab. V5's other documented simulation limits remain.

## References

The implementation uses the 9.4 documentation as a behavioral reference. Always follow the vendor instructions for an actual installation.

- [Splunk 9.4 KV Store backup and restore](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/administer-the-app-key-value-store/back-up-and-restore-kv-store): data/configuration prerequisites and restore overwrite behavior. Real consistent backups require coordination beyond this simulator.
- [Use REST to manage KV Store](https://dev.splunk.com/enterprise/docs/developapps/kvstore/usetherestapitomanagekv/): collection configuration, data and batch-save endpoint families.
- [Upgrade to Splunk 9.4: read this first](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first).
- [KV Store migration guidance, 9.4](https://help.splunk.com/en?resourceId=Splunk_Admin_MigrateKVstore&version=splunk-9_4): 7.0 transition and release-specific constraints. This simulator does not run a native migration.

## Verification

The added tests cover atomic validation, precedence/apply boundaries, replica majority and stale-primary prevention, lookup writes/projection/booleans, REST/terminal consistency, backup recovery, incident checks, SQLite reopen, profile isolation and all four lesson fixtures. Browser verification uses a separate learner named `V6 verification`; free practice remains separate.

Final checks (2026-10-26): **263 tests across 27 files passed**; workspace TypeScript checks and ESLint passed; the production web build succeeded. Vite retains its existing large-bundle advisory. Browser verification passed collection creation/write/read, lesson completion, backup/restore with a safety snapshot, and return to free practice. Both V5 and V6 APIs returned HTTP 200 at handoff. The finished UI is captured in `v6-kvstore.png`.
