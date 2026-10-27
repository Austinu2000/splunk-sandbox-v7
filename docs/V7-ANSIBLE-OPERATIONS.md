# V7 Ansible operations

Status: inventory operations and AU-01–AU-14 implemented; broader automation expansion continues. Existing Code & Ansible, virtual
repositories, playbook execution and G/A/X lessons remain available with the
limitations recorded in [V5 implementation](V5-IMPLEMENTATION.md).

The `#/automation` section now provides Inventory, Playbooks & Roles, Deployment
Center, Run History and Troubleshooting. It reads the control node working tree
for inventory and the existing committed-branch engine for deployments. It will not replace Learn or add a progress dashboard.

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

Inventory CLI now implements `ansible --version`, `ansible-config dump`, graph,
list, host inspection, list-hosts, patterns/limits and ping. The terminal, playbook
runner and Automation view share the same resolver. Config discovery honors
`ANSIBLE_CONFIG`, cwd config (excluding world-writable cwd), home and system
config. `-i` overrides `ANSIBLE_INVENTORY`, then config inventory. Inventory files
must be inside the current virtual repository. YAML inventory supports parent/
child groups, same-level priority/alphabetical order, group/host variables and
inventory-relative then repository-relative variable files. Inline inventory,
INI plugins, dynamic scripts, regex/range patterns and arbitrary config plugins
remain unsupported and are not advertised by lessons. Graph vars are explicitly
rejected; host inspection is the supported variable view.

The 35,000-host inventory test completes without creating managed-host filesystems.
YAML duplicate detection uses a linear key check and retains duplicate/tag/alias
rejection. This is inventory scalability, not proof that large playbook runs use
cohorts. Existing runner execution is still per-host.

The AU lessons are refined from the supplied track objectives because the prior
individual 50-lesson source was absent. Their stable numbering is retained, and
this provenance is explicit rather than claiming an exact transcription.

Native component-specific deployment remains mandatory: DS reload, cluster
manager bundle, SHC deployer bundle, or the documented host operation. A source
commit/revert alone must not change running configuration. Preview must use a
disposable world; success/failure evidence must bind to revision and target.

Existing tutorial instructions are retained in [TUTORIAL.md](TUTORIAL.md). Consult
version-appropriate official Ansible references when implementing each capability;
no new vendor behavior is claimed at this planning gate.
