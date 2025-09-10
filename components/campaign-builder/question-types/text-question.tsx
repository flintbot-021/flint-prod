'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Switch } from '@/components/ui/switch'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'

interface TextQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface TextQuestionSettings {
  headline?: string
  subheading?: string
  label?: string
  placeholder?: string
  required?: boolean
  buttonLabel?: string
  isUrlInput?: boolean
  textArea?: boolean
}

export function TextQuestion({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: TextQuestionProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as TextQuestionSettings || {}
  const {
    headline = '',
    subheading = '',
    label = '',
    placeholder = 'Answer will go here',
    required = false,
    buttonLabel = 'Next',
    isUrlInput = false,
    textArea = true
  } = settings

  // Dynamic placeholder based on URL mode
  const dynamicPlaceholder = isUrlInput 
    ? (placeholder || 'https://example.com')
    : (placeholder || 'Type your answer here...')

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<TextQuestionSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update text question settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content changes
  const handleHeadlineChange = async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
  }

  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  const handleLabelChange = async (newLabel: string) => {
    await updateSettings({ label: newLabel })
  }

  const handlePlaceholderChange = async (newPlaceholder: string) => {
    await updateSettings({ placeholder: newPlaceholder })
  }

  // Helper to check if content has actual value
  const hasContent = (value: string) => value && value.trim().length > 0

  if (isPreview) {
    // Preview Mode - Only show elements that have content
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        {/* Main Question Text - Only show if has content */}
        {hasContent(headline) && (
          <div className="pt-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              {headline}
            </h1>
          </div>
        )}

        {/* Optional Subheading - Only show if has content */}
        {hasContent(subheading) && (
          <div className="pt-4 text-center">
            <p className="text-xl text-gray-600">
              {subheading}
            </p>
          </div>
        )}

        {/* Label - Only show if has content */}
        {hasContent(label) && (
          <div className="pt-6">
            <label className="text-sm font-medium text-gray-700 block">
              {label}
            </label>
          </div>
        )}

        {/* Input Field - Always show with placeholder */}
        <div className="pt-4">
          {textArea && !isUrlInput ? (
            <textarea
              placeholder={hasContent(placeholder) ? placeholder : dynamicPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={false}
            />
          ) : (
            <input
              type={isUrlInput ? "url" : "text"}
              placeholder={hasContent(placeholder) ? placeholder : dynamicPlaceholder}
              className={cn(
                "w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                isUrlInput && "font-mono text-base" // Monospace font for URLs
              )}
              disabled={false}
            />
          )}
        </div>
      </div>
    )
  }

  // Edit Mode - Direct inline editing
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="pt-8">
        <InlineEditableText
          value={headline}
          onSave={handleHeadlineChange}
          placeholder="Type your question here"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Type sub heading here"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Label */}
      <div className="pt-6">
        <InlineEditableText
          value={label}
          onSave={handleLabelChange}
          placeholder="Type label here"
          variant="label"
          className="block w-full"
        />
      </div>

      {/* Input Field */}
      <div className="pt-4">
        <InlineEditableText
          value={placeholder}
          onSave={handlePlaceholderChange}
          placeholder={isUrlInput ? "https://example.com" : "Answer will go here"}
          variant="paragraph"
          className={cn(
            "w-full px-4 py-3 border border-gray-300 rounded-lg bg-white",
            isUrlInput && "font-mono text-sm" // Monospace font for URLs in edit mode
          )}
        />
      </div>


    </div>
  )
} 