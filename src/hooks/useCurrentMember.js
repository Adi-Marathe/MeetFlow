import { useEffect } from 'react'
import { useCurrentUser, useRecords, useCreateRecord } from 'lemma-sdk/react'
import { podClient } from '../lib/lemma'

export function useCurrentMember() {
  const { user, isLoading: userLoading } = useCurrentUser({ client: podClient })
  const { records: members, isLoading: membersLoading } = useRecords({ 
    client: podClient, 
    tableName: 'members' 
  })
  const { createRecord } = useCreateRecord({ 
    client: podClient, 
    tableName: 'members' 
  })

  const currentMember = members?.find(
    m => m.email?.toLowerCase() === user?.email?.toLowerCase()
  )

  // Auto-create member record on first login
  useEffect(() => {
    if (!user || !members) return
    if (currentMember) return // already exists
    if (membersLoading) return

    console.log('🆕 Creating member record for:', user.email)
    
    createRecord({
      id: `member-${user.id}`,
      user_id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      role: 'member', // default role
      joined_at: new Date().toISOString().split('T')[0]
    }).then(() => {
      console.log('✅ Member record created')
    }).catch(err => {
      console.error('❌ Failed to create member record:', err)
    })
  }, [user, members, currentMember, membersLoading, createRecord])

  const isLoading = userLoading || membersLoading

  return {
    user,
    member: currentMember,
    role: currentMember?.role || 'member',
    name: currentMember?.name || user?.name || user?.email,
    email: currentMember?.email || user?.email,
    isAdmin: currentMember?.role === 'admin',
    isMember: currentMember?.role === 'member' || !currentMember?.role,
    isObserver: currentMember?.role === 'observer',
    isLoading,
  }
}
