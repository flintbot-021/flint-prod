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
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampaignBuilderTopBarProps {
  campaignName: string
  campaignStatus: 'draft' | 'published' | 'archived'
  isPublished?: boolean
  isSaving?: boolean
  canPublish?: boolean
  onCampaignNameChange?: (name: string) => void
  onPreview?: () => void
  onPublish?: () => void
  className?: string
}

export function CampaignBuilderTopBar({
  campaignName,
  campaignStatus,
  isPublished = false,
  isSaving = false,
  canPublish = true,
  onCampaignNameChange,
  onPreview,
  onPublish,
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
              {isPublished ? 'Published' : 'Draft'}
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
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {/* Publish/Published Button */}
            {onPublish && (
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!canPublish || isSaving}
                variant={isPublished ? 'secondary' : 'default'}
              >
                <Globe className="h-4 w-4 mr-2" />
                {isPublished ? 'Published' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress/Loading Bar */}
      {isSaving && (
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  )
} 