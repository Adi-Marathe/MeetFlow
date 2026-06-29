import { useEffect } from 'react';

export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrlKey = false, metaKey = false, shiftKey = false, ignoreInputs = true } = options;

  useEffect(() => {
    function handler(e) {
      if (ignoreInputs) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
          // Allow Escape and Cmd+K even in inputs
          if (e.key !== 'Escape' && !(e.key === 'k' && (e.ctrlKey || e.metaKey))) return;
        }
      }
      const matchKey = e.key?.toLowerCase() === key?.toLowerCase();
      const matchCtrl = ctrlKey ? e.ctrlKey : true;
      const matchMeta = metaKey ? e.metaKey : true;
      const matchShift = shiftKey ? e.shiftKey : true;
      const matchMod = (ctrlKey || metaKey) ? (e.ctrlKey || e.metaKey) : true;

      if (matchKey && (ctrlKey || metaKey ? e.ctrlKey || e.metaKey : true) && matchShift) {
        if (ctrlKey || metaKey) {
          if (!e.ctrlKey && !e.metaKey) return;
        }
        e.preventDefault();
        callback(e);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, ctrlKey, metaKey, shiftKey, ignoreInputs]);
}
