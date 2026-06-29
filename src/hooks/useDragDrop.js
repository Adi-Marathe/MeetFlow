import { useState, useRef, useCallback } from 'react';

export function useDragDrop(onDrop) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const ghostRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e, item) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startPos.current = { x: e.clientX, y: e.clientY };

    // Create ghost
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      left: ${e.clientX - 100}px;
      top: ${e.clientY - 30}px;
      width: 200px;
      padding: 10px 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-accent);
      border-radius: 10px;
      box-shadow: var(--shadow-lg);
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--text-primary);
      opacity: 0.92;
      transform: scale(1.03) rotate(1.5deg);
      transition: none;
    `;
    ghost.textContent = item.title;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    setDragging(item);

    function onMouseMove(e) {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - 100}px`;
        ghostRef.current.style.top = `${e.clientY - 30}px`;
      }
    }

    function onMouseUp(e) {
      if (ghostRef.current) {
        document.body.removeChild(ghostRef.current);
        ghostRef.current = null;
      }
      setDragging(null);
      setDragOver(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const onColumnMouseEnter = useCallback((columnId) => {
    setDragOver(columnId);
  }, []);

  const onColumnMouseLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const onColumnMouseUp = useCallback((e, columnId) => {
    if (dragging && onDrop) {
      onDrop(dragging, columnId, e.clientX, e.clientY);
    }
    setDragging(null);
    setDragOver(null);
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  }, [dragging, onDrop]);

  return {
    dragging,
    dragOver,
    onMouseDown,
    onColumnMouseEnter,
    onColumnMouseLeave,
    onColumnMouseUp,
  };
}
