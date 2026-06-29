export function Button({
  children,
  variant = 'filled',
  size = 'md',
  onClick,
  disabled = false,
  style = {},
  className = '',
  type = 'button',
  ...props
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast), transform var(--duration-fast), box-shadow var(--duration-fast)',
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, height: 30 },
    md: { padding: '8px 16px', fontSize: 13, height: 36 },
    lg: { padding: '10px 20px', fontSize: 14, height: 40 },
    xl: { padding: '12px 24px', fontSize: 15, height: 44 },
  };

  const variants = {
    filled: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
    },
    subtle: {
      background: 'var(--accent-subtle)',
      color: 'var(--text-accent)',
      border: '1px solid var(--border-accent)',
    },
    danger: {
      background: 'var(--danger-subtle)',
      color: 'var(--danger)',
      border: '1px solid rgba(204,68,68,0.2)',
    },
    text: {
      background: 'transparent',
      color: 'var(--text-accent)',
      border: '1px solid transparent',
      textDecoration: 'underline',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      className={className}
      onMouseEnter={e => {
        if (disabled) return;
        if (variant === 'filled') {
          e.currentTarget.style.background = 'var(--accent-hover)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-accent)';
        } else if (variant === 'ghost') {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        } else if (variant === 'subtle') {
          e.currentTarget.style.background = 'var(--accent-subtle-hover)';
        }
      }}
      onMouseLeave={e => {
        if (disabled) return;
        Object.assign(e.currentTarget.style, variants[variant]);
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
