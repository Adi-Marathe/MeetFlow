import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, Users, ChevronRight, Circle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { AvatarGroup } from '../ui/Avatar';
import { formatDateFull, formatTime, getSourceColor, getSourceLabel } from '../../lib/utils';
import { members } from '../../mock/members';

export function MeetingCard({ meeting, index = 0 }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const participantMembers = meeting.participants
    .map(email => members.find(m => m.email === email))
    .filter(Boolean);

  const statusConfig = {
    pending_review: { variant: 'warning', label: 'Pending review', route: 'review' },
    extracted: { variant: 'inprogress', label: 'Extracted', route: 'review' },
    approved: { variant: 'done', label: 'Approved', route: 'board' },
    done: { variant: 'muted', label: 'Done', route: 'board' },
  };

  const { variant, label, route } = statusConfig[meeting.status] || statusConfig.done;
  const sourceColor = getSourceColor(meeting.source);

  function handleClick() {
    navigate(`/meetings/${meeting.id}/${route}`);
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast)',
        animation: `fadeInUp 0.3s var(--ease-out) ${index * 50}ms both`,
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
        borderColor: hovered ? 'var(--border-default)' : 'var(--border-subtle)',
      }}
    >
      {/* Source dot */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: sourceColor + '18',
        border: `1px solid ${sourceColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Video size={16} color={sourceColor} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {meeting.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />
            {formatDateFull(meeting.date)} · {meeting.duration_mins}m
          </span>
          <span style={{
            fontSize: 10,
            color: sourceColor,
            background: sourceColor + '15',
            padding: '1px 6px',
            borderRadius: 4,
            fontWeight: 500,
          }}>
            {getSourceLabel(meeting.source)}
          </span>
        </div>
      </div>

      {/* Participants */}
      <AvatarGroup members={participantMembers} size={22} max={2} />

      {/* Task count */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-accent)' }}>{meeting.task_count}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tasks</div>
      </div>

      {/* Status badge */}
      <Badge variant={variant}>{label}</Badge>

      {/* Arrow */}
      <ChevronRight
        size={16}
        color="var(--text-muted)"
        style={{
          flexShrink: 0,
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform var(--duration-fast)',
        }}
      />
    </div>
  );
}
