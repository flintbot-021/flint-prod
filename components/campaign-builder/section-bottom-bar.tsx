'use client'

import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Palette } from 'lucide-react'

interface SectionBottomBarProps {
  section: CampaignSection
  isQuestion?: boolean
  isRequired?: boolean
  buttonLabel?: string
  onRequiredChange?: (required: boolean) => void
  onButtonLabelChange?: (label: string) => Promise<void>
  onSectionUpdate?: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  showButtonPreview?: boolean
  isPreview?: boolean
}

export function SectionBottomBar({
  section,
  isQuestion = false,
  isRequired = false,
  buttonLabel = 'Next',
  onRequiredChange,
  onButtonLabelChange,
  onSectionUpdate,
  className,
  showButtonPreview = true,
  isPreview = false
}: SectionBottomBarProps) {
  const sectionType = getSectionTypeById(section.type)
  
  // Determine if this section type typically has questions
  const isQuestionType = sectionType?.category === 'input' || 
    ['multiple-choice', 'text-input', 'rating-scale', 'email-capture', 'contact-form'].includes(section.type)
  
  // Check if this is a Hero section
  const isHeroSection = section.type === 'content-hero' || section.type === 'hero'
  
  // Get Hero settings if it's a Hero section
  const heroSettings = isHeroSection ? section.settings as any : null
  const overlayColor = heroSettings?.overlayColor || '#000000'
  const overlayOpacity = heroSettings?.overlayOpacity || 40
  const showButton = heroSettings?.showButton !== false
  const hasBackgroundImage = heroSettings?.backgroundImage

  // Handle Hero settings updates
  const updateHeroSettings = async (newSettings: Record<string, unknown>) => {
    if (onSectionUpdate) {
      await onSectionUpdate({
        settings: {
          ...section.settings,
          ...newSettings
        }
      })
    }
  }

  // Validate button label
  const validateButtonLabel = (label: string): string | null => {
    if (!label.trim()) {
      return 'Button label is required'
    }
    if (label.length > 30) {
      return 'Button label must be 30 characters or less'
    }
    return null
  }

  // Don't render if no controls are needed
  if (!isQuestionType && !showButtonPreview && !isHeroSection) {
    return null
  }

  // For Hero sections, don't show button in preview mode
  if (isHeroSection && isPreview) {
    return null
  }

  // Preview Mode - Show what end users see
  if (isPreview) {
    return (
      <div className={cn(
        'flex items-center justify-between p-5 bg-background border-t border-border',
        className
      )}>
        {/* Left Side - Required Text */}
        <div className="flex items-center">
          {isQuestionType && isRequired && (
            <span className="text-sm text-red-400 font-medium">
              This is required
            </span>
          )}
        </div>

        {/* Right Side - Just the Button (not for Hero sections) */}
        {showButtonPreview && !isHeroSection && (
          <div className="flex items-center">
            <button className="font-medium text-white px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              {buttonLabel}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Build Mode - Show editing controls
  return (
    <div className={cn(
      'flex items-center justify-between p-5 bg-background border-t border-border',
      'hover:bg-gray-900 transition-colors group',
      className
    )}>
      {/* Left Side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Required Toggle for Question Types */}
        {isQuestionType && onRequiredChange && (
          <div className="flex items-center space-x-2">
            <Switch
              id={`required-${section.id}`}
              checked={isRequired}
              onCheckedChange={onRequiredChange}
              className="data-[state=checked]:bg-red-500"
            />
            <Label 
              htmlFor={`required-${section.id}`}
              className="text-sm font-medium cursor-pointer text-white"
            >
              Required
            </Label>
          </div>
        )}

        {/* Hero Section Overlay Controls */}
        {isHeroSection && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-gray-500" />
              <span className="text-gray-500">Overlay</span>
              <input
                type="color"
                value={overlayColor}
                onChange={(e) => updateHeroSettings({ overlayColor: e.target.value })}
                className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
              />
              <span className="text-gray-500">{overlayOpacity}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity}
                onChange={(e) => updateHeroSettings({ overlayOpacity: parseInt(e.target.value) })}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Hero Button Toggle */}
        {isHeroSection && (
          <button
            onClick={() => updateHeroSettings({ showButton: !showButton })}
            className={cn(
              "px-3 py-1 rounded text-xs font-medium transition-colors",
              showButton 
                ? "bg-blue-600 text-white" 
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            )}
          >
            {showButton ? 'Hide Button' : 'Show Button'}
          </button>
        )}

        {/* Button Controls for Question Types */}
        {showButtonPreview && !isHeroSection && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-medium">Button:</span>
            {onButtonLabelChange ? (
              <InlineEditableText
                value={buttonLabel}
                onSave={onButtonLabelChange}
                variant="caption"
                placeholder="Enter button text..."
                className="font-medium text-white px-2 py-1 bg-gray-800 border border-gray-700 rounded"
                showEditIcon={false}
                showSaveStatus={true}
                validation={validateButtonLabel}
                maxLength={30}
                required={true}
              />
            ) : (
              <span className="text-xs font-medium text-white px-2 py-1 bg-gray-800 border border-gray-700 rounded">
                {buttonLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 