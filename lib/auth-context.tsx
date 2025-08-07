'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from './auth'
import type { User } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'

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
  const posthog = usePostHog()
  const lastAuthCheck = useRef<number>(0)
  const authCacheTimeout = 5000 // Cache auth state for 5 seconds

  const refreshUser = async (forceRefresh = false) => {
    try {
      // Use cached result if recent and not forcing refresh
      const now = Date.now()
      if (!forceRefresh && (now - lastAuthCheck.current) < authCacheTimeout && user) {
        return
      }

      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser()
      lastAuthCheck.current = now
      
      if (error) {
        // Only log error if it's not AuthSessionMissingError
        if (error.name !== 'AuthSessionMissingError') {
          console.error('Error fetching user:', error)
        }
        setUser(null)
      } else {
        setUser(fetchedUser)
        // Identify user in PostHog when user is set
        if (fetchedUser && posthog) {
          posthog.identify(fetchedUser.id, {
            email: fetchedUser.email,
            created_at: fetchedUser.created_at,
            last_sign_in_at: fetchedUser.last_sign_in_at,
            app_metadata: fetchedUser.app_metadata,
            user_metadata: fetchedUser.user_metadata
          })
        }
      }
    } catch (error: any) {
      // Only log error if it's not AuthSessionMissingError
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Error in refreshUser:', error)
      }
      setUser(null)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      // Reset PostHog user when signing out
      if (posthog) {
        posthog.reset()
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
        
        // Update auth cache timestamp when we get fresh data
        lastAuthCheck.current = Date.now()
        
        // Only update state if there's an actual change
        if (newUserId !== lastUserId.current) {
        if (session?.user) {
          setUser(session.user)
          // Identify user in PostHog when user is set
          if (session.user && posthog) {
            posthog.identify(session.user.id, {
              email: session.user.email,
              created_at: session.user.created_at,
              last_sign_in_at: session.user.last_sign_in_at,
              app_metadata: session.user.app_metadata,
              user_metadata: session.user.user_metadata
            })
          }
        } else {
          setUser(null)
          // Reset PostHog user when signing out
          if (posthog) {
            posthog.reset()
          }
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