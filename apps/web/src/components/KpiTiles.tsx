import { HEALTH_LABELS, HEALTH_STATES, type FleetSummary, type HealthState } from '@sandbox/shared';
import { fmtInt, fmtPct, HEALTH_COLORS } from '../format';

export function KpiTiles({
  summary,
  selected,
  onSelect,
}: {
  summary: FleetSummary;
  selected?: HealthState;
  onSelect: (h: HealthState | undefined) => void;
}) {
  return (
    <div className="tiles">
      <button
        className={`tile ${selected === undefined ? 'selected' : ''}`}
        onClick={() => onSelect(undefined)}
      >
        <div className="tile-value">{fmtInt(summary.total)}</div>
        <div className="tile-label">Forwarders</div>
      </button>
      {HEALTH_STATES.map((h) => (
        <button
          key={h}
          className={`tile ${selected === h ? 'selected' : ''}`}
          style={{ borderTopColor: HEALTH_COLORS[h] }}
          onClick={() => onSelect(selected === h ? undefined : h)}
          title={`Show ${HEALTH_LABELS[h].toLowerCase()} forwarders`}
        >
          <div className="tile-value" style={{ color: h === 'healthy' ? undefined : HEALTH_COLORS[h] }}>
            {fmtInt(summary.byHealth[h])}
          </div>
          <div className="tile-label">
            {HEALTH_LABELS[h]} <span className="tile-pct">{fmtPct(summary.byHealth[h], summary.total)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
