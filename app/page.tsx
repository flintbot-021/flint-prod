'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'

function PasswordResetHandler({ onPasswordResetDetected }: { onPasswordResetDetected: (isReset: boolean) => void }) {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Debug logging
      console.log('Root page - URL params:', {
        type: searchParams.get('type'),
        code: searchParams.get('code'),
        token: searchParams.get('token'),
        allParams: Array.from(searchParams.entries())
      })
      console.log('Root page - Auth state:', { user: user?.email, loading })
      console.log('Root page - Session:', session)

      if (session) {
        // Check if this is a password reset session
        // Password reset sessions are usually temporary and may have specific properties
        const isRecovery = searchParams.get('type') === 'recovery' || 
                          !!searchParams.get('token') || 
                          !!searchParams.get('code')
        
        onPasswordResetDetected(isRecovery)
        console.log('Password reset detection:', { isRecovery, sessionUser: session.user.email })
      } else {
        onPasswordResetDetected(false)
      }
    }

    if (!loading && user) {
      checkPasswordResetSession()
    } else if (!loading) {
      onPasswordResetDetected(false)
    }
  }, [user, loading, searchParams, onPasswordResetDetected])

  return null
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  const handlePasswordResetDetected = (isReset: boolean) => {
    setIsPasswordReset(isReset)
    setSessionChecked(true)
  }

  useEffect(() => {
    if (!loading && sessionChecked) {
      if (user) {
        if (isPasswordReset) {
          console.log('Password reset detected, redirecting to update password page')
          router.push('/auth/update-password')
        } else {
          console.log('Normal authenticated user, redirecting to dashboard')
          router.push('/dashboard')
        }
      } else {
        console.log('User not authenticated, redirecting to login')
        router.push('/auth/login')
      }
    }
  }, [user, loading, sessionChecked, isPasswordReset, router])

  // Show loading spinner while determining auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={null}>
        <PasswordResetHandler onPasswordResetDetected={handlePasswordResetDetected} />
      </Suspense>
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
