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
  MoreHorizontal,
  Pause,
  Rocket
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CampaignBuilderTopBarProps {
  campaignName: string
  campaignStatus: 'draft' | 'published' | 'archived'
  isPublished?: boolean
  isSaving?: boolean
  canPublish?: boolean
  canPreview?: boolean
  validationErrors?: string[]
  onCampaignNameChange?: (name: string) => void
  onPreview?: () => void
  onPublish?: () => void
  onPause?: () => void
  className?: string
}

export function CampaignBuilderTopBar({
  campaignName,
  campaignStatus,
  isPublished = false,
  isSaving = false,
  canPublish = true,
  canPreview = true,
  validationErrors = [],
  onCampaignNameChange,
  onPreview,
  onPublish,
  onPause,
  className
}: CampaignBuilderTopBarProps) {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(campaignName)
  const [isSticky, setIsSticky] = useState(false)
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
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Campaign Name - Editable */}
            <div className="flex items-center space-x-2">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <Input
                    ref={inputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleNameSave}
                    className="h-8 text-lg font-semibold min-w-[200px]"
                    placeholder="Campaign name"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNameSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNameCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-foreground">
                    {campaignName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNameEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <Badge 
              variant={isPublished ? 'default' : 'secondary'}
            >
              {isPublished ? 'Live' : 'Draft'}
            </Badge>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Preview Button */}
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

            {/* Launch/Live Button and Actions */}
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

            {/* Live Tool Actions Menu */}
            {isPublished && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onPause && (
                    <DropdownMenuItem onClick={onPause} className="flex items-center">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Tool
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>


    </div>
  )
} 