'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FlintLogo } from '@/components/flint-logo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { Settings, LogOut, LifeBuoy, Mail, BookOpen, Eye } from 'lucide-react'

interface PrimaryNavigationProps {
  currentPage?: 'dashboard' | 'tools' | 'leads' | 'account' | 'builder' | 'assets'
  onShowOnboarding?: () => void
}

export function PrimaryNavigation({ currentPage, onShowOnboarding }: PrimaryNavigationProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect to sign in page after logout
      router.push('/auth/login')
    } catch (error) {
      console.error('Error during sign out:', error)
      // Still redirect even if there's an error
      router.push('/auth/login')
    }
  }

  return (
    <header className="bg-background shadow border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-4">
          {/* Left - Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              <FlintLogo size="sm" showText={false} className="!h-6 !w-auto" />
            </Link>
          </div>
          
          {/* Center - Navigation */}
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onMouseEnter={() => router.prefetch('/dashboard')}
                onClick={() => router.push('/dashboard')}
                className={`text-sm font-medium ${
                  currentPage === 'dashboard' || currentPage === 'tools'
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tools
              </Button>
              <Button
                variant="ghost"
                onMouseEnter={() => router.prefetch('/dashboard/leads')}
                onClick={() => router.push('/dashboard/leads')}
                className={`text-sm font-medium ${
                  currentPage === 'leads' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Leads
              </Button>
              {user?.email?.endsWith('@useflint.co') && (
                <Button
                  variant="ghost"
                  onMouseEnter={() => router.prefetch('/dashboard/assets')}
                  onClick={() => router.push('/dashboard/assets')}
                  className={`text-sm font-medium ${
                    currentPage === 'assets' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Assets
                </Button>
              )}
            </nav>
          </div>
          
          {/* Right - Actions */}
          
          <div className="flex items-center space-x-2">
            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help">
                  <LifeBuoy className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href="mailto:angus@useflint.co" className="flex items-center" target="_blank" rel="noopener noreferrer">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://speckled-drink-e93.notion.site/Flint-Help-Docs-2348a84750b080789e22efbb20b3da6a?source=copy_link" className="flex items-center" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Help Docs
                  </a>
                </DropdownMenuItem>
                {onShowOnboarding && (
                  <DropdownMenuItem onClick={onShowOnboarding} className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Show Onboarding Guide
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar dropdown */}
            <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400" style={{ backgroundColor: '#fbd6c3' }}>
                  <span className="text-base font-medium" style={{ color: '#f76706' }}>
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className={`flex items-center ${
                    currentPage === 'account' ? 'text-primary font-medium' : ''
                  }`}>
                    <Settings className="h-4 w-4 mr-2" /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 