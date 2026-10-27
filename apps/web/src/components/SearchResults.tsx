import { useMemo, useState } from 'react';
import type { FieldSummaryDto, PageDto, ResultValue, SearchEventDto, SearchJobDto } from '@sandbox/shared';
import { Chart } from './Chart';
import { fmtEventTime, fmtInt, fmtTableTime } from '../format';

const SELECTED = ['host', 'source', 'sourcetype'];

// ---------------------------------------------------------------- pager

export function Pager({
  page,
  size,
  onPage,
}: {
  page: PageDto<unknown>;
  size: number;
  onPage: (offset: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(page.total / size));
  const current = Math.floor(page.offset / size) + 1;
  if (pages <= 1) return null;
  const nums = [...new Set([1, current - 1, current, current + 1, pages])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return (
    <span className="pager">
      <button disabled={current <= 1} onClick={() => onPage(page.offset - size)}>
        ‹ Prev
      </button>
      {nums.map((n, i) => (
        <span key={n}>
          {i > 0 && n - nums[i - 1]! > 1 && <span className="ellipsis">…</span>}
          <button className={n === current ? 'current' : ''} onClick={() => onPage((n - 1) * size)}>
            {n}
          </button>
        </span>
      ))}
      <button disabled={current >= pages} onClick={() => onPage(page.offset + size)}>
        Next ›
      </button>
    </span>
  );
}

// ---------------------------------------------------------------- timeline

export function Timeline({ job }: { job: SearchJobDto }) {
  const option = useMemo(
    () => ({
      animation: false,
      grid: { left: 40, right: 8, top: 6, bottom: 20 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: job.timeline.map((b) => fmtTableTime(b.time / 1000).slice(11, 16)),
        axisLabel: { fontSize: 10, color: '#6b7785' },
        axisTick: { show: false },
      },
      yAxis: { type: 'value', minInterval: 1, splitNumber: 2, axisLabel: { fontSize: 10, color: '#6b7785' } },
      series: [
        {
          type: 'bar',
          data: job.timeline.map((b) => b.count),
          itemStyle: { color: '#5cc05c' },
          barCategoryGap: '10%',
        },
      ],
    }),
    [job],
  );
  return <Chart option={option} height={90} />;
}

// ---------------------------------------------------------------- fields sidebar

function FieldPopover({
  field,
  total,
  onAdd,
  onClose,
}: {
  field: FieldSummaryDto;
  total: number;
  onAdd: (f: string, v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="field-popover" role="dialog">
      <div className="fp-head">
        <strong>{field.name}</strong>
        <button onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="fp-sub">
        {fmtInt(field.distinct)}
        {field.distinct >= 100 ? '+' : ''} values, {Math.round((field.count / Math.max(1, total)) * 100)}% of
        events
      </p>
      <table>
        <thead>
          <tr>
            <th>Top 10 values</th>
            <th className="num">Count</th>
            <th className="num">%</th>
          </tr>
        </thead>
        <tbody>
          {field.top.map((t) => (
            <tr key={t.value}>
              <td>
                <button className="link-btn" onClick={() => onAdd(field.name, t.value)} title="Add to search">
                  {t.value || '(empty)'}
                </button>
              </td>
              <td className="num">{fmtInt(t.count)}</td>
              <td className="num">{((t.count / Math.max(1, field.count)) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FieldsSidebar({
  job,
  onAdd,
  showAll = false,
}: {
  job: SearchJobDto;
  onAdd: (field: string, value: string) => void;
  showAll?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const sample = Math.min(job.eventCount, 2000);
  const byName = new Map(job.fields.map((f) => [f.name, f]));
  const selected = SELECTED.map((n) => byName.get(n)).filter((f): f is FieldSummaryDto => !!f);
  const interesting = job.fields.filter(
    (f) => !SELECTED.includes(f.name) && (showAll || f.count >= sample * 0.2),
  );
  const item = (f: FieldSummaryDto) => (
    <li key={f.name}>
      <button className="field-name" onClick={() => setOpen(open === f.name ? null : f.name)}>
        <span className="field-type">{f.numeric ? '#' : 'a'}</span> {f.name}{' '}
        <span className="field-count">{f.distinct >= 100 ? '100+' : f.distinct}</span>
      </button>
      {open === f.name && (
        <FieldPopover
          field={f}
          total={sample}
          onClose={() => setOpen(null)}
          onAdd={(n, v) => {
            setOpen(null);
            onAdd(n, v);
          }}
        />
      )}
    </li>
  );
  return (
    <aside className="fields-sidebar">
      <h3>Selected fields</h3>
      <ul>{selected.map(item)}</ul>
      <h3>Interesting fields</h3>
      <ul>{interesting.map(item)}</ul>
      <p className="side-hint">
        {job.fields.length - selected.length - interesting.length} more fields in under 20% of events
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------- events list

function renderValue(v: ResultValue): string {
  if (v === null) return '';
  if (Array.isArray(v)) return v.join('\n');
  return String(v);
}

export function EventsList({
  page,
  onAddTerm,
}: {
  page: PageDto<SearchEventDto>;
  onAddTerm: (f: string, v: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  return (
    <table className="events">
      <thead>
        <tr>
          <th className="ev-toggle">i</th>
          <th className="ev-time">Time</th>
          <th>Event</th>
        </tr>
      </thead>
      <tbody>
        {page.items.map((e, i) => {
          const key = page.offset + i;
          const isOpen = expanded.has(key);
          const [date, time] = fmtEventTime(e.time);
          return (
            <tr key={key}>
              <td className="ev-toggle">
                <button
                  aria-label={isOpen ? 'Collapse event' : 'Expand event'}
                  onClick={() => {
                    const next = new Set(expanded);
                    if (isOpen) next.delete(key);
                    else next.add(key);
                    setExpanded(next);
                  }}
                >
                  {isOpen ? '▾' : '›'}
                </button>
              </td>
              <td className="ev-time mono">
                {date}
                <br />
                {time}
              </td>
              <td>
                <pre className="ev-raw">{e.raw}</pre>
                <div className="ev-meta">
                  {(['host', 'source', 'sourcetype'] as const).map((f) => (
                    <span key={f}>
                      {f} ={' '}
                      <button className="link-btn" onClick={() => onAddTerm(f, e[f])}>
                        {e[f]}
                      </button>
                    </span>
                  ))}
                </div>
                {isOpen && (
                  <table className="ev-fields">
                    <tbody>
                      {Object.entries(e.fields)
                        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
                        .map(([k, v]) => (
                          <tr key={k}>
                            <td className="mono">{k}</td>
                            <td className="mono">{renderValue(v)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------- statistics

function cell(col: string, v: ResultValue): string {
  if (col === '_time' && typeof v === 'number') return fmtTableTime(v);
  if (typeof v === 'number' && !Number.isInteger(v)) return String(Math.round(v * 1e6) / 1e6);
  return renderValue(v);
}

export function StatsTable({
  columns,
  page,
}: {
  columns: string[];
  page: PageDto<Record<string, ResultValue>>;
}) {
  const numeric = new Set(
    columns.filter(
      (c) => page.items.length > 0 && page.items.every((r) => r[c] === null || typeof r[c] === 'number'),
    ),
  );
  return (
    <div className="table-scroll">
      <table className="results">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className={numeric.has(c) ? 'num' : ''}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {page.items.map((r, i) => (
            <tr key={page.offset + i}>
              {columns.map((c) => (
                <td key={c} className={numeric.has(c) ? 'num' : 'mv'}>
                  {cell(c, r[c] ?? null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- visualization

type VizType = 'line' | 'column' | 'bar' | 'pie' | 'single';

const PALETTE = [
  '#1e93c6',
  '#f2b827',
  '#d6563c',
  '#6a5c9e',
  '#31a35f',
  '#ed8440',
  '#3863a0',
  '#a2cc3e',
  '#cc5068',
  '#73427f',
  '#11a88b',
];

export function Visualization({ columns, rows }: { columns: string[]; rows: Record<string, ResultValue>[] }) {
  const hasTime = columns.includes('_time');
  const numericCols = columns.filter(
    (c) =>
      c !== '_time' &&
      rows.some(
        (r) => typeof r[c] === 'number' || (typeof r[c] === 'string' && r[c] !== '' && !isNaN(Number(r[c]))),
      ),
  );
  const labelCol = hasTime ? '_time' : columns.find((c) => !numericCols.includes(c));
  const defaultType: VizType =
    rows.length === 1 && numericCols.length === 1 && !labelCol ? 'single' : hasTime ? 'line' : 'column';
  const [type, setType] = useState<VizType>(defaultType);

  if (!rows.length || !numericCols.length)
    return (
      <div className="empty-state">
        Visualizations need numeric results. Try a transforming search such as{' '}
        <code>| stats count by host</code> or <code>| timechart count</code>.
      </div>
    );

  const labels = rows.map((r) =>
    labelCol
      ? labelCol === '_time'
        ? fmtTableTime(Number(r._time)).slice(5, 16)
        : renderValue(r[labelCol] ?? null)
      : '',
  );
  const num = (v: ResultValue) => (v === null ? null : Number(v));
  let option: Record<string, unknown> | null = null;
  if (type === 'pie') {
    const col = numericCols[0]!;
    option = {
      tooltip: { trigger: 'item' },
      color: PALETTE,
      series: [
        {
          type: 'pie',
          radius: ['35%', '70%'],
          data: rows.map((r, i) => ({ name: labels[i], value: num(r[col] ?? null) })),
        },
      ],
    };
  } else if (type !== 'single') {
    const horizontal = type === 'bar';
    const cat = { type: 'category', data: labels, axisLabel: { fontSize: 11, color: '#5c6773' } };
    const val = { type: 'value', axisLabel: { fontSize: 11, color: '#5c6773' } };
    option = {
      color: PALETTE,
      tooltip: { trigger: 'axis' },
      legend: numericCols.length > 1 ? { bottom: 0, type: 'scroll' } : undefined,
      grid: { left: 8, right: 16, top: 16, bottom: numericCols.length > 1 ? 40 : 16, containLabel: true },
      xAxis: horizontal ? val : cat,
      yAxis: horizontal ? { ...cat, inverse: true } : val,
      series: numericCols.map((c) => ({
        name: c,
        type: type === 'line' ? 'line' : 'bar',
        showSymbol: rows.length < 40,
        stack: type !== 'line' && numericCols.length > 1 ? 'all' : undefined,
        data: rows.map((r) => num(r[c] ?? null)),
      })),
    };
  }

  return (
    <div>
      <div className="viz-types" role="group" aria-label="Visualization type">
        {(['line', 'column', 'bar', 'pie', 'single'] as VizType[]).map((t) => (
          <button key={t} className={t === type ? 'active' : ''} onClick={() => setType(t)}>
            {t === 'single' ? 'Single value' : t[0]!.toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {type === 'single' ? (
        <div className="single-value">
          <div className="sv-number">{renderValue(rows[0]![numericCols[0]!] ?? null)}</div>
          <div className="sv-label">{numericCols[0]}</div>
        </div>
      ) : (
        <Chart option={option!} height={360} />
      )}
    </div>
  );
}
