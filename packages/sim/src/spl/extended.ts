import { activeDataModels, dataModelRows } from '../engineering/data-models';
import { parseSearch, matches } from './search';
import { kvLookup, kvWrite, kvCollections } from '../kvstore/engine';
import type { Command, RunContext } from './commands';
import { parseCommand } from './commands';
import { runSearch } from './run';
import { Row } from './row';
import { SplError, toStr } from './values';
import { training, persistTraining } from '../training/engine';
import { parseSpan } from './time';
import { collectSummary } from '../engineering/summary';
import { infraName } from '../infra';
import { takeOptions, tokenizeArgs } from './args';
export function extendedCommand(name: string, args: string): Omit<Command, 'name' | 'text'> | undefined {
  const base = { transforming: true };
  if (name === 'outputlookup')
    return {
      ...base,
      run: (rows, ctx) => {
        if (ctx.readOnly)
          throw new SplError('outputlookup is not allowed in a read-only report source', name);
        const m = /^(?:append=(true|false)\s+)?([\w.-]+)(?:\s+append=(true|false))?$/.exec(args);
        if (!m) throw new SplError('Use outputlookup [append=true|false] filename.csv', name);
        const kv = m[2]!.endsWith('.csv') ? null : kvLookup(ctx.world, m[2]!, ctx.host);
        if (kv) {
          const schema =
            kvCollections(ctx.world, kv.host, kv.app).find((c) => c.collection === kv.collection)?.settings ??
            {};
          const records = rows.map((r) =>
            Object.fromEntries(
              Object.entries(r.toObject())
                .filter(([k]) => !kv.fields.length || kv.fields.includes(k))
                .map(([k, v]) => [
                  k,
                  schema[`field.${k}`] === 'bool' && (v === 'true' || v === 'false') ? v === 'true' : v,
                ]),
            ),
          );
          kvWrite(
            ctx.world,
            kv.host,
            kv.app,
            kv.collection,
            records,
            (m[1] ?? m[3]) === 'true' ? 'upsert' : 'replace',
          );
          return rows;
        }
        const key = m[2]!.replace(/\.csv$/, '');
        if (
          [
            '__proto__',
            'constructor',
            'prototype',
            'forwarder_inventory',
            'site_contacts',
            'indexer_inventory',
            'training_metrics',
            'training_events',
          ].includes(key)
        )
          throw new SplError('Generated lookup is read-only', name);
        const s = training(ctx.world),
          old = (m[1] ?? m[3]) === 'true' ? (s.lookups[key] ?? []) : [];
        if (old.length + rows.length > 100000) throw new SplError('Lookup row limit exceeded', name);
        s.lookups[key] = [...old, ...rows.map((r) => r.toObject())];
        persistTraining(ctx.world);
        return rows;
      },
    };
  if (name === 'eventstats' || name === 'streamstats') {
    const window = Number(/\bwindow=(\d+)/.exec(args)?.[1] ?? 0);
    const clean = args.replace(/\bwindow=\d+\s*/, '');
    const by =
      /\bby\s+(.+)$/
        .exec(clean)?.[1]
        ?.trim()
        .split(/[\s,]+/) ?? [];
    return {
      ...base,
      transforming: false,
      run: (rows, ctx) => {
        const key = (r: Row) => JSON.stringify(by.map((k) => r.get(k)));
        const groups = new Map<string, Row[]>();
        for (const r of rows) {
          const k = key(r);
          groups.set(k, [...(groups.get(k) ?? []), r]);
        }
        if (name === 'eventstats') {
          const sums = parseCommand(`stats ${clean}`).run(rows, ctx);
          const map = new Map(sums.map((r) => [key(r), r.toObject()]));
          return rows.map((r) => Row.of({ ...r.toObject(), ...map.get(key(r)) }));
        }
        const seen = new Map<string, Row[]>();
        return rows.map((r) => {
          const k = key(r),
            group = [...(seen.get(k) ?? []), r];
          if (window && group.length > window) group.shift();
          seen.set(k, group);
          const result = parseCommand(`stats ${clean}`).run(group, ctx)[0];
          return Row.of({ ...r.toObject(), ...result?.toObject() });
        });
      },
    };
  }
  if (name === 'chart')
    return {
      ...base,
      run: (rows, ctx) => {
        const m = /^(.+?)\s+(?:over|by)\s+(\w+)(?:\s+(?:by\s+)?(\w+))?$/.exec(args);
        if (!m) throw new SplError('Use chart aggregation over field [by series]', name);
        if (!m[3]) return parseCommand(`stats ${m[1]} by ${m[2]}`).run(rows, ctx);
        const grouped = parseCommand(`stats ${m[1]} by ${m[2]} ${m[3]}`).run(rows, ctx),
          out = new Map<string, Record<string, ReturnType<Row['get']>>>();
        for (const r of grouped) {
          const k = toStr(r.get(m[2]!));
          const o = out.get(k) ?? { [m[2]!]: r.get(m[2]!) };
          for (const col of r.names().filter((n) => n !== m[2] && n !== m[3]))
            o[toStr(r.get(m[3]!))] = r.get(col);
          out.set(k, o);
        }
        return [...out.values()].map(Row.of);
      },
    };
  if (name === 'append' || name === 'join')
    return {
      ...base,
      run: (rows, ctx) => {
        const m = /^(.*?)\[([\s\S]+)\]$/.exec(args);
        if (!m) throw new SplError('Expected [subsearch]', name);
        if ((m[2]!.match(/\[/g) ?? []).length > 2 || m[2]!.length > 8000)
          throw new SplError('Subsearch nesting/size limit exceeded', name);
        const out = runSearch(ctx.world, {
          search: m[2]!,
          principal: ctx.principal,
          readOnly: ctx.readOnly,
          earliest: String(ctx.earliest / 1000),
          latest: String(ctx.latest / 1000),
        });
        if (out.status === 'failed') throw new SplError(out.messages.map((m) => m.text).join('; '), name);
        const right = out.kind === 'events' ? out.events : out.results;
        if (right.length > 10000) throw new SplError('Subsearch exceeds 10000 rows', name);
        if (name === 'append') {
          if (m[1]!.trim()) throw new SplError('Append options are not supported', name);
          return [...rows, ...right];
        }
        const fields = m[1]!
          .replace(/\btype=(inner|left)/, '')
          .trim()
          .split(/[\s,]+/);
        if (!fields[0]) throw new SplError('Join needs explicit keys', name);
        const left = /type=left/.test(m[1]!);
        const key = (r: Row) => JSON.stringify(fields.map((f) => r.get(f)));
        const map = new Map(right.map((r) => [key(r), r]));
        return rows.flatMap((r) => {
          const match = map.get(key(r));
          return match ? [Row.of({ ...r.toObject(), ...match.toObject() })] : left ? [r] : [];
        });
      },
    };
  if (name === 'transaction')
    return {
      ...base,
      run: (rows) => {
        const span = /maxspan=(\S+)/.exec(args)?.[1];
        const max = span ? parseSpan(span) : Infinity;
        const field = args.replace(/maxspan=\S+/, '').trim();
        if (!/^\w+$/.test(field) || max === null)
          throw new SplError('Supported: transaction field [maxspan=5m]', name);
        const groups = new Map<string, Row[][]>();
        for (const r of [...rows].sort((a, b) => (a.time ?? 0) - (b.time ?? 0))) {
          const k = toStr(r.get(field));
          const buckets = groups.get(k) ?? [];
          let b = buckets.at(-1);
          if (!b || ((r.time ?? 0) - (b[0]!.time ?? 0)) * 1000 > max) {
            b = [];
            buckets.push(b);
          }
          b.push(r);
          groups.set(k, buckets);
        }
        return [...groups.entries()].flatMap(([k, gs]) =>
          gs.map((g) =>
            Row.of({
              [field]: k,
              eventcount: g.length,
              duration: (g.at(-1)!.time ?? 0) - (g[0]!.time ?? 0),
              _raw: g.map((r) => toStr(r.get('_raw'))).join('\n'),
            }),
          ),
        );
      },
    };
  if (name === 'collect')
    return {
      ...base,
      run: (rows, ctx) => {
        if (ctx.readOnly)
          throw new SplError(
            'collect is not allowed inside a read-only source; configure the report summary action',
            name,
          );
        const { opts, rest } = takeOptions(tokenizeArgs(args, name), ['index', 'source', 'sourcetype']);
        if (!opts.get('index') || rest.length)
          throw new SplError('Supported: collect index=NAME [source=SOURCE] [sourcetype=TYPE]', name);
        const objects = rows.map((row) => row.toObject());
        ctx.effects!.push(() =>
          collectSummary(ctx.world, objects, {
            index: opts.get('index')!,
            host: infraName(ctx.world, 'search_head'),
            principal: ctx.principal ?? 'admin',
            earliest: ctx.earliest,
            latest: ctx.latest,
            writer: ctx.search ?? 'manual collect',
            source: opts.get('source'),
            sourcetype: opts.get('sourcetype'),
          }),
        );
        return rows;
      },
    };
  if (name === 'addinfo')
    return {
      ...base,
      transforming: false,
      run: (rows, ctx) =>
        rows.map((row) => {
          row.set('info_min_time', ctx.earliest / 1000);
          row.set('info_max_time', ctx.latest / 1000);
          row.set('info_search_time', ctx.now / 1000);
          return row;
        }),
    };
  if (name === 'tstats') {
    const generate = (ctx: RunContext) => {
      const dm =
        /^(?:summariesonly=(true|false)\s+)?(.+?)\s+from\s+datamodel=([A-Za-z]\w*)(?:\.([A-Za-z]\w*))?(?:\s+where\s+(.+?))?(?:\s+by\s+([\w., ]+))?$/i.exec(
          args,
        );
      const legacy = dm && ctx.world.training?.summaries[dm[3]!];
      if (
        dm &&
        (!legacy ||
          activeDataModels(ctx.world, ctx.host ?? infraName(ctx.world, 'search_head'), dm[3]).length)
      ) {
        const result = dataModelRows(
          ctx.world,
          ctx.host ?? infraName(ctx.world, 'search_head'),
          dm[3]!,
          dm[4],
          ctx.earliest,
          ctx.latest,
          dm[1]?.toLowerCase() === 'true',
          ctx.principal,
        );
        ctx.extraWork = (ctx.extraWork ?? 0) + result.workUnits;
        ctx.messages.push({
          type: 'info',
          text: result.accelerated
            ? 'Read a compatible data model acceleration snapshot'
            : 'No complete current summary; scanned the actual model source',
        });
        if (result.partial)
          ctx.messages.push({
            type: 'warn',
            text: 'Only the stored summary coverage is available for this summariesonly query',
          });
        const rows = dm[5] ? result.rows.filter((row) => matches(parseSearch(dm[5]!), row)) : result.rows;
        return parseCommand('stats ' + dm[2] + (dm[6] ? ' by ' + dm[6] : '')).run(rows, ctx);
      }
      const m =
        /^(?:summariesonly=(true|false)\s+)?(.+?)\s+(?:where|from)\s+(.+?)(?:\s+by\s+([\w, ]+))?$/.exec(args);
      if (!m) throw new SplError('Supported: tstats aggregation where index=name [by fields]', name);
      const src = m[3]!,
        summary = /^(?:datamodel=|index=)(\w+)$/.exec(src)?.[1];
      const data = summary ? training(ctx.world).summaries[summary] : undefined;
      if (m[1] === 'true' && !data)
        throw new SplError('No acceleration summary exists for this dataset', name);
      let rows: Row[];
      if (data) rows = data.rows.map(Row.of);
      else {
        const o = runSearch(ctx.world, {
          host: ctx.host,
          search: src,
          earliest: String(ctx.earliest / 1000),
          latest: String(ctx.latest / 1000),
          principal: ctx.principal,
          readOnly: ctx.readOnly,
        });
        if (o.status === 'failed') throw new SplError('Unable to search indexed dataset', name);
        rows = o.events;
        ctx.messages.push({
          type: 'info',
          text: 'Sandbox tstats fallback scans events; create a summary for accelerated practice.',
        });
      }
      return parseCommand(`stats ${m[2]}${m[4] ? ` by ${m[4]}` : ''}`).run(rows, ctx);
    };
    return { ...base, generate, run: (_r, c) => generate(c) };
  }
  return undefined;
}
