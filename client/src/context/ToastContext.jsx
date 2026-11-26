import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { IconCheckCircle, IconAlertCircle, IconInfo, IconClose } from '../components/Icons';

const ToastContext = createContext(null);
const ICONS = { success: IconCheckCircle, error: IconAlertCircle, info: IconInfo };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    // Strip leading emoji some callers still send — the toast already has an icon
    const clean = String(text).replace(/^[\p{Extended_Pictographic}️\s]+/u, '');
    setToasts((t) => [...t.slice(-3), { id, type, text: clean }]);
    timers.current[id] = setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (t) => push('success', t),
    error: (t) => push('error', t),
    info: (t) => push('info', t),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || IconInfo;
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon />
              <div className="toast-text">{t.text}</div>
              <button type="button" className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><IconClose /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
