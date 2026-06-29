import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { TaskReviewCard } from '../components/features/TaskReviewCard';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useRecords, useWorkflowRun } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDateFull, getSourceLabel } from '../lib/utils';

export default function MeetingReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  const { records: allTasks = [] } = useRecords({ client, tableName: 'tasks' });
  const { records: members = [] } = useRecords({ client, tableName: 'members' });

  const meetingId = id === 'new' ? 'mtg-demo-001' : id;
  const meeting = meetings.find(m => m.id === meetingId) || meetings[0] || {};
  const initialTasks = allTasks.filter(t => t.meeting_id === meetingId);

  const [tasks, setTasks] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [approveState, setApproveState] = useState('idle'); // idle | loading | success
  const [hoveredLine, setHoveredLine] = useState(null);
  const taskRefs = useRef({});

  const workflow = useWorkflowRun({ client, workflowName: '' });

  // Load initial tasks when available
  useEffect(() => {
    if (initialTasks.length > 0 && tasks.length === 0) {
      setTasks(initialTasks.map(t => ({ ...t })));
    }
  }, [initialTasks]);

  const activeTasks = tasks.filter(t => !removedIds.includes(t.id));
  const participantMembers = (meeting.participants || [])
    .map(email => members.find(m => m.email === email))
    .filter(Boolean);

  const transcriptLines = (meeting.raw_transcript || '').split('\n').filter(Boolean);

  function handleTaskChange(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  function handleRemove(id) {
    setRemovedIds(prev => [...prev, id]);
  }

  function handleApprove() {
    setApproveState('loading');
    setTimeout(() => {
      setApproveState('success');
      setTimeout(() => {
        navigate(`/meetings/${meetingId}/board`);
      }, 1200);
    }, 900);
  }

  function handleLineHover(lineIdx) {
    setHoveredLine(lineIdx);
    // Glow the first task card briefly
    const firstTaskEl = taskRefs.current[activeTasks[0]?.id];
    if (firstTaskEl) {
      firstTaskEl.style.boxShadow = 'var(--shadow-accent)';
      setTimeout(() => {
        if (firstTaskEl) firstTaskEl.style.boxShadow = '';
      }, 300);
    }
  }

  return (
    <PageWrapper>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Left — Transcript */}
        <div style={{
          width: '38%',
          minWidth: 320,
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            flexShrink: 0,
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 10,
                fontFamily: 'var(--font-sans)',
                padding: 0,
              }}
            >
              <ArrowLeft size={12} />
              Back to dashboard
            </button>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
              {meeting.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10,
                color: 'var(--accent)',
                background: 'var(--accent-subtle)',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 500,
              }}>
                {getSourceLabel(meeting.source)}
              </span>
              <div style={{ display: 'flex', gap: -4 }}>
                {participantMembers.map(m => (
                  <Avatar key={m.id} initials={m.avatar_initials} color={m.color} size={20} title={m.name}
                    style={{ border: '2px solid var(--bg-elevated)', marginLeft: -4 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {formatDateFull(meeting.date)}
              </span>
            </div>
          </div>

          {/* Transcript */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {transcriptLines.map((line, i) => {
              const colonIdx = line.indexOf(':');
              const speaker = colonIdx !== -1 ? line.slice(0, colonIdx) : null;
              const text = colonIdx !== -1 ? line.slice(colonIdx + 1).trim() : line;
              const member = speaker ? members.find(m => m.name.split(' ')[0] === speaker.trim()) : null;

              return (
                <div
                  key={i}
                  onMouseEnter={() => handleLineHover(i)}
                  onMouseLeave={() => setHoveredLine(null)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 4,
                    background: hoveredLine === i ? 'var(--accent-subtle)' : 'transparent',
                    transition: 'background var(--duration-fast)',
                    cursor: 'default',
                  }}
                >
                  {speaker && (
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 2,
                    }}>
                      {speaker}
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.8,
                  }}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Task Review */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  ✦ Extracted tasks
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-accent)',
                  fontStyle: 'italic',
                }}>
                  Extracted by AI
                </span>
                <span style={{
                  fontSize: 11,
                  background: 'var(--accent-subtle)',
                  color: 'var(--text-accent)',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 500,
                }}>
                  {activeTasks.length}
                </span>
              </div>
            </div>
          </div>

          {/* AI marker */}
          <div style={{
            margin: '12px 24px 0',
            padding: '8px 12px',
            borderLeft: '3px solid var(--accent-subtle)',
            background: 'var(--accent-subtle)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            fontSize: 12,
            color: 'var(--text-accent)',
            fontStyle: 'italic',
          }}>
            ✦ Reviewed and extracted by MeetFlow AI
          </div>

          {/* Task list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 100px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeTasks.map((task, i) => (
                <div key={task.id} ref={el => taskRefs.current[task.id] = el}>
                  <TaskReviewCard
                    task={task}
                    onChange={handleTaskChange}
                    onRemove={() => handleRemove(task.id)}
                    index={i}
                  />
                </div>
              ))}

              {activeTasks.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}>
                  All tasks removed. Add some back or approve.
                </div>
              )}
            </div>
          </div>

          {/* Sticky approve bar */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} ready to publish
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button variant="ghost" size="md">
                Save draft
              </Button>
              <button
                onClick={handleApprove}
                disabled={approveState !== 'idle'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 40,
                  padding: '0 20px',
                  background: approveState === 'success' ? 'var(--success)' : 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: approveState !== 'idle' ? 'default' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 300ms',
                }}
              >
                {approveState === 'idle' && '✦ Approve and notify team →'}
                {approveState === 'loading' && (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spinArc 0.8s linear infinite' }}>
                      <circle cx="7" cy="7" r="5" fill="none" stroke="white" strokeWidth="1.5"
                        strokeDasharray="20 12" strokeLinecap="round" />
                    </svg>
                    Publishing…
                  </>
                )}
                {approveState === 'success' && (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <polyline points="3,8 7,12 13,5" fill="none" stroke="white" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="20" style={{ animation: 'checkDraw 0.4s var(--ease-out) forwards' }} />
                    </svg>
                    Published ✓
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
