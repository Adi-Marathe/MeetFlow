import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Video, CheckSquare, X, LayoutGrid } from 'lucide-react';
import { useRecords } from 'lemma-sdk/react';
import { podClient } from '../../lib/lemma';
import { formatDate } from '../../lib/utils';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const resultsRef = useRef([]);

  // Fetch data from pod
  const { records: meetings = [] } = useRecords({ client: podClient, tableName: 'meetings' });
  const { records: tasks = [] } = useRecords({ client: podClient, tableName: 'tasks' });

  const filteredMeetings = meetings.filter(m =>
    !query || m.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredTasks = tasks.filter(t =>
    !query || t.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const results = [
    ...filteredMeetings.map(m => ({ type: 'meeting', ...m })),
    ...filteredTasks.map(t => ({ type: 'task', ...t })),
  ];

  // Keep ref in sync so the keyboard effect always sees the latest results
  resultsRef.current = results;

  function handleSelect(item) {
    if (item.type === 'meeting') {
      navigate(`/meetings/${item.id}/board`);
    } else {
      navigate(`/meetings/${item.meeting_id}/board`);
    }
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, resultsRef.current.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = resultsRef.current[selected];
        if (item) handleSelect(item);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, selected, onClose]);


  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(26,25,21,0.5)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'popIn 0.2s var(--ease-spring)',
        margin: '0 16px',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search meetings, tasks…"
            style={{
              flex: 1,
              fontSize: 14,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button onClick={onClose} style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'var(--bg-elevated)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          }}>
            <X size={12} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
          {results.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}

          {filteredMeetings.length > 0 && (
            <>
              <div style={{ padding: '4px 16px 4px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Meetings
              </div>
              {filteredMeetings.map((m, i) => (
                <PaletteItem
                  key={m.id}
                  icon={<Video size={14} />}
                  title={m.title}
                  meta={formatDate(m.date) + ' · ' + m.task_count + ' tasks'}
                  active={selected === i}
                  onClick={() => handleSelect({ type: 'meeting', ...m })}
                  onHover={() => setSelected(i)}
                />
              ))}
            </>
          )}

          {filteredTasks.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Tasks
              </div>
              {filteredTasks.map((t, i) => (
                <PaletteItem
                  key={t.id}
                  icon={<CheckSquare size={14} />}
                  title={t.title}
                  meta={formatDate(t.deadline) + ' · ' + t.priority}
                  active={selected === filteredMeetings.length + i}
                  onClick={() => handleSelect({ type: 'task', ...t })}
                  onHover={() => setSelected(filteredMeetings.length + i)}
                />
              ))}
            </>
          )}
        </div>

        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 12,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

function PaletteItem({ icon, title, meta, active, onClick, onHover }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        cursor: 'pointer',
        background: active ? 'var(--accent-subtle)' : 'transparent',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background 100ms',
      }}
    >
      <span style={{ color: active ? 'var(--text-accent)' : 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{meta}</span>
    </div>
  );
}
