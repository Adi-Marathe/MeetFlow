import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <h1 style={{ fontSize: 72, fontWeight: 700, margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)', margin: 0 }}>
        Page not found
      </p>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  )
}
