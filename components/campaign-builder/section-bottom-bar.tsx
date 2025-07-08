'use client'

import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'


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
  
  // Check if this is a capture section
  const isCaptureSection = section.type === 'capture-details'
  
  // Check if this is an AI Logic section (configuration only, never shown to end users)
  const isAILogicSection = section.type === 'logic-ai' || sectionType?.category === 'logic'
  
  // Debug logging to check section type detection
  if (section.type === 'capture-details' || section.title?.includes('Capture')) {
    console.log('Capture section debug:', {
      sectionType: section.type,
      sectionTitle: section.title,
      isCaptureSection,
      captureSettings: section.settings,
      captureButtonText: section.settings?.submitButtonText
    })
  }
  
  // Check if this is a Hero section
  const isHeroSection = section.type === 'content-hero' || section.type === 'hero'
  
  // Check if this is a Basic section
  const isBasicSection = section.type === 'content-basic'
  
  // Get Hero settings if it's a Hero section
  const heroSettings = isHeroSection ? section.settings as any : null
  const showButton = heroSettings?.showButton !== false
  const hasBackgroundImage = heroSettings?.backgroundImage

  // Get Basic section settings
  const basicSettings = isBasicSection ? section.settings as any : null
  const textAlignment = basicSettings?.textAlignment || 'center'

  // Get Capture section settings
  const captureSettings = isCaptureSection ? section.settings as any : null
  const captureButtonText = captureSettings?.submitButtonText || 'Get my results'



  // Handle Basic section settings updates
  const updateBasicSettings = async (newSettings: Record<string, unknown>) => {
    if (onSectionUpdate) {
      await onSectionUpdate({
        settings: {
          ...section.settings,
          ...newSettings
        }
      })
    }
  }

  // Handle Capture section settings updates
  const updateCaptureSettings = async (newSettings: Record<string, unknown>) => {
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

  // Don't render if no controls are needed or if this is an AI Logic section or Hero section
  if (isAILogicSection || isHeroSection || (!isQuestionType && !showButtonPreview && !isBasicSection && !isCaptureSection)) {
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
            <span className="text-sm text-red-600 font-medium">
              This is required
            </span>
          )}
        </div>

        {/* Right Side - Just the Button (not for Hero sections) */}
        {(showButtonPreview && !isHeroSection) || isCaptureSection ? (
          <div className="flex items-center">
            <button 
              className="font-medium text-white px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              onClick={() => {
                if (isCaptureSection) {
                  // Trigger capture form submission
                  const formElement = document.getElementById(`capture-form-${section.id}`) as HTMLFormElement
                  if (formElement) {
                    formElement.requestSubmit()
                  }
                }
              }}
            >
              {isCaptureSection ? captureButtonText : buttonLabel}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  // Build Mode - Show editing controls
  return (
    <div className={cn(
      'flex items-center justify-between p-5 bg-background border-t border-border',
      'hover:bg-gray-100 transition-colors group',
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
              className="text-sm font-medium cursor-pointer text-gray-700"
            >
              Required
            </Label>
          </div>
        )}




      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center space-x-4">


        {/* Button Controls for Capture Sections Only */}
        {isCaptureSection ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-medium">Button:</span>
            <InlineEditableText
              value={captureButtonText}
              onSave={(newText) => updateCaptureSettings({ submitButtonText: newText })}
              variant="caption"
              placeholder="Get my results"
              className="font-medium text-white px-2 py-1 bg-gray-800 border border-gray-700 rounded"
              showEditIcon={false}
              showSaveStatus={true}
              validation={validateButtonLabel}
              maxLength={30}
              required={true}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
} 