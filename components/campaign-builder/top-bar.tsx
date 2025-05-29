'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Eye, 
  Globe, 
  Save, 
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
  onSave?: () => void
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
  onSave,
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
    router.push('/dashboard/campaigns')
  }

  const getStatusColor = () => {
    switch (campaignStatus) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = () => {
    switch (campaignStatus) {
      case 'published':
        return 'Published'
      case 'draft':
        return 'Draft'
      case 'archived':
        return 'Archived'
      default:
        return 'Unknown'
    }
  }

  return (
    <div
      ref={topBarRef}
      className={cn(
        'bg-white border-b border-gray-200 transition-all duration-200',
        isSticky && 'shadow-md',
        className
      )}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCampaigns}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>

            <div className="h-6 w-px bg-gray-300" />

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
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNameCancel}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {campaignName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNameEdit}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium border',
              getStatusColor()
            )}>
              {getStatusText()}
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Save Button */}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="text-gray-600 border-gray-300 hover:text-gray-900 hover:border-gray-400"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            )}

            {/* Preview Button */}
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-400"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {/* Publish/Unpublish Button */}
            {onPublish && (
              <Button
                size="sm"
                onClick={onPublish}
                disabled={!canPublish || isSaving}
                className={cn(
                  isPublished 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                )}
              >
                <Globe className="h-4 w-4 mr-2" />
                {isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress/Loading Bar */}
      {isSaving && (
        <div className="h-1 bg-gray-200">
          <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  )
} 