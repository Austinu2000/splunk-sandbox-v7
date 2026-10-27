import type { KnowledgeObject, LegacyImportPlan } from '@sandbox/shared';
import type { World } from '../world';

export const LEGACY_KNOWLEDGE_KEY = 'splunk-sandbox-v3-knowledge-v1';
export const LEGACY_SETTINGS_PREFIX = 'splunk-v3-settings:';

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** Validate legacy records without normalizing away unknown properties. */
export function isLegacyKnowledgeObject(value: unknown): value is KnowledgeObject {
  if (!object(value)) return false;
  return (
    ['id', 'title', 'description', 'owner', 'app', 'search', 'earliest', 'latest', 'updated'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    typeof value.enabled === 'boolean' &&
    ['report', 'alert', 'dashboard', 'dataset'].includes(String(value.kind)) &&
    ['Private', 'App', 'Global'].includes(String(value.sharing)) &&
    ['Classic', 'Dashboard Studio'].includes(String(value.type)) &&
    (value.schedule === undefined || typeof value.schedule === 'string') &&
    (value.condition === undefined || typeof value.condition === 'string') &&
    Array.isArray(value.panels) &&
    value.panels.every(
      (panel) =>
        object(panel) &&
        ['id', 'title', 'search'].every((key) => typeof panel[key] === 'string') &&
        ['column', 'bar', 'line', 'area', 'pie', 'single', 'table'].includes(String(panel.type)),
    )
  );
}

const identity = (item: KnowledgeObject) => JSON.stringify([item.kind, item.app, item.owner, item.title]);

/**
 * Pure, repeatable migration preflight. No parsing error can discard original data.
 * Legacy settings and schedules are not activated or executed by an import preview.
 * `existing` is an explicit destination catalog, never another profile's browser data.
 */
export function planLegacyImport(
  profileId: string,
  uiState: Readonly<Record<string, string>>,
  existing: readonly KnowledgeObject[] = [],
): LegacyImportPlan {
  const plan: LegacyImportPlan = {
    version: 1,
    profileId,
    mode: 'preview-only',
    preservedUiState: structuredClone(uiState),
    knowledge: [],
    settingsKeys: Object.keys(uiState)
      .filter((k) => k.startsWith(LEGACY_SETTINGS_PREFIX))
      .sort(),
    issues: [],
  };
  const raw = uiState[LEGACY_KNOWLEDGE_KEY];
  if (raw === undefined) return plan;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    plan.issues.push({
      key: LEGACY_KNOWLEDGE_KEY,
      code: 'invalid-json',
      message: 'Original text retained; repair JSON before importing.',
    });
    return plan;
  }
  if (!object(parsed) || !Array.isArray(parsed.objects)) {
    plan.issues.push({
      key: LEGACY_KNOWLEDGE_KEY,
      code: 'invalid-shape',
      message: 'Expected a knowledge-object list. Original value retained.',
    });
    return plan;
  }
  const ids = new Set<string>();
  const scopes = new Set<string>();
  const existingIds = new Set(existing.map((o) => o.id));
  const existingScopes = new Set(existing.map(identity));
  parsed.objects.forEach((value, record) => {
    const issue = (
      code: 'invalid-record' | 'duplicate-id' | 'scope-conflict' | 'missing-scope',
      message: string,
    ) => plan.issues.push({ key: LEGACY_KNOWLEDGE_KEY, record, code, message });
    if (!isLegacyKnowledgeObject(value)) {
      issue('invalid-record', 'Record retained in the original source; required fields need review.');
      return;
    }
    let conflict = false;
    const scope = identity(value);
    if (ids.has(value.id) || existingIds.has(value.id)) {
      conflict = true;
      issue('duplicate-id', 'ID collision; preserve both records and choose an explicit destination.');
    }
    if (scopes.has(scope) || existingScopes.has(scope)) {
      conflict = true;
      issue('scope-conflict', 'Object identity conflicts in kind/app/owner/title; do not overwrite.');
    }
    ids.add(value.id);
    scopes.add(scope);
    issue('missing-scope', 'Choose a target simulated host and validate permissions before activation.');
    plan.knowledge.push({
      sourceKey: LEGACY_KNOWLEDGE_KEY,
      sourceRecord: record,
      object: structuredClone(value),
      status: conflict ? 'conflict' : 'needs-scope',
    });
  });
  return plan;
}

export function engineeringMigrationPreview(world: World) {
  const plan = planLegacyImport(world.config.profileId, world.uiState);
  return {
    version: plan.version,
    profileId: plan.profileId,
    mode: plan.mode,
    preservedKeys: Object.keys(plan.preservedUiState).sort(),
    knowledgeCandidates: plan.knowledge.length,
    settingsKeys: plan.settingsKeys,
    issues: plan.issues,
    operationalCutover: false as const,
  };
}
