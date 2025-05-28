'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { User, LogOut, Settings, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Flint Lead Magnet
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Compact User Profile in Header */}
              <UserProfile variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* User Profile Card */}
            <div className="lg:col-span-1">
              <UserProfile variant="full" />
            </div>

            {/* Feature Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Campaigns</CardTitle>
                  </div>
                  <CardDescription>
                    Create and manage your lead magnet campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">Leads</CardTitle>
                  </div>
                  <CardDescription>
                    View and manage captured leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your account and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              {/* Welcome Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Welcome!</CardTitle>
                  </div>
                  <CardDescription>
                    You have successfully authenticated with Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Status:</strong> {user?.email_confirmed_at ? 'Verified' : 'Unverified'}</p>
                    <p><strong>Provider:</strong> {user?.app_metadata?.provider || 'email'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Test Authentication Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">🔐 Authentication Implementation Complete</CardTitle>
              <CardDescription>
                Full authentication system with PKCE flows, state management, and route protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ PKCE Authentication</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Email/password authentication</li>
                    <li>• OAuth providers (Google, GitHub)</li>
                    <li>• Password reset flows</li>
                    <li>• Email confirmation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">🔄 State Management</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• React Context API</li>
                    <li>• Real-time auth state updates</li>
                    <li>• Persistent sessions</li>
                    <li>• Loading states</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">🛡️ Route Protection</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Next.js middleware</li>
                    <li>• Automatic redirects</li>
                    <li>• Protected route patterns</li>
                    <li>• Auth guard hooks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 