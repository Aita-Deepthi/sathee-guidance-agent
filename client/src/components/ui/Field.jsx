import { cloneElement, isValidElement, useId } from 'react';
import { IconAlertCircle } from '../Icons';

/*
 * Labelled form field. Wires id / aria-describedby / aria-invalid onto the
 * single child control so hints and errors are announced by screen readers.
 */
export default function Field({ label, hint, error, optional, children, className = '', aside }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [errId, hintId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id: children.props.id || id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined })
    : children;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label" htmlFor={isValidElement(children) ? (children.props.id || id) : undefined}>
          <span>{label}{optional && <span className="optional"> (optional)</span>}</span>
          {aside}
        </label>
      )}
      {control}
      {error ? <div className="field-error" id={errId}><IconAlertCircle /> {error}</div> : hint ? <div className="field-hint" id={hintId}>{hint}</div> : null}
    </div>
  );
}
