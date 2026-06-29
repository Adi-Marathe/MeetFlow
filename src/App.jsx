import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthGuard } from 'lemma-sdk/react'
import { podClient } from './lib/lemma'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useCurrentMember } from './hooks/useCurrentMember'
import { CommandPalette } from './components/features/CommandPalette'
import { Modal } from './components/ui/Modal'
import { TranscriptUploader } from './components/features/TranscriptUploader'
import { Sidebar } from './components/layout/Sidebar'

// Pages
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Meetings from './pages/Meetings'
import MeetingReview from './pages/MeetingReview'
import BoardView from './pages/BoardView'
import MyTasks from './pages/MyTasks'
import Followups from './pages/Followups'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.18 } },
}

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%' }}>
      {children}
    </motion.div>
  )
}

// Auto-redirect based on role when landing on auth root
function RoleRedirect() {
  const { role, isLoading } = useCurrentMember()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    
    // Redirect to appropriate page based on role
    if (role === 'admin') {
      navigate('/dashboard', { replace: true })
    } else if (role === 'observer') {
      navigate('/board/public', { replace: true })
    } else if (role === 'member') {
      navigate('/my-tasks', { replace: true })
    }
  }, [role, isLoading, navigate])

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  }

  return <div style={{ padding: 40, textAlign: 'center' }}>Redirecting...</div>
}

// Role-based route protection
function PrivateRoute({ children, allowedRoles }) {
  const { role, isLoading } = useCurrentMember()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    
    if (!allowedRoles.includes(role)) {
      // Redirect to appropriate page based on role
      if (role === 'admin') {
        navigate('/dashboard', { replace: true })
      } else if (role === 'observer') {
        navigate('/board/public', { replace: true })
      } else {
        navigate('/my-tasks', { replace: true })
      }
    }
  }, [role, isLoading, allowedRoles, navigate])

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  }

  if (!allowedRoles.includes(role)) {
    return null
  }

  return children
}

// Authenticated app with sidebar
function AuthenticatedApp() {
  const location = useLocation()
  const { role } = useCurrentMember()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [newMeetingOpen, setNewMeetingOpen] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcut('k', () => setPaletteOpen(true), { metaKey: true })
  useKeyboardShortcut('k', () => setPaletteOpen(true), { ctrlKey: true })
  useKeyboardShortcut('n', () => { if (role === 'admin') setNewMeetingOpen(true) })
  useKeyboardShortcut('/', () => setPaletteOpen(true))
  useKeyboardShortcut('Escape', () => { setPaletteOpen(false); setNewMeetingOpen(false) })

  const noSidebarRoutes = ['/board/public']
  const showSidebar = !noSidebarRoutes.includes(location.pathname)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {showSidebar && <Sidebar onCommandPalette={() => setPaletteOpen(true)} />}
      
      <main style={{ flex: 1, height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.key}>
            {/* Root path redirects based on role */}
            <Route path="/" element={<RoleRedirect />} />

            <Route path="/dashboard" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin']}>
                  <Dashboard />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/meetings" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin']}>
                  <Meetings />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/meetings/:id/review" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin']}>
                  <MeetingReview />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/meetings/:id/board" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin', 'member']}>
                  <BoardView />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/my-tasks" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin', 'member']}>
                  <MyTasks />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/settings" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin']}>
                  <Settings />
                </PrivateRoute>
              </AnimatedPage>
            } />

            <Route path="/followups" element={
              <AnimatedPage>
                <PrivateRoute allowedRoles={['admin']}>
                  <Followups />
                </PrivateRoute>
              </AnimatedPage>
            } />

            {/* Public observer board */}
            <Route path="/board/public" element={
              <AnimatedPage>
                <BoardView observer />
              </AnimatedPage>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

        {/* Global modals */}
        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        
        <Modal isOpen={newMeetingOpen} onClose={() => setNewMeetingOpen(false)} title="New Meeting">
          <TranscriptUploader onSuccess={() => setNewMeetingOpen(false)} />
        </Modal>
      </main>
    </div>
  )
}

// Main App Component with AuthGuard
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            {/* PUBLIC ROUTE - No authentication required */}
            <Route path="/" element={<Landing />} />
            
            {/* ALL OTHER ROUTES - Protected by AuthGuard */}
            <Route path="*" element={
              <AuthGuard client={podClient} appName="MeetFlow">
                <AuthenticatedApp />
              </AuthGuard>
            } />
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
