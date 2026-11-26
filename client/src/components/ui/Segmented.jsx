// Single-choice segmented control (buttons with aria-pressed)
export default function Segmented({ options, value, onChange, size, block, label }) {
  return (
    <div className={`segmented ${size || ''} ${block ? 'block' : ''}`} role="group" aria-label={label}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <button type="button" key={opt.value} aria-pressed={value === opt.value} className={opt.tone ? `tone-${opt.tone}` : ''}
            onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
