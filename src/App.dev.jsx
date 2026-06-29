import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { DevAuthProvider, useAuth } from './context/DevAuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { CommandPalette } from './components/features/CommandPalette'
import { Sidebar } from './components/layout/Sidebar'

// Pages
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import BoardView from './pages/BoardView'
import MyTasks from './pages/MyTasks'
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

function RoleRedirect() {
  const { role, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/' && location.pathname !== '/auth') {
      navigate('/auth', { replace: true })
    } else if (isAuthenticated && location.pathname === '/') {
      if (role === 'admin') navigate('/dashboard', { replace: true })
      else if (role === 'observer') navigate('/board/public', { replace: true })
      else navigate('/my-tasks', { replace: true })
    }
  }, [role, isAuthenticated, navigate, location])

  return null
}

function AuthenticatedApp() {
  const location = useLocation()
  const { role, isAuthenticated } = useAuth()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useKeyboardShortcut('k', () => setPaletteOpen(true), { metaKey: true })
  useKeyboardShortcut('k', () => setPaletteOpen(true), { ctrlKey: true })
  useKeyboardShortcut('/', () => setPaletteOpen(true))
  useKeyboardShortcut('Escape', () => setPaletteOpen(false))

  const noSidebarRoutes = ['/', '/auth', '/board/public']
  const showSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {showSidebar && <Sidebar onCommandPalette={() => setPaletteOpen(true)} />}
      
      <main style={{ flex: 1, height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <RoleRedirect />
        
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.key}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/dashboard" element={
              <AnimatedPage>
                <Dashboard client={null} />
              </AnimatedPage>
            } />

            <Route path="/my-tasks" element={
              <AnimatedPage>
                <MyTasks client={null} />
              </AnimatedPage>
            } />

            <Route path="/board/public" element={
              <AnimatedPage>
                <BoardView client={null} observer />
              </AnimatedPage>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DevAuthProvider>
          <ToastProvider>
            <AuthenticatedApp />
          </ToastProvider>
        </DevAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
