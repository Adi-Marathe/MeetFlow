import { useState, useMemo } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, AlertTriangle, Bell, RefreshCw, ChevronRight, Zap, Filter, Smartphone, Mail, X } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../context/ToastContext';
import { useRecords, useUpdateRecord } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDate, isOverdue } from '../lib/utils';
import { sendSlackDM } from '../lib/slack';

const CHANNEL_ICONS = { slack: MessageSquare, whatsapp: Smartphone, email: Mail, telegram: Send };
const CHANNEL_COLORS = {
  slack: { bg: 'rgba(224, 30, 90, 0.12)', color: '#E01E5A' }, // Brightened for dark mode
  whatsapp: { bg: 'rgba(37,211,102,0.08)', color: '#25D366' },
  email: { bg: 'rgba(66,133,244,0.08)', color: '#4285f4' },
  telegram: { bg: 'rgba(34,158,217,0.08)', color: '#229ED9' },
};

const STATUS_CONFIG = {
  sent:     { label: 'Sent', color: 'var(--status-done)', bg: 'var(--status-done-bg)', icon: CheckCircle },
  pending:  { label: 'Pending', color: 'var(--warning)', bg: 'var(--warning-subtle)', icon: Clock },
  failed:   { label: 'Failed', color: 'var(--danger)', bg: 'var(--danger-subtle)', icon: AlertTriangle },
  draft:    { label: 'Draft', color: 'var(--text-muted)', bg: 'var(--bg-overlay)', icon: MessageSquare },
};

const FILTERS = ['All', 'Sent', 'Pending', 'Failed', 'Draft'];

function FollowupRow({ item, index, onResend, sending }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const { records: tasks = [] } = useRecords({ client, tableName: 'tasks' });

  const task = tasks.find(t => t.id === item.task_id);
  const member = members.find(m => m.email === item.owner_email);
  const statusCfg = STATUS_CONFIG[item.status?.toLowerCase()] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;
  const chanColor = CHANNEL_COLORS[item.channel] || { bg: 'var(--bg-overlay)', color: 'var(--text-muted)' };
  const ChanIcon = CHANNEL_ICONS[item.channel] || Mail;
  const overdue = item.scheduled_at && isOverdue(item.scheduled_at) && (item.status === 'Pending' || item.status === 'pending');
  const hasSummary = item.summary && item.summary.trim() !== '';
  const isSending = sending === item.id;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 18px',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${overdue ? 'rgba(180,50,50,0.15)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all var(--duration-fast)',
        animation: `fadeInUp 0.25s var(--ease-out) ${index * 40}ms both`,
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Channel icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
          background: chanColor.bg, color: chanColor.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChanIcon size={18} />
        </div>

        {/* Message preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 3,
          }}>
            {task?.title || 'Task follow-up'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {member && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Avatar initials={member.avatar_initials} color={member.color} size={16} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.name}</span>
              </div>
            )}
            {item.scheduled_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                <Clock size={10} />
                {formatDate(item.scheduled_at)}
                {overdue && ' · overdue'}
              </span>
            )}
          </div>
        </div>

        {/* Channel label */}
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
          color: chanColor.color, background: chanColor.bg,
          padding: '3px 9px', borderRadius: 'var(--radius-full)', flexShrink: 0,
        }}>
          {item.channel}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <StatusIcon size={12} color={statusCfg.color} />
          <span style={{
            fontSize: 11, fontWeight: 500, color: statusCfg.color,
            background: statusCfg.bg, padding: '3px 9px', borderRadius: 'var(--radius-full)',
          }}>
            {statusCfg.label}
          </span>
        </div>

        {/* Action button */}
        {(item.status === 'Failed' || item.status === 'Pending' || item.status === 'Draft') && !item.sent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResend(item);
            }}
            disabled={isSending}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', height: 30,
              background: isSending ? 'var(--bg-elevated)' : 'var(--accent-subtle)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11, fontWeight: 500, 
              color: isSending ? 'var(--text-muted)' : 'var(--text-accent)',
              cursor: isSending ? 'not-allowed' : 'pointer', 
              fontFamily: 'var(--font-sans)',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateX(0)' : 'translateX(6px)',
              transition: 'all var(--duration-fast)',
              flexShrink: 0,
            }}
          >
            {isSending ? (
              <>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                Sending...
              </>
            ) : (
              <>
                <Send size={11} /> Send now
              </>
            )}
          </button>
        )}

        {item.sent && (
          <span style={{
            fontSize: 11,
            color: 'var(--success)',
            background: 'var(--status-done-bg)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 500,
          }}>
            ✓ Sent
          </span>
        )}
      </div>

      {/* Expanded view - Draft Message & Error Summary */}
      {expanded && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Draft Message */}
          {item.draft_message && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Draft Message
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                background: 'var(--bg-overlay)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontStyle: 'italic',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}>
                {item.draft_message}
              </div>
            </div>
          )}

          {/* Error Summary (if failed) */}
          {hasSummary && (item.status === 'Failed' || item.status === 'failed') && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Error Summary
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--danger)',
                background: 'var(--danger-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--danger)',
                lineHeight: 1.5,
              }}>
                {item.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Followups() {
  const { addToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sending, setSending] = useState(null);
  const [sentIds, setSentIds] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('All');
  const [selectedOwner, setSelectedOwner] = useState('All');
  
  const { records: followups = [], refresh: refetchFollowups } = useRecords({ client, tableName: 'followups' });
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  const { records: tasks = [] } = useRecords({ client, tableName: 'tasks' });
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const updateFollowup = useUpdateRecord({ client, tableName: 'followups' });

  // Get unique meetings that have follow-ups
  const meetingsWithFollowups = useMemo(() => {
    const taskIds = followups.map(f => f.task_id);
    const tasksWithFollowups = tasks.filter(t => taskIds.includes(t.id));
    const meetingIds = [...new Set(tasksWithFollowups.map(t => t.meeting_id))];
    return meetings.filter(m => meetingIds.includes(m.id));
  }, [followups, tasks, meetings]);

  // Get unique owners that have follow-ups
  const ownersWithFollowups = useMemo(() => {
    const ownerEmails = [...new Set(followups.map(f => f.owner_email).filter(Boolean))];
    return ownerEmails.map(email => {
      const member = members.find(m => m.email === email);
      return { email, name: member?.name || email };
    });
  }, [followups, members]);

  const displayItems = useMemo(() => {
    return followups.filter(f => {
      const normalizedStatus = f.status?.toLowerCase();
      const statusCfg = STATUS_CONFIG[normalizedStatus];
      
      // Filter by status
      if (activeFilter !== 'All' && (!statusCfg || statusCfg.label !== activeFilter)) {
        return false;
      }
      
      // Filter by meeting
      if (selectedMeeting !== 'All') {
        // Find task to get meeting_id
        const task = tasks.find(t => t.id === f.task_id);
        if (!task || task.meeting_id !== selectedMeeting) {
          return false;
        }
      }
      
      // Filter by owner
      if (selectedOwner !== 'All' && f.owner_email !== selectedOwner) {
        return false;
      }
      
      return true;
    });
  }, [activeFilter, followups, selectedMeeting, selectedOwner]);

  const stats = {
    sent: followups.filter(f => f.status?.toLowerCase() === 'sent').length,
    pending: followups.filter(f => f.status?.toLowerCase() === 'pending').length,
    failed: followups.filter(f => f.status?.toLowerCase() === 'failed').length,
    total: followups.length,
  };

  const filteredStats = {
    sent: displayItems.filter(f => f.status?.toLowerCase() === 'sent').length,
    pending: displayItems.filter(f => f.status?.toLowerCase() === 'pending').length,
    failed: displayItems.filter(f => f.status?.toLowerCase() === 'failed').length,
    total: displayItems.length,
  };

  const hasActiveFilters = activeFilter !== 'All' || selectedMeeting !== 'All' || selectedOwner !== 'All';

  function clearFilters() {
    setActiveFilter('All');
    setSelectedMeeting('All');
    setSelectedOwner('All');
  }

  function handleResend(item) {
    setSending(item.id);
    setTimeout(() => {
      setSending(null);
      setSentIds(prev => [...prev, item.id]);
      addToast(`Follow-up sent via ${item.channel} ✓`, 'success');
    }, 1200);
  }

  async function handleSendNow(item) {
    setSending(item.id);
    
    try {
      // Only Slack is currently supported
      if (item.channel !== 'slack') {
        addToast(`${item.channel} sending is not implemented yet`, 'info', 3000);
        setSending(null);
        return;
      }

      // Send the DM
      const result = await sendSlackDM(item.owner_email, item.draft_message);
      
      if (result.ok) {
        // Update status to sent in database
        await updateFollowup.update({
          status: 'Sent',
          sent: true,
        }, {
          recordId: item.id
        });

        // Refresh data
        await refetchFollowups();
        
        addToast(`✓ Message sent to ${item.owner_email} via Slack`, 'success', 3000);
        setSentIds(prev => [...prev, item.id]);
      } else {
        // Parse and format error message
        let errorMsg = result.error || 'Unknown error';
        let userFriendlyMsg = errorMsg;

        // Check for common error patterns
        if (errorMsg.toLowerCase().includes('not_in_channel') || 
            errorMsg.toLowerCase().includes('user_not_found') ||
            errorMsg.toLowerCase().includes('users_not_found')) {
          userFriendlyMsg = `Slack user not found in workspace for ${item.owner_email}`;
        } else if (errorMsg.toLowerCase().includes('invalid_auth') || 
                   errorMsg.toLowerCase().includes('token')) {
          userFriendlyMsg = 'Slack authentication failed. Please check your Slack connection.';
        } else if (errorMsg.toLowerCase().includes('rate_limited')) {
          userFriendlyMsg = 'Slack rate limit reached. Please try again later.';
        } else if (errorMsg.toLowerCase().includes('channel_not_found')) {
          userFriendlyMsg = 'Slack channel not found. Please check your Slack settings.';
        }

        // Update status to failed with error
        await updateFollowup.update({
          status: 'Failed',
          summary: userFriendlyMsg,
        }, {
          recordId: item.id
        });

        // Refresh data
        await refetchFollowups();
        
        addToast(`✗ ${userFriendlyMsg}`, 'error', 5000);
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      
      let errorMsg = 'Network error. Please check your connection.';
      if (error.message) {
        errorMsg = error.message;
      }
      
      addToast(`✗ ${errorMsg}`, 'error', 4000);
    } finally {
      setSending(null);
    }
  }

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
              Follow-ups
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Automated nudges via Slack, WhatsApp, and more · Powered by Lemma SDK
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12, color: 'var(--text-accent)', fontWeight: 500,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulsingDot 1.8s ease-in-out infinite' }} />
            Lemma Workflow active
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: 'Total sent', value: hasActiveFilters ? filteredStats.sent : stats.sent, total: stats.sent, color: 'var(--success)', icon: CheckCircle },
            { label: 'Pending', value: hasActiveFilters ? filteredStats.pending : stats.pending, total: stats.pending, color: 'var(--warning)', icon: Clock },
            { label: 'Failed', value: hasActiveFilters ? filteredStats.failed : stats.failed, total: stats.failed, color: 'var(--danger)', icon: AlertTriangle },
            { label: 'All follow-ups', value: hasActiveFilters ? filteredStats.total : stats.total, total: stats.total, color: 'var(--text-muted)', icon: Bell },
          ].map(({ label, value, total, color, icon: Icon }) => (
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
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {value}
                  {hasActiveFilters && value !== total && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
                      / {total}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI marker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'var(--accent-subtle)',
          borderLeft: '3px solid rgba(99,102,241,0.3)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 12, color: 'var(--text-accent)', fontStyle: 'italic',
          marginBottom: 20,
        }}>
          ✦ Follow-ups are generated and dispatched automatically by MeetFlow AI via Lemma Workflow
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          {/* Header with Clear button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} color="var(--text-muted)" />
              <span style={{ 
                fontSize: 11, 
                fontWeight: 600, 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Filters
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.color = 'var(--text-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>

          {/* Filters Grid - Status on left, Meeting and Owner on right */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Status Filters */}
            <div style={{ flex: '1 1 auto', minWidth: 300 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 11, 
                fontWeight: 600, 
                color: 'var(--text-muted)', 
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} style={{
                    padding: '5px 14px', height: 34,
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${f === activeFilter ? 'var(--border-accent)' : 'var(--border-default)'}`,
                    background: f === activeFilter ? 'var(--accent-subtle)' : 'transparent',
                    color: f === activeFilter ? 'var(--text-accent)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: f === activeFilter ? 500 : 400,
                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'all var(--duration-fast)',
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {/* Meeting and Owner Filters */}
            <div style={{ display: 'flex', gap: 12, flex: '0 1 auto', minWidth: 'min(100%, 500px)' }}>
              {/* Meeting Filter */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: 'var(--text-muted)', 
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Meeting
                </label>
                <select
                  value={selectedMeeting}
                  onChange={(e) => setSelectedMeeting(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="All">All Meetings</option>
                  {meetingsWithFollowups.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner Filter */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  color: 'var(--text-muted)', 
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Owner
                </label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="All">All Owners</option>
                  {ownersWithFollowups.map(owner => (
                    <option key={owner.email} value={owner.email}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 24px' }}>
            <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No follow-ups in this category</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayItems.map((item, i) => (
              <FollowupRow 
                key={item.id} 
                item={{ ...item, status: sentIds.includes(item.id) ? 'sent' : item.status }} 
                index={i} 
                onResend={handleSendNow}
                sending={sending}
              />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
