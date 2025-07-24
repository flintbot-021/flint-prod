'use client'

import React from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'


interface BasicSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface BasicSettings {
  title?: string
  subtitle?: string
  content?: string
}

export function BasicSection({ section, isPreview = false, onUpdate, className }: BasicSectionProps) {
  // Get current settings with empty defaults (like other sections)
  const settings = section.settings as BasicSettings || {}
  const {
    title = '',
    subtitle = '',
    content = ''
  } = settings

  // Helper function to check if content exists (same as other sections)
  const hasContent = (value: string) => value && value.trim().length > 0

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<BasicSettings>) => {
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update basic settings:', error)
      throw error
    }
  }

  if (isPreview) {
    // Preview Mode - Only show elements that have content
    return (
      <div className={cn('py-16 px-6', className)}>
        <div className="max-w-4xl mx-auto">
          {/* Text Content */}
          <div className="text-center">
            {/* Title - Only show if has content */}
            {hasContent(title) && (
              <div className="pt-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {title}
                </h1>
              </div>
            )}
            
            {/* Subtitle - Only show if has content */}
            {hasContent(subtitle) && (
              <div className="pt-4">
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto whitespace-pre-wrap">
                  {subtitle}
                </p>
              </div>
            )}

            {/* Content - Only show if has content */}
            {hasContent(content) && (
              <div className="pt-6">
                <div className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Build Mode - Simple and clean like other sections
  return (
    <div className={cn('py-16 max-w-2xl mx-auto', className)}>
      {/* Title - Seamless inline editing (identical to hero section) */}
      <div className="pt-8">
        <InlineEditableText
          value={title}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          placeholder="Your Headline"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subtitle - Seamless inline editing (identical to hero section) */}
      <div className="pt-4">
        <InlineEditableText
          value={subtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          placeholder="Add your subheading here"
          variant="subheading"
          className="text-center block w-full"
          multiline={true}
        />
      </div>

      {/* Rich Text Content - Additional paragraph section */}
      <div className="pt-6">
        <InlineEditableText
          value={content}
          onSave={(newContent) => updateSettings({ content: newContent })}
          placeholder="Add your content here. You can write multiple paragraphs and create rich content that engages your audience."
          variant="paragraph"
          className="text-lg text-center block w-full min-h-32"
          multiline={true}
        />
      </div>
    </div>
  )
} 