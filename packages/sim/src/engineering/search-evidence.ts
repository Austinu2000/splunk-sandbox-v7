import type { SearchEvidence } from '@sandbox/shared';
import type { World } from '../world';
import { journal } from '../journal';
export function recordSearchEvidence(world: World, evidence: SearchEvidence) {
  const records = (world.searchEvidence ??= []);
  const existing = records.findIndex((r) => r.id === evidence.id);
  if (existing >= 0) records[existing] = structuredClone(evidence);
  else records.push(structuredClone(evidence));
  if (records.length > 20) records.shift();
  journal(world, { k: 'search.evidence', records: structuredClone(records) });
}
