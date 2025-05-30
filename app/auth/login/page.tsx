'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, LogIn, UserPlus, Mail } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
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
      
      if (mode === 'login') {
        result = await signIn(email, password)
        if (result.success) {
          // Redirect to intended destination
          setMessage('Login successful! Redirecting...')
          setTimeout(() => {
            router.push(redirectTo)
          }, 1000)
        }
      } else if (mode === 'signup') {
        result = await signUp(email, password)
      } else if (mode === 'reset') {
        result = await resetPassword(email)
      }

      if (result?.success) {
        if (mode !== 'login') {
          setMessage(result.message || 'Success!')
          // Clear form for signup/reset
          setEmail('')
          setPassword('')
        }
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
            {mode === 'login' ? (
              <LogIn className="h-6 w-6 text-blue-600" />
            ) : mode === 'signup' ? (
              <UserPlus className="h-6 w-6 text-blue-600" />
            ) : (
              <Mail className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? redirectedFrom 
                ? `Please sign in to access ${redirectedFrom}` 
                : 'Sign in to your account to continue'
              : mode === 'signup'
              ? 'Enter your details to create a new account'
              : 'Enter your email to receive a password reset link'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirectedFrom && mode === 'login' && (
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

            {mode !== 'reset' && (
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
                    minLength={mode === 'signup' ? 6 : undefined}
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
            )}

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
              {loading 
                ? 'Processing...' 
                : mode === 'login' 
                ? 'Sign in' 
                : mode === 'signup'
                ? 'Create account'
                : 'Send reset link'
              }
            </Button>

            {mode === 'login' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={loading}
                  >
                    GitHub
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === 'login' ? (
              <>
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="mt-2">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </p>
              </>
            ) : mode === 'signup' ? (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
