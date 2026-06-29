import { useState, useMemo } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, AlertTriangle, Bell, RefreshCw, ChevronRight, Zap, Filter, Smartphone, Mail } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../context/ToastContext';
import { useRecords } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { formatDate, isOverdue } from '../lib/utils';

const CHANNEL_ICONS = { slack: MessageSquare, whatsapp: Smartphone, email: Mail, telegram: Send };
const CHANNEL_COLORS = {
  slack: { bg: 'rgba(74,21,75,0.08)', color: '#4a154b' },
  whatsapp: { bg: 'rgba(37,211,102,0.08)', color: '#128c7e' },
  email: { bg: 'rgba(66,133,244,0.08)', color: '#4285f4' },
  telegram: { bg: 'rgba(34,158,217,0.08)', color: '#229ed9' },
};

const STATUS_CONFIG = {
  sent:     { label: 'Sent', color: 'var(--status-done)', bg: 'var(--status-done-bg)', icon: CheckCircle },
  pending:  { label: 'Pending', color: 'var(--warning)', bg: 'var(--warning-subtle)', icon: Clock },
  failed:   { label: 'Failed', color: 'var(--danger)', bg: 'var(--danger-subtle)', icon: AlertTriangle },
  draft:    { label: 'Draft', color: 'var(--text-muted)', bg: 'var(--bg-overlay)', icon: MessageSquare },
};

const FILTERS = ['All', 'Sent', 'Pending', 'Failed', 'Draft'];

function FollowupRow({ item, index, onResend }) {
  const [hovered, setHovered] = useState(false);
  
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });

  const member = members.find(m => m.email === item.to);
  const meeting = meetings.find(m => m.id === item.meeting_id);
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const chanColor = CHANNEL_COLORS[item.channel] || { bg: 'var(--bg-overlay)', color: 'var(--text-muted)' };
  const ChanIcon = CHANNEL_ICONS[item.channel] || Mail;
  const overdue = isOverdue(item.scheduled_at) && item.status === 'pending';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${overdue ? 'rgba(180,50,50,0.15)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'default',
        transition: 'all var(--duration-fast)',
        animation: `fadeInUp 0.25s var(--ease-out) ${index * 40}ms both`,
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
      }}
    >
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
          fontStyle: 'italic',
        }}>
          ✦ {item.message || `Follow-up for: ${item.task_title || 'task'}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {member && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar initials={member.avatar_initials} color={member.color} size={16} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.name.split(' ')[0]}</span>
            </div>
          )}
          {meeting && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 3 }}>
              {meeting.title.split(' ').slice(0, 3).join(' ')}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
            <Clock size={10} />
            {formatDate(item.scheduled_at)}
            {overdue && ' · overdue'}
          </span>
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

      {/* Action on hover */}
      {(item.status === 'failed' || item.status === 'pending') && (
        <button
          onClick={() => onResend(item)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', height: 30,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            fontSize: 11, fontWeight: 500, color: 'var(--text-accent)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(6px)',
            transition: 'all var(--duration-fast)',
            flexShrink: 0,
          }}
        >
          <Send size={11} /> Send now
        </button>
      )}
    </div>
  );
}

export default function Followups() {
  const { addToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sending, setSending] = useState(null);
  const [sentIds, setSentIds] = useState([]);
  
  const { records: followups = [] } = useRecords({ client, tableName: 'followups' });

  const displayItems = useMemo(() => {
    return followups.filter(f => {
      const statusCfg = STATUS_CONFIG[f.status];
      return activeFilter === 'All' || (statusCfg && statusCfg.label === activeFilter);
    });
  }, [activeFilter, followups]);

  const stats = {
    sent: followups.filter(f => f.status === 'sent').length,
    pending: followups.filter(f => f.status === 'pending').length,
    failed: followups.filter(f => f.status === 'failed').length,
    total: followups.length,
  };

  function handleResend(item) {
    setSending(item.id);
    setTimeout(() => {
      setSending(null);
      setSentIds(prev => [...prev, item.id]);
      addToast(`Follow-up sent via ${item.channel} ✓`, 'success');
    }, 1200);
  }

  return (
    <PageWrapper>
      <div style={{ padding: '28px 36px', maxWidth: 920, margin: '0 auto' }}>

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
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total sent', value: stats.sent, color: 'var(--success)', icon: CheckCircle },
            { label: 'Pending', value: stats.pending, color: 'var(--warning)', icon: Clock },
            { label: 'Failed', value: stats.failed, color: 'var(--danger)', icon: AlertTriangle },
            { label: 'All follow-ups', value: stats.total, color: 'var(--text-muted)', icon: Bell },
          ].map(({ label, value, color, icon: Icon }) => (
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
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
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
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
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

        {/* List */}
        {displayItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 24px' }}>
            <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No follow-ups in this category</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayItems.map((item, i) => (
              <FollowupRow key={item.id} item={{ ...item, status: sentIds.includes(item.id) ? 'sent' : item.status }} index={i} onResend={handleResend} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
