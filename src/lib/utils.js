

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function isOverdue(deadlineStr) {
  if (!deadlineStr) return false;
  return new Date(deadlineStr) < new Date();
}

export function isDueToday(deadlineStr) {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  const today = new Date();
  return deadline.toDateString() === today.toDateString();
}

export function isDueThisWeek(deadlineStr) {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  return deadline >= today && deadline <= endOfWeek;
}

export function getDeadlineColor(deadlineStr, status) {
  if (status === 'done') return 'var(--text-muted)';
  if (isOverdue(deadlineStr)) return 'var(--danger)';
  if (isDueToday(deadlineStr)) return 'var(--warning)';
  return 'var(--text-muted)';
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'var(--priority-high)';
    case 'medium': return 'var(--priority-medium)';
    case 'low': return 'var(--priority-low)';
    default: return 'var(--text-muted)';
  }
}

export function getStatusColor(status) {
  switch (status) {
    case 'todo': return 'var(--status-todo)';
    case 'inprogress': return 'var(--status-inprogress)';
    case 'done': return 'var(--status-done)';
    case 'blocked': return 'var(--status-blocked)';
    default: return 'var(--text-muted)';
  }
}

export function getStatusBg(status) {
  switch (status) {
    case 'todo': return 'var(--status-todo-bg)';
    case 'inprogress': return 'var(--status-inprogress-bg)';
    case 'done': return 'var(--status-done-bg)';
    case 'blocked': return 'var(--status-blocked-bg)';
    default: return 'var(--bg-elevated)';
  }
}

export function getSourceColor(source) {
  switch (source) {
    case 'google_meet': return '#F4622A';
    case 'zoom': return '#2d8cff';
    case 'slack_huddle': return '#2a8a5e';
    case 'teams': return '#7b5ea7';
    default: return '#8a8478';
  }
}

export function getSourceLabel(source) {
  switch (source) {
    case 'google_meet': return 'Google Meet';
    case 'zoom': return 'Zoom';
    case 'slack_huddle': return 'Slack Huddle';
    case 'teams': return 'Teams';
    default: return source;
  }
}

export function cycleStatus(current) {
  const cycle = ['todo', 'inprogress', 'done'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
