import { useState, useEffect, useRef } from 'react'
import { useCurrentUser, useRecords } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'
import { useToast } from '../context/ToastContext'

// Global flag to prevent multiple simultaneous creations across component instances
let creationInProgress = false
let globalInitialLoadComplete = false

// Reset global flags when the module is loaded (on page refresh)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalInitialLoadComplete = false
    creationInProgress = false
  })
}

export function useCurrentMember() {
  const { user, isLoading: userLoading } = useCurrentUser({ client: podClient })
  const { addToast } = useToast()
  
  // Fetch all members (no filtering needed, Lemma handles auth)
  const { records: allMembers = [], isLoading: membersLoading, refresh: refreshMembers } = useRecords({ 
    client: podClient, 
    tableName: 'members'
  })
  
  const [member, setMember] = useState(null)
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  const creationAttempted = useRef(false)
  const hasShownWelcomeToast = useRef(false)
  
  // Debug logging
  useEffect(() => {
    console.log('📊 Hook state:', {
      userEmail: user?.email,
      userLoading,
      membersLoading,
      allMembersCount: allMembers.length,
      globalInitialLoadComplete,
      creationInProgress,
      isCreatingMember
    })
  }, [user?.email, userLoading, membersLoading, allMembers.length, isCreatingMember])

  useEffect(() => {
    if (!user?.email) {
      return
    }

    // Wait for initial members load to complete before making decisions
    if (membersLoading && !globalInitialLoadComplete) {
      console.log('⏳ Waiting for members table to load...')
      return
    }

    // Mark initial load as complete GLOBALLY (only once)
    if (!membersLoading && !globalInitialLoadComplete) {
      globalInitialLoadComplete = true
      console.log('✅ Initial members load complete, found', allMembers.length, 'members')
    }
    
    // CRITICAL: Don't proceed until initial load is complete
    if (!globalInitialLoadComplete) {
      return
    }
    
    // CRITICAL FIX: Don't make decisions while table is loading (even after initial load)
    // The table can reload and temporarily show 0 members
    if (membersLoading) {
      console.log('⏳ Members table is loading, waiting before making decisions...')
      return
    }

    // Find member by email in the members table
    const foundMember = allMembers.find(m => m.email === user.email)
    
    if (foundMember) {
      setMember(foundMember)
      console.log('✅ Member found:', foundMember.email, foundMember.role)
      creationAttempted.current = false // Reset for next user
      
      // Show welcome toast for observers (only once per session)
      if (foundMember.role === 'observer' && !hasShownWelcomeToast.current) {
        hasShownWelcomeToast.current = true
        addToast('Welcome! You are currently an Observer. If you are a team member, an admin will promote you to Member.', 'info', 6000)
      }
      
      return // Exit early if member found
    }
    
    // Member not found AFTER initial load completed
    // Check all flags BEFORE deciding to create
    if (creationInProgress) {
      console.log('⏳ Another instance is creating member, waiting...')
      return
    }
    
    if (creationAttempted.current) {
      console.log('⏳ This instance already attempted creation, waiting for result...')
      return
    }
    
    if (isCreatingMember) {
      console.log('⏳ This instance is currently creating member...')
      return
    }
    
    // All checks passed - this instance will create the member
    creationAttempted.current = true
    console.log('👤 New user detected, creating member record for:', user.email)
    createNewMember(user)
  }, [user?.email, allMembers, membersLoading, isCreatingMember])

  const createNewMember = async (user) => {
    // Set flag IMMEDIATELY to block other instances
    if (creationInProgress) {
      console.log('⏳ Creation already in progress, skipping...')
      return
    }
    
    creationInProgress = true
    setIsCreatingMember(true)
    console.log('🔒 Creation lock acquired')
    
    try {
      const userName = user.name || (user.email || '').split('@')[0] || 'User'
      const userEmail = user.email
      
      // Small delay to ensure other instances see the lock
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Refresh and wait a bit for state to update
      await refreshMembers()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check one more time in current allMembers state
      const existingMember = allMembers.find(m => m.email === userEmail)
      if (existingMember) {
        console.log('✅ Member already exists (found during double-check), using it')
        setMember(existingMember)
        return
      }
      
      console.log('🆕 Confirmed: Member does not exist, proceeding with creation')
      
      // Generate member data (matching database schema)
      const memberData = {
        id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        member_uid: user.id || '',
        name: userName,
        email: userEmail,
        role: 'observer', // Default new users to 'observer' role - admin can promote later
        joined_at: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      }
      
      console.log('📝 Creating new member:', memberData)
      
      // Create member record using Lemma SDK
      const createdMember = await podClient.records.create('members', memberData)
      
      console.log('✅ Member created successfully:', createdMember)
      
      // Set the newly created member
      setMember(createdMember)
      
      // Show welcome toast for new observer
      addToast('Account created as Observer. If you are a team member, an admin will promote you to Member.', 'info', 6000)
      hasShownWelcomeToast.current = true
      
      // Refresh members list to keep it in sync
      await refreshMembers()
      
      console.log('🔓 Creation complete, releasing lock')
      
    } catch (error) {
      console.error('❌ Failed to create member record:', error)
      
      // Check if error is due to duplicate (member was created by another instance)
      if (error.message?.includes('duplicate') || error.message?.includes('already exists') || error.message?.includes('unique')) {
        console.log('⚠️ Member was created by another instance, fetching...')
        await refreshMembers()
        const existingMember = allMembers.find(m => m.email === user.email)
        if (existingMember) {
          setMember(existingMember)
          console.log('🔓 Found existing member, releasing lock')
          return
        }
      }
      
      // Fallback to temporary in-memory member if creation fails
      const fallbackMember = {
        email: user.email,
        name: user.name || (user.email || '').split('@')[0],
        role: 'member',
        member_uid: user.id || '',
      }
      setMember(fallbackMember)
      console.log('🔓 Using fallback member, releasing lock')
    } finally {
      setIsCreatingMember(false)
      creationInProgress = false
    }
  }

  const isLoading = userLoading || membersLoading || isCreatingMember
  const role = member?.role || null  // Don't default to 'member' - wait for actual data
  const name = member?.name || user?.name || (user?.email || '').split('@')[0] || 'User'
  const email = member?.email || user?.email || ''

  return {
    user,
    member,
    role,
    name,
    email,
    isAdmin: role === 'admin',
    isMember: role === 'member',
    isObserver: role === 'observer',
    isLoading,
  }
}
