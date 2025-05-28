'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'

interface UseAuthGuardOptions {
  /** Redirect path when user is not authenticated */
  redirectTo?: string
  /** Whether to allow access when user is not authenticated */
  requireAuth?: boolean
}

/**
 * Custom hook for protecting routes and components
 * Automatically redirects unauthenticated users if required
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { 
    redirectTo = '/auth/login', 
    requireAuth = true 
  } = options
  
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      const currentPath = window.location.pathname
      const redirectUrl = currentPath !== '/' 
        ? `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}`
        : redirectTo
      
      router.push(redirectUrl)
    }
  }, [user, loading, requireAuth, redirectTo, router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isLoading: loading,
  }
}

/**
 * Higher-order component for protecting routes
 * Wraps components to ensure they're only accessible to authenticated users
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseAuthGuardOptions = {}
) {
  const AuthGuardedComponent = (props: P) => {
    const { user, loading } = useAuthGuard(options)
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    
    if (options.requireAuth !== false && !user) {
      return null // Will be redirected by useAuthGuard
    }
    
    return <WrappedComponent {...props} />
  }
  
  AuthGuardedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return AuthGuardedComponent
} 