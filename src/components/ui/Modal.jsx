import { useEffect } from 'react';

export function Modal({ isOpen, onClose, children, maxWidth = 560, title }) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26,25,21,0.5)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth,
        maxHeight: '85vh',
        overflow: 'auto',
        animation: 'popIn 0.2s var(--ease-spring)',
        margin: 16,
      }}>
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                border: 'none',
              }}
            >×</button>
          </div>
        )}
        <div style={{ padding: title ? '16px 24px 24px' : '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
