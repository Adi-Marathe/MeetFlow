import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, FileText, Sparkles, LayoutGrid, Bell, Shield,
  Clock, Users, ArrowRight, CheckCircle, Play, ChevronRight,
  TrendingUp, MessageSquare, Cpu, Globe
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';

/* ── Transcript demo ─────────────────────────────────────── */
const TRANSCRIPT_TEXT = `Aditya: Shruti can you build the dashboard by July 3?
Shruti: Yes, done by July 3.
Aditya: I'll set up production by July 1.`;

const DEMO_TASKS = [
  { title: 'Build the user dashboard', initials: 'SA', color: '#267a52', deadline: 'Jul 3', priority: 'high', pColor: '#b43232' },
  { title: 'Set up production server', initials: 'AM', color: '#F4622A', deadline: 'Jul 1', priority: 'high', pColor: '#b43232' },
  { title: 'Create onboarding flow', initials: 'SA', color: '#267a52', deadline: 'Jul 5', priority: 'medium', pColor: '#F4622A' },
];

function TranscriptDemo() {
  const [phase, setPhase] = useState('paste');
  const [typed, setTyped] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout, interval;
    let charIdx = 0;

    function startPaste() {
      setPhase('paste'); setTyped(''); charIdx = 0;
      interval = setInterval(() => {
        charIdx++;
        setTyped(TRANSCRIPT_TEXT.slice(0, charIdx));
        if (charIdx >= TRANSCRIPT_TEXT.length) {
          clearInterval(interval);
          timeout = setTimeout(startProcessing, 700);
        }
      }, 16);
    }
    function startProcessing() {
      setPhase('processing'); setProgress(0);
      let p = 0;
      interval = setInterval(() => {
        p = Math.min(p + 2.2, 100);
        setProgress(p);
        if (p >= 100) { clearInterval(interval); timeout = setTimeout(startExtracted, 300); }
      }, 22);
    }
    function startExtracted() {
      setPhase('extracted');
      timeout = setTimeout(() => { setPhase('fade'); timeout = setTimeout(startPaste, 700); }, 3500);
    }
    startPaste();
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      position: 'relative',
      animation: phase === 'processing' ? 'transcriptPulse 2s ease-in-out infinite' : 'none',
    }}>
      {phase === 'processing' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--bg-overlay)', zIndex: 10 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-warm))', width: `${progress}%`, transition: 'width 0.05s linear', borderRadius: 1 }} />
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px', background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>transcript.txt</span>
        <span style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Google Meet</span>
      </div>
      <div style={{ padding: 20, minHeight: 180 }}>
        {(phase === 'paste' || phase === 'processing') && (
          <div style={{ opacity: phase === 'processing' ? 0.45 : 1, transition: 'opacity 400ms' }}>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
              {typed}
              {phase === 'paste' && <span style={{ display: 'inline-block', width: 1.5, height: '1em', background: 'var(--accent)', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
            </pre>
            {phase === 'processing' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 16, fontSize: 12, color: 'var(--text-accent)', fontStyle: 'italic' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" style={{ animation: 'spinArc 0.9s linear infinite', flexShrink: 0 }}>
                  <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="18 10" strokeLinecap="round" />
                </svg>
                ✦ Extracting action items…
              </div>
            )}
          </div>
        )}
        {(phase === 'extracted' || phase === 'fade') && (
          <div style={{ opacity: phase === 'fade' ? 0 : 1, transition: 'opacity 400ms', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-accent)', fontStyle: 'italic', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>✦</span> <span>Extracted by MeetFlow AI</span>
            </div>
            {DEMO_TASKS.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '3px solid rgba(99,102,241,0.22)',
                borderRadius: 10,
                animation: `fadeInUp 0.3s var(--ease-out) ${i * 80}ms both`,
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-accent)' }}>✦</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', fontStyle: 'italic', fontWeight: 500 }}>{t.title}</span>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: t.color + '20', border: `1.5px solid ${t.color}40`, color: t.color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.initials}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>{t.deadline}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.pColor, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Floating task card ────────────────────────────────────── */
function FloatingCard({ title, owner, tag, tagColor, status, statusColor, delay = 0, top, left, right, bottom, rotate = 0 }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow-md)',
      width: 200,
      animation: `float 6s ease-in-out ${delay}s infinite`,
      transform: `rotate(${rotate}deg)`,
      pointerEvents: 'none',
      zIndex: 2,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{owner}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: tagColor, background: tagColor + '18', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>{tag}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{status}</span>
      </div>
    </div>
  );
}

/* ── Animated stat counter ─────────────────────────────────── */
function StatCounter({ value, label, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const end = parseInt(value);
      const dur = 1200;
      const startTime = performance.now();
      function tick(now) {
        const p = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCount(Math.floor(ease * end));
        if (p < 1) requestAnimationFrame(tick);
        else setCount(end);
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 400 }}>{label}</div>
    </div>
  );
}

/* ── Doodle SVGs ─────────────────────────────────────────── */
function WavyUnderline() {
  return (
    <svg viewBox="0 0 200 14" style={{ position: 'absolute', bottom: -10, left: 0, width: '100%', height: 14, overflow: 'visible', pointerEvents: 'none' }}>
      <path d="M3,9 C22,3 44,15 66,9 S110,3 132,9 S176,15 197,9"
        fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"
        strokeDasharray="220" style={{ animation: 'doodleTrace 900ms var(--ease-out) 400ms both' }} />
    </svg>
  );
}

/* ── Marquee strip ─────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  '✦ Google Meet', '✦ Zoom', '✦ Slack Huddle', '✦ Microsoft Teams',
  '✦ Notion', '✦ Linear', '✦ Slack follow-ups', '✦ WhatsApp nudges',
  '✦ Automated deadlines', '✦ AI task extraction', '✦ Smart assignments',
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '14px 0', background: 'var(--bg-overlay)' }}>
      <div style={{ display: 'flex', gap: 40, animation: 'marquee 28s linear infinite', width: 'max-content', alignItems: 'center' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Feature card ──────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, accent = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        transition: 'all var(--duration-base)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: hovered ? 'var(--accent)' : 'var(--accent-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, transition: 'background var(--duration-base)',
      }}>
        <Icon size={18} color={hovered ? '#fff' : 'var(--accent)'} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ── Process step ──────────────────────────────────────────── */
function ProcessStep({ num, icon: Icon, title, desc, isLast }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-subtle)',
          border: '2px solid var(--border-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color="var(--accent)" />
        </div>
        {!isLast && <div style={{ width: 1.5, flex: 1, background: 'linear-gradient(to bottom, var(--border-accent), transparent)', marginTop: 8, minHeight: 40 }} />}
      </div>
      <div style={{ paddingTop: 10, paddingBottom: isLast ? 0 : 40 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 500, marginBottom: 4 }}>Step {num}</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Testimonial ───────────────────────────────────────────── */
function Testimonial({ quote, name, role, company, avatar }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
        fontStyle: 'italic',
        borderLeft: '3px solid var(--accent-subtle)',
        paddingLeft: 12,
      }}>
        ✦ "{quote}"
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: avatar,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{name[0]}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{role} · {company}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing Page ─────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleAuthClick() {
    // Navigate to dashboard - AuthGuard will show Lemma login if not authenticated
    navigate('/dashboard');
  }

  return (
    <div style={{ height: '100vh', background: 'var(--bg-base)', overflowX: 'hidden', overflowY: 'auto' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 58,
        background: navScrolled ? 'rgba(245,241,234,0.88)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 300ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>MeetFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['Features', 'How it works', 'Pricing'].map(item => (
            <button key={item} style={{
              fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)', transition: 'color var(--duration-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >{item}</button>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />
          <button onClick={handleAuthClick} style={{
            fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)', transition: 'color var(--duration-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >Sign in</button>
          <button onClick={handleAuthClick} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 18px', height: 38,
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all var(--duration-fast)',
            boxShadow: '0 1px 4px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = ''; }}
          >Get started <ArrowRight size={13} /></button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: '90px 24px 70px',
        overflow: 'hidden',
      }}>
        {/* Background gradient blobs */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, transparent 65%)',
          pointerEvents: 'none', animation: 'glow 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: 120, left: '5%',
          width: 300, height: 300,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 80, right: '5%',
          width: 250, height: 250,
          background: 'radial-gradient(ellipse at center, rgba(38,122,82,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Floating cards - left */}
        <div style={{ position: 'absolute', left: '4%', top: '18%', display: 'none' }}>
        </div>
        <FloatingCard
          title="API integration complete"
          owner="Shruti A."
          tag="Done"
          tagColor="#267a52"
          status="Completed"
          statusColor="#267a52"
          top="14%"
          left="2%"
          delay={0}
          rotate={-3}
        />
        <FloatingCard
          title="Set up production server"
          owner="Aditya M."
          tag="High"
          tagColor="#b43232"
          status="In progress"
          statusColor="#F4622A"
          top="48%"
          left="1%"
          delay={1.5}
          rotate={-2}
        />
        <FloatingCard
          title="Share updated PRD with team"
          owner="Shruti A."
          tag="Medium"
          tagColor="#F4622A"
          status="To do"
          statusColor="#7a7468"
          top="14%"
          right="2%"
          delay={0.8}
          rotate={2}
        />
        <FloatingCard
          title="Record onboarding demo video"
          owner="Aditya M."
          tag="Medium"
          tagColor="#F4622A"
          status="To do"
          statusColor="#7a7468"
          top="50%"
          right="1%"
          delay={2}
          rotate={3}
        />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-full)',
          fontSize: 12, color: 'var(--text-accent)', fontWeight: 500,
          marginBottom: 28,
          animation: 'fadeInUp 0.4s var(--ease-out)',
        }}>
          <span style={{ animation: 'pulsingDot 1.8s ease-in-out infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Powered by Lemma SDK · Gappy AI Hackathon 2026
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(40px, 6.5vw, 64px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.12,
          letterSpacing: '-0.04em',
          marginBottom: 22,
          maxWidth: 700,
          animation: 'fadeInUp 0.4s var(--ease-out) 80ms both',
        }}>
          Your meeting ended.{' '}
          <span style={{ display: 'block' }}>
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Now the real</em>{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              work begins.
              <WavyUnderline />
            </span>
          </span>
        </h1>

        <p style={{
          fontSize: 17,
          color: 'var(--text-secondary)',
          lineHeight: 1.72,
          maxWidth: 520,
          marginBottom: 38,
          animation: 'fadeInUp 0.4s var(--ease-out) 160ms both',
          fontWeight: 400,
        }}>
          Paste any transcript. MeetFlow pulls out every commitment, assigns it,
          sets a deadline, and keeps everyone accountable — <em>automatically</em>.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'fadeInUp 0.4s var(--ease-out) 240ms both',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <button
            id="hero-cta-start"
            onClick={handleAuthClick}
            style={{
              height: 48, padding: '0 28px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 2px 16px rgba(99,102,241,0.30)',
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.38)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(99,102,241,0.30)'; }}
          >
            Start free <ArrowRight size={15} />
          </button>
          <button
            id="hero-cta-demo"
            onClick={() => setDemoOpen(true)}
            style={{
              height: 48, padding: '0 22px',
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Play size={14} /> See how it works
          </button>
        </div>

        {/* Trust line */}
        <div style={{
          marginTop: 28,
          fontSize: 12, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 16,
          animation: 'fadeInUp 0.4s var(--ease-out) 320ms both',
          flexWrap: 'wrap', justifyContent: 'center', gap: 12,
        }}>
          {['No credit card', 'Free forever on hobby', 'Setup in 60 seconds'].map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={12} color="var(--success)" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Demo card ── */}
      <section style={{ padding: '64px 24px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 500, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live demo</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 10 }}>
            Watch AI process a meeting
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            This runs automatically, every time, on any meeting transcript.
          </p>
        </div>
        <TranscriptDemo />
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '60px 48px', background: 'var(--bg-overlay)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
          <StatCounter value={2400} suffix="+" label="Meetings processed" />
          <StatCounter value={18500} suffix="+" label="Tasks extracted" />
          <StatCounter value={94} suffix="%" label="On-time task rate" />
          <StatCounter value={12} suffix="min" label="Avg setup time" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '80px 48px', maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 500, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>How it works</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.2 }}>
            From transcript<br/>to shipped — in seconds.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
            No more manually writing up action items after every meeting. MeetFlow handles the entire loop — extraction, assignment, tracking, and follow-up.
          </p>
          <button onClick={handleAuthClick} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px',
            background: 'var(--accent-subtle)', color: 'var(--text-accent)',
            border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all var(--duration-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
          >
            Try it yourself <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ProcessStep num={1} icon={FileText} title="Paste your transcript" desc="Copy meeting notes from any source — Google Meet, Zoom, Slack Huddle, or Teams. Or drop a .txt file." isLast={false} />
          <ProcessStep num={2} icon={Sparkles} title="AI extracts everything" desc="MeetFlow identifies every commitment, assigns it to the person who made it, and sets a realistic deadline." isLast={false} />
          <ProcessStep num={3} icon={LayoutGrid} title="Team ships it" desc="Board goes live instantly. Drag tasks to Done, get automated follow-ups, close the loop." isLast={true} />
        </div>
      </section>

      {/* ── Board mockup ── */}
      <section style={{ padding: '20px 48px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          transform: 'perspective(1400px) rotateY(-2deg) rotateX(0.8deg)',
          transition: 'transform 400ms var(--ease-smooth)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'perspective(1400px) rotateY(0) rotateX(0)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'perspective(1400px) rotateY(-2deg) rotateX(0.8deg)'}
        >
          {/* Mock top bar */}
          <div style={{ background: 'var(--bg-overlay)', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#f87171', '#fbbf24', '#34d399'].map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Q3 Sprint Kickoff — Board</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-accent)', background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>✦ Approved</span>
          </div>
          {/* Kanban columns */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', padding: 16, minHeight: 240 }}>
            {[
              { label: 'To do', color: 'var(--status-todo)', tasks: ['Set up production server', 'Create onboarding flow', 'Prepare account guide'] },
              { label: 'In progress', color: 'var(--status-inprogress)', tasks: ['Build user dashboard', 'Draft welcome email'] },
              { label: 'Done', color: 'var(--status-done)', tasks: ['API integration', 'Share PRD with team', 'Sprint retro form'] },
            ].map((col, ci) => (
              <div key={ci} style={{ flex: 1, padding: '0 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{col.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 10, marginLeft: 'auto' }}>{col.tasks.length}</span>
                </div>
                {col.tasks.map((t, ti) => (
                  <div key={ti} style={{
                    padding: '9px 10px', background: 'var(--bg-elevated)',
                    borderRadius: 8, marginBottom: 6, fontSize: 11,
                    color: 'var(--text-secondary)', borderLeft: `2.5px solid ${col.color}`,
                    lineHeight: 1.4, boxShadow: 'var(--shadow-sm)',
                  }}>{t}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ padding: '60px 48px 80px', background: 'var(--bg-overlay)', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 500, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Features</div>
            <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>
              Everything you need to close the loop.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              Built for teams that move fast but can't afford to drop the ball.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <FeatureCard icon={Sparkles} title="AI Task Extraction" desc="Every commitment, deadline, and owner pulled automatically. No manual work, no missed items." />
            <FeatureCard icon={Users} title="Smart Assignment" desc="MeetFlow recognizes who said what and assigns tasks to the right person automatically." />
            <FeatureCard icon={LayoutGrid} title="Live Execution Board" desc="Kanban board auto-populated after every meeting. Drag tasks, track progress, ship faster." />
            <FeatureCard icon={Bell} title="Automated Follow-ups" desc="Slack and WhatsApp nudges fire automatically when tasks go overdue. No manual chasing." />
            <FeatureCard icon={TrendingUp} title="Deadline Intelligence" desc="AI sets realistic deadlines based on context. Surfaces overdue tasks before they become problems." />
            <FeatureCard icon={Globe} title="Multi-platform" desc="Google Meet, Zoom, Slack Huddle, Teams — works with any transcript from any platform." />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Loved by teams that ship.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Don't take our word for it.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Testimonial
            quote="Every meeting ends with a clear list now. We stopped losing track of commitments the moment we started using MeetFlow."
            name="Arjun Shah"
            role="PM"
            company="YC W25"
            avatar="#F4622A"
          />
          <Testimonial
            quote="The Slack follow-ups are magic. Tasks that would've been forgotten now get done because people get nudged automatically."
            name="Priya Mehta"
            role="Engineering Lead"
            company="Stealth startup"
            avatar="#267a52"
          />
          <Testimonial
            quote="We cut our post-meeting admin time by 90%. The AI extraction is incredibly accurate — it even catches implied tasks."
            name="Rohan Verma"
            role="Co-founder"
            company="Series A"
            avatar="#7a7468"
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 32px 80px' }}>
        <div style={{
          background: '#0f172a',
          borderRadius: 'var(--radius-2xl)',
          padding: '64px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: 1000,
          margin: '0 auto',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(232,149,106,0.7)', fontWeight: 500, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Ready to ship?
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, color: '#fff', marginBottom: 14, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Your team deserves better than<br />forgotten promises.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Start turning meetings into action. Free forever on hobby plan.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  height: 48, padding: '0 32px',
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 7,
                  boxShadow: '0 0 40px rgba(99,102,241,0.30)',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = ''; }}
              >
                Get started free <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '20px 48px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={11} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>MeetFlow</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Gappy AI Hackathon 2026 · Powered by Lemma SDK
        </span>
      </footer>

      {/* Demo Modal */}
      <Modal isOpen={demoOpen} onClose={() => setDemoOpen(false)} title="How MeetFlow Works" maxWidth={500}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['Paste your transcript', 'Copy raw meeting notes from any source — Zoom, Meet, or your own notes.'],
            ['AI analyzes speakers', 'MeetFlow identifies who said what and which statements were commitments.'],
            ['Tasks extracted instantly', 'Every "I\'ll do X by Y" becomes a task with owner and deadline.'],
            ['Review & edit', 'Admin reviews extracted tasks — edit titles, reassign owners, adjust deadlines.'],
            ['One-click publish', 'Approve and the board goes live instantly for the whole team.'],
            ['Automated follow-ups', 'Slack and WhatsApp nudges fire automatically when tasks go overdue.'],
            ['Close the loop', 'Dashboard tracks completion rate, overdue items, and team velocity.'],
          ].map(([step, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--text-accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{step}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
