export function Avatar({ initials, color = '#F4622A', size = 28, style = {}, title = '' }) {
  const fontSize = Math.max(9, Math.floor(size * 0.36));

  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        background: color + '22',
        border: `1.5px solid ${color}44`,
        color: color,
        fontSize,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.02em',
        userSelect: 'none',
        ...style,
      }}
    >
      {initials}
    </span>
  );
}

export function AvatarGroup({ members, size = 24, max = 3 }) {
  const shown = members.slice(0, max);
  const rest = members.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <Avatar
          key={m.id || i}
          initials={m.avatar_initials}
          color={m.color}
          size={size}
          title={m.name}
          style={{
            marginLeft: i > 0 ? -6 : 0,
            border: `2px solid var(--bg-surface)`,
          }}
        />
      ))}
      {rest > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          minWidth: size,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '2px solid var(--bg-surface)',
          color: 'var(--text-muted)',
          fontSize: size * 0.35,
          fontWeight: 600,
          marginLeft: -6,
        }}>
          +{rest}
        </span>
      )}
    </div>
  );
}
