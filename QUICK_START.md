# MeetFlow - Quick Start with Lemma AuthGuard

## ✅ What's Working Now

- **Lemma AuthGuard** for authentication
- **Dashboard** with real pod data
- **useCurrentMember** hook for role management
- **Auto-create** member on first login
- **Role-based routing** (admin/member/observer)

---

## 🚀 How to Run

```bash
npm run dev
```

Open http://localhost:5173 → See Lemma login screen → Log in → Dashboard loads!

---

## 👤 User Roles

### First Login
- User logs in with Lemma account
- App checks `members` table for their email
- If NOT found → creates record with `role: 'member'`
- If found → uses existing role

### Make Someone Admin
1. Go to Lemma dashboard
2. Open your pod's `members` table
3. Find user by email
4. Change `role` from `'member'` to `'admin'`
5. User refreshes app → now admin!

---

## 📊 Pod Setup

**Pod ID**: `019f0776-4d70-77e4-a0ab-3996ff7f97da`

### Create These Tables:

1. **members** - User roles
   - id, user_id, name, email, role, joined_at

2. **meetings** - Meeting records
   - id, title, date, source, status, participants, raw_transcript, summary

3. **tasks** - Task items
   - id, meeting_id, title, owner, status, priority, deadline, context

4. **followups** - Follow-up items
   - id, meeting_id, description, assigned_to, due_date, status

### Create Workflow:

**meeting-extraction-workflow**
- Input: meeting_id, raw_transcript, participants
- Output: Creates tasks in `tasks` table

---

## 🔧 Hook Pattern (CRITICAL!)

**Every Lemma SDK hook needs `client: podClient`:**

```javascript
import { useRecords } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'

// ✅ CORRECT
useRecords({ client: podClient, tableName: 'meetings' })

// ❌ WRONG - causes "trim" error
useRecords({ tableName: 'meetings' }) // Missing client!
```

---

## 📝 Components Status

### ✅ Complete
- `src/lib/lemma.js` - Client setup
- `src/hooks/useCurrentMember.js` - Role management
- `src/App.jsx` - AuthGuard wrapper
- `src/pages/Dashboard.jsx` - Real data with useRecords

### ⏳ TODO - Need to Add `client: podClient`
- `src/components/features/TranscriptUploader.jsx`
- `src/pages/BoardView.jsx`
- `src/pages/MyTasks.jsx`
- `src/pages/MeetingReview.jsx`
- `src/pages/Meetings.jsx`
- `src/pages/Followups.jsx`
- `src/pages/Settings.jsx`
- `src/components/layout/Sidebar.jsx` (partial)

---

## 🐛 Common Errors

### "Cannot read properties of undefined (reading 'trim')"
**Fix**: Add `client: podClient` to hook call

### "Table not found"
**Fix**: Create table in Lemma dashboard

### "Still showing as member after changing to admin"
**Fix**: Log out and log back in to refresh role

---

## 📚 Full Documentation

- **AUTHGUARD_SETUP_COMPLETE.md** - Complete setup guide
- **Lemma SDK Docs** - https://lemma.app/docs

---

## 🎯 Next Steps

1. **Test Login** - Log in with your Lemma account
2. **Create Tables** - Set up required tables in pod
3. **Make Yourself Admin** - Update role in `members` table
4. **Update Components** - Add `client: podClient` to remaining files
5. **Test Workflows** - Upload meeting transcript to test extraction

---

**Pod**: `019f0776-4d70-77e4-a0ab-3996ff7f97da`
**API**: `https://api.lemma.work`
**Auth**: `https://auth.lemma.work`

🎉 **Ready to go!**
