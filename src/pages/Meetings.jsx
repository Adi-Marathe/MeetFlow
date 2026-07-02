import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Video, Plus, Filter, ChevronRight, Clock, Users, CheckCircle, AlertCircle, Loader, Monitor, MessageSquare, FileText } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { NewMeetingModal } from '../components/features/NewMeetingModal';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { useRecords } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDate, formatDateFull, getSourceLabel } from '../lib/utils';
import { useCurrentMember } from '../hooks/useCurrentMember';

const STATUS_CONFIG = {
  approved:       { label: 'Approved', bg: 'var(--status-done-bg)', color: 'var(--status-done)' },
  completed:      { label: 'Completed', bg: 'var(--success-subtle)', color: 'var(--success)' },
  extracted:      { label: 'Extracted', bg: 'var(--amber-subtle)', color: 'var(--amber)' },
  pending_review: { label: 'Pending review', bg: 'var(--warning-subtle)', color: 'var(--warning)' },
  done:           { label: 'Done', bg: 'var(--status-done-bg)', color: 'var(--status-done)' },
};

const SOURCE_ICONS = { google_meet: Video, zoom: Monitor, slack: MessageSquare, teams: Users, default: FileText };

const FILTERS = ['All', 'Completed', 'Approved', 'Pending review', 'Extracted'];

function MeetingRow({ meeting, index }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const { records: allTasks = [] } = useRecords({ client, tableName: 'tasks' });
  const { records: members = [] } = useRecords({ client, tableName: 'members' });

  const meetingTasks = allTasks.filter(t => t.meeting_id === meeting.id);
  const doneTasks = meetingTasks.filter(t => t.status === 'done').length;
  const statusCfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending_review;
  const sourceKey = (meeting.source || '').toLowerCase().replace(' ', '_');
  const SourceIcon = SOURCE_ICONS[sourceKey] || SOURCE_ICONS.default;

  // Handle participants as either array or comma-separated string
  const participantEmails = Array.isArray(meeting.participants)
    ? meeting.participants
    : (meeting.participants || '').split(',').map(e => (e || '').trim()).filter(Boolean);

  const participants = participantEmails
    .map(email => members.find(m => m.email === email))
    .filter(Boolean);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/meetings/${meeting.id}/review`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast)',
        animation: `fadeInUp 0.25s var(--ease-out) ${index * 50}ms both`,
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {/* Source icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)',
        background: 'var(--bg-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', flexShrink: 0,
      }}>
        <SourceIcon size={20} />
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meeting.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <Clock size={10} /> {formatDate(meeting.date)}
          </span>
          {meeting.duration_mins && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {meeting.duration_mins}m</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: meeting.source === 'Google Meet' ? '#4285f4' : meeting.source === 'Zoom' ? '#2d8cff' : 'var(--text-muted)',
            background: meeting.source === 'Google Meet' ? 'rgba(66,133,244,0.08)' : meeting.source === 'Zoom' ? 'rgba(45,140,255,0.08)' : 'var(--bg-overlay)',
            padding: '1px 7px', borderRadius: 4,
          }}>
            {meeting.source}
          </span>
        </div>
      </div>

      {/* Participants */}
      <div style={{ display: 'flex', alignItems: 'center', gap: -4, flexShrink: 0 }}>
        {participants.slice(0, 3).map((m, i) => (
          <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-surface)', borderRadius: '50%' }}>
            <Avatar initials={m.avatar_initials} color={m.color} size={24} title={m.name} />
          </div>
        ))}
        {participants.length > 3 && (
          <div style={{ marginLeft: -6, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-overlay)', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
            +{participants.length - 3}
          </div>
        )}
      </div>

      {/* Task progress */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 48 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {meetingTasks.length}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>tasks</span>
      </div>

      {/* Status badge */}
      <div style={{ flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: statusCfg.color, background: statusCfg.bg,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
        }}>
          {statusCfg.label}
        </span>
      </div>

      <ChevronRight size={15} color={hovered ? 'var(--text-muted)' : 'transparent'} style={{ flexShrink: 0, transition: 'color var(--duration-fast)' }} />
    </div>
  );
}

export default function Meetings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const { isAdmin } = useCurrentMember();
  const { records: meetings = [] } = useRecords({ 
    client, 
    tableName: 'meetings',
    sort: [{ field: 'date', direction: 'desc' }],
  });
  const { records: allTasks = [] } = useRecords({ client, tableName: 'tasks' });

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
      
      if (activeFilter === 'All') {
        return matchSearch;
      }
      
      // Map filter labels to status values
      const filterToStatus = {
        'Completed': 'completed',
        'Approved': 'approved',
        'Pending review': 'pending_review',
        'Extracted': 'extracted',
      };
      
      const targetStatus = filterToStatus[activeFilter];
      const matchFilter = targetStatus ? m.status === targetStatus : true;
      
      return matchSearch && matchFilter;
    });
  }, [search, activeFilter, meetings]);

  const totalTasks = allTasks.length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;
  const approvedMeetings = meetings.filter(m => m.status === 'approved').length;
  const pendingMeetings = meetings.filter(m => m.status === 'pending_review').length;

  return (
    <PageWrapper>
      <div style={{ 
        padding: '28px clamp(20px, 5vw, 48px) 80px',
        paddingTop: window.innerWidth < 768 ? '80px' : '28px',
        maxWidth: '100%',
        width: '100%',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Meetings
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {meetings.length} meetings · {totalTasks} tasks extracted
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setNewMeetingOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                height: 40, padding: '0 18px',
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background var(--duration-fast)',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              <Plus size={15} /> New meeting
            </button>
          )}
        </div>

        {/* Stats strip */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { icon: Video, label: 'Total meetings', value: meetings.length, color: 'var(--accent)' },
            { icon: CheckCircle, label: 'Approved', value: approvedMeetings, color: 'var(--success)' },
            { icon: AlertCircle, label: 'Pending review', value: pendingMeetings, color: 'var(--warning)' },
            { icon: Loader, label: 'Tasks total', value: totalTasks, color: 'var(--text-muted)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              flex: '1 1 140px',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <Icon size={16} color={color} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search meetings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 38,
                padding: '0 14px 0 36px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                transition: 'border-color var(--duration-fast)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '6px 14px', height: 38,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${f === activeFilter ? 'var(--border-accent)' : 'var(--border-default)'}`,
                background: f === activeFilter ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                color: f === activeFilter ? 'var(--text-accent)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: f === activeFilter ? 500 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all var(--duration-fast)',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Meeting list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 24px' }}>
            <Video size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No meetings found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((m, i) => <MeetingRow key={m.id} meeting={m} index={i} />)}
          </div>
        )}
      </div>

      {/* New Meeting Modal */}
      <Modal isOpen={newMeetingOpen} onClose={() => setNewMeetingOpen(false)} title="New Meeting" maxWidth={640}>
        <NewMeetingModal onClose={() => setNewMeetingOpen(false)} />
      </Modal>
    </PageWrapper>
  );
}
