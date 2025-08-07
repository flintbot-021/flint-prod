'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show fallback while loading or if no user
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If no user after loading, show nothing (redirect will happen)
  if (!user) {
    return fallback
  }

  // User is authenticated, show the protected content
  return <>{children}</>
}
