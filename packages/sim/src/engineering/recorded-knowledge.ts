import { resolveHost } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { parseExpr, evaluate, toFieldValue, type Expr } from '../spl/eval';
import { parseSearch, matches } from '../spl/search';
import type { Row } from '../spl/row';
import type { RunContext } from '../spl/commands';
import { eventMetadata } from './ingestion';

/** Native search-time aliases, calculated fields and eventtype/tag classification for recorded data. */
export function recordedKnowledge(ctx: RunContext, host: string) {
  const p = resolveHost(ctx.world, host)!,
    props = runningConf(ctx.world, p, 'props'),
    eventtypes = runningConf(ctx.world, p, 'eventtypes'),
    tags = runningConf(ctx.world, p, 'tags');
  const compiled = new Map<
      string,
      { aliases: { source: string; target: string; keep: boolean }[]; evals: { field: string; expr: Expr }[] }
    >(),
    warnings = new Set<string>();
  const warn = (text: string) => {
    if (!warnings.has(text)) {
      warnings.add(text);
      ctx.messages.push({ type: 'warn', text });
    }
  };
  const classifiers = [...eventtypes.stanzas].slice(0, 100).flatMap(([name, stanza]) => {
    const search = setting(eventtypes, name, 'search');
    if (!search || confBool(stanza.settings.get('disabled')?.value)) return [];
    try {
      if (search.includes('|')) throw new Error();
      return [{ name, predicate: parseSearch(search) }];
    } catch {
      warn('Unsupported eventtype search: ' + name);
      return [];
    }
  });
  return (row: Row, sourcetype: string) => {
    let fields = compiled.get(sourcetype);
    if (!fields) {
      fields = { aliases: [], evals: [] };
      for (const [key, value] of [...(props.stanzas.get(sourcetype)?.settings ?? [])].slice(0, 100)) {
        if (key.startsWith('FIELDALIAS-')) {
          const alias = /^([A-Za-z_][\w.]*)\s+(AS|ASNEW)\s+([A-Za-z_][\w.]*)$/i.exec(value.value);
          if (!alias || eventMetadata.has(alias[3]!)) {
            warn('Unsupported or reserved FIELDALIAS: ' + key);
            continue;
          }
          fields.aliases.push({
            source: alias[1]!,
            target: alias[3]!,
            keep: alias[2]!.toUpperCase() === 'ASNEW',
          });
        }
        if (key.startsWith('EVAL-')) {
          const field = key.slice(5);
          try {
            if (!/^[A-Za-z_][\w.]*$/.test(field) || eventMetadata.has(field) || value.value.length > 4000)
              throw new Error();
            fields.evals.push({ field, expr: parseExpr(value.value, 'EVAL') });
          } catch {
            warn('Unsupported or reserved calculated field: ' + key);
          }
        }
      }
      compiled.set(sourcetype, fields);
    }
    for (const alias of fields.aliases) {
      const value = row.get(alias.source);
      if (value !== null && (!alias.keep || row.get(alias.target) === null)) row.set(alias.target, value);
    }
    for (const field of fields.evals) {
      try {
        row.set(field.field, toFieldValue(evaluate(field.expr, row, ctx)));
      } catch {
        warn('Calculated field could not be evaluated: ' + field.field);
      }
    }
    const names = classifiers.filter((c) => matches(c.predicate, row)).map((c) => c.name);
    if (!names.length) return;
    const values = (field: string) => {
      const v = row.get(field);
      return v === null ? [] : Array.isArray(v) ? v.map(String) : [String(v)];
    };
    row.set('eventtype', [...new Set([...values('eventtype'), ...names])]);
    const tagged = new Set(values('tag'));
    for (const name of names)
      for (const [key, value] of tags.stanzas.get('eventtype=' + name)?.settings ?? [])
        if (confBool(value.value)) tagged.add(key);
    if (tagged.size) row.set('tag', [...tagged]);
  };
}
