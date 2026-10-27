# V7 cluster and KV operations

This milestone extends the same World, virtual files, services, recorded events,
bucket-copy model and KV Store used elsewhere. It does not install native Splunk,
MongoDB, S3, Ansible or consensus services. The reference is Splunk Enterprise
9.4.1; KV serverVersion 7.0.0 remains a synthetic teaching fixture.

## Environments and activation

Existing saved worlds retain their inherited cluster behavior until the learner
explicitly enables V7 operational practice, or starts a V7 cluster lesson. This
adds phased operations without replacing existing files, events or bucket copies.
Lab, APL and Erie topology and historical placeholders are preserved.

The optional `enterprise_lab_v1` profile is fictional and versioned separately:
six indexers (three per site), three search heads, Deployer, Cluster Manager,
Deployment Server, monitoring/license roles, Heavy Forwarder and Ansible workspace.
Its independent save never migrates another profile automatically. The original
Lab still has three indexers and one search head. SHC lessons use the existing APL
profile; the multisite lesson uses the existing Erie profile.

## Indexer cluster

Membership derives from running peer mode, manager_uri/master_uri, known HTTPS
management target, service and explicitly supplied plaintext teaching secrets.
Seeded opaque encrypted placeholders cannot be decrypted or compared as real
secrets. RF/SF and native site policies derive from running manager configuration.
Disk edits require activation. Per-bucket coverage uses actual copy placement,
searchable flags and available joined members. Reference buckets are labeled
teaching fixtures; recorded buckets retain links to their real event IDs.

The manager repairs one damaged bucket each tick from an available surviving
copy. It cannot manufacture lost data. Multisite origin/siteN/total constraints
produce site placements and per-bucket health; unsupported or impossible policies
remain visible. The explicit site-outage lab control stops only running indexers
in the chosen site, records their names, and restores only those peers. It is not
a native Splunk command or a host/network partition model.

Bundle validation and publication are separate. Source is bounded to 500 files /
2 MB, checked for supported configuration, and fingerprinted. Publication requires
validation of the current artifact, captures immutable source, then advances one
peer through queued, draining, stopped and verifying phases before the next peer.
Later manager edits do not replace the reviewed artifact. Target source drift
pauses before stopping a healthy service, or holds an already stopped target for
explicit recovery. Save/load resumes the precise job phase and source.

Searchable rolling restarts require joined peers, met SF, searchable data and at
least two available searchable copies of every bucket. Maintenance is automatic
while the operation runs. User-requested restarts can abort remaining work; bundle
restarts cannot be aborted mid-distribution. An abort does not silently restart a
stopped peer. A paused operation can resume after its reviewed target source is
restored. Standard/forced/nonsearchable modes are explicitly unsupported.

Recorded-event searches can use an available searchable replica while the original
receiver is down. Search results identify the serving splunk_server while keeping
the ingestion receiver unchanged. Native-shaped CLI status and simulated REST/SPL
management endpoints share the same memberships and bucket counts.

## SHC

Existing APL/Erie profile members are treated as already bootstrapped. An available
majority of at least three members can elect a captain on a tick. The model keeps
a healthy incumbent and otherwise chooses a deterministic available member. It is
not Raft, a real consensus protocol, or cluster bootstrap/add/remove support.
SHC captain identity is independent of the KV Store primary.

Deployer apps compile local/default source into member defaults using the supported
merge_to_default mode. Existing member local overrides and lookup data are retained.
Unsupported push modes, empty removals, app uninstall and membership changes through
an app push are rejected. A push requires available members and a majority, checks
source before each stop, and restarts the captain last. Ordinary SHC rolling
restart cannot apply pending membership settings; those require a separately
coordinated configuration procedure.

Canonical report/dashboard saves enqueue bounded, scoped native file/stanza updates.
One available member receives each update per tick while the majority is healthy.
Missing members catch up after recovery. A full backlog or lost quorum rejects
new saves before modifying source. Local overrides remain visible in the member
comparison; a Deployer push alone does not erase them. A default report can be
adopted as a local runtime override without deleting its provider.

## SmartStore

A configured remote volume and remotePath can upload recorded warm/cold bucket
metadata to a fictional S3 object key. No credentials, SDK or network is used.
Hot buckets retain normal RF/SF behavior; uploaded data uses remote durability and
local cache availability rather than manufacturing additional durable replicas.
The remote key is immutable for existing data; changing its location does not
silently migrate an object. Frozen data is removed under modeled retention;
archived/thawed data follows the existing separate local recovery path.

Only uploaded objects can be evicted. Matching index/time searches fetch uncached
objects and retain actual fetch receipts. Unrelated searches do not warm them.
A cached read can survive a simulated remote outage; an uncached matching read
fails explicitly. Cache supports LRU and max_cache_size in MiB; 0 uses a bounded
64 MiB teaching default, not real automatic disk sizing. Cache capacity is applied
on ticks and cache misses. Other eviction/tuning policies are unsupported.

No real S3 permissions, encryption, endpoint, object-store consistency or production
capacity/latency is claimed. Only actual bounded recorded events participate in
this new remote/cache model; generated baseline data is not materialized as objects.

## KV and automation

The existing K-series lessons remain. New work covers typed service collections,
actual lookup enrichment, engine readiness, replica configuration repair, backup
verification and restore after deliberate data corruption. The upgrade exercise
is preparation only. It does not change a native MongoDB binary or assert that an
installed Splunk 9.2.2 server has been upgraded. Native migration prerequisites
must be checked against the release-specific vendor documentation.

KV writes remain bounded native config/data endpoints against virtual HTTPS hosts.
Ansible renders nested JSON values, preserves scalar types and uses the fictional
admin:training-only practice principal for writes. Native URI skips in check mode;
only explicit read-only overrides can observe the original world. A write override
is rejected. Collection configuration repeats without changes. Backup and restore
commands use the existing same-deployment virtual snapshots, including a pre-restore
safety snapshot. A successful Ansible run can queue a cluster job; the job and data
must be verified separately.

Web cluster, SHC and KV mutations reject stale environment contexts. Configuration
editors pin source revisions; KV actions also pin data/service revisions. A retained
form cannot write into a newly selected lesson/world. Leaving a new/resumed lesson
returns to its separately saved launching environment; older attempts retain their
profile-based fallback. Explicit review clears KV
drafts. New save schema 9 loads older saves and journals the added operational state.

## Validation and curriculum

AU-36–43 and SP-055–068 each require solution, incorrect-action, no-false-completion,
reset, resume and isolation acceptance cases before Learn promotion. The AU titles
are explicit refinements of the accepted track range; the unavailable original
individual-objective source is not invented. SmartStore grading observes retained
search/fetch evidence and does not issue a search that warms the cache itself.

Full-regression counts and browser evidence are recorded in
[V7 implementation status](V7-IMPLEMENTATION-STATUS.md). Subsequent milestones
continue without review pauses under the user's October 27 authorization.

## Primary references

- [Indexer rolling restart, 9.4](https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/9.4/manage-the-indexer-cluster/perform-a-rolling-restart-of-an-indexer-cluster)
- [Indexer cluster CLI, 9.4](https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/9.4/configure-the-indexer-cluster/configure-and-manage-the-indexer-cluster-with-the-cli)
- [SHC Deployer, 9.4](https://help.splunk.com/en/splunk-enterprise/administer/distributed-search/9.4/update-search-head-cluster-members/use-the-deployer-to-distribute-apps-and-configuration-updates)
- [SHC configuration, 9.4](https://help.splunk.com/en/splunk-enterprise/administer/distributed-search/9.4/configure-search-head-clustering/configure-the-search-head-cluster)
- [SmartStore on a new cluster, 9.4](https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/9.4/deploy-smartstore/deploy-smartstore-on-a-new-indexer-cluster)
- [KV Store backup and restore, 9.4](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/administer-the-app-key-value-store/back-up-and-restore-kv-store)
- [KV REST API](https://dev.splunk.com/enterprise/docs/developapps/kvstore/usetherestapitomanagekv/)
- [Upgrade to 9.4 prerequisites](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first)
