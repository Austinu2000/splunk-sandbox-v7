> Accepted for a separate V7 copy on October 27, 2026. The user explicitly requested duplication; V6 remains in place. The original brief below is preserved with trailing whitespace normalized. Work proceeds through its milestone review gates.

# SPLUNK ENGINEER SANDBOX — COMPLETE OPERATIONS & LEARNING EXPANSION

**Repository:** `Austinu2000/splunk-sandbox-v6`
**Baseline:** V6, `main` at `a9d4237`
**Status:** Revised implementation specification
**Scope:** Splunk engineering, Ansible, Git, Linux, practical training, APL and Erie environments
**Target operational reference:** Splunk Enterprise 9.4.1, with applicable Ansible documentation

---

# 1. OVERALL OBJECTIVE

Expand the existing Splunk Engineer Sandbox into a comprehensive, interactive training platform for learning the responsibilities of a Splunk engineer.

The application must support learning through realistic operational tasks—not only explanations, interview questions, or visual demonstrations.

The learner should be able to enter a simulated environment, receive an engineering assignment, investigate the infrastructure, perform the required task through Splunk Web or an appropriate CLI/configuration method, verify the results, and receive feedback.

Examples include:

- Creating and configuring new indexes.
- Creating summary indexes and scheduled reports.
- Onboarding new data sources.
- Developing and troubleshooting SPL searches.
- Building reports, dashboards, and alerts.
- Managing forwarders and Deployment Server configurations.
- Managing indexer clusters and Search Head Clusters.
- Troubleshooting ingestion and search performance.
- Managing KV Store, Enterprise Security, ITSI, SOAR, and supported integrations.
- Performing upgrades, migrations, backup, recovery, and security administration.
- Using Git and Ansible to automate Splunk infrastructure.
- Resolving APL- and Erie-themed production incidents.

Every implemented exercise must produce observable changes in the simulator.

## Curriculum target

| Curriculum | New lessons |
|---|---:|
| Existing Git, Ansible, advanced, and KV Store lessons | 27 retained |
| Ansible & Splunk Automation expansion | 50 |
| General Splunk Engineering expansion | 92 |
| APL and Erie engineering capstones | 8 |
| **Total planned interactive lessons** | **177** |

The 100 new Splunk engineering lessons are assigned stable IDs `SP-001` through `SP-100`.

The 50 new Ansible lessons retain IDs `AU-01` through `AU-50`.

All 27 existing lessons must be preserved without losing progress.

**Do not build a new learning progress dashboard.** Continue using the existing Learn section.

Creating and editing dashboards *inside Splunk Web* is still an essential engineering topic and remains in scope.

---

# 2. FOUNDATIONAL IMPLEMENTATION PRINCIPLES

## 2.1 Extend V6 rather than replacing it

Read and follow:

- `CLAUDE.md`
- `README.md`
- `SPEC.md`
- `PLAN.md`
- `docs/ANSIBLE-GIT-SPEC.md`
- `docs/V4-ANSIBLE-GIT-PLAN.md`
- `docs/V5-IMPLEMENTATION.md`
- `docs/V6-KVSTORE.md`
- `docs/TUTORIAL.md`
- `docs/V4-INTERVIEW-QUESTION-MAP.json`

Reuse the existing `World`, virtual filesystem, terminal interpreter, search engine, Git simulator, Ansible simulator, scenario engine, and lesson persistence system.

Relevant code includes:

- `packages/sim/src/`
- `packages/sim/src/spl/`
- `packages/sim/src/hosts/`
- `packages/sim/src/ansible/`
- `packages/sim/src/git/`
- `packages/sim/src/training/`
- `apps/web/src/replica/`
- `apps/web/src/pages/`
- `apps/server/src/`
- `lessons/`
- `profiles/`
- `scenarios/`

## 2.2 One shared operational state

**Splunk Web, CLI, configuration files, searches, reports, monitoring views, and lessons must refer to the same authoritative simulated state.**

The existing Web implementation has some settings and knowledge-object editing behavior stored primarily in browser-side practice data.

This must be upgraded wherever those objects are used for engineering exercises.

For example, creating an index through Splunk Web must affect the index catalog that the Splunk CLI, REST simulation, and search engine consult.

Creating a report through Splunk Web must produce a corresponding persistent knowledge object that can be inspected using the supported configuration or REST interface.

Do not create separate, contradictory copies of indexes, saved searches, or deployment state.

Existing browser-only user data must be migrated carefully, without silently discarding or overwriting saved work.

## 2.3 Teach both the GUI and CLI

For each relevant administrative workflow, provide:

- A Splunk Web route.
- A supported CLI, REST, or configuration-file route.
- An explanation of when each method is appropriate.
- A clear description of permissions and deployment scope.
- Resulting operational changes.
- Verification through an independent method.

Not every operation has an equivalent supported Splunk CLI command.

Where appropriate, teach direct `.conf` editing and REST API administration rather than inventing an unsupported CLI command.

## 2.4 Preserve the simulator's safety boundaries

The virtual terminal must remain an emulator.

Never execute learner-entered commands against the real operating system.

No user-controlled shell execution, arbitrary Python, unrestricted YAML/Jinja evaluation, real SSH, external Ansible jobs, or real Splunk configuration changes.

Offline operation must remain the default.

---

# 3. CORE SPLUNK ENGINEERING CAPABILITIES

## 3.1 Index Administration

Implement functional index administration through the simulated Splunk Web interface and supported CLI/configuration methods.

### Standalone indexer behavior

Provide a functional **Settings → Indexes** experience.

Support creating an events index through Splunk Web.

Support the documented simulated CLI form:

`$SPLUNK_HOME/bin/splunk add index <index_name>`

Support appropriate index listing, index-detail inspection, and REST-style operations where documented.

Implement the supported index settings, including:

- Index name
- Index type
- Home, cold, and thawed paths where applicable
- Retention time
- Size limits
- Disabled/enabled state where supported
- Configuration source
- Storage usage
- Index ownership and permissions

Use clear validation for invalid index names, paths, settings, and permissions.

### Clustered indexer behavior

On indexer-cluster peers, do not offer a falsely successful direct index-creation workflow through Splunk Web or `splunk add index`.

Teach learners to modify the Cluster Manager's `indexes.conf`, stage and validate a bundle, and distribute it through the native cluster configuration process.

The default training location for cluster-managed index definitions should be:

`$SPLUNK_HOME/etc/manager-apps/_cluster/local/indexes.conf`

Model `repFactor = auto` for new clustered indexes.

Teach the correct distinction between standalone and clustered index administration.

### Index lifecycle modeling

A newly created index must become available to appropriate searches and ingestion only after the correct configuration activation process.

Adding an index must not automatically generate arbitrary events.

Data must enter through simulated inputs, routing, or explicitly modeled teaching fixtures.

Model bucket stages, retention, index size, and storage behavior sufficiently for the related lessons.

Do not silently ignore unsupported index properties.

---

## 3.2 Summary Indexing

Summary indexing must receive dedicated functional treatment rather than being represented as an ordinary index with a different label.

Support the complete workflow:

1. Identify a reporting requirement.
2. Determine whether summary indexing is appropriate.
3. Create or select a destination index.
4. Write a suitable transforming search.
5. Save the search as a report.
6. Configure the report's execution schedule.
7. Enable summary indexing for that scheduled report.
8. Select the destination summary index.
9. Advance the simulation clock or execute the scheduled job.
10. Persist summary events.
11. Query the resulting summary index.
12. Compare the summarized output against the original source data.

Support appropriately scoped and documented functionality for:

- `collect`
- `addinfo`
- `sistats`
- `sitimechart`
- Summary-index-related `savedsearches.conf` settings
- Scheduled report execution
- Summary event metadata
- Scheduled job history
- Gaps and overlaps in collection windows
- Failed report execution
- Missing destination index
- Duplicate or incorrect summary data
- Summary-index retention

The simulator must distinguish between:

- Summary indexing
- Report acceleration
- Data model acceleration

These are separate concepts and must not be taught as interchangeable.

**Important:** Summary indexing requires a real destination index in the simulated catalog and a supported population mechanism. Saving a report alone must not instantly create summary events.

### Scheduled search configuration

Teach documented `savedsearches.conf` behavior, including scheduling and summary-index settings such as:

`action.summary_index = 1`

`action.summary_index._name = <index_name>`

Support equivalent behavior through the appropriate Splunk Web settings.

Do not invent a generic `splunk add report` CLI command.

Use configuration or REST-style administration for the non-Web route.

---

## 3.3 Saved Reports

Build on the existing Search & Reporting interface.

Support:

- Writing and executing an SPL search.
- Selecting time ranges.
- Saving a search as a report.
- Naming the report.
- Assigning its app and owner.
- Configuring sharing permissions.
- Scheduling a report.
- Editing the SPL.
- Editing report properties.
- Running a saved report.
- Viewing report execution history.
- Displaying statistics and supported visualizations.
- Disabling or deleting a report.
- Verifying the stored configuration.

A saved report must exist in shared knowledge-object state, not only a browser-side list.

Scheduling must be connected to the actual simulated scheduler.

When a scheduled job runs, it must execute the stored search against the appropriate simulated data/time range and retain a usable result or error record.

---

## 3.4 Data Onboarding

Support realistic data onboarding through the Splunk Web Add Data experience and through configuration files.

Teach:

- File monitoring
- Directory monitoring
- Windows Event Log inputs
- Syslog collection
- Heavy Forwarder routing
- HTTP Event Collector
- Simulated cloud inputs
- DB Connect concepts and supported inputs

Relevant configuration concepts:

- `inputs.conf`
- `outputs.conf`
- `props.conf`
- `transforms.conf`
- `deploymentclient.conf`
- `serverclass.conf`

Model data moving through the existing simulated pipeline.

A valid data onboarding operation should be observable through:

- Forwarder inputs
- Routing destinations
- Index assignment
- Sourcetype assignment
- Parsed events
- Search results
- Forwarder or Heavy Forwarder logs
- Relevant monitoring indicators

---

## 3.5 SPL and Search Engineering

Expand practical SPL instruction substantially.

Include:

- Base searches
- Indexed fields
- Filtering
- Boolean operators
- Time ranges
- `stats`
- `eventstats`
- `streamstats`
- `timechart`
- `chart`
- `eval`
- `rex`
- `where`
- `lookup`
- `inputlookup`
- `outputlookup`
- `join`
- `append`
- `transaction`
- `tstats`
- Search macros
- Data models
- Search performance analysis

Only mark a command as supported when the simulator executes the lesson's actual required semantics correctly.

For unsupported or partial commands, either extend the parser and engine or explicitly defer the associated lesson.

Do not return predetermined results based on matching a lesson-specific SPL string.

---

## 3.6 Dashboards and Alerts

Expand existing Splunk Web dashboard and report features to support functional engineering lessons.

Teach:

- Creating Classic dashboards
- Working with supported Simple XML
- Dashboard Studio fundamentals
- Creating panels from reports
- Dashboard tokens
- Search-driven visualizations
- Scheduled alerts
- Real-time alert concepts
- Trigger conditions
- Throttling
- Alert actions
- Permissions and sharing
- Troubleshooting failed scheduled searches

These are Splunk engineering functions, not the deferred learning-progress dashboard.

User-created dashboards, alerts, and reports must persist through the existing application state system.

---

## 3.7 Platform Administration and Operations

Expand the simulator's operational fidelity for:

- Splunk service management
- App configuration precedence
- `btool`
- Deployment Server administration
- Indexer clustering
- Search Head clustering
- Cluster Manager bundles
- SHC Deployer bundles
- KV Store
- Monitoring Console
- License management
- Queue monitoring
- Search scheduler activity
- Storage and retention
- SmartStore concepts
- Certificate administration
- Upgrade procedures
- Backup and recovery

Every administrative procedure must distinguish between modifying files on disk and activating their configuration.

---

# 4. NEW SPLUNK ENGINEERING LESSON LIBRARY

**Create 100 new lessons, SP-001 through SP-100.**

These must be real exercises using the simulator.

The lesson catalog below is mandatory. Individual lessons can be refined during implementation, but the scope, numbering, and core objectives must remain intact.

## Track 1 — Splunk Architecture and Administration Basics

**6 lessons**

| ID | Lesson |
|---|---|
| SP-001 | Splunk Architecture: Forwarders, Indexers, Search Heads, and Management Components |
| SP-002 | Navigating Splunk Web as an Engineer |
| SP-003 | Understanding Splunk Services, Ports, and the Splunk CLI |
| SP-004 | Understanding Splunk App Directories and Configuration Precedence |
| SP-005 | Using `btool` to Inspect Effective Configuration |
| SP-006 | Permissions, Roles, App Context, and Administrative Scope |

Include both GUI and terminal exercises where applicable.

The final exercise should require learners to identify the source of a configuration setting and explain which component owns it.

## Track 2 — Index Creation, Configuration, and Data Lifecycle

**10 lessons**

| ID | Lesson |
|---|---|
| SP-007 | Create Your First Events Index Through Splunk Web |
| SP-008 | Create and Inspect an Index Through the CLI |
| SP-009 | Understand Events Indexes, Metrics Indexes, and Summary Indexes |
| SP-010 | Configure an Index Using `indexes.conf` |
| SP-011 | Configure Index Retention and Storage Limits |
| SP-012 | Understand Hot, Warm, Cold, Frozen, and Thawed Data |
| SP-013 | Create a New Clustered Index Through the Cluster Manager |
| SP-014 | Validate and Deploy a Clustered Index Configuration Bundle |
| SP-015 | Route a New Data Source Into a Custom Index |
| SP-016 | Troubleshoot Missing, Incorrect, or Unauthorized Index Access |

### Mandatory hands-on example

The learner receives this request:

> Create an index named `application_logs`, configure its retention, and make it available to the appropriate data source.

The learner must complete the task first through the supported Splunk Web workflow in a standalone-indexer environment.

A separate lesson must teach the CLI approach.

For a clustered environment, the learner must use the Cluster Manager configuration-bundle approach instead.

Successful completion requires the index to exist in the correct effective configuration and to be independently verifiable.

## Track 3 — Data Ingestion, Parsing, and Troubleshooting

**9 lessons**

| ID | Lesson |
|---|---|
| SP-017 | Onboard a Linux Log File Through Splunk Web |
| SP-018 | Create and Troubleshoot Monitoring Inputs |
| SP-019 | Configure and Test an HTTP Event Collector Input |
| SP-020 | Understand Forwarder, Heavy Forwarder, and Indexer Processing |
| SP-021 | Configure Timestamp Extraction |
| SP-022 | Troubleshoot Event Line Breaking |
| SP-023 | Configure Sourcetypes and Field Extraction |
| SP-024 | Route Events to Indexes Using Supported Configuration |
| SP-025 | Diagnose a Broken Data Ingestion Pipeline |

Lessons must show where parsing and routing occur, why configuration placement matters, and how to verify ingestion.

## Track 4 — Forwarders, Deployment Server, and Heavy Forwarders

**9 lessons**

| ID | Lesson |
|---|---|
| SP-026 | Install and Verify a Universal Forwarder |
| SP-027 | Configure `deploymentclient.conf` |
| SP-028 | Create and Manage Deployment Server Classes |
| SP-029 | Configure `outputs.conf` and Receiving Ports |
| SP-030 | Understand Heavy Forwarder Deployment and Routing |
| SP-031 | Onboard and Troubleshoot Windows Event Logs |
| SP-032 | Investigate Deployment Server Phone-Home Problems |
| SP-033 | Perform a Controlled Forwarder Upgrade |
| SP-034 | Troubleshoot Forwarder TLS, Certificates, and Connection Failures |

Where a lesson overlaps with Ansible, allow a native-administration route and a supported automation route.

Do not duplicate the same content without adding a different learning objective.

## Track 5 — SPL, Reports, Summary Indexing, and Search Optimization

**12 lessons**

| ID | Lesson |
|---|---|
| SP-035 | Build and Filter an SPL Search |
| SP-036 | Create Statistical Reports with `stats` and `timechart` |
| SP-037 | Extract and Transform Fields with `rex` and `eval` |
| SP-038 | Enrich Searches Using Lookups |
| SP-039 | Inspect Search Jobs and Search Performance |
| SP-040 | Create and Save a Report Through Splunk Web |
| SP-041 | Create or Manage a Report Through Configuration or REST |
| SP-042 | Schedule a Report and Verify Its Execution |
| SP-043 | Understand Summary Indexing Versus Search Acceleration |
| SP-044 | Create and Configure an Index for Summary Data |
| SP-045 | Populate a Summary Index Using a Scheduled Report in Splunk Web |
| SP-046 | Configure, Query, and Troubleshoot Summary Indexing Through CLI/Configuration |

### Required report and summary-index project

The learner is assigned an operational reporting task:

> Create a report showing hourly application errors, summarize the results into a dedicated index, and make the summarized report usable over a longer time range.

The project must include:

**Phase A — Search development**

Write a working search against an existing simulated application index.

Example:

```spl
index=app sourcetype=app_log
| timechart span=1h count(eval(status>=500)) AS errors
```

The simulator must either support the exact expression used or provide an equivalent supported expression with correct semantics.

**Phase B — Report creation**

Save the search as a report through Splunk Web.

Verify its name, owner, app, permissions, search string, and time range.

**Phase C — Summary index**

Create the destination index using the appropriate standalone or clustered workflow.

**Phase D — Scheduling**

Configure an appropriate execution interval and summary-index population behavior.

**Phase E — Verification**

Advance the simulation clock, inspect scheduled search history, and confirm that summary events were written.

**Phase F — Reporting**

Run a search against the summary index and compare results against the original source data.

**Phase G — Troubleshooting**

Introduce a problem such as:

- Missing destination index
- Wrong schedule
- Incorrect time window
- Duplicate summary results
- No summary events
- Insufficient index permissions

The learner must diagnose and resolve the issue.

The simulator must not mark the lesson complete merely because a report and an index exist. The actual scheduled summary-index population and verification must succeed.

## Track 6 — Dashboards, Alerts, and Knowledge Objects

**8 lessons**

| ID | Lesson |
|---|---|
| SP-047 | Create a Dashboard Through Splunk Web |
| SP-048 | Create Dashboard Studio Visualizations and Inputs |
| SP-049 | Inspect and Edit Supported Dashboard Source |
| SP-050 | Create a Scheduled Alert |
| SP-051 | Configure Trigger Conditions, Actions, and Throttling |
| SP-052 | Troubleshoot Noisy or Missing Alerts |
| SP-053 | Investigate Scheduled Search Failures |
| SP-054 | Configure Knowledge Object Permissions and Sharing |

At least one lesson must create a dashboard from a previously saved report.

At least one must diagnose why a dashboard panel produces no results.

## Track 7 — Indexer Clustering

**7 lessons**

| ID | Lesson |
|---|---|
| SP-055 | Understand Cluster Manager, Peers, RF, and SF |
| SP-056 | Inspect and Configure Cluster Membership |
| SP-057 | Validate and Apply a Cluster Configuration Bundle |
| SP-058 | Perform an Indexer Rolling Restart Safely |
| SP-059 | Understand Multisite Replication and Searchability |
| SP-060 | Explore SmartStore, S3, and Cache Management |
| SP-061 | Recover an Unhealthy Indexer Cluster |

The exercises must use the existing cluster health and bucket models.

## Track 8 — Search Head Clustering and KV Store

**7 lessons**

| ID | Lesson |
|---|---|
| SP-062 | Understand SHC Members and Captain Election |
| SP-063 | Deploy SHC Applications Through the Deployer |
| SP-064 | Diagnose Search Head Configuration and Knowledge Object Differences |
| SP-065 | Create and Manage KV Store Collections |
| SP-066 | Understand KV Store Engine Migration and Upgrade Preparation |
| SP-067 | Troubleshoot KV Store Replication |
| SP-068 | Back Up and Restore KV Store Data |

Reuse the V6 KV Store implementation and current K-series lessons.

New SP lessons must extend those skills into more complete engineering workflows rather than repeating basic collection creation.

## Track 9 — Monitoring, Performance, and Troubleshooting

**8 lessons**

| ID | Lesson |
|---|---|
| SP-069 | Use the Monitoring Console to Investigate Health |
| SP-070 | Understand Splunk Queues and Processing Bottlenecks |
| SP-071 | Diagnose Missing Logs from Source to Search |
| SP-072 | Investigate Unexpected Ingestion and License Usage |
| SP-073 | Troubleshoot Disk Usage and Data Retention |
| SP-074 | Investigate Skipped Searches and Scheduler Capacity |
| SP-075 | Use Internal Logs, Metrics, and Audit Evidence |
| SP-076 | Optimize an Expensive Search or Dashboard |

Each lesson must have a reproducible performance or operational condition, not merely a static metric.

## Track 10 — Security, CIM, ES, and SOAR

**6 lessons**

| ID | Lesson |
|---|---|
| SP-077 | Normalize Security Events to CIM |
| SP-078 | Understand Data Model Acceleration and `tstats` |
| SP-079 | Create and Troubleshoot an Enterprise Security Detection |
| SP-080 | Investigate a SOAR-to-ServiceNow Automation Failure |
| SP-081 | Configure and Troubleshoot SAML, LDAP, and RBAC |
| SP-082 | Validate Splunk Access Controls, TLS, and Security Settings |

These lessons must use meaningful synthetic security events and configurations.

Do not simulate an Enterprise Security outcome simply by returning a canned detection result.

## Track 11 — Cloud Ingestion, Cribl, OpenTelemetry, and ITSI

**6 lessons**

| ID | Lesson |
|---|---|
| SP-083 | Onboard and Troubleshoot AWS VPC Flow Logs |
| SP-084 | Ingest and Correlate Application Traces with OpenTelemetry |
| SP-085 | Troubleshoot a Cribl Routing or Persistent Queue Issue |
| SP-086 | Configure and Troubleshoot a DB Connect Data Source |
| SP-087 | Investigate ITSI KPIs, Dependencies, and Service Health |
| SP-088 | Correlate Infrastructure Logs, Application Errors, and Service Impact |

Use the existing simplified AWS, HEC, Cribl, OpenTelemetry, and ITSI models where possible.

Add only the capabilities needed for the supported lessons, and document remaining boundaries clearly.

## Track 12 — Upgrades, Maintenance, and Disaster Recovery

**4 lessons**

| ID | Lesson |
|---|---|
| SP-089 | Plan a Splunk Upgrade and Validate Prerequisites |
| SP-090 | Execute a Controlled Splunk Upgrade Workflow |
| SP-091 | Back Up Configuration and Recover from a Failed Change |
| SP-092 | Troubleshoot Certificate Rotation and Restore Connectivity |

Teach distinctions between configuration rollback, package downgrade, backup restoration, and service recovery.

Do not treat these as interchangeable.

## Track 13 — APL and Erie Engineering Capstones

**8 lessons**

| ID | Lesson |
|---|---|
| SP-093 | APL: Onboard and Normalize FortiGate Security Logs |
| SP-094 | APL: Diagnose an AWS VPC Flow Logs Ingestion Failure |
| SP-095 | APL: Build an ES/CIM Security Reporting and Detection Workflow |
| SP-096 | APL: Perform a Controlled Search Head Cluster Change |
| SP-097 | Erie: Investigate Large-Scale Forwarder Deployment Drift |
| SP-098 | Erie: Troubleshoot Missing Windows Event Logs |
| SP-099 | Erie: Diagnose Indexer Storage, Retention, and Cluster Health |
| SP-100 | Erie: Execute a Complete Source-to-Report Production Change |

These capstones must integrate multiple engineering capabilities.

They are not intended to be isolated command tutorials.

---

# 5. APL ENVIRONMENT REQUIREMENTS

APL must have a meaningful engineering curriculum rather than functioning as a generic environment with a different organization name.

Use the existing APL profile as the starting implementation fixture.

Before changing its topology, review the profile's existing placeholders and any user-confirmed requirements. Do not silently replace saved worlds or treat historical placeholders as verified infrastructure facts.

Create optional, versioned profile refinements if a more historically faithful topology is desired.

## Required APL learning areas

- Security-focused data ingestion
- FortiGate sourcetype and timestamp handling
- Symantec Endpoint Protection/CIM mapping
- AWS VPC Flow Logs
- Syslog and OT data collection
- Heavy Forwarder troubleshooting
- Search Head Cluster deployments
- Enterprise Security searches and detections
- Data model acceleration
- KV Store maintenance
- SAML/RBAC
- SOAR/ServiceNow integrations
- Cribl evaluation and routing
- Cluster maintenance and recovery

### Example APL end-to-end task

A security analyst reports that FortiGate events are arriving but aren't populating the expected security data model.

The learner must:

1. Investigate the input and relevant sourcetype.
2. Determine whether events are reaching the correct index.
3. Inspect parsing and timestamp behavior.
4. Validate field extraction.
5. Map required CIM fields.
6. Verify the relevant data model.
7. Investigate acceleration where applicable.
8. Run a search demonstrating the corrected data.
9. Produce or repair a security report.
10. Document the root cause and validation evidence.

Completion must depend on the actual simulated data path and resulting events.

---

# 6. ERIE ENVIRONMENT REQUIREMENTS

Erie must emphasize scale, forwarder fleet operations, data quality, retention, and large distributed deployment administration.

Use `profiles/erie.yaml` as the initial fixture, retaining its explicitly marked unconfirmed values until reviewed.

## Required Erie learning areas

- Large Universal Forwarder fleet administration
- Multiple Deployment Server operations
- Windows Event Log ingestion
- Deployment Server phone-home storms
- Server-class distribution
- Forwarder version drift
- Ansible upgrade orchestration
- TLS/certificate administration
- Linux and Windows data collection
- Heavy Forwarder routing
- DB Connect inputs
- Storage pressure and retention
- Multisite cluster troubleshooting
- Reporting and scheduled search performance
- Operational monitoring and incident recovery

### Example Erie end-to-end task

An operations team reports that Windows Event Log ingestion has dropped for a subset of managed servers.

The learner must:

1. Identify affected hosts.
2. Compare the reported fleet against the inventory.
3. Inspect Deployment Server configuration.
4. Check phone-home status.
5. Investigate server-class matching.
6. Verify installed applications.
7. Inspect Windows Event Log inputs.
8. Check output routing and connectivity.
9. Correct the actual problem.
10. Verify newly delivered events in Splunk.
11. Confirm that unaffected hosts remain healthy.
12. Prepare an operational incident summary.

Use existing scalable fleet representations rather than creating tens of thousands of unnecessary individual objects.

---

# 7. DUAL-PATH LESSON DESIGN: WEB AND CLI

Every relevant lesson must specify the supported interaction paths.

| Administrative task | Splunk Web path | CLI/configuration path |
|---|---|---|
| Create standalone index | Settings → Indexes | `splunk add index` |
| Create clustered index | Read-only/inspection as appropriate | Cluster Manager `indexes.conf` and bundle |
| Create report | Search → Save As Report | `savedsearches.conf` or supported REST |
| Schedule report | Report/settings interface | `savedsearches.conf` or supported REST |
| Populate summary index | Scheduled report summary-index settings | Configured saved search or supported `collect` operation |
| Onboard a file | Add Data | `inputs.conf` |
| Configure forwarder outputs | Applicable management views | `outputs.conf` |
| Manage deployment apps | Forwarder Management | DS apps and `serverclass.conf` |
| Deploy SHC apps | Applicable monitoring/inspection | Deployer bundle workflow |
| Inspect configuration | Applicable Settings view | `splunk btool ... --debug` |
| Create dashboard | Dashboard interface | Supported dashboard source configuration |

Where a workflow is restricted by deployment type, the simulator must enforce that restriction.

### Shared outcome requirement

The UI and CLI must not use separate fake implementations.

For example:

- A report created through Web must be visible to the REST/configuration simulation.
- A supported configuration change applied through CLI must appear in the Web listing.
- Index creation must update the shared index catalog.
- A saved scheduled report must execute against the shared search engine.
- A dashboard panel must use actual results from its search.

---

# 8. ANSIBLE & GIT EXPANSION — RETAINED SCOPE

Retain all functional requirements previously approved for the Ansible expansion.

## 8.1 New Automation Operations section

Route: `#/automation`

Required tabs:

- Inventory
- Playbooks & Roles
- Deployment Center
- Run History
- Troubleshooting

Do not introduce a new learning-progress dashboard.

## 8.2 Inventory functionality

Implement accurate simulated behavior for:

- `ansible --version`
- `ansible-config dump`
- `ansible-inventory --graph`
- `ansible-inventory --list`
- `ansible-inventory --host`
- `ansible all --list-hosts`
- `ansible all -m ping`

Support inventory groups, variables, host inspection, configuration discovery, and drift detection.

## 8.3 Playbook functionality

Provide meaningful, supported playbooks for:

- Connectivity validation
- Forwarder installation
- Forwarder upgrades
- Output configuration
- Deployment Server changes
- Cluster Manager bundles
- SHC Deployer bundles
- Rolling restarts
- Configuration drift
- Certificate operations
- Splunk post-deployment validation

Support the documented training subset of tasks, roles, variables, templates, handlers, check mode, diff mode, serial batches, failure controls, and idempotency.

## 8.4 Native Splunk deployment integration

Ansible must orchestrate Splunk changes through the appropriate management component.

- Indexer cluster configuration through the Cluster Manager.
- SHC app configuration through the SHC Deployer.
- Forwarder app configuration through the Deployment Server where appropriate.
- Direct host administration for supported host-specific tasks.

Model validation, applying changes, restart requirements, service recovery, and rollback.

## 8.5 Change management

Preserve and improve:

- Feature branches
- Commits
- Pull requests
- Review approval
- Configuration validation
- Dry-run evidence
- Deployment revision tracking
- Controlled apply
- Post-deployment verification
- Recovery

A source-code change or Git revert must not automatically alter the running Splunk configuration.

## 8.6 Previously approved 50 AU lessons

Retain the entire existing Ansible curriculum.

| Track | Lesson IDs | Lessons |
|---|---|---|
| Ansible/Linux fundamentals | AU-01–AU-06 | Control nodes, SSH, Linux navigation, permissions, Ansible configuration, connectivity |
| Inventory | AU-07–AU-14 | Inventory discovery, groups, graph, variables, limits, environments, drift |
| Playbooks and roles | AU-15–AU-22 | YAML, tasks, modules, roles, handlers, templates, dry runs, idempotency, errors |
| Git and change management | AU-23–AU-27 | Git/Ansible integration, commits, branches, PRs, validation, rollback |
| Forwarder automation | AU-28–AU-35 | UF installation, deployment clients, outputs, server classes, batches, failure recovery |
| Cluster automation | AU-36–AU-43 | RF/SF, bundle validation, indexer restart, SHC deployer, cluster recovery |
| Enterprise troubleshooting | AU-44–AU-50 | Unreachable hosts, drift, handlers, preflight, partial upgrades, full change requests, final assessment |

Preserve the original 50 lesson objectives, numbering, outcome checks, and difficulty progression.

New SP lessons may share technical models and incidents with AU lessons, but must not duplicate lessons without adding a different skill.

---

# 9. LEARNING EXPERIENCE REQUIREMENTS

All 150 proposed new lessons must be fully interactive.

## 9.1 Four learning levels

**Level 1 — Guided:** Explain concepts, commands, and expected behavior step by step.

**Level 2 — Practical:** Give the task and expected result, with optional hints.

**Level 3 — Troubleshooting:** Seed an operational problem and require diagnosis and recovery.

**Level 4 — Enterprise:** Provide realistic production-style work with limited or no guidance.

## 9.2 Lesson structure

Every lesson must define:

- Stable ID
- Title
- Track
- Learning objectives
- Supported environment
- Difficulty
- Prerequisites
- Required simulator capabilities
- Initial fixture/setup
- Practical tasks
- Supported interface paths
- Hints
- Documentation references
- Outcome-based checks
- Completion criteria
- Feedback and explanation
- Reset behavior
- Saved progress
- Versioned fixture definition

## 9.3 Lesson completion

Completion must be based on verified results.

For example, a summary index lesson should verify:

- Correct index exists.
- Relevant report exists.
- Report has the expected search and schedule.
- Summary-index action is configured.
- Scheduled execution succeeded.
- Summary events were written.
- Events can be queried.
- The result satisfies the reporting objective.

Merely opening the report editor or running `collect` must not count as full completion.

## 9.4 Hints

Provide progressive hints.

A typical sequence:

1. Identify the affected system or feature.
2. Suggest a relevant command or configuration location.
3. Give a more specific diagnostic clue.
4. Show a solution walkthrough only when permitted.

Advanced challenges may disable hints.

## 9.5 Knowledge checks

Include concise conceptual questions within lessons and at the end of important tracks.

They must supplement, not replace, hands-on operational evaluation.

## 9.6 Persistence

Reuse the existing Learn section and lesson session mechanism.

Preserve:

- Free-practice sessions
- Learner-specific progress
- Completed lessons
- Saved attempts
- Notes
- Scores
- Hints used
- Existing G/A/X/K progress

Allow safe lesson reset and replay.

No separate progress dashboard.

---

# 10. EXISTING INTERVIEW QUESTION BANK INTEGRATION

The existing repository includes an interview question collection containing 235 source questions.

Build a curriculum coverage mapping between this existing question bank and the expanded lessons.

## Required functionality

For each relevant question, identify:

- Question ID
- Technical topic
- Difficulty
- Applicable lesson(s)
- Associated practical skill
- Suitable environment
- Applicable troubleshooting scenario
- Supporting documentation
- Whether simulator functionality exists

Do not make assumptions about the user's employment history from question wording.

## Required learning behavior

Where practical, transform knowledge questions into operational exercises.

For example:

**Question:** How does `btool` help troubleshoot Splunk configuration?

**Associated lab:** The learner finds a conflicting app setting, runs `btool` with source information, identifies the winning configuration, corrects the appropriate file, applies the change, and verifies the effective result.

Existing interview practice must remain available.

The new curriculum should complement it rather than replace it.

## Coverage audit

Provide an auditable report of:

- Questions covered by existing lessons
- Questions covered by new lessons
- Questions covered by practical incidents
- Questions requiring explanation only
- Questions not yet covered

Do not claim all 235 questions are functionally covered until the mapping and required lesson behavior have been verified.

---

# 11. SCENARIO AND PRACTICAL TRAINING INTEGRATION

Reuse the existing scenario engine.

Add generic scenario capabilities only when existing primitives are insufficient.

Do not hardcode behavior based on individual lesson IDs.

Support new incident categories including:

- Missing index
- Invalid index setting
- Wrong routing destination
- Incomplete summary index
- Scheduled report failure
- Broken dashboard search
- Missing Windows events
- Invalid sourcetype
- Failed field extraction
- Overloaded parsing queue
- Configuration precedence conflict
- Deployment Server mismatch
- Indexer cluster bundle failure
- SHC configuration drift
- KV Store inconsistency
- Excessive storage usage
- Expensive search
- Broken CIM mapping
- Forwarder certificate failure
- Failed upgrade
- Automation drift

Each scenario must include a verifiable resolution.

A learner should be able to solve it through supported simulator operations without relying on a predetermined answer button.

---

# 12. REQUIRED BACKEND ENHANCEMENTS

## 12.1 Index catalog

Add or extend a persistent operational index catalog supporting declared indexes, effective configuration, status, type, storage policy, appropriate permissions, and relevant statistics.

Search and ingestion must use this catalog.

## 12.2 Knowledge object engine

Unify relevant persistent knowledge objects:

- Reports
- Saved searches
- Alerts
- Dashboard definitions
- Search macros
- Lookups
- Applicable app/owner/sharing metadata

Where browser-only state currently exists, migrate it to the shared simulated model without losing existing user data.

## 12.3 Scheduler integration

The simulated scheduler must execute supported saved searches against simulated time.

Record:

- Scheduled execution
- Completion/failure
- Search time range
- Result count
- Relevant result data
- Summary-index writes
- Errors
- Skipped executions
- Backfill behavior where explicitly implemented

Avoid claim of complete Splunk scheduler fidelity unless all advertised functionality is actually modeled.

## 12.4 Data onboarding and index-write model

Allow supported configuration changes to affect which events are collected, parsed, indexed, and returned by search.

An index must not suddenly contain data simply because it was created.

Summary-index events must be traceable to a completed supported operation.

## 12.5 GUI/CLI consistency

Provide a shared service layer for mutations and inspection.

Do not implement Web actions as browser-only shortcuts while leaving the terminal unchanged.

## 12.6 Operational evidence

Record an ordered sequence of meaningful actions, configuration changes, checks, deployments, scheduler executions, and verified outcomes.

Lesson completion must use this evidence together with actual final state.

---

# 13. INTEGRATED DEVELOPMENT MILESTONES

The Ansible and Splunk lesson expansions must be coordinated.

Do not create all 150 new lesson files at once and claim the curriculum is finished.

Lessons are complete only after their underlying functionality, fixtures, and tests work.

## Milestone 0 — Shared Architecture and Persistence

- Audit current browser-only Settings and knowledge objects.
- Define shared operational data contracts.
- Design safe persistence migration.
- Define lesson fixture schema and coverage mapping.
- Document supported and unsupported feature boundaries.

**Gate:** Existing saved work is preserved and the architecture supports GUI/CLI consistency.

## Milestone 1 — Foundations and Inventory

- Ansible inventory and configuration fidelity.
- Splunk component inspection and CLI fundamentals.
- Configuration precedence.
- AU-01–AU-14.
- SP-001–SP-006.

**Gate:** Inventory, hosts, and effective configurations are inspectable and consistent.

## Milestone 2 — Indexes and Data Onboarding

- Functional index CRUD within documented scope.
- Standalone and clustered index creation.
- Index lifecycle model.
- Data inputs and parsing.
- SP-007–SP-025.

**Gate:** Learners can create an index, onboard a supported data source, and verify events in search.

## Milestone 3 — Reports, Searches, and Summary Indexing

- Shared saved-report storage.
- Report creation through Web and configuration/REST.
- Scheduled search execution.
- Summary-index population.
- Search optimization exercises.
- SP-035–SP-046.

**Gate:** Learners can create a report, schedule it, populate a summary index, and query accurate persisted results.

## Milestone 4 — Git, Ansible, and Playbook Execution

- Playbook interpreter improvements.
- Correct starter roles.
- Git-to-Ansible workflows.
- Dry runs, handlers, idempotency, and validations.
- AU-15–AU-27.

**Gate:** Source changes and Ansible execution produce accurate configuration outcomes.

## Milestone 5 — Forwarder and Deployment Server Operations

- UF installation and upgrades.
- Deployment Server app lifecycle.
- Heavy Forwarder administration.
- Phone-home and server-class behavior.
- AU-28–AU-35.
- SP-026–SP-034.

**Gate:** Forwarder and deployment exercises modify actual simulated fleet behavior.

## Milestone 6 — Dashboards and Alerts

- Functional report-to-dashboard workflow.
- Supported dashboards and tokens.
- Scheduled alerts and trigger evaluation.
- Sharing and permissions.
- SP-047–SP-054.

**Gate:** Created knowledge objects work against shared simulated searches and persist across sessions.

## Milestone 7 — Cluster Administration

- Enterprise Automation Lab topology.
- Cluster Manager bundles.
- SHC Deployer bundles.
- Cluster health and recovery.
- KV Store integration.
- AU-36–AU-43.
- SP-055–SP-068.

**Gate:** Safe and unsafe cluster operations produce meaningful, verifiable consequences.

## Milestone 8 — Monitoring, Security, and Integrations

- Monitoring and performance behavior.
- Search and ingestion troubleshooting.
- ES/CIM/SOAR.
- Cloud ingestion.
- Cribl, OpenTelemetry, and supported ITSI.
- SP-069–SP-088.

**Gate:** The operational incidents have functioning data, health, and recovery models.

## Milestone 9 — Upgrades and Advanced Automation

- Upgrade planning and execution.
- Recovery behavior.
- Certificates.
- Enterprise change controls.
- AU-44–AU-50.
- SP-089–SP-092.

**Gate:** Advanced operational workflows can be completed and scored safely.

## Milestone 10 — APL and Erie Capstones

- Eight integrated SP capstones.
- Environment-specific incident fixtures.
- Profile validation and isolation.
- End-to-end project exercises.
- SP-093–SP-100.

**Gate:** APL and Erie exercises involve genuinely different infrastructure problems and workflows.

## Milestone 11 — Curriculum Audit and Final Validation

- Confirm all 150 new lessons exist and function.
- Verify existing 27 lessons still work.
- Complete the 235-question coverage mapping.
- Validate free-practice isolation.
- Test save/load, reset, replay, and migrations.
- Run full regression suite.
- Publish implementation documentation.
- Identify remaining unsupported vendor features.

**Gate:** Every accepted lesson has passing functional, failure, reset, and persistence tests.

Stop after each milestone for review.

---

# 14. TEST REQUIREMENTS

Every new lesson must have an automated solution-path test.

Required lesson checks:

1. Initial fixture loads.
2. Required commands or UI operations are supported.
3. A valid solution changes the expected state.
4. Incorrect actions fail appropriately.
5. Superficial command execution does not falsely complete the lesson.
6. Final verification detects the correct outcome.
7. Reset restores the original fixture.
8. Save/resume preserves the attempt.
9. Unrelated environments and sessions remain unchanged.

## Additional integration tests

### Indexes

- Web creation is visible in CLI inspection.
- CLI creation is visible in Web.
- Clustered index creation uses the Cluster Manager.
- Invalid or conflicting settings are rejected.
- Correct routing produces searchable events.

### Summary indexing

- Saved report persists.
- Schedule executes correctly.
- Summary events are written only after successful execution.
- Incorrect destination fails.
- Duplicate schedules and overlapping windows can be diagnosed.
- Report and summary results are consistent within supported semantics.

### Splunk operations

- Configuration precedence is respected.
- Required restarts/reloads activate the correct settings.
- Cluster bundle validation and application work.
- Forwarder configuration affects delivery.
- Monitoring views reflect operational changes.

### Ansible and Git

- Inventory targeting is accurate.
- Dry-run mode does not mutate operational state.
- Idempotent tasks converge.
- Changes can be reviewed and deployed.
- Failed or unsafe operations are recorded.
- Recovery produces verifiable outcomes.

### Persistence

- Existing lessons still load.
- Existing sessions survive migration.
- APL and Erie states remain isolated.
- New knowledge objects persist.
- Saved reports and indexes survive restart.
- Learner progress remains intact.

Use the existing Vitest, TypeScript, lint, and build workflows.

Performance tests must cover large simulated forwarder populations without unnecessary per-host materialization.

---

# 15. DOCUMENTATION DELIVERABLES

Create and maintain appropriate versioned documentation, including:

- `docs/V7-CONSOLIDATED-BUILD-SPEC.md`
- `docs/V7-SPLUNK-ENGINEERING-LESSONS.md`
- `docs/V7-ANSIBLE-OPERATIONS.md`
- `docs/V7-REPORTS-AND-SUMMARY-INDEXING.md`
- `docs/V7-APL-ERIE-CAPSTONES.md`
- `docs/V7-IMPLEMENTATION-STATUS.md`
- `docs/V7-INTERVIEW-QUESTION-COVERAGE.md`

Each lesson must link to relevant version-appropriate official documentation.

Document intentional simulator simplifications.

The existing V6 application must not be renamed or migrated to a new version merely because the proposed documentation uses a V7 planning prefix.

---

# 16. FINAL ACCEPTANCE CRITERIA

The expansion is complete only when:

- [ ] All 100 SP lessons are implemented and functional.
- [ ] All 50 AU lessons are implemented and functional.
- [ ] The existing 27 lessons remain accessible.
- [ ] Splunk Web and supported CLI/configuration workflows use shared state.
- [ ] Standalone index creation is functional.
- [ ] Clustered index creation follows the Cluster Manager workflow.
- [ ] New data sources can be routed into newly created indexes.
- [ ] Reports can be created, saved, edited, and executed.
- [ ] Supported scheduled reports run against the simulated environment.
- [ ] Summary indexes receive and store actual simulated results.
- [ ] Summary data can be searched and validated.
- [ ] Supported dashboard and alert workflows function.
- [ ] Data ingestion and parsing exercises affect actual simulated events.
- [ ] Forwarder and Deployment Server workflows function.
- [ ] Indexer and Search Head Cluster exercises function.
- [ ] APL and Erie have meaningful environment-specific exercises.
- [ ] All lesson fixtures are deterministic.
- [ ] Lesson completion is outcome-based.
- [ ] Learner progress persists.
- [ ] Lesson resets do not damage free practice.
- [ ] Existing Git, Ansible, Splunk, and KV Store behavior remains compatible.
- [ ] No new learning-progress dashboard has been created.
- [ ] No simulated command reaches the real operating system or production infrastructure.
- [ ] Tests and implementation documentation accurately reflect delivered functionality.

---

# 17. FINAL CODING AGENT DIRECTIVE

Expand the current Splunk Engineer Sandbox V6 into a comprehensive hands-on Splunk engineering training environment.

Do not focus exclusively on Ansible.

Splunk Web administration, CLI configuration, ingestion, indexing, reporting, summary indexing, clustering, forwarder management, monitoring, troubleshooting, security, and change management must receive equally meaningful treatment.

Preserve and improve the existing simulator rather than starting over.

The 150 new lessons are mandatory deliverables, but lessons must not be implemented ahead of their required working functionality.

For each milestone:

1. Inspect the existing implementation.
2. Identify the required real-world behavior and official documentation.
3. Implement the supported simulation operations.
4. Connect the GUI, CLI, configuration, and underlying world state.
5. Implement the associated lessons.
6. Add correct initial fixtures and realistic failures.
7. Add outcome-based validation and feedback.
8. Test success, failure, reset, and persistence.
9. Verify the UI and terminal manually.
10. Document completed behavior and remaining limitations.

**Expected final experience:** A learner should be able to progress from not knowing how to create a Splunk index to independently completing complex enterprise changes, including summary-index reporting, data onboarding, clustered deployments, forwarder upgrades, and production incident recovery in the APL and Erie training environments.

Do not mark the work complete based on lesson counts, static instructions, or visual resemblance alone.

**Build functional operations first, integrate meaningful lessons alongside them, and verify that every exercise teaches a real Splunk engineering skill.**
