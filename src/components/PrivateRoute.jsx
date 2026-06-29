import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, allowedRoles }) {
  const { role, isLoading, isAuthenticated } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 160, height: 16, borderRadius: 8, margin: '0 auto' }} />
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on their actual role
    if (role === 'admin') return <Navigate to="/dashboard" replace />
    if (role === 'observer') return <Navigate to="/board/public" replace />
    if (role === 'member') return <Navigate to="/my-tasks" replace />
    
    // Fallback
    return <Navigate to="/" replace />
  }

  return children
}
