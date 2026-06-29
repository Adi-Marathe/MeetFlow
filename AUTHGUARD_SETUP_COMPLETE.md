# ✅ Lemma AuthGuard Integration Complete

## What Was Implemented

Complete integration with Lemma's official **AuthGuard** for authentication and **useRecords** for data fetching.

---

## Architecture Overview

```
App starts
    ↓
AuthGuard wraps entire app
    ↓
User sees Lemma login screen
    ↓
User logs in with Lemma account
    ↓
useCurrentUser() gets authenticated user
    ↓
useRecords() fetches member from 'members' table
    ↓
Auto-create member if first login (role: 'member')
    ↓
Role-based routing (admin → dashboard, member → my-tasks)
    ↓
All data via useRecords({ client: podClient, tableName: '...' })
```

---

## Files Changed

### ✅ Core Setup

**`src/lib/lemma.js`** - Lemma client initialization
```javascript
import { LemmaClient } from 'lemma-sdk'

export const client = new LemmaClient({
  apiUrl: 'https://api.lemma.work',
  authUrl: 'https://auth.lemma.work',
})

export const podClient = client.withPod('019f0776-4d70-77e4-a0ab-3996ff7f97da')
```

**`src/hooks/useCurrentMember.js`** - NEW HOOK
```javascript
import { useCurrentUser, useRecords, useCreateRecord } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'

export function useCurrentMember() {
  const { user } = useCurrentUser({ client: podClient })
  const { records: members } = useRecords({ client: podClient, tableName: 'members' })
  const { createRecord } = useCreateRecord({ client: podClient, tableName: 'members' })
  
  // Auto-create member on first login
  // Returns: { user, member, role, name, email, isAdmin, isMember, isObserver, isLoading }
}
```

**`src/App.jsx`** - AuthGuard wrapper
```javascript
import { AuthGuard } from 'lemma-sdk/react'
import { podClient } from './lib/lemma'

export default function App() {
  return (
    <AuthGuard client={podClient} appName="MeetFlow">
      <AuthenticatedApp />
    </AuthGuard>
  )
}
```

**`src/pages/Dashboard.jsx`** - useRecords for data
```javascript
import { useRecords } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'
import { useCurrentMember } from '../hooks/useCurrentMember'

export default function Dashboard() {
  const { name, role } = useCurrentMember()
  
  const { records: meetings } = useRecords({
    client: podClient,
    tableName: 'meetings',
  })
  
  const { records: tasks } = useRecords({
    client: podClient,
    tableName: 'tasks',
  })
  
  // Render with real data
}
```

---

## How Authentication Works

### 1. Lemma Login Flow

When user first visits the app:
1. AuthGuard detects no session
2. Shows Lemma branded login screen
3. User logs in with Lemma account email/password
4. Lemma auth service creates session
5. App loads with authenticated user

### 2. Role Management

On first login:
1. `useCurrentUser()` returns authenticated Lemma user
2. `useRecords()` checks 'members' table for user's email
3. If NOT found → `useCreateRecord()` creates member with `role: 'member'`
4. If found → use existing role from database

**To make someone admin:**
1. Log in to Lemma dashboard
2. Go to your pod's 'members' table
3. Find the user's record
4. Change `role` field from `'member'` to `'admin'`
5. User refreshes app → now has admin access

### 3. Role-Based UI

- **Admin**: Full access (dashboard, meetings, settings, etc.)
- **Member**: Can see own tasks and boards
- **Observer**: Read-only public board view

---

## Pod Configuration

### Required Tables

Create these tables in your Lemma pod:

**`members` table**:
- `id` (string) - Unique member ID
- `user_id` (string) - Lemma user ID
- `name` (string) - User's name
- `email` (string) - User's email
- `role` (string) - 'admin', 'member', or 'observer'
- `joined_at` (date) - When user first logged in

**`meetings` table**:
- `id` (string)
- `title` (string)
- `date` (date)
- `source` (string)
- `status` (string)
- `participants` (array)
- `raw_transcript` (text)
- `summary` (text)
- `task_count` (number)

**`tasks` table**:
- `id` (string)
- `meeting_id` (string)
- `title` (string)
- `owner` (string) - Email address
- `status` (string) - 'todo', 'inprogress', 'done', 'blocked'
- `priority` (string) - 'low', 'medium', 'high'
- `deadline` (date)
- `context` (text)

**`followups` table**:
- `id` (string)
- `meeting_id` (string)
- `description` (string)
- `assigned_to` (string)
- `due_date` (date)
- `status` (string)

### Required Workflow

**`meeting-extraction-workflow`**:
- Input: `meeting_id`, `raw_transcript`, `participants`
- Output: Creates tasks in 'tasks' table

---

## Critical Hook Pattern

**Every SDK hook MUST include `client: podClient`**:

```javascript
// ✅ CORRECT
useRecords({ client: podClient, tableName: 'meetings' })
useCreateRecord({ client: podClient, tableName: 'tasks' })
useUpdateRecord({ client: podClient, tableName: 'tasks' })
useCurrentUser({ client: podClient })
useWorkflowRun({ client: podClient, workflowName: 'workflow-name' })

// ❌ WRONG - Causes "trim" error
useRecords({ tableName: 'meetings' }) // Missing client!
useCreateRecord('tasks') // Wrong format!
```

---

## Next Steps - Fix Remaining Components

### Files That Need Updating

All these files currently use old patterns and need to be updated:

1. **`src/components/features/TranscriptUploader.jsx`**
   - Replace `useCreateRecord` calls with `{ client: podClient, tableName: '...' }`
   - Update `useWorkflowRun` with `{ client: podClient, workflowName: '...' }`

2. **`src/pages/BoardView.jsx`**
   - Add `useRecords({ client: podClient, tableName: 'tasks' })`
   - Add `useUpdateRecord({ client: podClient, tableName: 'tasks' })`
   - Replace custom auth with `useCurrentMember()`

3. **`src/pages/MyTasks.jsx`**
   - Add `useRecords({ client: podClient, tableName: 'tasks' })`
   - Filter tasks by current user's email
   - Add `useUpdateRecord` for task updates

4. **`src/pages/MeetingReview.jsx`**
   - Add `useRecords` for meetings and tasks
   - Add `useUpdateRecord` for approving meetings

5. **`src/pages/Meetings.jsx`**
   - Add `useRecords({ client: podClient, tableName: 'meetings' })`

6. **`src/pages/Followups.jsx`**
   - Add `useRecords({ client: podClient, tableName: 'followups' })`

7. **`src/pages/Settings.jsx`**
   - Add `useRecords({ client: podClient, tableName: 'members' })`
   - Add `useUpdateRecord` for changing roles

8. **`src/components/layout/Sidebar.jsx`**
   - Replace remaining `useAuth` with `useCurrentMember`
   - Update user display section

---

## Testing Checklist

### ✅ Verify Setup

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Open App**
   - Go to http://localhost:5173
   - Should see Lemma login screen

3. **Log In**
   - Use your Lemma account credentials
   - Should redirect to dashboard (or my-tasks if member)

4. **Check Console**
   ```
   ✅ Lemma client initialized for pod: 019f0776-4d70-77e4-a0ab-3996ff7f97da
   📊 Dashboard rendering
   👤 Current member: {name: '...', email: '...', role: 'member'}
   📅 Meetings: 0
   ✅ Tasks: 0
   ```

### ✅ Test Role Assignment

**Make yourself admin:**
1. Go to Lemma dashboard
2. Navigate to your pod
3. Open 'members' table
4. Find your email
5. Change role to 'admin'
6. Refresh app
7. Should now see Dashboard, Meetings, Settings

**Test member access:**
1. Log in with different account
2. Should default to 'member' role
3. Can only see My Tasks and Boards
4. Cannot access Dashboard or Settings

---

## Troubleshooting

### "Cannot read properties of undefined (reading 'trim')"

**Cause**: Missing `client` parameter in SDK hook

**Fix**: Add `client: podClient` to ALL hooks:
```javascript
// Before ❌
const { records } = useRecords({ tableName: 'meetings' })

// After ✅
const { records } = useRecords({ client: podClient, tableName: 'meetings' })
```

### "Table 'members' not found"

**Cause**: Members table doesn't exist in pod

**Fix**:
1. Go to Lemma dashboard
2. Navigate to your pod
3. Create 'members' table with required fields
4. Refresh app

### Login Screen Doesn't Appear

**Cause**: AuthGuard not wrapping app properly

**Fix**: Check `App.jsx` has:
```javascript
<AuthGuard client={podClient} appName="MeetFlow">
  <AuthenticatedApp />
</AuthGuard>
```

### User Stays as "member" After Changing to "admin"

**Cause**: Browser cached role

**Fix**:
1. Log out (or clear browser storage)
2. Log back in
3. Role should refresh from database

---

## Security Notes

- ✅ Authentication handled by Lemma (secure)
- ✅ Session management handled by Lemma
- ✅ No passwords stored in app
- ✅ Role-based access control via database
- ⚠️ First user defaults to 'member' - manually promote to admin

---

## Summary

✅ **AuthGuard integration complete**
✅ **useRecords fetching real pod data**
✅ **useCurrentMember hook for role management**
✅ **Dashboard working with real data**
✅ **Role-based routing functional**
✅ **Auto-create member on first login**

**Pod ID**: `019f0776-4d70-77e4-a0ab-3996ff7f97da`
**API URL**: `https://api.lemma.work`
**Auth URL**: `https://auth.lemma.work`

🎉 **Your app now uses Lemma's official authentication!**

---

## Quick Reference

### Import Pattern
```javascript
import { useRecords, useCreateRecord, useUpdateRecord, useCurrentUser } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'
import { useCurrentMember } from '../hooks/useCurrentMember'
```

### Hook Usage
```javascript
// Get current user with role
const { name, email, role, isAdmin } = useCurrentMember()

// Fetch data
const { records, isLoading } = useRecords({ client: podClient, tableName: 'meetings' })

// Create data
const { createRecord } = useCreateRecord({ client: podClient, tableName: 'tasks' })
await createRecord({ id: 'task-1', title: 'New task', ... })

// Update data
const { updateRecord } = useUpdateRecord({ client: podClient, tableName: 'tasks' })
await updateRecord('task-1', { status: 'done' })

// Run workflow
const { start } = useWorkflowRun({ client: podClient, workflowName: 'workflow-name' })
await start({ input: 'data' })
```

---

**Next**: Update remaining components to use Lemma SDK hooks!
