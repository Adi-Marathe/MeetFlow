import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Plus } from 'lucide-react';
import { useWorkflowRun, useRecords, useCreateRecord } from 'lemma-sdk/react';
import { podClient } from '../../lib/lemma';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

export function NewMeetingModal({ onClose = null }) {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingMeetingId, setProcessingMeetingId] = useState(null);
  const [workflowRunIdState, setWorkflowRunIdState] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);
  const navigate = useNavigate();
  const { email: currentEmail } = useCurrentMember();
  const { addToast } = useToast();

  // Safety check - ensure state is properly initialized
  const safeTitle = title ?? '';
  const safeParticipants = participants ?? '';
  const safeTranscript = transcript ?? '';

  // Don't call useCreateRecord at mount - causes SDK crash before auth is ready
  // We'll create records directly using podClient.datastore API instead
  const workflowRun = useWorkflowRun({ client: podClient, workflowName: 'meeting-extraction-workflow' });

  // Poll for meeting and tasks while processing
  const { records: processingMeetings = [] } = useRecords({
    client: podClient,
    tableName: 'meetings',
    filter: processingMeetingId ? { id: { eq: processingMeetingId } } : undefined,
  });

  const { records: extractedTasks = [] } = useRecords({
    client: podClient,
    tableName: 'tasks',
    filter: processingMeetingId ? { meeting_id: { eq: processingMeetingId } } : undefined,
  });

  // Log extracted tasks for debugging
  useEffect(() => {
    if (processingMeetingId) {
      console.log(`📊 Polling tasks for meeting ${processingMeetingId}... Found: ${extractedTasks.length} tasks`);
      if (extractedTasks.length > 0) {
        console.log('✅ Tasks detected:', extractedTasks.map(t => ({ id: t.id, title: t.title })));
      }
    }
  }, [extractedTasks.length, processingMeetingId, extractedTasks]);

  const processingMeeting = processingMeetings[0];

  // Rotate processing messages
  useEffect(() => {
    if (!processingMeetingId) return;

    const messages = ['Reading transcript...', 'Extracting tasks...', 'Almost done...'];
    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [processingMeetingId]);

  // Auto-navigate when tasks are extracted
  useEffect(() => {
    if (processingMeetingId && extractedTasks.length > 0) {
      console.log('✅ Tasks detected! Navigating to review page...');
      // Tasks extracted! Navigate to review page with workflow run ID
      setTimeout(() => {
        navigate(`/meetings/${processingMeetingId}/review${workflowRunIdState ? `?runId=${workflowRunIdState}` : ''}`);
        if (onClose) onClose();
      }, 500); // Small delay to show completion
    }
  }, [extractedTasks.length, processingMeetingId, workflowRunIdState, navigate, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const safeTranscriptValue = safeTranscript || transcript || '';
    const safeTitleValue = (safeTitle || title || '').trim();
    
    // Validate required fields
    if (!safeTitleValue) {
      addToast('Please enter a meeting title', 'warning', 3000);
      return;
    }
    
    if (!safeTranscriptValue || !(safeTranscriptValue || '').trim()) {
      addToast('Please paste a transcript', 'warning', 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate unique meeting ID and date
      const meetingId = `mtg-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];
      const participantsList = (safeParticipants || participants || '').trim() || currentEmail || '';
      const meetingTitle = (safeTitle || title || '').trim() || 'Untitled Meeting';

      console.log('📝 Creating meeting record...');

      // Create meeting using correct SDK API: podClient.records.create
      const meetingRecord = await podClient.records.create('meetings', {
        id: meetingId,
        title: meetingTitle,
        date: today,
        duration_mins: 30,
        raw_transcript: (safeTranscript || transcript || '').trim(),
        summary: '',
        status: 'pending_review',
        participants: participantsList,
        source: 'paste'
      });

      console.log('✅ Meeting created:', meetingRecord);

      // Show success toast
      addToast('✓ Transcript uploaded! Extracting tasks...', 'success', 3000);

      // 3. Start workflow with NO arguments - agent will find the pending_review meeting
      console.log('🚀 Starting workflow (agent will query for pending_review meeting)...');
      
      const workflowResult = await workflowRun.start({});
      
      // Extract workflow run ID - check both possible locations
      const runId = workflowResult?.id || workflowResult?.runId;

      console.log('✅ Workflow started for meeting:', meetingId);
      console.log('📋 Workflow result:', workflowResult);
      console.log('🆔 Extracted workflow run ID:', runId);

      // 4. Store workflow run ID in meeting record for later use
      if (runId) {
        try {
          // Use datastore API directly for update since records.update might not exist
          await podClient.datastore.tables.meetings.records.update(meetingId, {
            workflow_uid: runId  // Use workflow_uid to match your column name
          });
          console.log('✅ Workflow run ID stored in meeting.workflow_uid:', runId);
        } catch (updateError) {
          console.warn('⚠️ Could not store workflow run ID in database:', updateError);
          console.warn('This is non-critical - workflow will still work via URL parameter');
        }
      } else {
        console.error('❌ WARNING: Could not extract workflow run ID from result:', workflowResult);
      }

      // 5. Store run ID in state for navigation
      setWorkflowRunIdState(runId);

      // 6. Enter processing state - this triggers task polling
      setProcessingMeetingId(meetingId);
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('❌ Failed to create meeting or start workflow:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
      });
      addToast(`Failed to create meeting: ${error.message || 'Unknown error'}`, 'error', 4000);
      setIsSubmitting(false);
      setProcessingMeetingId(null);
    }
  };

  const processingMessages = ['Reading transcript...', 'Extracting tasks...', 'Almost done...'];

  // Show processing state
  if (processingMeetingId) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: 320,
      }}>
        {/* Pulsing animation */}
        <div style={{
          position: 'relative',
          width: 80,
          height: 80,
          marginBottom: 24,
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(207, 115, 54, 0.3) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Loader size={20} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        </div>

        {/* Processing message */}
        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: 'var(--text-primary)', 
          marginBottom: 8,
          textAlign: 'center',
        }}>
          {processingMessages[processingStep]}
        </h3>
        
        <p style={{ 
          fontSize: 13, 
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: 400,
        }}>
          {processingMeeting && extractedTasks.length > 0
            ? `Found ${extractedTasks.length} tasks! Redirecting...`
            : processingMeeting
            ? `Meeting created, extracting tasks...`
            : 'Creating meeting record...'
          }
        </p>

        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.6;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title Input */}
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: 13, 
          fontWeight: 500, 
          color: 'var(--text-primary)', 
          marginBottom: 6 
        }}>
          Meeting Title <span style={{ color: 'var(--danger)', fontWeight: 600 }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Q3 Planning, Sprint Review, etc."
          disabled={isSubmitting}
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
        />
      </div>

      {/* Participants Input */}
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: 13, 
          fontWeight: 500, 
          color: 'var(--text-primary)', 
          marginBottom: 6 
        }}>
          Participants <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          type="text"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Comma-separated emails. Leave empty to use your email.
        </p>
      </div>

      {/* Transcript Textarea */}
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: 13, 
          fontWeight: 500, 
          color: 'var(--text-primary)', 
          marginBottom: 6 
        }}>
          Transcript <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your meeting transcript here...&#10;&#10;Example:&#10;John: Let's discuss the Q3 roadmap.&#10;Sarah: I can handle the API integration by Friday.&#10;John: Great, I'll review the design docs by Thursday."
          disabled={isSubmitting}
          required
          style={{
            width: '100%',
            minHeight: 200,
            maxHeight: 300,
            padding: '12px',
            fontSize: 13,
            lineHeight: 1.6,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'var(--font-mono)',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
        />
      </div>

      {/* Submit Button */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        {onClose && (
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !safeTranscript || !(safeTranscript || '').trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isSubmitting ? (
            <>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Extracting Tasks...
            </>
          ) : (
            <>
              <Plus size={16} />
              Extract Tasks
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
