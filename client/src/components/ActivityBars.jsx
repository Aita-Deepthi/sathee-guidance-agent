import { formatDate, formatMinutes, todayISO } from '../utils/format';

// 14-day study-minutes bar strip (real Progress records from /progress/summary)
export default function ActivityBars({ days }) {
  const max = Math.max(60, ...days.map((x) => x.minutes));
  const total = days.reduce((n, x) => n + x.minutes, 0);
  const active = days.filter((x) => x.minutes > 0 || x.completed > 0).length;
  return (
    <div className="activity">
      <div className="activity-summary">
        <div><div className="metric-value num">{formatMinutes(total)}</div><div className="metric-hint">logged in 14 days</div></div>
        <div className="right"><div className="metric-value num">{active}<small> / 14</small></div><div className="metric-hint">active days</div></div>
      </div>
      <div className="activity-bars" role="img" aria-label={`Study minutes over the last 14 days: ${formatMinutes(total)} total across ${active} active days`}>
        {days.map((x) => {
          const h = x.minutes ? Math.max(8, Math.round((x.minutes / max) * 100)) : 0;
          return (
            <div key={x.date} className="activity-col" title={`${formatDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${formatMinutes(x.minutes)} · ${x.completed}/${x.planned} tasks`}>
              <div className={`activity-bar ${x.date === todayISO() ? 'today' : ''}`} style={{ height: `${h}%` }} />
            </div>
          );
        })}
      </div>
      <div className="activity-axis text-xs muted num">
        <span>{formatDate(days[0]?.date, { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
