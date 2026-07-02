import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../lib/utils';
import { useRecords } from 'lemma-sdk/react';
import { client } from '../../lib/lemma';

export function TaskCard({
  task,
  draggable = false,
  isOverlay = false,
  hideOwner = false,
  showMeetingSource = false,
}) {
  const navigate = useNavigate();
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  
  const owner = members.find(m => m.email === task.owner);
  const meeting = showMeetingSource ? meetings.find(m => m.id === task.meeting_id) : null;
  const [contextOpen, setContextOpen] = useState(false);

  const priorityColors = {
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
  };

  const statusVariants = {
    todo: 'muted',
    inprogress: 'inprogress',
    done: 'done',
  };

  const statusLabels = {
    todo: 'To do',
    inprogress: 'In progress',
    done: 'Done',
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderLeft: `3px solid ${priorityColors[task.priority] || 'var(--border-subtle)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '12px 14px',
    cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : (task.meeting_id ? 'pointer' : 'default'),
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    userSelect: 'none',
    ...(isOverlay && {
      transform: 'scale(1.02)',
      borderColor: 'var(--accent)',
      borderLeftColor: priorityColors[task.priority] || 'var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)',
      opacity: 1,
      zIndex: 999,
      transition: 'none', // Snap to cursor
    }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!draggable && task.meeting_id) {
          navigate(`/meetings/${task.meeting_id}/board`);
        }
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={e => {
        if (!isDragging && !isOverlay) {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.borderLeftColor = priorityColors[task.priority] || 'var(--border-strong)';
          e.currentTarget.style.transition = 'border-color 120ms';
        }
      }}
      onMouseLeave={e => {
        if (!isOverlay) {
          e.currentTarget.style.borderTopColor = 'var(--border-subtle)';
          e.currentTarget.style.borderRightColor = 'var(--border-subtle)';
          e.currentTarget.style.borderBottomColor = 'var(--border-subtle)';
        }
      }}
    >
      {/* Drag handle */}
      {draggable && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          color: 'var(--text-muted)',
          opacity: isOverlay ? 0 : 0.5, // Always slightly visible or hide on hover, let's keep it visible
        }}>
          <GripVertical size={14} />
        </div>
      )}

      {/* Title */}
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 10,
        lineHeight: 1.4,
        paddingRight: draggable ? 20 : 0,
      }}>
        {task.title}
      </div>

      {/* Owner + deadline row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!hideOwner && owner && (
            <>
              <Avatar initials={owner.avatar_initials} color={owner.color} size={22} title={owner.name} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{(owner.name || '').split(' ')[0] || 'User'}</span>
            </>
          )}
          {showMeetingSource && meeting && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/meetings/${meeting.id}/board`);
              }}
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                background: 'var(--bg-overlay)',
                padding: '2px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title={meeting.title}
            >
              From: {(meeting.title || '').split(' ').slice(0, 2).join(' ') || 'Meeting'}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          background: 'var(--bg-elevated)',
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {formatDate(task.deadline)}
        </span>
      </div>

      {/* Status + priority row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge variant={statusVariants[task.status] || 'default'} dot>
          {statusLabels[task.status] || task.status}
        </Badge>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: priorityColors[task.priority],
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 500 }}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Context */}
      {task.context && (
        <div style={{ marginTop: 12 }}>
          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            borderLeft: `2px solid ${priorityColors[task.priority] || 'var(--accent-subtle)'}`,
            paddingLeft: 8,
            background: 'var(--bg-elevated)',
            padding: '6px 8px',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          }}>
            {task.context}
          </p>
        </div>
      )}
    </div>
  );
}
