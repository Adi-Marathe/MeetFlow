import { useState, useRef } from 'react'
import { Video, Zap, TrendingUp, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { StatCard } from '../components/features/StatCard'
import { MeetingCard } from '../components/features/MeetingCard'
import { TaskCard } from '../components/features/TaskCard'
import { TranscriptUploader } from '../components/features/TranscriptUploader'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/DevAuthContext'

// Mock data for dev mode
const mockMeetings = [
  {
    id: 'mtg-001',
    title: 'Q3 Sprint Kickoff',
    date: '2026-06-25',
    source: 'Google Meet',
    status: 'approved',
    participants: ['aditya@meetflow.dev', 'shruti@meetflow.dev'],
  },
  {
    id: 'mtg-002',
    title: 'Product Sprint Planning',
    date: '2026-06-23',
    source: 'Zoom',
    status: 'approved',
    participants: ['aditya@meetflow.dev'],
  },
  {
    id: 'mtg-003',
    title: 'Client Onboarding — TechCorp',
    date: '2026-06-23',
    source: 'Admin',
    status: 'pending_review',
    participants: ['shruti@meetflow.dev'],
  },
  {
    id: 'mtg-004',
    title: 'Weekly Standup — June 23',
    date: '2026-06-23',
    source: 'Slack Huddle',
    status: 'approved',
    participants: ['aditya@meetflow.dev'],
  },
]

const mockTasks = [
  {
    id: 'task-001',
    title: 'Build the user dashboard',
    meeting_id: 'mtg-001',
    owner: 'shruti@meetflow.dev',
    status: 'inprogress',
    priority: 'high',
    deadline: '2026-07-03',
  },
  {
    id: 'task-002',
    title: 'Set up production server',
    meeting_id: 'mtg-001',
    owner: 'aditya@meetflow.dev',
    status: 'done',
    priority: 'high',
    deadline: '2026-07-01',
  },
  {
    id: 'task-003',
    title: 'Create onboarding flow',
    meeting_id: 'mtg-002',
    owner: 'shruti@meetflow.dev',
    status: 'todo',
    priority: 'medium',
    deadline: '2026-07-05',
  },
  {
    id: 'task-004',
    title: 'Share updated PRD with team',
    meeting_id: 'mtg-002',
    owner: 'aditya@meetflow.dev',
    status: 'todo',
    priority: 'medium',
    deadline: '2026-06-30',
  },
  {
    id: 'task-005',
    title: 'Record onboarding demo video',
    meeting_id: 'mtg-003',
    owner: 'aditya@meetflow.dev',
    status: 'inprogress',
    priority: 'medium',
    deadline: '2026-07-02',
  },
  {
    id: 'task-006',
    title: 'API integration complete',
    meeting_id: 'mtg-001',
    owner: 'shruti@meetflow.dev',
    status: 'done',
    priority: 'high',
    deadline: '2026-06-28',
  },
  {
    id: 'task-007',
    title: 'Review security audit',
    meeting_id: 'mtg-004',
    owner: 'aditya@meetflow.dev',
    status: 'todo',
    priority: 'high',
    deadline: '2026-06-29',
  },
  {
    id: 'task-008',
    title: 'Update documentation',
    meeting_id: 'mtg-004',
    owner: 'shruti@meetflow.dev',
    status: 'todo',
    priority: 'low',
    deadline: '2026-07-10',
  },
  {
    id: 'task-009',
    title: 'Deploy to staging',
    meeting_id: 'mtg-002',
    owner: 'aditya@meetflow.dev',
    status: 'done',
    priority: 'high',
    deadline: '2026-06-27',
  },
  {
    id: 'task-010',
    title: 'Client feedback review',
    meeting_id: 'mtg-003',
    owner: 'shruti@meetflow.dev',
    status: 'inprogress',
    priority: 'medium',
    deadline: '2026-07-04',
  },
]

export default function Dashboard({ client }) {
  const { name } = useAuth()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const scrollContainerRef = useRef(null)

  // Use mock data in dev mode
  const meetings = mockMeetings
  const allTasks = mockTasks
  const meetingsLoading = false

  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const stats = {
    meetingsThisWeek: meetings.filter(m => new Date(m.date) >= weekAgo).length,
    tasksExtracted: allTasks.length,
    completionRate: allTasks.length
      ? Math.round(allTasks.filter(t => t.status === 'done').length / allTasks.length * 100)
      : 0,
    overdue: allTasks.filter(t =>
      t.status !== 'done' && t.deadline && new Date(t.deadline) < now
    ).length,
  }

  const openTasks = allTasks.filter(t => t.status !== 'done')

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

  return (
    <PageWrapper>
      <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 }}>
            {greeting}, {name?.split(' ')[0] || 'Admin'}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard
            icon={Video}
            label="Meetings this week"
            value={stats.meetingsThisWeek}
            sub={`across ${meetings.length} total`}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent meetings
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {meetings.length} total
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meetings.map((m, i) => (
              <MeetingCard key={m.id} meeting={m} index={i} />
            ))}
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
              {openTasks.map(task => (
                <div key={task.id} style={{ minWidth: 240, maxWidth: 240, scrollSnapAlign: 'start', flexShrink: 0 }}>
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Meeting Upload Zone */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              New meeting
            </h2>
          </div>
          <TranscriptUploader client={client} />
        </section>
      </div>

      {/* Upload modal for keyboard shortcut N */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="New Meeting">
        <TranscriptUploader client={client} onSuccess={() => setUploadModalOpen(false)} />
      </Modal>
    </PageWrapper>
  )
}
