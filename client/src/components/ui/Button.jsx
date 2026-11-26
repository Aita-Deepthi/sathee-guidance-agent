// Button with built-in loading state. variant: primary | secondary | ghost | subtle | danger
export default function Button({ variant = 'secondary', size, loading = false, block, icon, children, className = '', disabled, type = 'button', ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
