import type { DashboardInput, OperationalDashboardPanel } from './dashboards';
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function classicSource(
  title: string,
  description: string,
  inputs: DashboardInput[],
  panels: OperationalDashboardPanel[],
) {
  return (
    '<' +
    (inputs.length ? 'form' : 'dashboard') +
    ' version="1.1"><label>' +
    escapeXml(title) +
    '</label><description>' +
    escapeXml(description) +
    '</description>' +
    (inputs.length
      ? '<fieldset>' +
        inputs
          .map(
            (i) =>
              '<input type="' +
              i.type +
              '" token="' +
              escapeXml(i.token) +
              '"><label>' +
              escapeXml(i.label) +
              '</label><default>' +
              escapeXml(i.defaultValue) +
              '</default>' +
              i.choices
                .map((c) => '<choice value="' + escapeXml(c.value) + '">' + escapeXml(c.label) + '</choice>')
                .join('') +
              '</input>',
          )
          .join('') +
        '</fieldset>'
      : '') +
    '<row>' +
    panels
      .map(
        (p) =>
          '<panel><title>' +
          escapeXml(p.title) +
          '</title><' +
          (['table', 'single'].includes(p.type) ? p.type : 'chart') +
          '><search' +
          (p.report ? ' ref="' + escapeXml(p.report) + '"' : '') +
          '>' +
          (p.search ? '<query>' + escapeXml(p.search) + '</query>' : '') +
          '<earliest>' +
          escapeXml(p.earliest) +
          '</earliest><latest>' +
          escapeXml(p.latest) +
          '</latest></search>' +
          (!['table', 'single'].includes(p.type)
            ? '<option name="charting.chart">' + p.type + '</option>'
            : '') +
          '</' +
          (['table', 'single'].includes(p.type) ? p.type : 'chart') +
          '></panel>',
      )
      .join('') +
    '</row></' +
    (inputs.length ? 'form' : 'dashboard') +
    '>'
  );
}
export function studioSource(
  title: string,
  description: string,
  inputs: DashboardInput[],
  panels: OperationalDashboardPanel[],
) {
  const value = {
    title,
    description,
    dataSources: Object.fromEntries(
      panels.map((p, i) => [
        'ds_' + i,
        {
          type: 'ds.search',
          options: { query: p.search ?? '', queryParameters: { earliest: p.earliest, latest: p.latest } },
        },
      ]),
    ),
    visualizations: Object.fromEntries(
      panels.map((p, i) => [
        p.id,
        {
          type: 'splunk.' + (p.type === 'single' ? 'singlevalue' : p.type),
          title: p.title,
          dataSources: { primary: 'ds_' + i },
        },
      ]),
    ),
    inputs: Object.fromEntries(
      inputs.map((i) => [
        'input_' + i.token,
        {
          type: 'input.' + i.type,
          title: i.label,
          options: { token: i.token, defaultValue: i.defaultValue, items: i.choices },
        },
      ]),
    ),
    layout: { type: 'grid' },
  };
  return JSON.stringify(value, null, 2);
}
