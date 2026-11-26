export function Skeleton({ width, height = 12, radius, className = '', style }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}

function Lines({ n = 3 }) {
  return (
    <div className="stack-2">
      {Array.from({ length: n }).map((_, i) => <Skeleton key={i} width={`${92 - i * 14}%`} />)}
    </div>
  );
}

function CardSkeleton({ rows = 3, tall = false }) {
  return (
    <div className="card">
      <div className="card-header"><Skeleton width={140} height={14} /><Skeleton width={64} height={20} /></div>
      <div className="card-body stack-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="row-3">
            <Skeleton width={18} height={18} radius={5} />
            <div className="grow stack-1"><Skeleton width="55%" height={12} /><Skeleton width="30%" height={10} /></div>
          </div>
        ))}
        {tall && <Lines n={2} />}
      </div>
    </div>
  );
}

// Layout-matching placeholders so content does not jump when data arrives
export function PageSkeleton({ variant = 'default' }) {
  return (
    <div className="stack" role="status" aria-live="polite" aria-label="Loading">
      <div className="stack-2">
        <Skeleton width={220} height={26} />
        <Skeleton width={360} height={14} style={{ maxWidth: '80%' }} />
      </div>
      {variant === 'dashboard' && (
        <>
          <div className="card"><div className="metrics">{[0, 1, 2, 3].map((i) => <div key={i} className="metric stack-2"><Skeleton width={90} height={12} /><Skeleton width={70} height={22} /></div>)}</div></div>
          <div className="split">
            <div className="stack"><CardSkeleton rows={2} /><CardSkeleton rows={4} /></div>
            <div className="stack"><CardSkeleton rows={3} /><CardSkeleton rows={2} /></div>
          </div>
        </>
      )}
      {variant === 'split' && (
        <div className="split">
          <CardSkeleton rows={5} />
          <div className="stack"><CardSkeleton rows={2} /><CardSkeleton rows={3} /></div>
        </div>
      )}
      {variant === 'grid' && (
        <div className="grid-3">{[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} rows={2} />)}</div>
      )}
      {variant === 'charts' && (
        <div className="grid-2">{[0, 1, 2, 3].map((i) => <div key={i} className="card card-pad stack-3"><Skeleton width={160} height={14} /><Skeleton height={220} radius={8} /></div>)}</div>
      )}
      {variant === 'default' && <CardSkeleton rows={4} tall />}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="stack-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row-3"><Skeleton width={18} height={18} radius={5} /><div className="grow stack-1"><Skeleton width="60%" /><Skeleton width="35%" height={10} /></div></div>
      ))}
    </div>
  );
}
