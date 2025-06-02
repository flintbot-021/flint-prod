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
  className,
  showButtonPreview = true,
  isPreview = false
}: SectionBottomBarProps) {
  const sectionType = getSectionTypeById(section.type)
  
  // Determine if this section type typically has questions
  const isQuestionType = sectionType?.category === 'input' || 
    ['multiple-choice', 'text-input', 'rating-scale', 'email-capture', 'contact-form'].includes(section.type)

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
  if (!isQuestionType && !showButtonPreview) {
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

        {/* Right Side - Just the Button */}
        {showButtonPreview && (
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
      {/* Left Side - Question Controls */}
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
      </div>

      {/* Right Side - Button Controls */}
      {showButtonPreview && (
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
  )
} 