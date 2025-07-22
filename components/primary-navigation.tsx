'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FlintLogo } from '@/components/flint-logo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { Settings, LogOut } from 'lucide-react'

interface PrimaryNavigationProps {
  currentPage?: 'dashboard' | 'leads' | 'account' | 'builder'
}

export function PrimaryNavigation({ currentPage }: PrimaryNavigationProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  return (
    <header className="bg-background shadow border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <FlintLogo size="sm" showText={false} className="!h-6 !w-auto" />
            <span className="mx-4 text-gray-300 select-none">|</span>
            <nav className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className={`text-sm font-medium ${
                  currentPage === 'dashboard' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/leads')}
                className={`text-sm font-medium ${
                  currentPage === 'leads' 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Leads
              </Button>
            </nav>
          </div>
          {/* Avatar dropdown */}
          <div className="relative ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <span className="text-base font-medium text-blue-600">
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
                <DropdownMenuItem onClick={signOut} className="flex items-center">
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
} 