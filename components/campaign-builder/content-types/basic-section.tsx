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
  // Get current settings with defaults
  const settings = section.settings as BasicSettings || {}
  const {
    title = 'Your Headline',
    subtitle = 'Add your subheading here',
    content = 'Add your content here. You can write multiple paragraphs and create rich content that engages your audience.'
  } = settings

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
    // Preview Mode - What end users see
    return (
      <div className={cn('py-16 px-6', className)}>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Text Content */}
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {title}
              </h1>
              
              {subtitle && (
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                  {subtitle}
                </p>
              )}
            </div>

            {content && (
              <div className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Build Mode - Simple and clean like text questions
  return (
    <div className={cn('py-16 space-y-6 max-w-2xl mx-auto', className)}>
      {/* Title - Seamless inline editing (identical to hero section) */}
      <div className="pt-8">
        <InlineEditableText
          value={title}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          autoSave={false}
          placeholder="Your Headline"
          className="!text-4xl !font-bold text-center text-gray-400 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-4xl !font-bold !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-400 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="heading"
        />
      </div>

      {/* Subtitle - Seamless inline editing (identical to hero section) */}
      <div className="pt-4">
        <InlineEditableText
          value={subtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          autoSave={false}
          placeholder="Add your compelling subtitle here"
          className="!text-xl text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-xl !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="body"
        />
      </div>

      {/* Rich Text Content - Additional paragraph section */}
      <div className="pt-6">
        <InlineEditableText
          value={content}
          onSave={(newContent) => updateSettings({ content: newContent })}
          autoSave={false}
          placeholder="Add your content here. You can write multiple paragraphs and create rich content that engages your audience."
          className="!text-lg text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0 !min-h-32"
          inputClassName="!text-lg !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent !min-h-32"
          showEditIcon={false}
          variant="body"
          multiline={true}
        />
      </div>
    </div>
  )
} 