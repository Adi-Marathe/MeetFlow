import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader, Sparkles, Send } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useRecords, useUpdateRecord, useWorkflowRuns, useWorkflowResume } from 'lemma-sdk/react';
import { podClient as client } from '../lib/lemma';
import { formatDateFull, getSourceLabel } from '../lib/utils';
import { useCurrentMember } from '../hooks/useCurrentMember';
import { useToast } from '../context/ToastContext';

export default function MeetingReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useCurrentMember();
  const { addToast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [lastTaskCount, setLastTaskCount] = useState(0);
  const [stableTaskCount, setStableTaskCount] = useState(0);
  const [sendingFollowups, setSendingFollowups] = useState(false);
  const [followupPollingCount, setFollowupPollingCount] = useState(0);
  
  // Get workflow run ID from URL search params OR from meeting record
  const searchParams = new URLSearchParams(window.location.search);
  const urlRunId = searchParams.get('runId');
  
  const { records: meetings = [] } = useRecords({ client, tableName: 'meetings' });
  const { records: allTasks = [], refresh: refetchTasks } = useRecords({ client, tableName: 'tasks' });
  const { records: members = [] } = useRecords({ client, tableName: 'members' });
  const { records: followups = [], refresh: refetchFollowups } = useRecords({ client, tableName: 'followups' });
  
  const meetingId = id;
  const meeting = meetings.find(m => m.id === meetingId);
  
  // Use URL runId first, fallback to database-stored runId (workflow_uid)
  const workflowRunId = urlRunId || meeting?.workflow_uid;
  
  // Get all workflow runs to find waiting ones (kept for debugging)
  const { records: workflowRuns = [], refresh: refreshWorkflowRuns } = useWorkflowRuns({ 
    client, 
    workflowName: 'meeting-extraction-workflow' 
  });
  
  // ALWAYS call the hook (hooks must be unconditional)
  // Pass workflowRunId even if undefined - the hook will handle it
  const resume = useWorkflowResume({ 
    client,
    runId: workflowRunId || undefined
  });

  const updateMeeting = useUpdateRecord({ client, tableName: 'meetings' });
  const updateTask = useUpdateRecord({ client, tableName: 'tasks' });

  const tasks = allTasks.filter(t => t.meeting_id === meetingId);
  
  // Get follow-ups for current meeting's tasks
  const taskIds = tasks.map(t => t.id);
  const meetingFollowups = followups.filter(f => taskIds.includes(f.task_id));

  // Track when task count stabilizes (no new tasks for 3 seconds)
  useEffect(() => {
    if (tasks.length !== lastTaskCount) {
      // Task count changed - reset stability counter
      console.log(`📊 Task count changed: ${lastTaskCount} → ${tasks.length}`);
      setLastTaskCount(tasks.length);
      setStableTaskCount(0);
    } else if (tasks.length > 0 && meeting?.status === 'pending_review' && stableTaskCount < 3) {
      // Task count stable - increment counter every second until it reaches 3
      const timer = setTimeout(() => {
        const newCount = stableTaskCount + 1;
        console.log(`⏱️ Task count stable for ${newCount} second(s) (${tasks.length} tasks)`);
        setStableTaskCount(newCount);
        
        // When stable for 3 seconds, show tasks
        if (newCount === 3) {
          console.log('✅ Tasks stabilized! Showing task list for review');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tasks.length, lastTaskCount, meeting?.status, stableTaskCount]);

  // Poll for tasks more frequently while status is pending_review (every 1s instead of 2s)
  useEffect(() => {
    if (!meeting) return;
    
    if (meeting.status === 'pending_review' && pollingCount < 60) {
      const timer = setTimeout(() => {
        console.log(`🔄 Polling (${pollingCount + 1}/60): Checking for tasks... Current count: ${tasks.length}`);
        refetchTasks();
        refreshWorkflowRuns(); // Also refresh workflow runs to detect waiting state
        setPollingCount(prev => prev + 1);
      }, 1000); // Poll every 1 second for real-time updates

      return () => clearTimeout(timer);
    } else if (pollingCount >= 60) {
      console.log('⏱️ Polling stopped after 60 seconds');
    }
  }, [meeting, tasks.length, pollingCount, refetchTasks, refreshWorkflowRuns]);

  // Poll for follow-ups after approval (wait for agent to generate and send messages)
  useEffect(() => {
    if (!sendingFollowups) return;
    
    // Keep polling for up to 120 seconds (120 polls at 1s each) - extended for sending time
    if (followupPollingCount < 120) {
      const timer = setTimeout(() => {
        refetchFollowups();
        setFollowupPollingCount(prev => prev + 1);
        
        // IMPORTANT: Only check follow-ups for THIS MEETING's tasks
        const currentMeetingFollowups = followups.filter(f => taskIds.includes(f.task_id));
        
        // Only consider tasks with owners from THIS meeting
        const tasksWithOwners = tasks.filter(t => t.owner && t.owner.trim() !== '');
        const sentFollowups = currentMeetingFollowups.filter(f => f.status === 'Sent');
        const failedFollowups = currentMeetingFollowups.filter(f => f.status === 'Failed');
        const draftFollowups = currentMeetingFollowups.filter(f => f.status === 'Draft' || f.status === 'Pending');
        
        // Check if we have finalized follow-ups (Sent or Failed - not Draft/Pending)
        const hasFinalizedFollowups = sentFollowups.length > 0 || failedFollowups.length > 0;
        
        // Check if ALL follow-ups have been finalized (all Sent or Failed, no Drafts/Pending remaining)
        const allFollowupsFinalized = tasksWithOwners.length > 0 && 
                                       currentMeetingFollowups.length >= tasksWithOwners.length &&
                                       draftFollowups.length === 0;
        
        console.log(`🔍 Polling follow-ups (${followupPollingCount}s):`, {
          meetingId: meetingId,
          taskCount: tasks.length,
          tasksWithOwners: tasksWithOwners.length,
          taskIds: taskIds,
          totalFollowups: followups.length,
          currentMeetingFollowups: currentMeetingFollowups.length,
          followupDetails: currentMeetingFollowups.map(f => ({
            task_id: f.task_id,
            owner: f.owner_email,
            status: f.status,
            channel: f.channel
          })),
          sentCount: sentFollowups.length,
          failedCount: failedFollowups.length,
          draftPendingCount: draftFollowups.length,
          hasFinalizedFollowups,
          allFinalized: allFollowupsFinalized
        });
        
        // Only redirect when all follow-ups are finalized (no Drafts/Pending remaining)
        // OR we have at least some finalized follow-ups and waited long enough (60s)
        if (allFollowupsFinalized || (hasFinalizedFollowups && followupPollingCount > 60)) {
          // Follow-ups are ready! Show appropriate toast and redirect
          console.log('✅ Follow-ups completed for this meeting, redirecting...', {
            sent: sentFollowups.length,
            failed: failedFollowups.length,
            draft: draftFollowups.length,
            total: currentMeetingFollowups.length
          });
          
          // Stop the animation
          setSendingFollowups(false);
          
          // Show toast based on results
          if (sentFollowups.length > 0 && failedFollowups.length === 0) {
            addToast(
              `✓ Success! ${sentFollowups.length} follow-up ${sentFollowups.length === 1 ? 'message' : 'messages'} sent via Slack`,
              'success',
              5000
            );
          } else if (sentFollowups.length > 0 && failedFollowups.length > 0) {
            addToast(
              `⚠️ ${sentFollowups.length} sent, ${failedFollowups.length} failed. Check Follow-ups page for details.`,
              'warning',
              5000
            );
          } else if (failedFollowups.length > 0) {
            addToast(
              `✗ ${failedFollowups.length} follow-up ${failedFollowups.length === 1 ? 'message' : 'messages'} failed to send. Check Follow-ups page for details.`,
              'error',
              5000
            );
          } else if (draftFollowups.length > 0) {
            // All follow-ups are in draft status
            addToast(
              `✓ ${draftFollowups.length} follow-up ${draftFollowups.length === 1 ? 'message' : 'messages'} drafted and ready`,
              'success',
              4000
            );
          } else {
            // All follow-ups created but status unknown
            addToast(
              `✓ Follow-up messages generated for ${currentMeetingFollowups.length} ${currentMeetingFollowups.length === 1 ? 'task' : 'tasks'}`,
              'success',
              4000
            );
          }
          
          navigate('/followups');
        }
      }, 1000); // Poll every 1 second

      return () => clearTimeout(timer);
    } else {
      // Timeout after 120 seconds - redirect anyway
      console.log('⏱️ Follow-up polling timeout (120s), redirecting...');
      setSendingFollowups(false);
      addToast('Follow-up processing is taking longer than expected. Check Follow-ups page for status.', 'info', 5000);
      navigate('/followups');
    }
  }, [sendingFollowups, followupPollingCount, followups, taskIds, tasks, refetchFollowups, navigate, addToast, meetingId]);

  const handleApprove = async () => {
    if (!meeting || !isAdmin) return;

    // Verify workflow run ID is available before starting
    if (!workflowRunId) {
      console.error('❌ No workflow run ID available');
      addToast('Cannot approve: workflow run ID not found. Please try reloading the page.', 'error', 4000);
      return;
    }

    setIsApproving(true);
    try {
      console.log('🔄 Starting approval process...');
      console.log('Meeting ID:', meeting.id);
      console.log('Meeting status before:', meeting.status);
      console.log('Workflow run ID:', workflowRunId);
      
      // 1. Update meeting status to approved
      await updateMeeting.update({
        status: 'approved'
      }, {
        recordId: meeting.id
      });
      console.log('✅ Meeting status updated to approved');

      // 2. Resume the workflow with approval decision
      console.log('📤 Calling resume with approval data:', { approved: true });
      
      // Call resume with just the form data - let SDK find the waiting node automatically
      const result = await resume.resume({ 
        approved: true  // This matches the workflow's form field name
      });
      
      console.log('✅ Workflow resumed successfully. Result:', result);

      // Show success toast
      addToast('✓ Workflow approved! Generating follow-up messages...', 'success', 4000);

      // Count unique task owners for notification
      const taskOwners = [...new Set(tasks.map(t => t.owner).filter(Boolean))];
      const ownerCount = taskOwners.length;
      
      // Start follow-up animation and polling
      setIsApproving(false);
      setSendingFollowups(true);
      setFollowupPollingCount(0);
    } catch (error) {
      console.error('❌ Failed to approve meeting:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        workflowRunId: workflowRunId,
      });
      
      // Show error toast
      if (error.message?.includes('runId')) {
        addToast('Workflow error: The workflow run ID is not properly configured. Please try starting a new meeting.', 'error', 5000);
      } else {
        addToast(`Failed to approve meeting: ${error.message || 'Unknown error'}`, 'error', 5000);
      }
      setIsApproving(false);
    }
  };

  const handleTaskUpdate = async (taskId, field, value) => {
    try {
      await updateTask.update({
        [field]: value
      }, {
        recordId: taskId
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Check if extraction is still in progress
  // Show "Agent is thinking" if tasks are still being created (count hasn't stabilized)
  // Once task count is stable for 3 seconds, show the task list for review
  const isExtracting = stableTaskCount < 3 && meeting?.status === 'pending_review';

  // Log state for debugging
  useEffect(() => {
    console.log('📋 Extraction state:', {
      status: meeting?.status,
      taskCount: tasks.length,
      stableCount: stableTaskCount,
      isExtracting: isExtracting,
      pollingCount: pollingCount
    });
  }, [meeting?.status, tasks.length, stableTaskCount, isExtracting, pollingCount]);

  // Show follow-up sending animation after approval
  const isSendingFollowups = sendingFollowups;

  // Check if workflow run ID is in URL (means workflow has been started)
  const hasWorkflowStarted = !!workflowRunId;

  if (!meeting) {
    return (
      <PageWrapper>
        <div style={{ padding: '32px 36px', maxWidth: 920, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading meeting...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ 
        padding: '28px clamp(20px, 5vw, 48px) 120px',
        paddingTop: window.innerWidth < 768 ? '80px' : '28px',
        paddingLeft: window.innerWidth >= 768 ? 'clamp(20px, 5vw, 48px)' : '20px',
        maxWidth: '100%',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {meeting.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Badge variant={meeting.status === 'approved' || meeting.status === 'completed' ? 'done' : 'warning'}>
              {meeting.status === 'pending_review' ? 'Pending Review' : 
               meeting.status === 'extracted' ? 'Extracted' :
               meeting.status === 'approved' ? 'Approved' : 
               meeting.status === 'completed' ? 'Completed' : 'Done'}
            </Badge>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {formatDateFull(meeting.date)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {getSourceLabel(meeting.source)}
            </span>
            {meeting.duration_mins && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {meeting.duration_mins} min
              </span>
            )}
          </div>
        </div>

        {/* Extracting State - Improved Animation */}
        {isExtracting && !isSendingFollowups && (
          <div style={{
            padding: '80px 48px',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Multiple animated gradient orbs */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '15%',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 6s ease-in-out infinite',
              opacity: 0.4,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '20%',
              right: '15%',
              width: 250,
              height: 250,
              background: 'radial-gradient(circle, var(--success-subtle) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 8s ease-in-out infinite reverse',
              opacity: 0.3,
            }} />
            
            {/* AI thinking icon with improved animation */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
              <div style={{
                width: 80,
                height: 80,
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'pulse 2s ease-in-out infinite',
              }}>
                <Sparkles 
                  size={40} 
                  color="var(--accent)" 
                  style={{ 
                    animation: 'sparkle 1.5s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 12px var(--accent))'
                  }} 
                />
                {/* Rotating ring */}
                <div style={{
                  position: 'absolute',
                  inset: -8,
                  border: '2px solid var(--accent)',
                  borderRadius: '50%',
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  animation: 'spin 3s linear infinite',
                  opacity: 0.3,
                }} />
              </div>

              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                marginBottom: 12,
                letterSpacing: '-0.02em',
              }}>
                Agent is thinking...
              </h3>
              <p style={{ 
                fontSize: 14, 
                color: 'var(--text-muted)', 
                marginBottom: 32,
                lineHeight: 1.6,
              }}>
                Analyzing transcript and extracting actionable tasks
              </p>
              
              {/* Progress indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'bounce 1.4s ease-in-out infinite',
                }} />
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'bounce 1.4s ease-in-out 0.2s infinite',
                }} />
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'bounce 1.4s ease-in-out 0.4s infinite',
                }} />
              </div>
            </div>

            <style>{`
              @keyframes sparkle {
                0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
                50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
              }
              @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes float {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(20px, -20px) scale(1.05); }
                66% { transform: translate(-20px, 10px) scale(0.95); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Sending Follow-ups Animation */}
        {isSendingFollowups && (
          <div style={{
            padding: '80px 48px',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated gradient orbs */}
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              width: 350,
              height: 350,
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 7s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '15%',
              right: '10%',
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 9s ease-in-out infinite reverse',
            }} />
            <div style={{
              position: 'absolute',
              top: '40%',
              right: '20%',
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'float 5s ease-in-out infinite',
            }} />
            
            {/* Main content */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
              {/* Animated icon with rings */}
              <div style={{ position: 'relative', margin: '0 auto 32px', width: 100, height: 100 }}>
                <div style={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--success-subtle) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  animation: 'pulse 2.5s ease-in-out infinite',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
                }}>
                  <Send 
                    size={48} 
                    color="var(--accent)" 
                    style={{ 
                      animation: 'bounce 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 0 16px var(--accent))'
                    }} 
                  />
                  
                  {/* Pulsing rings */}
                  <div style={{
                    position: 'absolute',
                    inset: -12,
                    border: '3px solid var(--accent)',
                    borderRadius: '50%',
                    opacity: 0.4,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: -24,
                    border: '2px solid var(--success)',
                    borderRadius: '50%',
                    opacity: 0.3,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) 0.5s infinite',
                  }} />
                </div>
              </div>

              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: 'var(--text-primary)', 
                marginBottom: 16,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                Crafting Follow-up Messages
              </h3>
              <p style={{ 
                fontSize: 15, 
                color: 'var(--text-muted)', 
                marginBottom: 40,
                lineHeight: 1.6,
                maxWidth: 480,
                margin: '0 auto 40px',
              }}>
                The agent is writing personalized messages and sending them to task owners via Slack
              </p>
              
              {/* Progress steps */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 40,
                textAlign: 'left',
                maxWidth: 400,
                margin: '0 auto 40px',
              }}>
                {[
                  { label: 'Analyzing task assignments', delay: 0 },
                  { label: 'Generating personalized messages', delay: 0.3 },
                  { label: 'Sending notifications via Slack', delay: 0.6 },
                ].map(({ label, delay }, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    animation: `fadeInUp 0.5s ease-out ${delay}s both`,
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: `pulse 2s ease-in-out ${delay}s infinite`,
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Animated dots */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'bounce 1.4s ease-in-out infinite',
                }} />
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--success)',
                  animation: 'bounce 1.4s ease-in-out 0.2s infinite',
                }} />
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--warning)',
                  animation: 'bounce 1.4s ease-in-out 0.4s infinite',
                }} />
              </div>

              {/* Polling status */}
              <div style={{
                marginTop: 32,
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                Checking status {followupPollingCount > 0 ? `(${followupPollingCount}s)` : '...'}
              </div>
            </div>

            <style>{`
              @keyframes ping {
                75%, 100% {
                  transform: scale(1.5);
                  opacity: 0;
                }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )}

        {/* Tasks List - Improved Layout */}
        {!isExtracting && !isSendingFollowups && tasks.length > 0 && (
          <div style={{ marginBottom: 120 }}>
            <div style={{ 
              marginBottom: 20,
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Extracted Tasks ({tasks.length})
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Review and edit tasks before approving
                </p>
              </div>
              <div style={{
                padding: '8px 16px',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-accent)',
              }}>
                ✦ AI Generated
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map((task, index) => (
                <TaskEditCard
                  key={task.id}
                  task={task}
                  members={members}
                  onUpdate={handleTaskUpdate}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Tasks Yet (but not extracting) */}
        {!isExtracting && !isSendingFollowups && tasks.length === 0 && (
          <div style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              No tasks extracted from this meeting.
            </p>
          </div>
        )}

        {/* Approve Bar - Improved Design */}
        {isAdmin && !isExtracting && !isSendingFollowups && tasks.length > 0 && meeting.status !== 'approved' && meeting.status !== 'completed' && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: window.innerWidth >= 768 ? 240 : 0, // Account for sidebar on desktop
            right: 0,
            padding: '16px clamp(20px, 5vw, 48px)',
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-default)',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            zIndex: 50,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--success-subtle)',
                display: window.innerWidth < 640 ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={18} color="var(--success)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: window.innerWidth < 640 ? 12 : 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: window.innerWidth < 640 ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tasks.length} tasks ready
                </div>
              </div>
            </div>
            
            {/* Enhanced Approve Button */}
            {!hasWorkflowStarted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Waiting for workflow...
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: window.innerWidth < 640 ? '8px 16px' : '10px 20px',
                  background: isApproving ? 'var(--bg-elevated)' : 'var(--success)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: isApproving ? 'var(--text-muted)' : '#ffffff',
                  fontSize: window.innerWidth < 640 ? 13 : 14,
                  fontWeight: 500,
                  cursor: isApproving ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isApproving) {
                    e.currentTarget.style.background = 'var(--success-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isApproving) {
                    e.currentTarget.style.background = 'var(--success)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isApproving ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{window.innerWidth < 640 ? 'Approving...' : 'Approving...'}</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{window.innerWidth < 640 ? 'Approve' : 'Approve & Notify Team'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// Task Edit Card Component
function TaskEditCard({ task, members, onUpdate, index }) {
  const [title, setTitle] = useState(task.title);
  const [owner, setOwner] = useState(task.owner);
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [priority, setPriority] = useState(task.priority || 'medium');

  const handleBlur = (field, value) => {
    if (value !== task[field]) {
      onUpdate(task.id, field, value);
    }
  };

  const priorityColors = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--success)',
  };

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        animation: `fadeInUp 0.3s var(--ease-out) ${index * 50}ms both`,
      }}
    >
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => handleBlur('title', title)}
        style={{
          width: '100%',
          padding: '8px 0',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary)',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid transparent',
          outline: 'none',
          marginBottom: 12,
        }}
        onFocus={(e) => e.target.style.borderBottomColor = 'var(--border-accent)'}
        onBlur={(e) => {
          e.target.style.borderBottomColor = 'transparent';
          handleBlur('title', title);
        }}
      />

      {/* Owner, Deadline, Priority */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: window.innerWidth < 640 ? 'column' : 'row' }}>
        {/* Owner Select */}
        <div style={{ flex: window.innerWidth < 640 ? '1 1 100%' : '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>
            Owner
          </label>
          <select
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              handleBlur('owner', e.target.value);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 13,
              color: 'var(--text-primary)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.email}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline */}
        <div style={{ flex: window.innerWidth < 640 ? '1 1 100%' : '1 1 160px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>
            Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              handleBlur('deadline', e.target.value);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 13,
              color: 'var(--text-primary)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          />
        </div>

        {/* Priority */}
        <div style={{ flex: window.innerWidth < 640 ? '1 1 100%' : '0 1 140px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 4 }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              handleBlur('priority', e.target.value);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: 13,
              color: priorityColors[priority],
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Context */}
      {task.context && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {task.context}
          </p>
        </div>
      )}
    </div>
  );
}
