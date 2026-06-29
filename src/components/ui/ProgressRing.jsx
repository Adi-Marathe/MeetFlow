import { useEffect, useRef } from 'react';

export function ProgressRing({ percent = 0, size = 64, strokeWidth = 5, animate = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const circleRef = useRef(null);

  useEffect(() => {
    if (!animate || !circleRef.current) return;
    circleRef.current.style.setProperty('--ring-start', String(circumference));
    circleRef.current.style.setProperty('--ring-end', String(offset));
  }, [circumference, offset, animate]);

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-default)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        ref={circleRef}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animate ? circumference : offset}
        style={animate ? {
          animation: `ringFill 900ms var(--ease-out) forwards`,
          '--ring-start': circumference,
          '--ring-end': offset,
        } : {
          strokeDashoffset: offset,
        }}
      />
    </svg>
  );
}
