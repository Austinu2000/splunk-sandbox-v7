# V7 Ansible operations

Status: architecture and source audit only. Existing Code & Ansible, virtual
repositories, playbook execution and G/A/X lessons remain available with the
limitations recorded in [V5 implementation](V5-IMPLEMENTATION.md).

The proposed `#/automation` section is not implemented yet. Its Inventory,
Playbooks & Roles, Deployment Center, Run History and Troubleshooting tabs will
read shared simulated state. It will not replace Learn or add a progress dashboard.

| Milestone | AU IDs | Required work |
| --- | --- | --- |
| 1 | AU-01–AU-14 | Control node, SSH/Linux/config fundamentals; inventory graph/list/host, configuration discovery, targeting, drift |
| 4 | AU-15–AU-27 | Tasks/modules/roles/templates/handlers, preview/idempotency, Git/PR validation and rollback |
| 5 | AU-28–AU-35 | UF installation/upgrades, DS client/output/server-class changes, controlled batches and recovery |
| 7 | AU-36–AU-43 | Cluster manager/deployer bundles, RF/SF, restart and recovery |
| 9 | AU-44–AU-50 | Unreachable hosts, drift, handlers, preflight, partial upgrades, reviewed enterprise change |

The supplied brief gives track-level ranges but refers to an earlier approved
50-lesson list for individual objectives. That individual AU list is absent from
the V6 repository and the supplied older Git/Ansible prompt. The planning manifest
reserves the IDs without inventing replacement objectives. Reconcile the source
before accepting AU lesson definitions; foundational engine work can continue.

Current inventory command code returns inventory YAML for both graph/list forms;
it is not sufficient fidelity for the new AU exercises. `ansible --version`,
`ansible-config dump`, list-hosts and detailed inventory inspection require explicit
implementation/tests. Existing runner support is bounded, and fleet runs remain
per-host; do not claim cohort scalability until tested against a reference run.

Native component-specific deployment remains mandatory: DS reload, cluster
manager bundle, SHC deployer bundle, or the documented host operation. A source
commit/revert alone must not change running configuration. Preview must use a
disposable world; success/failure evidence must bind to revision and target.

Existing tutorial instructions are retained in [TUTORIAL.md](TUTORIAL.md). Consult
version-appropriate official Ansible references when implementing each capability;
no new vendor behavior is claimed at this planning gate.
