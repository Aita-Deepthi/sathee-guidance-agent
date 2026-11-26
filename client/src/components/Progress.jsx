export function ProgressBar({ value = 0, color, size, label }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return (
    <div className={`progress ${size || ''}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 120, stroke = 10, label, sublabel, color = 'var(--color-primary)', ariaLabel }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={`ring ${size < 72 ? 'sm' : ''}`} style={{ width: size, height: size }} role="img" aria-label={ariaLabel || `${v}% ${sublabel || ''}`.trim()}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--chart-track)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .5s var(--ease-out)' }} />
      </svg>
      <div className="ring-label" aria-hidden="true">
        <strong>{label ?? `${v}%`}</strong>
        {sublabel && size >= 72 && <span>{sublabel}</span>}
      </div>
    </div>
  );
}

// Compact inline statistic, used inside a shared .metrics strip
export function Metric({ icon, label, value, unit, hint }) {
  return (
    <div className="metric">
      <div className="metric-label">{icon}{label}</div>
      <div className="metric-value">{value}{unit && <small> {unit}</small>}</div>
      {hint && <div className="metric-hint">{hint}</div>}
    </div>
  );
}

// Back-compat: a stat tile (used on result + progress pages)
export function StatCard({ icon, label, value, hint, tone }) {
  return (
    <div className="card stat-tile">
      <div className={`stat-tile-icon ${tone ? `tone-${tone}` : ''}`}>{icon}</div>
      <div className="stat-tile-label">{label}</div>
      <div className="stat-tile-value">{value}</div>
      {hint && <div className="stat-tile-hint">{hint}</div>}
    </div>
  );
}
