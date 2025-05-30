'use client'

import { useState } from 'react'
import { User, Settings, LogOut, Mail, Calendar, Shield } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { useAuth } from '@/lib/auth-context'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserProfileProps {
  user?: SupabaseUser | null
  showActions?: boolean
  variant?: 'card' | 'compact' | 'full'
}

export function UserProfile({ 
  user: propUser, 
  showActions = true, 
  variant = 'card' 
}: UserProfileProps) {
  const { user: contextUser, signOut } = useAuth()
  const user = propUser || contextUser
  const [loading, setLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {getInitials(user.email || '')}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {user.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {user.email_confirmed_at ? 'Verified' : 'Unverified'}
          </p>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={variant === 'full' ? 'w-full' : 'w-full max-w-md'}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-semibold text-blue-600">
              {getInitials(user.email || '')}
            </span>
          </div>
        </div>
        <CardTitle className="text-lg">{user.email}</CardTitle>
        <CardDescription>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant={user.email_confirmed_at ? 'default' : 'secondary'}>
              {user.email_confirmed_at ? 'Verified' : 'Unverified'}
            </Badge>
            {user.app_metadata?.provider && (
              <Badge variant="outline">
                {user.app_metadata.provider}
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      
      {variant === 'full' && (
        <CardContent className="space-y-4">
          {/* User Details */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">User ID</p>
                <p className="text-muted-foreground font-mono text-xs">{user.id}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Member Since</p>
                <p className="text-muted-foreground">
                  {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                </p>
              </div>
            </div>
            
            {user.last_sign_in_at && (
              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">Last Sign In</p>
                  <p className="text-muted-foreground">
                    {formatDate(user.last_sign_in_at)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Provider Info */}
          {user.app_metadata && Object.keys(user.app_metadata).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Authentication Details</h4>
              <div className="space-y-2 text-xs">
                {user.app_metadata.provider && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium">{user.app_metadata.provider}</span>
                  </div>
                )}
                {user.role && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium">{user.role}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
      
      {showActions && (
        <CardContent className={variant === 'full' ? 'pt-0' : ''}>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={loading}
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 