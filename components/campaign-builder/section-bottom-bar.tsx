'use client'

import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { ChevronRight, AlertCircle } from 'lucide-react'

interface SectionBottomBarProps {
  section: CampaignSection
  isQuestion?: boolean
  isRequired?: boolean
  buttonLabel?: string
  onRequiredChange?: (required: boolean) => void
  onButtonLabelChange?: (label: string) => Promise<void>
  className?: string
  showButtonPreview?: boolean
}

export function SectionBottomBar({
  section,
  isQuestion = false,
  isRequired = false,
  buttonLabel = 'Next',
  onRequiredChange,
  onButtonLabelChange,
  className,
  showButtonPreview = true
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

  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200',
      'rounded-b-lg',
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
              className="text-sm font-medium cursor-pointer"
            >
              Required
            </Label>
            {isRequired && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Required
              </Badge>
            )}
          </div>
        )}

        {/* Section Type Info */}
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="font-medium">{sectionType?.name || section.type}</span>
          {sectionType?.category && (
            <>
              <span>•</span>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  sectionType.category === 'input' && 'border-blue-200 text-blue-700',
                  sectionType.category === 'content' && 'border-green-200 text-green-700',
                  sectionType.category === 'logic' && 'border-purple-200 text-purple-700',
                  sectionType.category === 'output' && 'border-orange-200 text-orange-700'
                )}
              >
                {sectionType.category}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Button Controls */}
      {showButtonPreview && (
        <div className="flex items-center space-x-3">
          {/* Button Label Editor */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium">Button:</span>
            {onButtonLabelChange ? (
              <InlineEditableText
                value={buttonLabel}
                onSave={onButtonLabelChange}
                variant="caption"
                placeholder="Enter button text..."
                className="font-medium text-gray-700 px-2 py-1 bg-white border border-gray-200 rounded"
                showEditIcon={false}
                showSaveStatus={true}
                validation={validateButtonLabel}
                maxLength={30}
                required={true}
              />
            ) : (
              <span className="text-xs font-medium text-gray-700 px-2 py-1 bg-white border border-gray-200 rounded">
                {buttonLabel}
              </span>
            )}
          </div>

          {/* Button Preview */}
          <Button
            size="sm"
            className="h-7 px-3 text-xs pointer-events-none"
            disabled
          >
            {buttonLabel}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
} 