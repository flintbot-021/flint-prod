'use client'

import React from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { BasicContentConfiguration } from '@/lib/types/database'
import { FileText } from 'lucide-react'

export function BasicContentSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete
}: SectionRendererProps) {
  // Get basic configuration from section configuration
  const basicConfig = section.configuration as BasicContentConfiguration
  
  // Use section configuration with fallbacks
  const configAny = basicConfig as any
  const settings = {
    title: basicConfig.title || title || 'Your Headline',
    subtitle: configAny.subtitle || description || 'Add your subheading here',
    content: configAny.content || 'Add your content here. You can write multiple paragraphs and create rich content that engages your audience.',
    image: configAny.image || '',
    textAlignment: configAny.textAlignment || 'center'
  }

  // Debug logging
  console.log('📄 BASIC SECTION DEBUG:', {
    sectionType: section.type,
    sectionId: section.id,
    sectionTitle: section.title,
    basicConfig,
    settings,
    hasImage: !!settings.image,
    textAlignment: settings.textAlignment,
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

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Top Image (if provided) */}
          {settings.image && (
            <div className="w-full">
              <img 
                src={settings.image}
                alt={settings.title || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content Stack: Title -> Subtitle -> Content */}
          <div className={cn('space-y-6', getAlignmentClass(settings.textAlignment))}>
            {/* Title */}
            <h1 className={cn(
              "font-bold text-white",
              deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
            )}>
              {settings.title}
            </h1>
            
            {/* Subtitle */}
            {settings.subtitle && (
              <p className={cn(
                "text-gray-300",
                deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              )}>
                {settings.subtitle}
              </p>
            )}

            {/* Content Paragraph */}
            {settings.content && (
              <div className={cn(
                "text-gray-400 leading-relaxed whitespace-pre-wrap",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
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
      />
    </div>
  )
} 