export default function Loader({ label = 'Loading…', full = false, small = false }) {
  if (small) return <span className="spinner spinner-sm" role="status" aria-label={label} />;
  return (
    <div className={full ? 'loader-full' : 'loader'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
