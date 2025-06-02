'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'

interface TextQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface TextQuestionSettings {
  content?: string
  subheading?: string
  label?: string
  placeholder?: string
  required?: boolean
  buttonLabel?: string
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
    content = '',
    subheading = '',
    label = '',
    placeholder = 'Answer will go here',
    required = false,
    buttonLabel = 'Next'
  } = settings

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

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle subheading change
  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Handle label change
  const handleLabelChange = async (newLabel: string) => {
    await updateSettings({ label: newLabel })
  }

  // Handle placeholder change
  const handlePlaceholderChange = async (newPlaceholder: string) => {
    await updateSettings({ placeholder: newPlaceholder })
  }

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('p-6 max-w-2xl mx-auto', className)}>
        <div className="space-y-6">
          {/* Main Question Text */}
          <div className="text-center">
            <InlineEditableText
              value={settings.content || ''}
              onSave={handleContentChange}
              variant="heading"
              placeholder="Click to edit your question..."
              className="text-2xl font-semibold text-center block w-full"
              showEditIcon={false}
              autoSave={false}
            />
          </div>

          {/* Optional Subheading */}
          <div className="text-center">
            <InlineEditableText
              value={settings.subheading || ''}
              onSave={handleSubheadingChange}
              variant="body"
              placeholder="Add a subheading (optional)..."
              className="text-gray-600 text-center block w-full"
              showEditIcon={false}
              autoSave={false}
            />
          </div>

          {/* Input Field */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder={settings.placeholder || 'Type your answer here...'}
              className="w-full p-4 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={true}
            />
          </div>

          {/* Input Label (editable) */}
          <div className="text-center">
            <InlineEditableText
              value={settings.label || ''}
              onSave={handleLabelChange}
              variant="caption"
              placeholder="Add input label (optional)..."
              className="text-sm text-gray-500 text-center block w-full"
              showEditIcon={false}
              autoSave={false}
            />
          </div>

          {/* Placeholder Text (editable) */}
          <div className="text-center">
            <InlineEditableText
              value={settings.placeholder || ''}
              onSave={handlePlaceholderChange}
              variant="caption"
              placeholder="Edit placeholder text..."
              className="text-xs text-gray-400 text-center block w-full"
              showEditIcon={false}
              autoSave={false}
            />
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Direct inline editing like the user's image
  return (
    <div className={cn('p-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="Type your question here"
          className="text-4xl font-bold text-gray-400 text-center block w-full"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subheading */}
      <div className="text-center">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          variant="body"
          placeholder="Type sub heading here"
          className="text-xl text-gray-400 text-center block w-full"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Label */}
      <div className="pt-8">
        <InlineEditableText
          value={label}
          onSave={handleLabelChange}
          variant="body"
          placeholder="Type label here"
          className="text-sm font-medium text-gray-400 block w-full"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Input Field */}
      <div>
        <InlineEditableText
          value={placeholder}
          onSave={handlePlaceholderChange}
          variant="body"
          placeholder="Answer will go here"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-400 bg-white"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 