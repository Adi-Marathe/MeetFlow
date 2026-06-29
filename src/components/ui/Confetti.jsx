import { useEffect, useRef } from 'react';

const COLORS = ['#e8956a', '#d4914a', '#3aaa74', '#faf9f7', '#F4622A', '#f0c070'];

export function Confetti({ x, y, onDone }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const particles = [];

    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      const dx = (Math.random() - 0.5) * 160;
      const dy = -(60 + Math.random() * 80);
      const dr = Math.random() * 360;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${3 + Math.random() * 5}px;
        height: ${6 + Math.random() * 6}px;
        border-radius: 2px;
        background: ${color};
        pointer-events: none;
        z-index: 9999;
        --dx: ${dx}px;
        --dy: ${dy}px;
        --dr: ${dr}deg;
        animation: confettiFall ${600 + Math.random() * 200}ms ease-in forwards;
        animation-delay: ${Math.random() * 100}ms;
      `;
      document.body.appendChild(el);
      particles.push(el);
    }

    const cleanup = setTimeout(() => {
      particles.forEach(p => p.parentNode && p.parentNode.removeChild(p));
      onDone && onDone();
    }, 1000);

    return () => {
      clearTimeout(cleanup);
      particles.forEach(p => p.parentNode && p.parentNode.removeChild(p));
    };
  }, [x, y, onDone]);

  return <div ref={containerRef} />;
}
