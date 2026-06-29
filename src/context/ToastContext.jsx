import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration + 400);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const colors = {
    success: { bg: 'var(--success)', icon: '✓' },
    error: { bg: 'var(--danger)', icon: '✕' },
    warning: { bg: 'var(--warning)', icon: '!' },
    info: { bg: 'var(--accent)', icon: '✦' },
  };
  const { bg, icon } = colors[toast.type] || colors.info;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        minWidth: 280,
        maxWidth: 360,
        pointerEvents: 'auto',
        animation: 'toastSlideIn 0.28s var(--ease-out)',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <span style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: bg,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
          {toast.message}
        </span>
      </div>
      <div style={{ height: 2, background: 'var(--bg-elevated)', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          background: bg,
          animation: `countdownShrink ${toast.duration}ms linear forwards`,
        }} />
      </div>
    </div>
  );
}
