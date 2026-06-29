import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Custom localStorage-based auth (bypassing Lemma auth service)
  const [devUser, setDevUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for user
    const stored = localStorage.getItem('meetflow_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        setDevUser(user)
        console.log('✅ User loaded from localStorage:', user.email)
      } catch (err) {
        console.error('Failed to parse stored user:', err)
        localStorage.removeItem('meetflow_user')
      }
    }
    setIsLoading(false)
  }, [])

  const currentMember = devUser
  const role = devUser?.role || 'member'

  const loginAsDev = (roleParam = 'admin') => {
    const user = {
      email: roleParam === 'admin' ? 'adimarathe234@gmail.com' : 
             roleParam === 'member' ? 'ahershruti1911@gmail.com' : 
             'observer@meetflow.dev',
      name: roleParam === 'admin' ? 'Aditya Marathe' : 
            roleParam === 'member' ? 'Shruti A' : 
            'Observer User',
      role: roleParam,
      id: `user-${roleParam}`,
    }
    setDevUser(user)
    localStorage.setItem('meetflow_user', JSON.stringify(user))
    localStorage.setItem('meetflow_role', roleParam)
    localStorage.setItem('meetflow_email', user.email)
    localStorage.setItem('meetflow_name', user.name)
    console.log('✅ Logged in as:', user.name, `(${roleParam})`)
  }

  const logout = () => {
    setDevUser(null)
    localStorage.removeItem('meetflow_user')
    localStorage.removeItem('meetflow_role')
    localStorage.removeItem('meetflow_email')
    localStorage.removeItem('meetflow_name')
    console.log('👋 Logged out')
  }

  const value = {
    // Current user
    currentUser: currentMember,
    currentMember,
    podMember: devUser,
    
    // Role
    role,
    
    // Quick access
    email: devUser?.email || '',
    name: devUser?.name || '',
    
    // Loading & auth state
    isLoading,
    isAuthenticated: !!devUser,
    
    // Auth methods
    loginAsDev,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
