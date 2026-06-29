import { Zap, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { loginAsDev } = useAuth()

  const handleLemmaAuth = () => {
    addToast('Lemma authentication is temporarily unavailable. Please use demo roles below.', 'info')
  }

  const handleRoleSelect = (role) => {
    // Log in directly with selected role
    loginAsDev(role)
    
    // Redirect based on role
    if (role === 'admin') {
      navigate('/dashboard')
    } else if (role === 'observer') {
      navigate('/board/public')
    } else {
      navigate('/my-tasks')
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '64px 48px',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(244,98,42,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700 }}>MeetFlow</span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}>
            From meeting<br />to done — in minutes.
          </h1>
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            maxWidth: 380,
            marginBottom: 48,
          }}>
            Paste any transcript. MeetFlow extracts every commitment, assigns it, and keeps your team accountable automatically.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Feature icon={CheckCircle} text="No credit card required" />
            <Feature icon={CheckCircle} text="Up and running in 60 seconds" />
            <Feature icon={CheckCircle} text="AI extracts tasks automatically" />
          </div>
        </div>

        {/* Testimonial */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24,
          marginTop: 48,
        }}>
          <p style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            ✦ "Every meeting ends with a clear action list now."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}>
              AS
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Arjun S.</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>PM, Yo-B2B</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth */}
      <div style={{
        width: 520,
        padding: '64px 48px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Sign in to continue, or pick a demo role below.
          </p>
        </div>

        {/* Continue with Lemma Button */}
        <button
          onClick={handleLemmaAuth}
          style={{
            width: '100%',
            height: 52,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s',
            marginBottom: 32,
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-hover)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 98, 42, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Zap size={18} fill="#fff" />
          Continue with Lemma →
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>or enter as</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RoleCard
            title="Admin"
            badge="Recommended for demo"
            description="Full access — upload, review, publish, manage team"
            color="var(--accent)"
            onClick={() => handleRoleSelect('admin')}
          />
          <RoleCard
            title="Member"
            description="See your tasks, update status, track deadlines"
            color="#10b981"
            onClick={() => handleRoleSelect('member')}
          />
          <RoleCard
            title="Observer"
            description="Read-only board view — no edits"
            color="var(--text-muted)"
            onClick={() => handleRoleSelect('observer')}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 32,
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          By continuing you agree to our{' '}
          <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</a>
          {' '}and{' '}
          <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={16} color="var(--accent)" />
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
    </div>
  )
}

function RoleCard({ title, badge, description, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background = 'var(--bg-elevated)'
        e.currentTarget.style.transform = 'translateX(4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.background = 'var(--bg-surface)'
        e.currentTarget.style.transform = 'translateX(0)'
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${color}20`,
        border: `2px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>
          {title === 'Admin' ? '👑' : title === 'Member' ? '👤' : '👁'}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: color,
              background: `${color}15`,
              padding: '2px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>→</div>
    </button>
  )
}
