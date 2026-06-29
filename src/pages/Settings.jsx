import { useState } from 'react';
import { Check, Circle, AlertCircle, Loader } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Toggle } from '../components/ui/Toggle';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useRecords, useUpdateRecord } from 'lemma-sdk/react';
import { client } from '../lib/lemma';

const SETTINGS_NAV = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'members', label: 'Members' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
];

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Routes to #general via Lemma Surface',
    status: 'connected',
    statusLabel: 'Connected',
    icon: '💬',
    color: '#2a8a5e',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Using Lemma shared number',
    status: 'live',
    statusLabel: 'Live',
    icon: '📱',
    color: '#25d366',
  },
  {
    id: 'lemma',
    name: 'Lemma Workflow',
    desc: 'meeting-extraction-workflow running',
    status: 'active',
    statusLabel: 'Active',
    icon: '⚡',
    color: '#F4622A',
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    desc: 'Connect to import meetings automatically',
    status: 'disconnected',
    statusLabel: 'Connect',
    icon: '🎥',
    color: '#4285f4',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    desc: 'Route follow-ups via Telegram bot',
    status: 'disconnected',
    statusLabel: 'Connect',
    icon: '✈️',
    color: '#229ed9',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    desc: 'Native integration — coming soon',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: '📹',
    color: '#8a8478',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    desc: 'Enterprise integration — coming soon',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: '🏢',
    color: '#8a8478',
  },
];

const NOTIFICATION_SETTINGS = [
  { id: 'task_assigned', label: 'Task assigned to me', desc: 'When a new task is assigned from a meeting' },
  { id: 'task_overdue', label: 'Task overdue', desc: 'Daily digest of overdue tasks' },
  { id: 'meeting_extracted', label: 'Meeting processed', desc: 'When AI finishes extracting tasks' },
  { id: 'followup_sent', label: 'Follow-up sent', desc: 'When an automated follow-up fires' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('integrations');
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const updateMember = useUpdateRecord({ client, tableName: '' });
  
  const [memberRoles, setMemberRoles] = useState({});
  const [integrationStates, setIntegrationStates] = useState({});

  useEffect(() => {
    if (members.length > 0 && Object.keys(memberRoles).length === 0) {
      setMemberRoles(Object.fromEntries(members.map(m => [m.id, m.role])));
    }
  }, [members]);
  const [notifications, setNotifications] = useState(
    Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.id, true]))
  );

  function handleConnect(integId) {
    setIntegrationStates(prev => ({ ...prev, [integId]: 'loading' }));
    setTimeout(() => {
      setIntegrationStates(prev => ({ ...prev, [integId]: 'connected' }));
    }, 1800);
  }

  return (
    <PageWrapper>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Left nav */}
        <div style={{
          width: 200,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '24px 0',
          flexShrink: 0,
        }}>
          <div style={{ padding: '0 16px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</h2>
          </div>
          {SETTINGS_NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                background: activeTab === item.id ? 'var(--accent-subtle)' : 'transparent',
                color: activeTab === item.id ? 'var(--text-accent)' : 'var(--text-secondary)',
                border: 'none',
                borderLeft: activeTab === item.id ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: activeTab === item.id ? 500 : 400,
                transition: 'all var(--duration-fast)',
              }}
              onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {/* WORKSPACE */}
          {activeTab === 'workspace' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Workspace</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Manage your workspace settings.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                {[
                  { label: 'Workspace name', value: 'MeetFlow Demo' },
                  { label: 'Workspace slug', value: 'meetflow-demo' },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <input
                      defaultValue={field.value}
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}
                <Button variant="filled" size="md" style={{ alignSelf: 'flex-start' }}>
                  Save changes
                </Button>
              </div>
            </div>
          )}

          {/* MEMBERS */}
          {activeTab === 'members' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Members</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Manage team members and their roles.</p>

              {/* Invite form */}
              <div style={{
                display: 'flex', gap: 10, marginBottom: 24, padding: 16,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <input
                  placeholder="colleague@company.com"
                  style={{
                    flex: 1, height: 36, padding: '0 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', outline: 'none',
                  }}
                />
                <Button variant="filled" size="md">Invite member</Button>
              </div>

              {/* Members table */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {members.map((member, i) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderBottom: i < members.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    <Avatar initials={member.avatar_initials} color={member.color} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.email}</div>
                    </div>
                    <select
                      value={memberRoles[member.id] || member.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        setMemberRoles(prev => ({ ...prev, [member.id]: newRole }));
                        try {
                          await updateMember.mutateAsync({ id: member.id, updates: { role: newRole } });
                        } catch (error) {
                          console.error("Failed to update role:", error);
                        }
                      }}
                      style={{
                        padding: '5px 10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        outline: 'none',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="observer">Observer</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Integrations</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                Connect your tools. Follow-ups route automatically via connected channels.
              </p>

              {/* AI marker */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 20,
                padding: '8px 14px',
                background: 'var(--accent-subtle)',
                borderLeft: '3px solid var(--accent-subtle)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                fontSize: 12,
                color: 'var(--text-accent)',
                fontStyle: 'italic',
              }}>
                ✦ Live integrations power automated follow-ups via Lemma SDK
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {INTEGRATIONS.map(integ => {
                  const state = integrationStates[integ.id];
                  const isConnected = ['connected', 'live', 'active'].includes(integ.status) || state === 'connected';
                  const isLoading = state === 'loading';
                  const isSoon = integ.status === 'soon';

                  const statusColors = {
                    connected: '#2a8a5e',
                    live: '#25d366',
                    active: '#F4622A',
                  };
                  const dotColor = statusColors[integ.status] || '#8a8478';

                  return (
                    <div
                      key={integ.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '16px',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isConnected ? 'rgba(42,138,94,0.2)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)',
                        transition: 'border-color var(--duration-fast)',
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{integ.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {integ.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: isConnected ? 'italic' : 'normal' }}>
                          {integ.desc}
                        </div>
                      </div>

                      {/* Status */}
                      {isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: dotColor,
                            animation: 'pulsingDot 2s ease-in-out infinite',
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: dotColor,
                          }}>
                            {integ.statusLabel}
                          </span>
                        </div>
                      )}

                      {!isConnected && !isSoon && (
                        <button
                          onClick={() => handleConnect(integ.id)}
                          disabled={isLoading}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            background: isLoading ? 'var(--bg-elevated)' : 'var(--accent-subtle)',
                            border: '1px solid var(--border-accent)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--text-accent)',
                            cursor: isLoading ? 'default' : 'pointer',
                            fontFamily: 'var(--font-sans)',
                            transition: 'all var(--duration-fast)',
                          }}
                        >
                          {isLoading && (
                            <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spinArc 0.8s linear infinite' }}>
                              <circle cx="6" cy="6" r="4" fill="none" stroke="var(--accent)" strokeWidth="1.5"
                                strokeDasharray="16 8" strokeLinecap="round" />
                            </svg>
                          )}
                          {isLoading ? 'Connecting…' : 'Connect'}
                        </button>
                      )}

                      {isSoon && (
                        <span style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          background: 'var(--bg-elevated)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 500,
                        }}>
                          Coming soon
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Notifications</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Choose which events trigger notifications.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {NOTIFICATION_SETTINGS.map(setting => (
                  <div
                    key={setting.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '16px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {setting.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{setting.desc}</div>
                    </div>
                    <Toggle
                      checked={notifications[setting.id]}
                      onChange={val => setNotifications(prev => ({ ...prev, [setting.id]: val }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
