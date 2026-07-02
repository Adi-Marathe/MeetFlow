import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, ExternalLink, LayoutList, LayoutGrid, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useCurrentMember } from '../hooks/useCurrentMember';
import { useToast } from '../context/ToastContext';
import { Confetti } from '../components/ui/Confetti';
import { MyTasksKanban } from '../components/features/MyTasksKanban';
import { useRecords, useUpdateRecord } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDate, isOverdue, isDueToday, isDueThisWeek, cycleStatus, getStatusColor, getPriorityColor } from '../lib/utils';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Due today' },
  { id: 'week', label: 'This week' },
  { id: 'inprogress', label: 'In progress' },
  { id: 'overdue', label: 'Overdue' },
];

const STATUS_LABELS = { todo: 'To do', inprogress: 'In progress', done: 'Done' };

export default function MyTasks() {
  const { member: currentUser, email } = useCurrentMember();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(() => localStorage.getItem('mytasks_view') || 'list');
  const [taskStates, setTaskStates] = useState({});
  const [hoveredTask, setHoveredTask] = useState(null);
  const [confetti, setConfetti] = useState(null);

  useEffect(() => {
    localStorage.setItem('mytasks_view', view);
  }, [view]);

  const { records: allTasks = [] } = useRecords({ client, tableName: 'tasks' });
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  const updateTask = useUpdateRecord({ client, tableName: 'tasks' });

  const myTasks = useMemo(() => {
    return allTasks.filter(t => t.owner === currentUser?.email);
  }, [currentUser, allTasks]);

  const filteredTasks = useMemo(() => {
    const withStates = myTasks.map(t => ({
      ...t,
      status: taskStates[t.id] || t.status,
    }));

    switch (filter) {
      case 'today': return withStates.filter(t => isDueToday(t.deadline));
      case 'week': return withStates.filter(t => isDueThisWeek(t.deadline));
      case 'inprogress': return withStates.filter(t => t.status === 'inprogress');
      case 'overdue': return withStates.filter(t => isOverdue(t.deadline) && t.status !== 'done');
      default: return withStates;
    }
  }, [myTasks, taskStates, filter]);

  const activeTasks = filteredTasks.filter(t => (taskStates[t.id] || t.status) !== 'done');
  const dueTodayCount = myTasks.filter(t => isDueToday(t.deadline)).length;
  const inProgressCount = myTasks.filter(t => (taskStates[t.id] || t.status) === 'inprogress').length;

  async function cycleTaskStatus(e, taskId, current) {
    e.stopPropagation();
    const next = cycleStatus(current);
    setTaskStates(prev => ({ ...prev, [taskId]: next }));
    
    if (current !== 'done' && next === 'done') {
      const rect = e.currentTarget.getBoundingClientRect();
      setConfetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setTimeout(() => setConfetti(null), 1200);
    }
    try {
      await updateTask.update({
        status: next
      }, {
        recordId: taskId
      });
    } catch (err) { console.error('Failed to update task:', err); }
  }

  async function handleStatusChange(taskId, newStatus) {
    setTaskStates(prev => ({ ...prev, [taskId]: newStatus }));
    try {
      await updateTask.update({
        status: newStatus
      }, {
        recordId: taskId
      });
    } catch (err) { console.error('Failed to update task:', err); }
  }

  function handleSnooze(task) {
    addToast(`"${task.title.slice(0, 28)}…" snoozed 1 day`, 'info');
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (myTasks.length === 0) {
    return (
      <PageWrapper>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', minHeight: 'calc(100vh - 100px)', gap: 16,
        }}>
          <CheckSquare size={48} color="var(--text-muted)" />
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Inter' }}>
            No tasks assigned to you yet.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Tasks from meetings will appear here once assigned.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {confetti && <Confetti x={confetti.x} y={confetti.y} onDone={() => setConfetti(null)} />}
      <div style={{ 
        maxWidth: view === 'kanban' ? '100%' : 860,
        width: '100%',
        margin: '0 auto', 
        padding: window.innerWidth < 768 ? '20px 16px' : '40px 32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'max-width 300ms var(--ease-out)',
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0
        }} />
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Your tasks
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 8 }}>
              {greeting}, {currentUser?.name?.split(' ')[0] || 'there'} 👋
            </p>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {activeTasks.length} open · {dueTodayCount} due today · {inProgressCount} in progress
            </p>
          </div>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 8, padding: 3,
          }}>
            <button
              onClick={() => setView('list')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6,
                background: view === 'list' ? 'var(--bg-surface)' : 'transparent',
                color: view === 'list' ? 'var(--text-accent)' : 'var(--text-muted)',
                boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms', cursor: 'pointer', border: 'none',
              }}
              title="List view"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setView('kanban')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6,
                background: view === 'kanban' ? 'var(--bg-surface)' : 'transparent',
                color: view === 'kanban' ? 'var(--text-accent)' : 'var(--text-muted)',
                boxShadow: view === 'kanban' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 150ms', cursor: 'pointer', border: 'none',
              }}
              title="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28, position: 'relative', zIndex: 1 }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${active ? 'var(--border-accent)' : 'var(--border-default)'}`,
                  background: active ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--duration-fast)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Views */}
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredTasks.length === 0 ? (
                <EmptyState />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredTasks.map((task, i) => {
                    const status = taskStates[task.id] || task.status;
                    const done = status === 'done';
                    const meeting = meetings.find(m => m.id === task.meeting_id);
                    const overdue = isOverdue(task.deadline) && !done;
                    const today = isDueToday(task.deadline) && !done;
                    const isHovered = hoveredTask === task.id;

                    return (
                      <div
                        key={task.id}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '16px 20px',
                          background: isHovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                          borderRadius: 'var(--radius-lg)',
                          animation: `fadeInUp 0.3s var(--ease-out) ${i * 40}ms both`,
                          transition: 'all var(--duration-fast)',
                          position: 'relative',
                          zIndex: 1,
                          boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                        }}
                      >
                        {/* Status circle */}
                        <button
                          onClick={(e) => cycleTaskStatus(e, task.id, status)}
                          title={STATUS_LABELS[status]}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: done ? 'none' : '1.5px solid var(--border-strong)',
                            background: done ? 'var(--success)' : 'transparent',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all var(--duration-base) var(--ease-spring)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {done && (
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <polyline points="2,5 4.5,7.5 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Title and Context */}
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{
                            fontSize: 15,
                            fontFamily: 'Inter',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            lineHeight: 1.4,
                            position: 'relative',
                            textDecoration: done ? 'line-through' : 'none',
                            textDecorationColor: 'var(--text-muted)',
                            transition: 'color var(--duration-base), text-decoration var(--duration-base)',
                          }}>
                            {task.title}
                          </span>
                          {task.context && (
                            <span style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '80%',
                            }}>
                              ↳ {task.context}
                            </span>
                          )}
                        </div>

                        {/* Meeting source chip */}
                        {meeting && (
                          <span
                            onClick={() => navigate(`/meetings/${meeting.id}/board`)}
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-elevated)',
                              padding: '2px 7px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              maxWidth: 110,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 500,
                            }}
                            title={meeting.title}
                          >
                            {meeting.title.split(' ').slice(0, 2).join(' ')}
                          </span>
                        )}

                        {/* Priority */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 70 }}>
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: getPriorityColor(task.priority),
                            display: 'inline-block',
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 500 }}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Deadline */}
                        <span style={{
                          fontSize: 13,
                          fontFamily: 'Inter',
                          color: overdue ? 'var(--danger)' : today ? 'var(--warning)' : 'var(--text-secondary)',
                          background: overdue ? 'var(--danger-subtle)' : today ? 'var(--warning-subtle)' : 'var(--bg-elevated)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          flexShrink: 0,
                          fontWeight: overdue || today ? 600 : 400,
                        }}>
                          {formatDate(task.deadline)}
                        </span>

                        {/* Priority / Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          {/* Hover actions */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            opacity: isHovered ? 1 : 0,
                            transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
                            transition: 'all var(--duration-fast)',
                          }}>
                            <button
                              onClick={() => handleSnooze(task)}
                              title="Snooze 1 day"
                              style={{
                                width: 26, height: 26, borderRadius: 6,
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Clock size={12} />
                            </button>
                            <button
                              title="View board"
                              onClick={() => navigate(`/meetings/${task.meeting_id}/board`)}
                              style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {view === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                overflow: 'hidden',
                marginTop: 8
              }}
            >
              <MyTasksKanban tasks={filteredTasks} onStatusChange={handleStatusChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center',
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ marginBottom: 16 }}>
        <circle cx="32" cy="32" r="28" fill="var(--accent-subtle)" />
        <circle cx="32" cy="32" r="20" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        <polyline points="22,32 28,38 42,26" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
        All clear here.
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 240 }}>
        No tasks match this filter. Try "All" to see everything.
      </p>
    </div>
  );
}
