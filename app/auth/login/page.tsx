'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, LogIn, UserPlus, Mail } from 'lucide-react'

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // Get redirect destination from query params
  const redirectedFrom = searchParams.get('redirectedFrom')
  const redirectTo = redirectedFrom || '/dashboard'

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo)
    }
  }, [user, authLoading, router, redirectTo])

  // Don't render login form if user is already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to intended destination
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      let result
      
      result = await signIn(email, password)
      if (result.success) {
        // Redirect to intended destination
        setMessage('Login successful! Redirecting...')
        setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      }

      if (result?.success) {
        setMessage(result.message || 'Success!')
        // Clear form for signup/reset
        setEmail('')
        setPassword('')
      } else {
        setError(result?.error || 'An error occurred')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const result = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithGitHub()
      
      if (result.success) {
        setMessage(result.message || 'Redirecting...')
      } else {
        setError(result.error || 'Failed to initiate OAuth login')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            {redirectedFrom 
              ? `Please sign in to access ${redirectedFrom}` 
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirectedFrom && (
            <div className="mb-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3">
              <strong>Access Required:</strong> Please sign in to continue to {redirectedFrom}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                {message}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <a
              href="https://launch.useflint.co/"
              className="text-sm text-muted-foreground hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              ← Back to homepage
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
