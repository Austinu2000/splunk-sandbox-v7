# V7 Splunk engineering lessons

Status: **5 of 100 new SP lessons implemented**. SP-001–SP-005 are executable in Learn; the remaining rows are planned. All existing 27 G/A/X/K entries remain in Learn with their inherited limitations. No new lesson is registered until its required operations and solution/failure/reset/resume/isolation tests pass.

`packages/sim/src/engineering/lesson-schema.ts` defines the versioned authoring contract. `docs/V7-CURRICULUM-PLAN.json` preserves stable IDs, milestones and planning status. Actual fixtures and per-lesson official references are authored alongside functionality, not fabricated in bulk.

| ID | Objective | Milestone | Status |
| --- | --- | --- | --- |
| SP-001 | Splunk Architecture: Forwarders, Indexers, Search Heads, and Management Components | 1 | Verified |
| SP-002 | Navigating Splunk Web as an Engineer | 1 | Verified |
| SP-003 | Understanding Splunk Services, Ports, and the Splunk CLI | 1 | Verified |
| SP-004 | Understanding Splunk App Directories and Configuration Precedence | 1 | Verified |
| SP-005 | Using `btool` to Inspect Effective Configuration | 1 | Verified |
| SP-006 | Permissions, Roles, App Context, and Administrative Scope | 1 | Planned |
| SP-007 | Create Your First Events Index Through Splunk Web | 2 | Planned |
| SP-008 | Create and Inspect an Index Through the CLI | 2 | Planned |
| SP-009 | Understand Events Indexes, Metrics Indexes, and Summary Indexes | 2 | Planned |
| SP-010 | Configure an Index Using `indexes.conf` | 2 | Planned |
| SP-011 | Configure Index Retention and Storage Limits | 2 | Planned |
| SP-012 | Understand Hot, Warm, Cold, Frozen, and Thawed Data | 2 | Planned |
| SP-013 | Create a New Clustered Index Through the Cluster Manager | 2 | Planned |
| SP-014 | Validate and Deploy a Clustered Index Configuration Bundle | 2 | Planned |
| SP-015 | Route a New Data Source Into a Custom Index | 2 | Planned |
| SP-016 | Troubleshoot Missing, Incorrect, or Unauthorized Index Access | 2 | Planned |
| SP-017 | Onboard a Linux Log File Through Splunk Web | 2 | Planned |
| SP-018 | Create and Troubleshoot Monitoring Inputs | 2 | Planned |
| SP-019 | Configure and Test an HTTP Event Collector Input | 2 | Planned |
| SP-020 | Understand Forwarder, Heavy Forwarder, and Indexer Processing | 2 | Planned |
| SP-021 | Configure Timestamp Extraction | 2 | Planned |
| SP-022 | Troubleshoot Event Line Breaking | 2 | Planned |
| SP-023 | Configure Sourcetypes and Field Extraction | 2 | Planned |
| SP-024 | Route Events to Indexes Using Supported Configuration | 2 | Planned |
| SP-025 | Diagnose a Broken Data Ingestion Pipeline | 2 | Planned |
| SP-026 | Install and Verify a Universal Forwarder | 5 | Planned |
| SP-027 | Configure `deploymentclient.conf` | 5 | Planned |
| SP-028 | Create and Manage Deployment Server Classes | 5 | Planned |
| SP-029 | Configure `outputs.conf` and Receiving Ports | 5 | Planned |
| SP-030 | Understand Heavy Forwarder Deployment and Routing | 5 | Planned |
| SP-031 | Onboard and Troubleshoot Windows Event Logs | 5 | Planned |
| SP-032 | Investigate Deployment Server Phone-Home Problems | 5 | Planned |
| SP-033 | Perform a Controlled Forwarder Upgrade | 5 | Planned |
| SP-034 | Troubleshoot Forwarder TLS, Certificates, and Connection Failures | 5 | Planned |
| SP-035 | Build and Filter an SPL Search | 3 | Planned |
| SP-036 | Create Statistical Reports with `stats` and `timechart` | 3 | Planned |
| SP-037 | Extract and Transform Fields with `rex` and `eval` | 3 | Planned |
| SP-038 | Enrich Searches Using Lookups | 3 | Planned |
| SP-039 | Inspect Search Jobs and Search Performance | 3 | Planned |
| SP-040 | Create and Save a Report Through Splunk Web | 3 | Planned |
| SP-041 | Create or Manage a Report Through Configuration or REST | 3 | Planned |
| SP-042 | Schedule a Report and Verify Its Execution | 3 | Planned |
| SP-043 | Understand Summary Indexing Versus Search Acceleration | 3 | Planned |
| SP-044 | Create and Configure an Index for Summary Data | 3 | Planned |
| SP-045 | Populate a Summary Index Using a Scheduled Report in Splunk Web | 3 | Planned |
| SP-046 | Configure, Query, and Troubleshoot Summary Indexing Through CLI/Configuration | 3 | Planned |
| SP-047 | Create a Dashboard Through Splunk Web | 6 | Planned |
| SP-048 | Create Dashboard Studio Visualizations and Inputs | 6 | Planned |
| SP-049 | Inspect and Edit Supported Dashboard Source | 6 | Planned |
| SP-050 | Create a Scheduled Alert | 6 | Planned |
| SP-051 | Configure Trigger Conditions, Actions, and Throttling | 6 | Planned |
| SP-052 | Troubleshoot Noisy or Missing Alerts | 6 | Planned |
| SP-053 | Investigate Scheduled Search Failures | 6 | Planned |
| SP-054 | Configure Knowledge Object Permissions and Sharing | 6 | Planned |
| SP-055 | Understand Cluster Manager, Peers, RF, and SF | 7 | Planned |
| SP-056 | Inspect and Configure Cluster Membership | 7 | Planned |
| SP-057 | Validate and Apply a Cluster Configuration Bundle | 7 | Planned |
| SP-058 | Perform an Indexer Rolling Restart Safely | 7 | Planned |
| SP-059 | Understand Multisite Replication and Searchability | 7 | Planned |
| SP-060 | Explore SmartStore, S3, and Cache Management | 7 | Planned |
| SP-061 | Recover an Unhealthy Indexer Cluster | 7 | Planned |
| SP-062 | Understand SHC Members and Captain Election | 7 | Planned |
| SP-063 | Deploy SHC Applications Through the Deployer | 7 | Planned |
| SP-064 | Diagnose Search Head Configuration and Knowledge Object Differences | 7 | Planned |
| SP-065 | Create and Manage KV Store Collections | 7 | Planned |
| SP-066 | Understand KV Store Engine Migration and Upgrade Preparation | 7 | Planned |
| SP-067 | Troubleshoot KV Store Replication | 7 | Planned |
| SP-068 | Back Up and Restore KV Store Data | 7 | Planned |
| SP-069 | Use the Monitoring Console to Investigate Health | 8 | Planned |
| SP-070 | Understand Splunk Queues and Processing Bottlenecks | 8 | Planned |
| SP-071 | Diagnose Missing Logs from Source to Search | 8 | Planned |
| SP-072 | Investigate Unexpected Ingestion and License Usage | 8 | Planned |
| SP-073 | Troubleshoot Disk Usage and Data Retention | 8 | Planned |
| SP-074 | Investigate Skipped Searches and Scheduler Capacity | 8 | Planned |
| SP-075 | Use Internal Logs, Metrics, and Audit Evidence | 8 | Planned |
| SP-076 | Optimize an Expensive Search or Dashboard | 8 | Planned |
| SP-077 | Normalize Security Events to CIM | 8 | Planned |
| SP-078 | Understand Data Model Acceleration and `tstats` | 8 | Planned |
| SP-079 | Create and Troubleshoot an Enterprise Security Detection | 8 | Planned |
| SP-080 | Investigate a SOAR-to-ServiceNow Automation Failure | 8 | Planned |
| SP-081 | Configure and Troubleshoot SAML, LDAP, and RBAC | 8 | Planned |
| SP-082 | Validate Splunk Access Controls, TLS, and Security Settings | 8 | Planned |
| SP-083 | Onboard and Troubleshoot AWS VPC Flow Logs | 8 | Planned |
| SP-084 | Ingest and Correlate Application Traces with OpenTelemetry | 8 | Planned |
| SP-085 | Troubleshoot a Cribl Routing or Persistent Queue Issue | 8 | Planned |
| SP-086 | Configure and Troubleshoot a DB Connect Data Source | 8 | Planned |
| SP-087 | Investigate ITSI KPIs, Dependencies, and Service Health | 8 | Planned |
| SP-088 | Correlate Infrastructure Logs, Application Errors, and Service Impact | 8 | Planned |
| SP-089 | Plan a Splunk Upgrade and Validate Prerequisites | 9 | Planned |
| SP-090 | Execute a Controlled Splunk Upgrade Workflow | 9 | Planned |
| SP-091 | Back Up Configuration and Recover from a Failed Change | 9 | Planned |
| SP-092 | Troubleshoot Certificate Rotation and Restore Connectivity | 9 | Planned |
| SP-093 | APL: Onboard and Normalize FortiGate Security Logs | 10 | Planned |
| SP-094 | APL: Diagnose an AWS VPC Flow Logs Ingestion Failure | 10 | Planned |
| SP-095 | APL: Build an ES/CIM Security Reporting and Detection Workflow | 10 | Planned |
| SP-096 | APL: Perform a Controlled Search Head Cluster Change | 10 | Planned |
| SP-097 | Erie: Investigate Large-Scale Forwarder Deployment Drift | 10 | Planned |
| SP-098 | Erie: Troubleshoot Missing Windows Event Logs | 10 | Planned |
| SP-099 | Erie: Diagnose Indexer Storage, Retention, and Cluster Health | 10 | Planned |
| SP-100 | Erie: Execute a Complete Source-to-Report Production Change | 10 | Planned |

Prerequisites and difficulty must be assigned per lesson rather than inferred from numbering. Four levels remain Guided, Practical, Troubleshooting and Enterprise. Checks must verify final world state and revision-bound evidence; merely opening a page or typing a command is insufficient.
