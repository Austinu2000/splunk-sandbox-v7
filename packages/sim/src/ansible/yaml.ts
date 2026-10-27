import { isMap, isSeq, isScalar, parseDocument } from 'yaml';
import { TrainingError } from '../training/engine';
export function yaml(text: string): unknown {
  if (text.length > 2_000_000) throw new TrainingError('YAML size limit');
  // YAML's default duplicate-key scan is quadratic in a large hosts mapping.
  // Check scalar keys with a Set instead, before conversion can overwrite them.
  const document = parseDocument(text, { uniqueKeys: false });
  if (document.errors.length || document.warnings.length)
    throw new TrainingError((document.errors[0] ?? document.warnings[0])!.message);
  let count = 0;
  const validate = (node: unknown, depth = 0): void => {
    if (++count > 500000 || depth > 80) throw new TrainingError('YAML nesting/node limit');
    if (isMap(node)) {
      const keys = new Set<string>();
      for (const pair of node.items) {
        if (!isScalar(pair.key)) throw new TrainingError('YAML mapping keys must be scalars');
        const key = String(pair.key.value);
        if (keys.has(key)) throw new TrainingError(`Duplicate YAML key: ${key}`);
        keys.add(key);
        validate(pair.value, depth + 1);
      }
    } else if (isSeq(node)) for (const item of node.items) validate(item, depth + 1);
  };
  validate(document.contents);
  try {
    return document.toJS({ maxAliasCount: 30 });
  } catch {
    throw new TrainingError('YAML alias or nesting limit exceeded');
  }
}
