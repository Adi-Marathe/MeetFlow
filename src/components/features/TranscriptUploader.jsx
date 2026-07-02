import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateRecord, useWorkflowRun } from 'lemma-sdk/react'
import { useCurrentMember } from '../../hooks/useCurrentMember'
import { Button } from '../ui/Button'
import { AlertCircle } from 'lucide-react'

const PLACEHOLDER = `Paste your raw transcript here...
e.g. Aditya: Shruti can you complete the dashboard by July 3?
     Shruti: Yes, I'll have it ready.`

export function TranscriptUploader({ client, onSuccess }) {
  const { email } = useCurrentMember()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [transcriptError, setTranscriptError] = useState(false)
  const [processing, setProcessing] = useState(false)
  const cardRef = useRef(null)

  // Safety check for hooks
  if (!client) {
    console.error('TranscriptUploader: client prop is required')
    return <div style={{ padding: 20, color: 'var(--danger)' }}>Error: Missing client configuration</div>
  }

  const { create } = useCreateRecord(client, { tableName: 'meetings' })
  const workflow = useWorkflowRun({
    client,
    workflowName: 'meeting-extraction-workflow',
  })

  async function handleSubmit() {
    let valid = true
    if (!title || !(title || '').trim()) {
      setTitleError(true)
      valid = false
    } else {
      setTitleError(false)
    }

    if (!transcript || !(transcript || '').trim()) {
      setTranscriptError(true)
      valid = false
    } else {
      setTranscriptError(false)
    }

    if (!valid) return

    setProcessing(true)
    if (cardRef.current) {
      cardRef.current.classList.add('processing-amber')
    }

    try {
      const meetingId = `mtg-${Date.now()}`
      await create({
        id: meetingId,
        title: (title || '').trim() || 'Untitled Meeting',
        date: new Date().toISOString().split('T')[0],
        source: 'paste',
        raw_transcript: (transcript || '').trim(),
        status: 'pending_review',
        participants: email || '',
      })

      await workflow.start({})

      if (cardRef.current) {
        cardRef.current.classList.remove('processing-amber')
      }
      setProcessing(false)
      if (onSuccess) onSuccess()
      navigate(`/meetings/${meetingId}/review`)
    } catch (err) {
      console.error('Failed to create meeting:', err)
      if (cardRef.current) {
        cardRef.current.classList.remove('processing-amber')
      }
      setProcessing(false)
      // You could show error toast here
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulseAmber {
          0% { box-shadow: 0 0 0 0 var(--accent-subtle); border-color: var(--border-accent); }
          70% { box-shadow: 0 0 0 10px transparent; border-color: var(--border-subtle); }
          100% { box-shadow: 0 0 0 0 transparent; border-color: var(--border-subtle); }
        }
        .processing-amber {
          animation: pulseAmber 1.5s infinite cubic-bezier(0.66, 0, 0, 1);
          border-color: var(--border-accent) !important;
        }
      `}</style>
      <div
        ref={cardRef}
        style={{
          padding: 28,
          background: 'var(--bg-surface)',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Processing overlay text */}
        {processing && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            color: 'var(--text-accent)', fontStyle: 'italic', zIndex: 2,
            background: 'var(--bg-surface)', padding: '4px 12px',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--border-accent)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spinArc 1s linear infinite' }}>
              <circle cx="7" cy="7" r="5" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="20 12" strokeLinecap="round" />
            </svg>
            <span>✦ Processing transcript…</span>
          </div>
        )}

        {/* 1. Meeting Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontFamily: 'Inter', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Meeting title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            {titleError && (
              <span style={{ fontSize: 11, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, animation: 'fadeIn 0.2s' }}>
                <AlertCircle size={12} /> Title is required
              </span>
            )}
          </div>
          <input
            type="text"
            value={title || ''}
            onChange={e => { setTitle(e.target.value || ''); if (titleError) setTitleError(false); }}
            placeholder="e.g. Q3 Sprint Planning, Client Onboarding..."
            disabled={processing}
            style={{
              width: '100%', height: 40,
              background: 'var(--bg-elevated)',
              border: `1px solid ${titleError ? 'var(--danger)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0 14px',
              fontFamily: 'Inter', fontSize: 14, fontWeight: 400, color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all var(--duration-fast)',
              boxShadow: titleError ? '0 0 0 3px var(--danger-subtle)' : 'none',
            }}
            onFocus={e => {
              if (!titleError) {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
              }
            }}
            onBlur={e => {
              if (!titleError) {
                e.target.style.borderColor = 'var(--border-default)';
                e.target.style.boxShadow = 'none';
              }
            }}
          />
        </div>

        {/* 2. Transcript Textarea */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontFamily: 'Inter', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Meeting transcript <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            {transcriptError && (
              <span style={{ fontSize: 11, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, animation: 'fadeIn 0.2s' }}>
                <AlertCircle size={12} /> Transcript is required
              </span>
            )}
          </div>
          <textarea
            value={transcript || ''}
            onChange={e => { setTranscript(e.target.value || ''); if (transcriptError) setTranscriptError(false); }}
            placeholder={PLACEHOLDER}
            disabled={processing}
            style={{
              width: '100%', resize: 'vertical',
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--text-secondary)',
              background: 'var(--bg-elevated)',
              border: `1px solid ${transcriptError ? 'var(--danger)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px', outline: 'none', lineHeight: 1.7, minHeight: 160,
              transition: 'all var(--duration-fast)',
              boxShadow: transcriptError ? '0 0 0 3px var(--danger-subtle)' : 'none',
            }}
            onFocus={e => {
              if (!transcriptError) {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
              }
            }}
            onBlur={e => {
              if (!transcriptError) {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.boxShadow = 'none';
              }
            }}
          />
        </div>

        {/* 3. Process Button */}
        <Button
          onClick={handleSubmit}
          variant="filled"
          disabled={processing}
          style={{ width: '100%', height: 44, justifyContent: 'center', marginTop: 8, background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'Inter', fontWeight: 500 }}
        >
          {processing ? '⟳ Processing…' : '✦ Process with AI →'}
        </Button>
      </div>
    </>
  );
}
