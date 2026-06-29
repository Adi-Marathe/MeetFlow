import { useRef, useEffect, useState } from 'react';
import { ProgressRing } from '../ui/ProgressRing';
import { useCountUp } from '../../hooks/useCountUp';

export function StatCard({ icon: Icon, label, value, sub, subColor, showRing = false, ringPercent = 0, index = 0 }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const count = useCountUp(value, 900, started);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        animation: `fadeInUp 0.3s var(--ease-out) ${index * 60}ms both`,
        transition: 'box-shadow var(--duration-fast), transform var(--duration-fast)',
        flex: 1,
        minWidth: 180,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {Icon && <Icon size={18} color="var(--accent)" />}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showRing ? (
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <ProgressRing percent={started ? ringPercent : 0} size={48} strokeWidth={4} animate={started} />
              <span style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-accent)',
              }}>
                {count}%
              </span>
            </div>
          ) : (
            <span style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1,
              fontFamily: 'var(--font-sans)',
            }}>
              {count}
            </span>
          )}
        </div>
        {sub && (
          <div style={{
            fontSize: 11,
            color: subColor || 'var(--text-muted)',
            marginTop: 4,
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
