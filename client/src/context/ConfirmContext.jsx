import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { IconAlert, IconTrash, IconInfo } from '../components/Icons';

/*
 * Promise-based confirmation dialog (replaces window.confirm).
 *   const confirm = useConfirm();
 *   if (await confirm({ title, description, confirmLabel, tone: 'danger' })) { ... }
 * Accessible: role=alertdialog, focus moves in, Tab is trapped, Esc cancels,
 * focus returns to the opener on close.
 */
const ConfirmContext = createContext(null);
const TONE_ICON = { danger: IconTrash, warning: IconAlert, primary: IconInfo };

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const opener = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    opener.current = document.activeElement;
    resolver.current = resolve;
    setState({ tone: 'primary', confirmLabel: 'Confirm', cancelLabel: 'Cancel', ...opts });
  }), []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
    const el = opener.current;
    if (el && typeof el.focus === 'function') setTimeout(() => el.focus(), 0);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog {...state} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ title, description, confirmLabel, cancelLabel, tone, onClose }) {
  const ref = useRef(null);
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const Icon = TONE_ICON[tone] || IconInfo;

  useEffect(() => {
    (tone === 'danger' ? cancelRef : confirmRef).current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [tone]);

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(false); }
    if (e.key === 'Tab') {
      const nodes = ref.current.querySelectorAll('button');
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(false); }}>
      <div ref={ref} className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={description ? 'confirm-desc' : undefined} onKeyDown={onKeyDown}>
        <div className="dialog-body">
          <div className={`dialog-icon ${tone}`}><Icon /></div>
          <div className="grow">
            <h2 id="confirm-title">{title}</h2>
            {description && <p id="confirm-desc">{description}</p>}
          </div>
        </div>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={() => onClose(false)}>{cancelLabel}</button>
          <button ref={confirmRef} type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={() => onClose(true)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
