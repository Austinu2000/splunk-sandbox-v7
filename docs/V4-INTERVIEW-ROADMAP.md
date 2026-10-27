# V4 interview-driven implementation roadmap

Prepared October 26, 2026. Status: analysis and proposed backlog; no new runtime features or live tickets are implemented by this document.

## Recommendation

Make existing tickets better interview exercises first, then complete the planned Git/Ansible workflow and add deeper ingestion, cluster, and search behavior. Prioritize working diagnosis and observable recovery over adding more settings screens. The existing UI already exposes more features than the simulator can execute.

Keep the original Git/Ansible milestone numbers and tutorial lesson IDs. This roadmap adds interview requirements and a subsequent backlog; it does not replace the tutorial or mark pending milestones complete. See [the existing plan](V4-ANSIBLE-GIT-PLAN.md) and [delivered Milestone 1](V4-GIT-MILESTONE-1.md).

## Evidence and prioritization

Source: `Austin_Interview_Questions.docx`, supplied from the user's Downloads folder. Its introduction reports 69 transcripts, 44 sessions containing questions, and 462 raw question occurrences consolidated into 235 canonical questions. The source marks some wording as relayed or reconstructed with †; preserve that distinction.

The companion [question map](V4-INTERVIEW-QUESTION-MAP.json) records all 235 canonical questions, source paragraph positions, reported session counts, proposed workstreams, and selected related scenarios. IQ001–IQ235 are new planning references assigned in Part A order, not original document labels. Session counts overlap between questions: do not add them to claim a number of unique interviews covered. Their sum is 442; the document's separate raw-occurrence total is 462.

Priorities combine recurrence, current capability gaps, reusable simulation behavior, and prerequisites. Counts alone would over-prioritize introductory and recruiter questions that do not need infrastructure.

| Repeated question | Reported sessions | Planning implication |
| --- | ---: | --- |
| Cloud/on-premises/hybrid experience — IQ124 | 8 | Add a cloud boundary and migration exercise |
| Cribl experience — IQ115 | 6 | Extend routing into queue and recovery behavior |
| Owned architecture, scripting, dashboards, missing data — IQ001/135/167/153 | 5 each | Connect explanations to working environments and evidence |
| AWS integration and cloud migration — IQ126/125 | 4 each | Model ingestion failure and cutover verification |
| Ansible — IQ138; Git/CI — IQ139 | 3; 2 | Continue the already planned automation workflow |
| SHC out of sync, slow dashboards — IQ154/168 | 3 each | Model actual failure state and meaningful performance work |
| OpenTelemetry collectors — IQ094 | 4 | Add an observability track, especially for SRE interviews |

The source also has 45 architecture/admin questions, 21 onboarding/configuration questions, 21 ITSI/observability/OTel questions, and 18 scripting/automation questions. These are topic counts, not implementation completion targets.

## What exists and what needs depth

There are 24 scenario files across core, APL and Erie. Profiles expose different subsets; Lab currently has no incident catalog. Related scenarios in the question map indicate a starting point, not full question coverage.

| Area | Current capability | Required addition |
| --- | --- | --- |
| Missing data and configuration | Permissions, outputs, server classes, queues, line breaking, timestamps, btool and reload/restart effects | Variants, diagnostic branches, evidence-based follow-ups and recovery checks |
| Git/Ansible | Journaled Git, two repos, editors and automation host in Lab/APL | Code/PR/CI UI, Ansible execution, handlers, canaries and guided lessons remain planned |
| Cloud ingestion | APL AWS flow-log stall scenario | S3/SQS delivery state, virtual permissions, checkpoints, HEC outcomes and migration cutover |
| Cribl | Routing/drop configuration and derived metrics | Persistent queue contents, capacity, destination failures, drain and replay semantics |
| Clusters/storage | Simplified health, bundle, retention and disk indicators | Bucket copies, RF/SF, maintenance lifecycle, peer retirement/discovery, SHC and KV Store state |
| SPL and dashboards | Working limited SPL, generated lookups, job inspector and saved UI artifacts | Writable CSV lookups, more operators, acceleration/scheduling models and comparable query cost |
| ES/SOAR | CIM, acceleration, SAML and ServiceNow practice scenarios | Richer detections, enrichment, workflow failure and validation |
| Observability | Some platform health; APL industrial OT syslog | OTel collector pipelines, traces/spans, service dependencies, ITSI KPIs and detector behavior |

Industrial **OT** syslog is not **OpenTelemetry**. Likewise, a captured settings page or sample search in the replica catalog does not establish engine support.

## First: improve existing tickets

These are enhancements to existing scenario IDs, not duplicate incidents. Add the interview context without revealing the hidden cause in the learner's ticket.

| Existing ticket(s) | Interview questions | Add to the exercise and its completion criteria |
| --- | --- | --- |
| `input-permissions`, `forwarder-retired-indexer`, `ds-serverclass-typo` | IQ153/060/161/163 | Scope one host versus a class/site; trace source → input → output → receiving tier → search. Explain why the chosen check eliminates an alternative. Verify events resume after the required application step. |
| `event-line-breaking`, `timestamp-tz`, `apl-fortigate-sourcetype`, `apl-fortigate-timezone` | IQ072/078/079/080 | Supply raw sample events and expected event boundaries/times. Identify the parsing tier, show winning configuration, and verify new events without claiming historical data was rewritten. |
| `blocked-parsing-queue`, `apl-ot-udp-drops` | IQ030/156/157/162 | Distinguish delayed delivery from loss. Add a recovery window and verify source throughput, queue trend and searchable events agree. Requires richer queue/loss state before grading those details. |
| `license-noisy-debug`, `erie-wineventlog-volume` | IQ050/069 | Identify the noisy source, propose a scoped policy and preserve required events. A broad drop-all change must fail correctness even if license volume falls. |
| `erie-retention-capacity`, `erie-peer-disk-full` | IQ005/022/033 | Ask for retention-versus-capacity reasoning and safe relief. Grade bucket lifecycle/RF claims only after the cluster/storage model exists. |
| `apl-shc-bundle-push` | IQ154 | Separate app bundle mismatch from member/captain health. Preserve the existing app-distribution drill; add replication/captain variants only with new state. |
| `apl-idx-rolling-restart`, `erie-uf-upgrade-drift` | IQ010/031/138/143 | Record prechecks, scope, canary, rollout and rollback evidence. Correct maintenance completion before using the indexer drill for advanced safety scoring. |
| `apl-aws-flowlogs-stalled`, `apl-cribl-route` | IQ126/115/122 | Ask the learner to locate the broken hop and explain backlog recovery. Existing configuration fixes remain introductory; queue, IAM and replay variants depend on the ingestion pack. |
| `skipped-searches` | IQ059/168 | Explain scheduler contention, distinguish it from an inefficient individual search, and verify resumed execution. Add slow-dashboard variants after search-cost and panel execution models. |
| `apl-sep-cim`, `apl-es-dm-acceleration`, `apl-soar-servicenow`, `apl-saml-role-mapping` | IQ071/081/082/039/151 | Add field/enrichment examples, access scope, a failed downstream action and a redacted secret-handling explanation. Require outcome evidence rather than a changed setting alone. |

Every enhanced ticket should collect a concise stakeholder update, root cause with evidence, change and rollback plan, verification, and prevention. Follow with two or three interview questions: “What would you check next if this failed?”, “Why this component?”, and a question-specific tradeoff. Score technical recovery separately from explanation quality.

## Ordered implementation backlog

All items below are proposed. Effort is relative: small uses existing state; medium adds a bounded reusable model; large adds multiple interacting models. Do not treat these as time estimates.

| Order / backlog ID | Deliverable | Dependency and acceptance gate |
| --- | --- | --- |
| 1 / INT-01 — medium | Question-linked tickets, follow-ups and evidence scoring; begin with missing data, timestamps, parsing and licensing | Extend validated ticket/interview schemas. Failed commands, unrelated searches and post-fix checks must not earn pre-change safety credit. Preserve existing saves. |
| 1 / INT-02 — medium | Correct cluster completion and add reliable action evidence | Required before advanced rollout grading. Recovery must not require maintenance to remain enabled. Use stable event IDs and successful outcomes tied to target/revision/run. |
| 2 / INT-03 — large | Continue existing Milestones 2–3: Code, PRs, CI, deployment, Ansible foundation | IQ135–150/179. Pin reviews/checks to revisions; edits are not deployments; check mode predicts without changing live state; second identical run is unchanged; handlers restart only when appropriate. |
| 2 / INT-04 — small/medium | Exact lookup live-coding exercise | IQ054. Seed `employee_lookup.csv`; filter IT employees; write `it_employees.csv`; demonstrate overwrite versus append. Implement generic persisted lookup writes, not a special answer string. Preserve unrelated rows as required by the chosen mode. |
| 3 / INT-05 — large | Cloud and ingestion ticket pack | IQ124/125/126/060/153. Model virtual S3 objects, SQS delivery, permissions, checkpoints, duplicate handling and HEC requests. Add migration inventory, cutover, reconciliation and rollback. Logs/search/tickets must reflect the same pipeline state. |
| 3 / INT-06 — medium/large | Cribl persistent queues and recovery | IQ115/118/119/122. Reuse ingestion primitives. Bounded queues and destination failures must produce observable backlog and controlled drain; test loss/duplication. Teach replay availability from retained data and configured behavior, not an assumed unlimited history. |
| 4 / INT-07 — large | Cluster, SHC, storage and monitoring failures | IQ006/008/011/033/042/044/154/158/165/166. Add bucket-copy RF/SF, peer lifecycle, discovery, SHC health, KV Store sync and platform-monitor failure. Implement CLI/status commands from real state; validate accepted recovery and unsafe alternatives. |
| 5 / INT-08 — large | SPL and dashboard performance track | IQ046–059/167–172. Add eventstats/streamstats/chart first, then bounded tstats/acceleration, macros, summary jobs and relevant join/append/transaction behavior. Shared panel searches must preserve results while reducing deterministic work. |
| Role track / INT-09 — large | OpenTelemetry, ITSI and incident triage | IQ094–114/127/164. Collector receivers/processors/exporters, resource attributes and trace/span relationships feed service health, KPI/dependency and alert-noise exercises. Move ahead of INT-07/08 for observability-focused interviews. |
| Role track / INT-10 — medium/large | ES/SOAR detection and response depth | IQ081–093/151. Asset/identity enrichment, scoped detections, action permissions, incident handoff and recovery. Expand existing cases before creating a full security platform. |
| Alongside lessons / INT-11 — small | Architecture and experience answer practice | IQ001–004/173–194 plus selected screening prompts. Timed explanation, environment diagram, stakeholder updates and user-authored experience cards. Link training evidence while clearly distinguishing it from actual employment experience. |

Continue original Milestones 4–6 for learner isolation, the manual's G/A lessons, advanced Ansible and expert challenges. INT-02 precedes advanced rolling restart acceptance; INT-03 supplies automation foundations. New interview packs can reuse those facilities without renumbering the manual. INT-04 is an early bounded exercise that need not wait for the entire automation expansion.

Suggested new learner-facing ticket titles:

- “AWS logs stopped after a permissions change; the queue keeps growing.”
- “A HEC sender succeeds, but the expected index has no new events.”
- “The Cribl destination recovered, but its backlog is not draining.”
- “Two new indexers are missing the deployed configuration.”
- “An SHC member stays pending even though its apps match.”
- “Search UI is unavailable, but no platform alert fired.”
- “KV Store lookups are stale on one search head.”
- “Restarted forwarders cannot discover peers while the manager is unavailable.”
- “A peer retirement threatens searchable copies.”
- “A dashboard returns correct results but takes too much work to load.”
- “A service has logs but no traces after a collector rollout.”

These titles describe symptoms. Root causes, solution paths and hidden checks stay server-side until debrief.

## Ticket and grading contract

Add optional, versioned metadata: `interviewQuestionIds`, role track, prerequisites, affected service, impact, requested evidence, follow-up prompts and rubric version. Maintain compatibility with the current strict YAML schema; simply adding these fields today would fail validation. Keep public prompt data separate from hidden grading criteria.

Use structured action outcomes: monotonic action ID, simulation tick, actor/host, target, success, before/after state references, commit or run ID where applicable. Match precheck → scoped change → verification on the **same** affected target and revision. A dry run after deployment or on unrelated hosts must not count as a safe precheck. Preserve evidence through save/replay and action-log trimming.

Use deterministic checks for operational facts. For explanation quality, give a transparent checklist offline and allow optional existing AI feedback; avoid pretending keyword matching proves expertise. Accept equivalent valid investigation paths. Label unsupported fixes as unrecognized rather than automatically incorrect.

## Corrections and constraints found during review

- `packages/sim/src/operations.ts` currently approximates RF/SF from healthy peer counts, and `fixupComplete` requires maintenance mode plus all peers healthy. The rolling-restart scenario also expects that indicator. Update the model, scenario answer and regression checks together before teaching safe final-state maintenance cleanup.
- `packages/sim/src/shell/commands/splunk.ts` lacks several advanced cluster/SHC/KV Store status and lifecycle commands. Text mentioning a command is not executable support.
- `packages/sim/src/spl/commands.ts` lacks outputlookup, tstats, eventstats, streamstats, chart, transaction, join, append and collect. Generated lookups are currently limited; the employee CSV exercise needs real new behavior.
- `packages/sim/src/spl/run.ts` reports actual runtime. Grade optimization using deterministic work counters and result equivalence, not machine-dependent wall-clock milliseconds.
- `packages/sim/src/interview/engine.ts` primarily matches command/search/page text. Successful outcomes and ordered scope checks must be added before grading automation safety. Action IDs must remain monotonic when older entries are trimmed.
- Existing fishbucket directories, mongod process listings and replica catalog searches do not implement checkpoints, KV Store replication or a complete `_introspection` dataset.

Keep all new execution inside the simulator, with shared World state, deterministic time, journaled mutations and generic scenario primitives. Use synthetic Lab fixtures or isolated scenario overlays for new topologies; preserve the supplied APL/Erie baseline figures and placeholders. Before implementing precise vendor behavior, verify it against official documentation for the targeted product version and record any deliberate simplification.

## Deliberate deferrals and validation

Recruiter questions about location, salary, availability and work authorization need optional private answer notes, not infrastructure. Do not infer personal answers from the transcript index. Defer full Terraform, MCP, MLTK/AI, Endace and POS simulations unless the next interview specifically targets them; their cost and current dependencies outweigh their frequency here. Linux/Windows troubleshooting should expand existing terminal behavior in the relevant incident packs.

For every implemented pack: run a valid solution, a plausible wrong fix and an unsafe shortcut; test same-seed determinism and save/replay; verify UI, shell and searches agree; then run the project's required regression, typecheck, lint and build gates. New diagram, ticket and follow-up screens need browser verification. This analysis-only change requires question-map integrity and link checks, not a rerun of runtime tests.
