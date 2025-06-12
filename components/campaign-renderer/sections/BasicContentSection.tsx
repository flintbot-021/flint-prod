'use client'

import React from 'react'
import { Type } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { BasicContentConfiguration } from '@/lib/types/database'

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
  const settings = {
    title: basicConfig.title || title || 'Content Title',
    subtitle: basicConfig.description || description || '',
    content: basicConfig.content || '',
    image: basicConfig.image || '',
    textAlignment: basicConfig.textAlignment || 'center'
  }

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
      basic_content_viewed: true
    })
  }

  return (
    <div className="h-full bg-muted flex flex-col pb-20">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-12">
          {/* Image */}
          {settings.image && (
            <div className="w-full">
              <img 
                src={settings.image}
                alt={settings.title || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Text Content */}
          <div className={cn('space-y-6', getAlignmentClass(settings.textAlignment))}>
            <div className="space-y-4">
              {settings.title && (
                <h1 className={cn(
                  "font-bold text-white",
                  deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
                )}>
                  {settings.title}
                </h1>
              )}
              
              {settings.subtitle && (
                <p className={cn(
                  "text-gray-300 max-w-3xl mx-auto",
                  deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                )}>
                  {settings.subtitle}
                </p>
              )}
            </div>

            {settings.content && (
              <div className={cn(
                "text-gray-400 max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {settings.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Type className="h-5 w-5 text-primary" />}
        label={`Content ${index + 1}`}
        actionButton={{
          label: 'Continue',
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 