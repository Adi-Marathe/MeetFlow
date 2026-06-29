import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Development-only auth context (bypasses Lemma)
export function DevAuthProvider({ children }) {
  const [devUser, setDevUser] = useState(null)

  useEffect(() => {
    // Check localStorage for dev user
    const stored = localStorage.getItem('dev_user')
    if (stored) {
      setDevUser(JSON.parse(stored))
    }
  }, [])

  const loginAsDev = (role = 'admin') => {
    const user = {
      email: `${role}@meetflow.dev`,
      name: role === 'admin' ? 'Aditya Marathe' : role === 'member' ? 'Shruti A' : 'Observer User',
      role,
      id: `dev-${role}`,
    }
    setDevUser(user)
    localStorage.setItem('dev_user', JSON.stringify(user))
  }

  const logout = () => {
    setDevUser(null)
    localStorage.removeItem('dev_user')
  }

  const value = {
    podMember: devUser ? { email: devUser.email, name: devUser.name, id: devUser.id } : null,
    currentMember: devUser,
    role: devUser?.role ?? 'member',
    email: devUser?.email ?? '',
    name: devUser?.name ?? '',
    isLoading: false,
    isAuthenticated: !!devUser,
    loginAsDev,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within DevAuthProvider')
  }
  return context
}
