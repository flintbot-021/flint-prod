'use client'

import React from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
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
  
  // Use section configuration with fallbacks
  // Note: The database stores background image as 'image', not 'backgroundImage'
  const configAny = heroConfig as any
  const settings = {
    title: heroConfig.title || title || 'Hero Title',
    subtitle: configAny.subtitle || heroConfig.description || description || 'Hero subtitle',
    backgroundImage: configAny.backgroundImage || configAny.image || '',
    overlayColor: heroConfig.overlayColor || '#000000',
    overlayOpacity: heroConfig.overlayOpacity ?? 40,
    buttonText: heroConfig.buttonText || 'Get Started',
    showButton: heroConfig.showButton ?? true
  }

  // Debug logging
  console.log('🦸 HERO SECTION DEBUG:', {
    sectionType: section.type,
    sectionId: section.id,
    sectionTitle: section.title,
    heroConfig,
    settings,
    hasBackgroundImage: !!settings.backgroundImage,
    configKeys: Object.keys(heroConfig || {})
  })

  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: 'viewed',
      hero_viewed: true
    })
  }

  // Convert hex color with opacity to rgba for overlay
  const getOverlayStyle = () => {
    const hex = settings.overlayColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${settings.overlayOpacity / 100})`
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      {settings.backgroundImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700" />
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={getOverlayStyle()}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl">
        <h1 className={cn(
          "font-bold text-white leading-tight",
          deviceInfo?.type === 'mobile' 
            ? "text-4xl md:text-5xl" 
            : "text-5xl md:text-6xl lg:text-7xl"
        )}>
          {settings.title}
        </h1>
        
        {settings.subtitle && (
          <p className={cn(
            "text-white/90 max-w-3xl mx-auto leading-relaxed",
            deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
          )}>
            {settings.subtitle}
          </p>
        )}

        {settings.showButton && (
          <div className="pt-4">
            <button
              onClick={handleContinue}
              className={cn(
                'bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-md transition-colors',
                deviceInfo?.type === 'mobile' ? "text-base px-6 py-3" : "text-lg px-8 py-4"
              )}
            >
              {settings.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 