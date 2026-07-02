import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Toggle } from '../components/ui/Toggle';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useRecords, useUpdateRecord, useCreateRecord } from 'lemma-sdk/react';
import { client } from '../lib/lemma';
import { useToast } from '../context/ToastContext';
import { useCurrentMember } from '../hooks/useCurrentMember';
import { 
  FaSlack, 
  FaWhatsapp, 
  FaTelegram, 
  FaGoogle, 
  FaVideo, 
  FaMicrosoft 
} from 'react-icons/fa';
import { 
  HiBell, 
  HiCheckCircle, 
  HiClock, 
  HiDocumentText, 
  HiMail 
} from 'react-icons/hi';
import { IoIosFlash } from 'react-icons/io';
import { MdSettingsSuggest, MdGroups, MdIntegrationInstructions, MdNotifications } from 'react-icons/md';

const SETTINGS_NAV = [
  { id: 'workspace', label: 'Workspace', icon: MdSettingsSuggest },
  { id: 'members', label: 'Members', icon: MdGroups },
  { id: 'integrations', label: 'Integrations', icon: MdIntegrationInstructions },
  { id: 'notifications', label: 'Notifications', icon: MdNotifications },
];

const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Send follow-up messages via Slack DM',
    status: 'connected',
    statusLabel: 'Connected',
    icon: FaSlack,
    color: '#E01E5A', // Changed from dark #4A154B to bright pink for better visibility
    bgColor: 'rgba(224, 30, 90, 0.1)',
    available: true,
    alwaysActive: true, // Managed by Lemma connectors
  },
  {
    id: 'telegram',
    name: 'Telegram',
    desc: 'Route follow-ups via Telegram bot',
    status: 'connected',
    statusLabel: 'Connected',
    icon: FaTelegram,
    color: '#229ED9',
    bgColor: 'rgba(34, 158, 217, 0.1)',
    available: true,
    alwaysActive: true, // Managed by Lemma connectors
  },
  {
    id: 'lemma',
    name: 'Lemma Workflow',
    desc: 'meeting-extraction-workflow running',
    status: 'active',
    statusLabel: 'Active',
    icon: IoIosFlash,
    color: '#F4622A',
    bgColor: 'rgba(244, 98, 42, 0.1)',
    available: true,
    alwaysActive: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Business API integration',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: FaWhatsapp,
    color: '#25D366',
    bgColor: 'rgba(37, 211, 102, 0.1)',
    available: false,
    alwaysActive: false,
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    desc: 'Import meetings automatically',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: FaGoogle,
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.1)',
    available: false,
    alwaysActive: false,
  },
  {
    id: 'zoom',
    name: 'Zoom',
    desc: 'Native integration',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: FaVideo,
    color: '#2D8CFF',
    bgColor: 'rgba(45, 140, 255, 0.1)',
    available: false,
    alwaysActive: false,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    desc: 'Enterprise integration',
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: FaMicrosoft,
    color: '#5059C9',
    bgColor: 'rgba(80, 89, 201, 0.1)',
    available: false,
    alwaysActive: false,
  },
];

const NOTIFICATION_SETTINGS = [
  { id: 'task_assigned', label: 'Task assigned to me', desc: 'When a new task is assigned from a meeting', icon: HiDocumentText },
  { id: 'task_overdue', label: 'Task overdue', desc: 'Daily digest of overdue tasks', icon: HiClock },
  { id: 'meeting_extracted', label: 'Meeting processed', desc: 'When AI finishes extracting tasks', icon: HiCheckCircle },
  { id: 'followup_sent', label: 'Follow-up sent', desc: 'When an automated follow-up fires', icon: HiMail },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('integrations');
  const { addToast } = useToast();
  const { email: currentEmail } = useCurrentMember();
  
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const updateMember = useUpdateRecord({ client, tableName: 'members' });
  
  const [memberRoles, setMemberRoles] = useState({});
  const [notifications, setNotifications] = useState(
    Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.id, true]))
  );

  useEffect(() => {
    if (members.length > 0 && Object.keys(memberRoles).length === 0) {
      setMemberRoles(Object.fromEntries(members.map(m => [m.id, m.role])));
    }
  }, [members]);

  function handleToggleIntegration(integId, integ) {
    // Check if integration is always active (managed by Lemma)
    if (integ.alwaysActive) {
      addToast(
        `${integ.name} is managed by Lemma connectors and cannot be toggled from the app`,
        'info',
        4000
      );
      return;
    }

    // Check if integration is not available yet
    if (!integ.available) {
      addToast(`${integ.name} is not available yet. Coming soon!`, 'info', 3000);
      return;
    }
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
          {SETTINGS_NAV.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
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
                          await updateMember.update({
                            role: newRole
                          }, {
                            recordId: member.id
                          });
                          addToast(`Updated ${member.name}'s role to ${newRole}`, 'success', 2000);
                        } catch (error) {
                          console.error("Failed to update role:", error);
                          addToast('Failed to update role. Please try again.', 'error', 3000);
                          // Revert on error
                          setMemberRoles(prev => ({ ...prev, [member.id]: member.role }));
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {INTEGRATIONS.map(integ => {
                  const Icon = integ.icon;
                  const isConnected = ['connected', 'live', 'active'].includes(integ.status);
                  const isSoon = integ.status === 'soon';
                  const isAlwaysActive = integ.alwaysActive;

                  return (
                    <div
                      key={integ.id}
                      style={{
                        padding: '20px',
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isConnected ? integ.color + '40' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all var(--duration-fast)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Background glow */}
                      {isConnected && (
                        <div style={{
                          position: 'absolute',
                          top: -50,
                          right: -50,
                          width: 150,
                          height: 150,
                          background: `radial-gradient(circle, ${integ.color}15 0%, transparent 70%)`,
                          borderRadius: '50%',
                          pointerEvents: 'none',
                        }} />
                      )}

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, position: 'relative', zIndex: 1 }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 'var(--radius-md)',
                          background: integ.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={24} color={integ.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {integ.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {integ.desc}
                          </div>
                        </div>
                      </div>

                      {/* Status/Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                        {isConnected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: integ.color,
                              animation: 'pulse 2s ease-in-out infinite',
                            }} />
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: integ.color,
                            }}>
                              {integ.statusLabel}
                            </span>
                          </div>
                        )}

                        {!isConnected && isSoon && (
                          <span style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-elevated)',
                            padding: '5px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 500,
                          }}>
                            Coming soon
                          </span>
                        )}

                        {/* Toggle for always active integrations - but shows toast when clicked */}
                        {isAlwaysActive && (
                          <div 
                            onClick={() => handleToggleIntegration(integ.id, integ)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Toggle
                              checked={true}
                              onChange={() => {}} // No-op, actual handler is on parent div
                            />
                          </div>
                        )}
                      </div>
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
                {NOTIFICATION_SETTINGS.map(setting => {
                  const Icon = setting.icon;
                  return (
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
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--accent-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={18} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {setting.label}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{setting.desc}</div>
                        </div>
                      </div>
                      <Toggle
                        checked={notifications[setting.id]}
                        onChange={val => setNotifications(prev => ({ ...prev, [setting.id]: val }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
