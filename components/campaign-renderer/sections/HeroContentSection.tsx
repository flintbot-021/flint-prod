'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { HeroContentConfiguration } from '@/lib/types/database'

export function HeroContentSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete
}: SectionRendererProps) {
  // Get hero configuration from section configuration
  const heroConfig = section.configuration as HeroContentConfiguration
  
  // Debug the configuration data
  console.log('HeroContentSection DEBUG:', {
    sectionId: section.id,
    heroConfig,
    backgroundImage: heroConfig.backgroundImage,
    buttonText: heroConfig.buttonText,
    overlayColor: heroConfig.overlayColor,
    overlayOpacity: heroConfig.overlayOpacity,
    showButton: heroConfig.showButton,
    allConfigKeys: Object.keys(heroConfig || {})
  })
  
  // Use section configuration with fallbacks
  // Note: The database stores background image as 'image', not 'backgroundImage'
  const configAny = heroConfig as any
  const settings = {
    title: heroConfig.title || title || 'Hero Title',
    subtitle: heroConfig.description || description || 'Hero subtitle',
    backgroundImage: configAny.backgroundImage || configAny.image || '',
    overlayColor: heroConfig.overlayColor || '#000000',
    overlayOpacity: heroConfig.overlayOpacity ?? 40,
    buttonText: heroConfig.buttonText || 'Get Started',
    showButton: heroConfig.showButton ?? true
  }

  console.log('HeroContentSection SETTINGS:', settings)

  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: 'viewed',
      hero_viewed: true
    })
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      {settings.backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.backgroundImage})` }}
        />
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: settings.overlayColor,
          opacity: settings.overlayOpacity / 100 
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen pb-20">
        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center space-y-8 max-w-4xl">
            <div className="space-y-6">
              <h1 className={cn(
                "font-bold text-white leading-tight",
                deviceInfo?.type === 'mobile' 
                  ? "text-4xl md:text-5xl" 
                  : "text-5xl md:text-6xl lg:text-7xl"
              )}>
                {settings.title}
              </h1>
              
              <p className={cn(
                "text-gray-200 max-w-3xl mx-auto leading-relaxed",
                deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
              )}>
                {settings.subtitle}
              </p>
            </div>

            {settings.showButton && (
              <button
                onClick={handleContinue}
                className={cn(
                  'inline-flex items-center font-semibold',
                  'bg-white text-gray-900 rounded-full',
                  'hover:bg-gray-100 transition-colors duration-200',
                  'shadow-lg hover:shadow-xl transform hover:scale-105',
                  deviceInfo?.type === 'mobile' ? "text-base px-6 py-3" : "text-lg px-8 py-4"
                )}
              >
                {settings.buttonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Star className="h-5 w-5 text-primary" />}
        label={`Hero ${index + 1}`}
        actionButton={{
          label: settings.buttonText,
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 