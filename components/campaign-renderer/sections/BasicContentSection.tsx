'use client'

import React from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { BasicContentConfiguration } from '@/lib/types/database'
import { FileText } from 'lucide-react'
import { getCampaignTheme, getCampaignTextColor } from '../utils'

interface BasicContentSettings {
  alignment: 'left' | 'center' | 'right',
  headline: string,
  subheading: string,
  content: string,
  image_url: string,
}

export function BasicContentSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  campaign
}: SectionRendererProps) {
  // Get basic configuration from section configuration
  const basicConfig = section.configuration as BasicContentConfiguration
  
  // Use section configuration with fallbacks
  const configAny = basicConfig as any
  const settings: BasicContentSettings = {
    alignment: configAny.alignment || 'center',
    headline: title || 'Your Headline Here',
    subheading: description || 'A compelling subheading to draw them in.',
    content: configAny.content || 'This is where your main content will go. You can add more details, paragraphs, and information here to engage your audience.',
    image_url: configAny.image_url || '',
  }

  // Debug logging
  console.log('📄 BASIC SECTION DEBUG:', {
    sectionType: section.type,
    sectionId: section.id,
    sectionTitle: section.title,
    basicConfig,
    settings,
    hasImage: !!settings.image_url,
    textAlignment: settings.alignment,
    configKeys: Object.keys(basicConfig || {})
  })

  // Get text alignment class
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }

  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: 'viewed',
      content_viewed: true
    })
  }

  // Get campaign theme colors
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Main Content Area */}
      <div className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Top Image (if provided) */}
          {settings.image_url && (
            <div className="w-full">
              <img 
                src={settings.image_url}
                alt={settings.headline || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content Stack: Title -> Subtitle -> Content */}
          <div className={cn('space-y-6', getAlignmentClass(settings.alignment))}>
            {/* Headline */}
            {settings.headline && (
              <h1 
                className={cn(
                  "font-bold",
                  deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
                )}
                style={primaryTextStyle}
              >
                {settings.headline}
              </h1>
            )}
            
            {/* Subheading */}
            {settings.subheading && (
              <p 
                className={cn(
                  deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                )}
                style={mutedTextStyle}
              >
                {settings.subheading}
              </p>
            )}

            {/* Content Paragraph */}
            {settings.content && (
              <div 
                className={cn(
                  "leading-relaxed whitespace-pre-wrap",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}
                style={mutedTextStyle}
              >
                {settings.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<FileText className="h-5 w-5 text-primary" />}
        label={`Section ${index + 1}`}
        actionButton={{
          label: 'Next',
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 