'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from './auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const initialized = useRef(false)
  const lastUserId = useRef<string | null>(null)
  const isTabActive = useRef(true)

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } else {
        setUser(user)
      }
    } catch (error) {
      console.error('Error in refreshUser:', error)
      setUser(null)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      setUser(null)
      lastUserId.current = null
    } catch (error) {
      console.error('Error in signOut:', error)
    }
  }

  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized.current) return

    // Track tab visibility to prevent unnecessary operations
    const handleVisibilityChange = () => {
      isTabActive.current = !document.hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Get initial session
    const initializeAuth = async () => {
      await refreshUser()
      setLoading(false)
      initialized.current = true
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip if not initialized yet
        if (!initialized.current) return
        
        // Skip if tab is not active and this is just a token refresh
        if (!isTabActive.current && event === 'TOKEN_REFRESHED') {
          return
        }
        
        // Skip if this is just a tab refocus without actual auth change
        const newUserId = session?.user?.id || null
        if (newUserId === lastUserId.current && event === 'TOKEN_REFRESHED') {
          return
        }
        
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Only update state if there's an actual change
        if (newUserId !== lastUserId.current) {
          if (session?.user) {
            setUser(session.user)
          } else {
            setUser(null)
          }
          lastUserId.current = newUserId
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase.auth])

  const value = {
    user,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 