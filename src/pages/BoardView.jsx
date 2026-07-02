import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { KanbanBoard } from '../components/features/KanbanBoard';
import { AvatarGroup } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useCurrentMember } from '../hooks/useCurrentMember';
import { useToast } from '../context/ToastContext';
import { useRecords } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDateFull } from '../lib/utils';

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { member: currentUser, email } = useCurrentMember();
  const { addToast } = useToast();

  const [filterMeeting, setFilterMeeting] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  const { records: tasks = [] } = useRecords({ client, tableName: 'tasks' });
  const { records: members = [] } = useRecords({ client, tableName: 'members' });

  const isPublic = id === 'public';
  const isGlobal = !id; // /board route with no id
  const meetingId = isPublic ? null : (id || null);
  const meeting = meetingId ? meetings.find(m => m.id === meetingId) : null;
  const baseTasks = isGlobal || isPublic ? tasks : tasks.filter(t => t.meeting_id === meetingId);
  
  const boardTasks = baseTasks.filter(t => {
    if (filterMeeting !== 'all' && t.meeting_id !== filterMeeting) return false;
    if (filterAssignee !== 'all' && t.owner !== filterAssignee) return false;
    return true;
  });

  const isObserver = currentUser?.role === 'observer' || isPublic;

  const participantMembers = meeting 
    ? (typeof meeting.participants === 'string' 
        ? meeting.participants.split(',').map(e => e.trim()).map(email => members.find(m => m.email === email)).filter(Boolean)
        : Array.isArray(meeting.participants) 
          ? meeting.participants.map(email => members.find(m => m.email === email)).filter(Boolean)
          : members)
    : members;

  function handleShare() {
    const publicLink = 'https://meetflow.apps.lemma.work/board/public';
    navigator.clipboard.writeText(publicLink).then(() => {
      addToast('Public board link copied ✓', 'success');
    }).catch(() => {
      addToast('Public board link copied to clipboard', 'success');
    });
  }

  function handleExport() {
    const data = JSON.stringify({ meeting: isGlobal ? 'Workspace Board' : meeting, tasks: boardTasks }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isGlobal ? 'meetflow-workspace.json' : `meetflow-${meetingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported successfully', 'success');
  }

  const content = (
    <div style={{ 
      padding: '24px clamp(20px, 3vw, 32px) 0',
      paddingTop: window.innerWidth < 768 ? '80px' : '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: -150, left: '20%', width: 500, height: 500,
        background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 60%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Observer banner */}
      {isObserver && (
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>👁</span>
          You're viewing in read-only mode. Tasks cannot be moved or edited.
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isPublic && !isGlobal && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {isGlobal ? 'Workspace Board' : meeting?.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {isGlobal ? 'All meetings' : formatDateFull(meeting?.date)}
              </span>
              <AvatarGroup members={participantMembers} size={20} max={3} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            style={{
              height: 32, padding: '0 28px 0 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            }}
          >
            <option value="all">All members</option>
            {members.map(m => <option key={m.id} value={m.email}>{m.name}</option>)}
          </select>

          {isGlobal && (
            <select
              value={filterMeeting}
              onChange={(e) => setFilterMeeting(e.target.value)}
              style={{
                height: 32, padding: '0 28px 0 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}
            >
              <option value="all">All meetings</option>
              {meetings.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          )}

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />

          <Button variant="ghost" size="md" onClick={handleShare}>
            <Share2 size={14} />
            Share board
          </Button>
          <Button variant="ghost" size="md" onClick={handleExport}>
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard 
        tasks={boardTasks} 
        readOnly={isObserver} 
        currentUserEmail={email}
        userRole={currentUser?.role || 'member'}
      />
      </div>
    </div>
  );

  if (isPublic) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{
          padding: '12px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>M</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>MeetFlow</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            Read-only view
          </span>
        </div>
        {content}
      </div>
    );
  }

  return <PageWrapper>{content}</PageWrapper>;
}
