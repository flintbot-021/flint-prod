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
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        <div className="space-y-6">
          {/* Main Question Text */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">
              {content || 'Your question text here...'}
            </h1>
          </div>

          {/* Optional Subheading */}
          {subheading && (
            <div className="text-center">
              <p className="text-xl text-gray-300">
                {subheading}
              </p>
            </div>
          )}

          {/* Label */}
          {label && (
            <div className="pt-6">
              <label className="text-sm font-medium text-gray-300 block">
                {label}
              </label>
            </div>
          )}

          {/* Input Field */}
          <div>
            <input
              type="text"
              placeholder={placeholder || 'Type your answer here...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={false}
            />
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Direct inline editing like the user's image
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="Type your question here"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
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
          className="text-xl text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Label */}
      <div className="pt-6">
        <InlineEditableText
          value={label}
          onSave={handleLabelChange}
          variant="body"
          placeholder="Type label here"
          className="text-sm font-medium text-gray-400 block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-sm !font-medium !text-gray-400 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-400 bg-white hover:bg-white"
          inputClassName="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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