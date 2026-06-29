export function Toggle({ checked, onChange, size = 'md', disabled = false }) {
  const sizes = {
    sm: { width: 32, height: 18, knob: 12, pad: 3 },
    md: { width: 40, height: 22, knob: 16, pad: 3 },
    lg: { width: 48, height: 26, knob: 20, pad: 3 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: s.width,
        height: s.height,
        borderRadius: s.height / 2,
        background: checked ? 'var(--accent)' : 'var(--border-strong)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background var(--duration-base) var(--ease-spring)',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: s.pad,
        left: checked ? s.width - s.knob - s.pad : s.pad,
        width: s.knob,
        height: s.knob,
        borderRadius: '50%',
        background: '#ffffff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left var(--duration-base) var(--ease-spring)',
      }} />
    </button>
  );
}
