# V7 APL and Erie capstones

Status: Milestone 10 planning. SP-093–SP-100 are reserved in the curriculum manifest
and are not executable lessons yet. Existing profile fixtures, unknown/placeholder
figures and saved topologies are retained without asserting historical accuracy.

| IDs | Environment | Integrated result |
| --- | --- | --- |
| SP-093 | APL | FortiGate source → parsing → sourcetype → CIM → verified security data |
| SP-094 | APL | Recover AWS VPC Flow Logs ingestion with observable backlog/checkpoint changes |
| SP-095 | APL | Security normalization, data model, ES reporting/detection and verification |
| SP-096 | APL | Reviewed SHC app change, deployer distribution and healthy member state |
| SP-097 | Erie | Diagnose fleet inventory/server-class/version drift and controlled recovery |
| SP-098 | Erie | Restore Windows event collection without damaging unaffected cohorts |
| SP-099 | Erie | Resolve storage/retention/cluster conditions and verify searchable data |
| SP-100 | Erie | Reviewed source-to-ingestion-to-scheduled-report production change |

Each fixture must compose working primitives from earlier milestones, carry its
own version/seed, and run in an isolated learner attempt. APL and Erie must produce
different operational failures and deployment paths. Do not materialize tens of
thousands of full host filesystems. Use columnar cohorts and sparse overrides.

Acceptance includes successful solution, plausible incorrect recovery, no false
completion from a cosmetic action, preserved unrelated environment, reset, replay
and save/resume tests. New optional topology revisions require an explicit fixture
version and must not overwrite a previously saved profile.
