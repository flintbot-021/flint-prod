'use client'

import React from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { BasicContentConfiguration } from '@/lib/types/database'
import { FileText } from 'lucide-react'
import { getCampaignTheme, getCampaignTextColor, getNextSectionButtonText } from '../utils'

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
  campaign,
  sections
}: SectionRendererProps) {
  // Get basic configuration from section configuration
  const basicConfig = section.configuration as BasicContentConfiguration
  
  // Use section configuration with fallbacks
  const configAny = basicConfig as any
  const settings: BasicContentSettings = {
    alignment: configAny.alignment || 'center',
    headline: title || '',
    subheading: description || '',
    content: configAny.content || '',
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
      <div className="flex-1 pt-20 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Top Image (if provided) */}
          {settings.image_url && (
            <div className="w-full">
              <img 
                src={settings.image_url}
                alt={settings.headline || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          )}

          {/* Content Stack: Title -> Subtitle -> Content */}
          <div className={cn('space-y-8', getAlignmentClass(settings.alignment))}>
            {/* Headline */}
            {settings.headline && (
            <h1 
              className={cn(
                "font-black tracking-tight leading-tight",
                deviceInfo?.type === 'mobile' ? "text-4xl md:text-5xl" : "text-5xl md:text-6xl lg:text-7xl"
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
                  "font-medium leading-relaxed",
                  deviceInfo?.type === 'mobile' ? "text-xl md:text-2xl" : "text-2xl md:text-3xl lg:text-4xl"
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
                  "leading-relaxed whitespace-pre-wrap font-medium",
                  deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl md:text-2xl"
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
          label: getNextSectionButtonText(index, sections, 'Next'),
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 