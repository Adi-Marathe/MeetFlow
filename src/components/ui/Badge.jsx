export function Badge({ children, variant = 'default', style = {}, dot = false }) {
  const variants = {
    default: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'var(--border-default)' },
    accent: { bg: 'var(--accent-subtle)', color: 'var(--text-accent)', border: 'var(--border-accent)' },
    success: { bg: 'var(--success-subtle)', color: 'var(--success)', border: 'rgba(42,138,94,0.2)' },
    warning: { bg: 'var(--warning-subtle)', color: 'var(--warning)', border: 'rgba(212,145,74,0.2)' },
    danger: { bg: 'var(--danger-subtle)', color: 'var(--danger)', border: 'rgba(204,68,68,0.2)' },
    muted: { bg: 'var(--status-todo-bg)', color: 'var(--status-todo)', border: 'transparent' },
    inprogress: { bg: 'var(--status-inprogress-bg)', color: 'var(--status-inprogress)', border: 'var(--border-accent)' },
    done: { bg: 'var(--status-done-bg)', color: 'var(--status-done)', border: 'rgba(42,138,94,0.2)' },
  };

  const v = variants[variant] || variants.default;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: dot ? 5 : 0,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      letterSpacing: '0.02em',
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: v.color,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
