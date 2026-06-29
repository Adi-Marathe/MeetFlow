import { useState, useRef } from 'react';
import { GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../lib/utils';
import { useRecords } from 'lemma-sdk/react';
import { client } from '../../lib/lemma';

export function TaskReviewCard({ task, onChange, onRemove, index = 0, highlightRef }) {
  const [contextOpen, setContextOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const owner = members.find(m => m.email === task.owner);

  const priorities = ['high', 'medium', 'low'];
  const priorityColors = {
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
  };

  return (
    <div
      ref={highlightRef}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '3px solid var(--accent-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        animation: `fadeInUp 0.3s var(--ease-out) ${index * 80}ms both`,
        transition: 'box-shadow var(--duration-fast)',
        position: 'relative',
      }}
    >
      {/* AI marker */}
      {index === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 12,
          fontSize: 11,
          color: 'var(--text-accent)',
          fontStyle: 'italic',
        }}>
          <span>✦</span>
          <span>Extracted by MeetFlow AI</span>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{ color: 'var(--text-muted)', cursor: 'grab', paddingTop: 2, flexShrink: 0 }}>
          <GripVertical size={14} />
        </div>
        <input
          value={task.title}
          onChange={e => onChange({ ...task, title: e.target.value })}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            padding: '0',
            borderBottom: '1px solid transparent',
            transition: 'border-color var(--duration-fast)',
          }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--border-accent)'}
          onBlur={e => e.target.style.borderBottomColor = 'transparent'}
        />
        <button
          onClick={onRemove}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: 0.6,
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Fields row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Owner */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOwnerMenuOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {owner && <Avatar initials={owner.avatar_initials} color={owner.color} size={18} />}
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {owner?.name?.split(' ')[0] || 'Assign'}
            </span>
            <ChevronDown size={10} color="var(--text-muted)" />
          </button>

          {ownerMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 100,
              minWidth: 160,
              overflow: 'hidden',
            }}>
              {members.filter(m => m.role !== 'observer').map(m => (
                <div
                  key={m.id}
                  onClick={() => { onChange({ ...task, owner: m.email }); setOwnerMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    background: task.owner === m.email ? 'var(--accent-subtle)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (task.owner !== m.email) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (task.owner !== m.email) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar initials={m.avatar_initials} color={m.color} size={20} />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadline */}
        <input
          type="date"
          value={task.deadline}
          onChange={e => onChange({ ...task, deadline: e.target.value })}
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
        />

        {/* Priority */}
        <div style={{ display: 'flex', gap: 4 }}>
          {priorities.map(p => (
            <button
              key={p}
              onClick={() => onChange({ ...task, priority: p })}
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${priorityColors[p]}44`,
                background: task.priority === p ? priorityColors[p] : 'transparent',
                color: task.priority === p ? '#fff' : priorityColors[p],
                cursor: 'pointer',
                transition: 'all var(--duration-fast)',
                textTransform: 'capitalize',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Context collapsible */}
      {task.context && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setContextOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {contextOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Context
          </button>
          {contextOpen && (
            <p style={{
              marginTop: 6,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              borderLeft: '2px solid var(--accent-subtle)',
              paddingLeft: 8,
            }}>
              {task.context}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
