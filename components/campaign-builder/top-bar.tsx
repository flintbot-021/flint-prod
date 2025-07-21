'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Eye, 
  Globe, 
  Edit3,
  Check,
  X,
  Loader2,
  Rocket,
  Settings,
  LifeBuoy,
  ChevronDown,
  Copy,
  PauseCircle,
  Home,
  Mail,
  BookOpen
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { CampaignEditModal } from './campaign-edit-modal'
import { Campaign } from '@/lib/types/database'

interface CampaignBuilderTopBarProps {
  campaignName: string
  campaignStatus: 'draft' | 'published' | 'archived'
  campaignId?: string
  campaignUserKey?: string
  campaignPublishedUrl?: string
  campaign?: Campaign
  isPublished?: boolean
  isSaving?: boolean
  canPublish?: boolean
  canPreview?: boolean
  validationErrors?: string[]
  onCampaignNameChange?: (name: string) => void
  onCampaignUpdate?: (updatedCampaign: Campaign) => void
  onPreview?: () => void
  onPublish?: () => void
  onPause?: () => void
  onShowOnboarding?: () => void;
  className?: string
}

export function CampaignBuilderTopBar({
  campaignName,
  campaignStatus,
  campaignId,
  campaignUserKey,
  campaignPublishedUrl,
  campaign,
  isPublished = false,
  isSaving = false,
  canPublish = true,
  canPreview = true,
  validationErrors = [],
  onCampaignNameChange,
  onCampaignUpdate,
  onPreview,
  onPublish,
  onPause,
  onShowOnboarding,
  className
}: CampaignBuilderTopBarProps) {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(campaignName)
  const [isSticky, setIsSticky] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const topBarRef = useRef<HTMLDivElement>(null)

  // Update editedName when campaignName prop changes
  useEffect(() => {
    setEditedName(campaignName)
  }, [campaignName])

  // Handle sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      if (topBarRef.current) {
        const rect = topBarRef.current.getBoundingClientRect()
        setIsSticky(rect.top <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  const handleNameEdit = () => {
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== campaignName) {
      onCampaignNameChange?.(editedName.trim())
    }
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setEditedName(campaignName)
    setIsEditingName(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  const handleBackToCampaigns = () => {
    router.push('/dashboard')
  }

  const handleEditCampaign = () => {
    console.log('Theme button clicked - opening edit modal')
    if (campaign) {
      setShowEditModal(true)
    }
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
  }

  const handleEditModalSave = (updatedCampaign: Campaign) => {
    onCampaignUpdate?.(updatedCampaign)
    setShowEditModal(false)
  }

  const handleViewLive = () => {
    if (campaignUserKey && campaignPublishedUrl) {
      const liveUrl = `${window.location.origin}/c/${campaignUserKey}/${campaignPublishedUrl}`
      window.open(liveUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const copyLiveLink = async () => {
    if (campaignUserKey && campaignPublishedUrl) {
      const liveUrl = `${window.location.origin}/c/${campaignUserKey}/${campaignPublishedUrl}`
      try {
        await navigator.clipboard.writeText(liveUrl)
        toast({
          title: 'Link copied!',
          description: 'The live tool link has been copied to your clipboard',
          duration: 3000
        })
      } catch (error) {
        console.error('Error copying link:', error)
        toast({
          title: 'Copy failed',
          description: 'Unable to copy link to clipboard',
          variant: 'destructive'
        })
      }
    }
  }

  return (
    <div
      ref={topBarRef}
      className={cn(
        'bg-background border-b sticky top-0 z-50 transition-all duration-200',
        isSticky && 'shadow-md',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCampaigns}
              aria-label="Back to Dashboard"
            >
              <Home className="h-5 w-5" />
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Campaign Name - Plain Text Only */}
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-foreground">
                {campaignName}
              </h1>
            </div>

            {/* Status Badge */}
            <Badge 
              variant={isPublished ? 'default' : 'secondary'}
              className={isPublished ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
            >
              {isPublished ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              ) : (
                'Draft'
              )}
            </Badge>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Preview Button - Always show if onPreview is available */}
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                disabled={!canPreview || isSaving}
                title={!canPreview && validationErrors.length > 0 
                  ? `Missing required sections: ${validationErrors.join(', ')}`
                  : undefined
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {/* View Live Button (for published campaigns only) */}
            {isPublished && campaignUserKey && campaignPublishedUrl && (
              <div className="flex items-center">
                {/* Main View Live Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewLive}
                  disabled={isSaving}
                  className="rounded-r-none border-r-0"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  View Live
                </Button>
                
                {/* Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      className="rounded-l-none px-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyLiveLink} className="flex items-center">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    {onPause && (
                      <DropdownMenuItem onClick={onPause} className="flex items-center">
                        <PauseCircle className="h-4 w-4 mr-2" />
                        Unpublish
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Edit Button */}
            {campaign && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCampaign}
                disabled={isSaving}
              >
                <Settings className="h-4 w-4 mr-2" />
                Theme
              </Button>
            )}

            {/* Launch Button (for drafts only) */}
            {!isPublished && onPublish && (
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!canPublish || isSaving}
                title={!canPublish && validationErrors.length > 0 
                  ? `Missing required sections: ${validationErrors.join(', ')}`
                  : undefined
                }
              >
                <Rocket className="h-4 w-4 mr-2" />
                Launch
              </Button>
            )}

            {/* Help Icon Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help" className="ml-2">
                  <LifeBuoy className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href="mailto:support@yourdomain.com" className="flex items-center" target="_blank" rel="noopener noreferrer">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://help.yourdomain.com" className="flex items-center" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Help Docs
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowOnboarding} className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Show Onboarding Guide
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Campaign Edit Modal */}
      {campaign && (
        <CampaignEditModal
          campaign={campaign}
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          onSave={handleEditModalSave}
          mode="edit"
          initialStep="theme"
        />
      )}
    </div>
  )
} 