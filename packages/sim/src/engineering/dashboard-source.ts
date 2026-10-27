import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { z } from 'zod';
import type { DashboardInput, OperationalDashboardPanel } from '@sandbox/shared';
export { classicSource, studioSource } from '@sandbox/shared';
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
import { OperationsError } from './access';
const name = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/);
const text = z.string().max(10000);
const panelType = z.enum(['table', 'single', 'column', 'bar', 'line', 'area', 'pie']);
const choices = z
  .array(z.object({ label: z.string().max(200), value: z.string().max(500) }).strict())
  .max(30);
export const dashboardInputSchema = z
  .object({
    token: name,
    label: z.string().max(200),
    type: z.enum(['text', 'dropdown']),
    defaultValue: z.string().max(500),
    choices,
  })
  .strict();
export const dashboardPanelSchema = z
  .object({
    id: name,
    title: z.string().max(200),
    type: panelType,
    search: text.optional(),
    report: z.string().max(120).optional(),
    earliest: z.string().max(100),
    latest: z.string().max(100),
    dataSource: name.optional(),
  })
  .strict();
const studioSchema = z
  .object({
    title: z.string().max(200),
    description: z.string().max(2000).optional(),
    dataSources: z.record(
      name,
      z
        .object({
          type: z.literal('ds.search'),
          options: z
            .object({
              query: text,
              queryParameters: z
                .object({ earliest: z.string().max(100).optional(), latest: z.string().max(100).optional() })
                .strict()
                .optional(),
            })
            .strict(),
        })
        .strict(),
    ),
    visualizations: z.record(
      name,
      z
        .object({
          type: z.enum([
            'splunk.table',
            'splunk.singlevalue',
            'splunk.column',
            'splunk.bar',
            'splunk.line',
            'splunk.area',
            'splunk.pie',
          ]),
          title: z.string().max(200).optional(),
          dataSources: z.object({ primary: name }).strict(),
          options: z.object({}).strict().optional(),
        })
        .strict(),
    ),
    inputs: z
      .record(
        name,
        z
          .object({
            type: z.enum(['input.text', 'input.dropdown']),
            title: z.string().max(200).optional(),
            options: z
              .object({ token: name, defaultValue: z.string().max(500), items: choices.optional() })
              .strict(),
          })
          .strict(),
      )
      .optional(),
    defaults: z.object({}).strict().optional(),
    layout: z
      .object({ type: z.literal('grid') })
      .strict()
      .optional(),
  })
  .strict();
export function studioWrapper(source: string, title: string) {
  return (
    '<dashboard version="2"><label>' +
    escapeXml(title) +
    '</label><definition><![CDATA[' +
    source.replace(/]]>/g, ']]]]><![CDATA[>') +
    ']]></definition></dashboard>'
  );
}
type Node = Record<string, unknown>;
const array = (v: unknown): Node[] => (v === undefined ? [] : ((Array.isArray(v) ? v : [v]) as Node[]));
const nodeText = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'object' && v !== null ? String((v as Node)['#text'] ?? '') : '';
function allowed(n: Node, keys: string[]) {
  for (const k of Object.keys(n))
    if (!keys.includes(k) && k !== '#text')
      throw new OperationsError('Unsupported dashboard source element: ' + k);
}
export function parseDashboardSource(source: string, format: 'classic' | 'studio') {
  if (
    source.length > 100000 ||
    /<!DOCTYPE|<!ENTITY/i.test(source) ||
    (format === 'classic' && (source.match(/<[A-Za-z]/g)?.length ?? 0) > 512)
  )
    throw new OperationsError('Dashboard source exceeds bounds or contains prohibited XML declarations');
  let title = '',
    description = '',
    inputs: DashboardInput[] = [],
    panels: OperationalDashboardPanel[] = [];
  if (format === 'studio') {
    const v = studioSchema.parse(JSON.parse(source));
    title = v.title;
    description = v.description ?? '';
    if (
      Object.keys(v.dataSources).length > 8 ||
      Object.keys(v.visualizations).length > 8 ||
      Object.keys(v.inputs ?? {}).length > 8
    )
      throw new OperationsError('Dashboard supports at most eight inputs, data sources and panels');
    inputs = Object.values(v.inputs ?? {}).map((i) => ({
      token: i.options.token,
      label: i.title ?? i.options.token,
      type: i.type === 'input.text' ? 'text' : 'dropdown',
      defaultValue: i.options.defaultValue,
      choices: i.options.items ?? [],
    }));
    panels = Object.entries(v.visualizations).map(([id, p]) => {
      const ds = v.dataSources[p.dataSources.primary];
      if (!ds) throw new OperationsError('Missing dashboard data source: ' + p.dataSources.primary);
      return {
        id,
        title: p.title ?? id,
        type: (p.type === 'splunk.singlevalue'
          ? 'single'
          : p.type.slice(7)) as OperationalDashboardPanel['type'],
        search: ds.options.query,
        earliest: ds.options.queryParameters?.earliest ?? '-15m',
        latest: ds.options.queryParameters?.latest ?? 'now',
        dataSource: p.dataSources.primary,
      };
    });
  } else {
    if (XMLValidator.validate(source) !== true) throw new OperationsError('Invalid dashboard XML');
    const doc = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      alwaysCreateTextNode: true,
    }).parse(source) as Node;
    allowed(doc, ['dashboard', 'form']);
    const root = (doc.dashboard ?? doc.form) as Node;
    if (!root || typeof root !== 'object') throw new OperationsError('Use a dashboard or form root');
    allowed(root, ['@_version', '@_theme', 'label', 'description', 'fieldset', 'row']);
    title = nodeText(root.label);
    description = nodeText(root.description);
    if (root['@_version'] === '2')
      throw new OperationsError('Use the Studio JSON source editor for version 2');
    if (root.fieldset) {
      const field = root.fieldset as Node;
      allowed(field, ['input', '@_submitButton']);
      inputs = array(field.input).map((i) => {
        allowed(i, ['@_type', '@_token', 'label', 'default', 'choice']);
        return dashboardInputSchema.parse({
          token: i['@_token'],
          type: i['@_type'],
          label: nodeText(i.label),
          defaultValue: nodeText(i.default),
          choices: array(i.choice).map((c) => {
            allowed(c, ['@_value']);
            return { label: nodeText(c), value: c['@_value'] };
          }),
        });
      });
    }
    for (const row of array(root.row)) {
      allowed(row, ['panel']);
      for (const p of array(row.panel)) {
        allowed(p, ['title', 'table', 'chart', 'single']);
        const kinds = ['table', 'chart', 'single'].filter((k) => p[k]);
        if (kinds.length !== 1)
          throw new OperationsError('Each panel needs exactly one supported visualization');
        const kind = kinds[0]!,
          v = p[kind] as Node;
        allowed(v, ['search', 'option']);
        const search = v.search as Node;
        if (!search) throw new OperationsError('Panel search is missing');
        allowed(search, ['@_ref', 'query', 'earliest', 'latest']);
        if (search.query && search['@_ref'])
          throw new OperationsError('Use an inline query or a report reference, not both');
        let type = kind === 'chart' ? 'column' : kind;
        for (const o of array(v.option)) {
          allowed(o, ['@_name']);
          if (o['@_name'] !== 'charting.chart') throw new OperationsError('Unsupported visualization option');
          type = nodeText(o);
        }
        panels.push(
          dashboardPanelSchema.parse({
            id: 'panel_' + panels.length,
            title: nodeText(p.title),
            type,
            search: search.query ? nodeText(search.query) : undefined,
            report: search['@_ref'],
            earliest: nodeText(search.earliest) || '-15m',
            latest: nodeText(search.latest) || 'now',
          }),
        );
      }
    }
  }
  if (
    !title.trim() ||
    title.length > 200 ||
    description.length > 2000 ||
    !panels.length ||
    panels.length > 8 ||
    inputs.length > 8
  )
    throw new OperationsError('Use a title, one to eight panels, and at most eight inputs');
  if (new Set(inputs.map((i) => i.token)).size !== inputs.length)
    throw new OperationsError('Input tokens must be unique');
  for (const p of panels)
    if (!p.search?.trim() && !p.report?.trim())
      throw new OperationsError('Panel needs SPL or a saved report');
  return { title, description, inputs, panels };
}
export function substituteDashboardTokens(value: string, tokens: Record<string, string>) {
  return value.replace(/\$([A-Za-z][A-Za-z0-9_-]*)(\|s)?\$/g, (_, key: string, quoted: string) => {
    if (!Object.hasOwn(tokens, key)) throw new OperationsError('Input token is unset: ' + key);
    const v = tokens[key]!;
    if (quoted) return JSON.stringify(v);
    if (!/^[A-Za-z0-9_.:*@+/-]*$/.test(v))
      throw new OperationsError('Use the |s token filter for values requiring SPL quoting');
    return v;
  });
}
export function dashboardDocument(xml: string) {
  if (xml.length > 100000 || /<!DOCTYPE|<!ENTITY/i.test(xml) || (xml.match(/<[A-Za-z]/g)?.length ?? 0) > 512)
    throw new OperationsError('Invalid or oversized dashboard document');
  if (XMLValidator.validate(xml) !== true) throw new OperationsError('Invalid dashboard XML');
  const doc = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    alwaysCreateTextNode: true,
  }).parse(xml) as Node;
  if ((doc.dashboard as Node)?.['@_version'] === '2') {
    allowed(doc, ['dashboard']);
    const root = doc.dashboard as Node;
    allowed(root, ['@_version', '@_theme', 'label', 'description', 'definition']);
    return { format: 'studio' as const, source: nodeText(root.definition) };
  }
  return { format: 'classic' as const, source: xml };
}
