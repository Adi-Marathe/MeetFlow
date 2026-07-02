import { useState, useRef } from 'react'
import { Video, Zap, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecords } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'
import { useCurrentMember } from '../hooks/useCurrentMember'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatCard } from '../components/features/StatCard'
import { MeetingCard } from '../components/features/MeetingCard'
import { TaskCard } from '../components/features/TaskCard'
import { NewMeetingModal } from '../components/features/NewMeetingModal'

export default function Dashboard() {
  const { name, email, role, isAdmin, isLoading: memberLoading } = useCurrentMember()
  const navigate = useNavigate()
  const scrollContainerRef = useRef(null)

  console.log('📊 Dashboard rendering')
  console.log('👤 Current member:', { name, email, role })

  // Fetch meetings from Lemma pod
  const { records: meetings = [], isLoading: meetingsLoading } = useRecords({
    client: podClient,
    tableName: 'meetings',
    sort: [{ field: 'date', direction: 'desc' }],
  })

  // Fetch tasks from Lemma pod
  const { records: allTasks = [] } = useRecords({
    client: podClient,
    tableName: 'tasks',
  })

  console.log('📅 Meetings:', meetings?.length)
  console.log('✅ Tasks:', allTasks?.length)

  const isLoading = memberLoading || meetingsLoading

  if (isLoading) {
    return (
      <PageWrapper>
        <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
          <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 32 }} />
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ flex: 1, height: 100, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </PageWrapper>
    )
  }

  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const stats = {
    meetingsThisWeek: meetings?.filter(m => new Date(m.date) >= weekAgo).length ?? 0,
    tasksExtracted: allTasks?.length ?? 0,
    completionRate: allTasks?.length
      ? Math.round(allTasks.filter(t => t.status === 'done').length / allTasks.length * 100)
      : 0,
    overdue: allTasks?.filter(t =>
      t.status !== 'done' && t.deadline && new Date(t.deadline) < now
    ).length ?? 0,
  }

  const openTasks = allTasks?.filter(t => t.status !== 'done') ?? []

  const scrollTasks = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  try {
    // Limit to 5 recent meetings for dashboard
    const recentMeetings = meetings?.slice(0, 5) ?? []
    const hasMoreMeetings = meetings?.length > 5

    return (
      <PageWrapper>
        <div style={{ 
          padding: '28px clamp(20px, 5vw, 48px) 80px', 
          paddingTop: window.innerWidth < 768 ? '80px' : '28px', // Extra padding on mobile for toggle button
          maxWidth: '100%',
          width: '100%',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 }}>
              {greeting}, {(name || '').split(' ')[0] || 'there'}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
          </div>

          {/* Stats - Responsive Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16, 
            marginBottom: 32 
          }}>
            <StatCard
              icon={Video}
              label="Meetings this week"
              value={stats.meetingsThisWeek}
              sub={`across ${meetings?.length ?? 0} total`}
            index={0}
          />
          <StatCard
            icon={Zap}
            label="Tasks extracted"
            value={stats.tasksExtracted}
            sub={`${openTasks.length} open`}
            index={1}
          />
          <StatCard
            icon={TrendingUp}
            label="Completion rate"
            value={stats.completionRate}
            showRing
            ringPercent={stats.completionRate}
            index={2}
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={stats.overdue}
            sub="needs attention"
            subColor="var(--danger)"
            index={3}
          />
        </div>

        {/* Recent Meetings */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent meetings
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {recentMeetings.length} of {meetings?.length ?? 0}
              </span>
              {hasMoreMeetings && (
                <button
                  onClick={() => navigate('/meetings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-accent)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-subtle)';
                    e.currentTarget.style.color = 'var(--text-accent)';
                  }}
                >
                  See all
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentMeetings && recentMeetings.length > 0 ? (
              recentMeetings.map((m, i) => (
                <MeetingCard key={m.id} meeting={m} index={i} />
              ))
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No meetings yet. Upload a transcript to get started.
              </div>
            )}
          </div>
        </section>

        {/* Open Tasks Horizontal Scroll */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Open tasks
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{openTasks.length} active</span>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Left fade */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 32,
              background: 'linear-gradient(to right, var(--bg-base), transparent)',
              zIndex: 1, pointerEvents: 'none',
            }} />
            {/* Right fade */}
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 32,
              background: 'linear-gradient(to left, var(--bg-base), transparent)',
              zIndex: 1, pointerEvents: 'none',
            }} />
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollTasks('left')}
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollTasks('right')}
              style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ChevronRight size={16} />
            </button>

            <div
              ref={scrollContainerRef}
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                padding: '0 40px 8px 40px',
                scrollbarWidth: 'none',
              }}
            >
              {openTasks && openTasks.length > 0 ? (
                openTasks.map(task => (
                  <div key={task.id} style={{ minWidth: 240, maxWidth: 240, scrollSnapAlign: 'start', flexShrink: 0 }}>
                    <TaskCard task={task} />
                  </div>
                ))
              ) : (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, width: '100%' }}>
                  No open tasks
                </div>
              )}
            </div>
          </div>
        </section>

        {/* New Meeting Form - Admin Only - Directly on page */}
        {isAdmin && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                New Meeting
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Paste a transcript to extract tasks automatically
              </p>
            </div>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}>
              <NewMeetingModal onClose={() => {}} />
            </div>
          </section>
        )}
      </div>
    </PageWrapper>
    );
  } catch (err) {
    console.error('🚨 DASHBOARD RENDER CRASH:', err);
    console.error('📍 Error message:', err.message);
    console.error('📚 Stack trace:', err.stack);
    console.error('📋 Component state:', { name, email, role, meetings, allTasks });
    return (
      <PageWrapper>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
          <h2>Dashboard Render Error</h2>
          <p style={{ marginTop: 16, fontFamily: 'monospace' }}>{err.message}</p>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Check console for full stack trace</p>
        </div>
      </PageWrapper>
    );
  }
}
