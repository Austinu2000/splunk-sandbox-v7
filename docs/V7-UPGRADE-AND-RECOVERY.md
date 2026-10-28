# V7 upgrade and recovery foundation — Milestone 9 in progress

This is a bounded, offline teaching workflow. Milestone 9 is **not complete**:
AU-44–50 still need authored fixtures, scoring, acceptance cases and promotion.
SP-089–092 are available after 24 acceptance cases, four passive grading checks
and a malformed-certificate recovery test. The catalog now contains 162 lessons
(135 new + 27 inherited).

## Available foundation

Open **Interview workbench → Enterprise upgrade and recovery**, or
`#/settings/maintenance` on V7 (5873). Review actual virtual versions, service
availability, staged package identity, configuration archives and retained jobs.

- The only target is a teaching patch from 9.4.1 to **9.4.2**. This is an exercise
  target, not a recommendation about a current real Splunk release. Each staged
  `.tgz` contains explicitly labeled JSON, not a vendor distribution or executable.
- Package staging and configuration archives use real SHA-256 over their UTF-8
  content. Verification checks the registered archive digest; the virtual native
  `sha256sum FILE` and `sha256sum -c MANIFEST` commands can inspect artifacts.
- Configuration archives capture the host's Splunk `etc` files, directories,
  ownership and modes. They exclude installed packages, indexed data and KV Store
  data. Archives are bounded to 1,000 files, 1,000 directories and 2 MB of file
  content; 30 retained archives per world. Storage is virtual and inspectable.
- Restore requires a stopped service, a verified registered archive and no active
  upgrade. It validates the archive before changing configuration, first captures
  the current configuration separately, removes added paths and restores metadata.
  A configuration restore does **not** downgrade a package or restore data.
- Preflight checks native configuration syntax, current verified archives,
  package/manifest identity, actual service availability, modeled free space,
  tier prerequisites, recorded replication/search factors, SHC majority when
  configured, and an independent current KV Store data backup for search heads.
- Order is license manager, cluster manager, deployer, search heads (current SHC
  captain last within that tier), then indexers. Unselected prerequisites must
  already run the target. Only Linux Enterprise hosts are supported here;
  Universal Forwarders retain their separate package model.
- The coordinator pins reviewed configuration and artifacts. It drains/checks
  surviving search capacity, stops, installs, starts and verifies one host at a
  time. It retains completed hosts, errors and phase history across save/replay.
  Paused work resumes after the original reviewed source/artifact is repaired.
  It will not silently approve a different artifact or repeat completed hosts.
- Abort preserves actual installed versions and current service state for explicit
  recovery. Native downgrade is rejected. Configuration restore, data restore,
  package replacement and service recovery remain separate actions.
- Standalone manual practice supports virtual `tar -xzf PACKAGE -C /opt` after a
  current preflight and service stop, followed by `splunk start --accept-license`.
  The flag is an explicit **nonbinding simulation acknowledgement**. Cluster
  peers/search heads use the coordinator for quorum/search capacity checks.
- The simulation clock may advance jobs automatically. The page shows the clock
  state when reviewed; when paused, an **Advance … one tick** action runs one
  shared world tick. Other scheduled/input/cluster work advances in that tick too.

## Persistence and guards

Maintenance state uses save schema 15; schemas 1–14 remain loadable. All source,
file metadata, package/version, service and job changes use the same World and
journal as CLI, Search and other operational pages. No real shell, archive
extraction, license acceptance, network access or host package installation occurs.

The API requires the current environment/attempt context and source/job revision,
strict action fields and current practice-principal privileges. Background KV
heartbeats and ingestion counters do not count as configuration review changes;
preflight and installation independently check current operational readiness.
Cluster jobs and active/paused package jobs exclude one another. A paused package
job continues to reserve its maintenance window until resume or explicit abort.

## Validation

- Focused tests cover real SHA-256 against Node crypto, corruption without source
  mutation, directory/permission restoration, unchanged data/package version on
  configuration restore, required startup acknowledgement, native virtual checksum
  and extraction commands, rejection of downgrade/stale source/manifest failures,
  storage/syntax/service prerequisites, separate KV data backup, and explicit abort.
- A six-host LM/CM/SH/three-peer run pauses on an altered pending artifact, saves,
  replays and resumes without reinstalling completed hosts. Actual recorded search
  remains available during surviving peer phases.
- API tests reject stale context/revision, unsupported fields and analyst writes;
  perform and persist an actual standalone 9.4.2 upgrade through shared ticks;
  and keep APL and the prior Lab attempt separate.
- Browser verification uses a separate named verification learner
  attempt. Its hf01 archive was verified and the retained upgrade completed with
  hf01 actually reporting 9.4.2. This is foundation proof, not completion evidence
  for SP-001 or for any future maintenance lesson.

The complete Milestone 9 gate and capstone/final-audit gates remain pending.

## Vendor reference and limits

The native reference for upgrade order, health precautions and SHA-256 package
verification is [Splunk Enterprise 9.4 automated rolling indexer upgrades](https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/9.4/deploy-the-indexer-cluster/perform-an-automated-rolling-upgrade-of-an-indexer-cluster).
The V7 coordinator does not claim to implement Splunk's built-in automated upgrade
app, its native rolling-upgrade endpoints, systemd orchestration, all packaging
formats, installation hooks, app compatibility certification or a full OS/hardware
prerequisite matrix. Manual cluster package extraction is intentionally excluded
from this bounded model.

[Splunk Enterprise 9.4 upgrade considerations](https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/9.4/upgrade-or-migrate-splunk-enterprise/about-upgrading-to-9.4-read-this-first)
explain the need for separate backups and that installing an older package is not
a supported rollback. V7 has configuration-only archives and the existing separate
KV backup model; it does not provide vendor binary reinstalls, OS snapshots,
cryptographic CA issuance or a complete disaster-recovery product.

Browser foundation proof: [completed hf01 upgrade](v7-maintenance-upgrade.png).

## Foundation checkpoint validation

The full regression passed **1,196 tests / 75 files**. Subsequent guard/storage
refinements passed **46 focused tests**, including native shell, cluster capacity,
all-target privilege checks and maintenance save/replay. TypeScript, ESLint and
the web build pass. The inherited web bundle size advisory remains. These are
foundation checks, not the Milestone 9 curriculum acceptance gate.

Native virtual `df /opt` and maintenance readiness now share the same seeded
baseline plus actual active recorded bucket bytes. Neither view invents a separate
storage figure for the UI. This remains a bounded local recorded-data capacity
model rather than full OS filesystem or vendor storage accounting.

## Graded upgrade and recovery exercises

SP-089 verifies a current six-host preflight; SP-090 completes a real virtual hf01
package change; SP-091 restores the known-good configuration with a separate
failed-change safety archive; SP-092 recovers a premature certificate rotation,
proves old-only trust, overlaps both CA issuers, activates the new issuer and
retires old trust. Certificate checks are captured from native service activation
and remain available in the maintenance page. Disabling verification is retained
as a failed teaching outcome, not a passing recovery.

The CA metadata model supports up to five explicit issuer labels to represent an
overlap trust bundle. New rotation practice uses native server.conf [sslConfig]
sslRootCAPath; older lessons retain their supported, deprecated outputs.conf field.
This remains JSON teaching metadata, not real PEM, signatures, key management or
certificate issuance. Native reference: [TLS forwarding configuration in 9.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/9.4/secure-splunk-platform-communications-with-transport-layer-security-certificates/configure-splunk-indexing-and-forwarding-to-use-tls-certificates).

Browser SP-092 verification completed the old-certificate recovery, overlap trust,
new-certificate activation and retirement of the old CA, with verification enabled
throughout. Native activation checks retain the initial failure and each real
relationship. Search and Job Inspector confirmed count=4 and four distinct practice
IDs. [Activation history](v7-certificate-rotation.png),
[completed graded exercise](v7-maintenance-lesson-complete.png). The original Lab
free-practice session was restored after the separate learner attempt.

SP-089–092 checkpoint: full regression **1,229 tests / 76 files passed**.
AU-44–50 and the remaining milestone gates are still in progress.
