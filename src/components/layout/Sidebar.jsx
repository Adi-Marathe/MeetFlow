import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Video, LayoutGrid, CheckSquare,
  MessageSquare, Settings, Zap, ChevronLeft, ChevronRight,
  Sun, Moon, Command, LogOut, Menu, X
} from 'lucide-react';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { useRecords } from 'lemma-sdk/react';
import { podClient } from '../../lib/lemma';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin'] },
  { icon: Video, label: 'Meetings', path: '/meetings', roles: ['admin'] },
  { icon: LayoutGrid, label: 'Board', path: '/board', roles: ['admin', 'observer'] },
  { icon: CheckSquare, label: 'My Tasks', path: '/my-tasks', roles: ['admin', 'member'] },
  { icon: MessageSquare, label: 'Follow-ups', path: '/followups', roles: ['admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['admin'] },
];

export function Sidebar({ onCommandPalette }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { member, role, email, name } = useCurrentMember();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch members from pod
  const { records: members = [] } = useRecords({ 
    client: podClient, 
    tableName: 'members' 
  });

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const visibleItems = navItems.filter(item => item.roles.includes(role));
  const sidebarWidth = collapsed ? 60 : 240;

  const handleLogout = () => {
    // Lemma AuthGuard handles logout - just redirect to trigger it
    window.location.href = '/';
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/board') return location.pathname === '/board' || location.pathname.endsWith('/board');
    if (path === '/meetings') return location.pathname === '/meetings' || (location.pathname.startsWith('/meetings/') && !location.pathname.includes('/board'));
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: 'fixed',
            top: 16,
            left: mobileOpen ? 256 : 16, // Move right when sidebar is open
            zIndex: 150,
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            transition: 'left 250ms var(--ease-smooth)',
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
        minWidth: isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
        height: '100vh',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 250ms var(--ease-smooth), min-width 250ms var(--ease-smooth)',
        overflow: isMobile && !mobileOpen ? 'hidden' : 'visible',
        borderRight: '1px solid var(--border-subtle)',
        position: isMobile ? 'fixed' : 'relative',
        left: 0,
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}>
      {/* Logo row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '18px 0' : '18px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 8,
        minHeight: 58,
      }}>
        {!collapsed && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}
            onClick={() => navigate('/dashboard')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={14} color="var(--bg-base)" fill="var(--bg-base)" />
            </div>
            <span style={{
              fontWeight: 700, fontSize: 15,
              color: 'var(--text-on-sidebar)',
              letterSpacing: '-0.02em',
            }}>MeetFlow</span>
          </div>
        )}
        {collapsed && (
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
        )}
        {!collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted-sidebar)', cursor: 'pointer', border: 'none',
              transition: 'background 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sidebar-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {collapsed && !isMobile && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              position: 'absolute', right: -10, top: 20,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10,
            }}
          >
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      {/* User info */}
      {member && (
        <div style={{
          padding: collapsed ? '12px 0' : '12px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Avatar
            initials={(name || '').split(' ').map(n => (n || '')[0]).filter(Boolean).join('') || (email || '')[0]?.toUpperCase() || '?'}
            color={member?.color || '#6366f1'}
            size={32}
            title={name}
          />
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--text-on-sidebar)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{name}</div>
              <span style={{
                display: 'inline-block',
                fontSize: 10, fontWeight: 600,
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                padding: '1px 7px',
                borderRadius: 4,
                textTransform: 'capitalize',
                letterSpacing: '0.03em',
              }}>{role}</span>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              title={collapsed ? label : ''}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 9,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 12px',
                margin: '2px 12px',
                width: 'calc(100% - 24px)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: active ? 'var(--bg-sidebar-active)' : 'transparent',
                color: active ? 'var(--text-accent)' : 'var(--text-muted-sidebar)',
                transition: 'all var(--duration-fast)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                border: 'none',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
                  e.currentTarget.style.color = 'var(--text-on-sidebar)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted-sidebar)';
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.6} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 14px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {members.slice(0, 3).map(m => (
              <Avatar key={m.id} initials={m.avatar_initials} color={m.color} size={20} title={m.name}
                style={{ border: '1.5px solid var(--bg-sidebar)' }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted-sidebar)', marginLeft: 4 }}>
              {members.length} members
            </span>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 6,
        }}>
          {!collapsed && (
            <button
              onClick={onCommandPalette}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'var(--text-muted-sidebar)',
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-sidebar-hover)',
                border: '1px solid var(--border-default)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              }}
            >
              <Command size={10} /> K
            </button>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--bg-sidebar-hover)',
                border: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted-sidebar)', cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-on-sidebar)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted-sidebar)'}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--bg-sidebar-hover)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted-sidebar)', cursor: 'pointer',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(180,50,50,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted-sidebar)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
