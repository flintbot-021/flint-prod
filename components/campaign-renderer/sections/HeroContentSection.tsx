'use client'

import React from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { HeroContentConfiguration } from '@/lib/types/database'
import { getCampaignTheme, getCampaignButtonStyles, getCampaignTextColor, getNextSectionButtonText } from '../utils'

export function HeroContentSection({
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
  // Get hero configuration from section configuration
  const heroConfig = section.configuration as HeroContentConfiguration
  
  // Use section configuration - only use fallbacks for essential styling properties
  // Note: The database stores background image as 'image', not 'backgroundImage'
  const configAny = heroConfig as any
  const settings = {
    title: configAny.headline || configAny.title || '',
    subtitle: configAny.subheading || configAny.subtitle || '',
    backgroundImage: configAny.backgroundImage || configAny.image || '',
    overlayColor: heroConfig.overlayColor || '#000000',
    overlayOpacity: heroConfig.overlayOpacity ?? 40,
    buttonText: (() => {
      // Use dynamic button text for better UX flow - prioritize smart flow over stored config
      const dynamicButtonText = getNextSectionButtonText(index, sections, 'Get Started')
      const storedButtonText = heroConfig.buttonText || 'Get Started'
      
      // If our dynamic text is different from default, use it (this means next section is special)
      return dynamicButtonText !== 'Get Started' ? dynamicButtonText : storedButtonText
    })(),
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

  // Get campaign theme colors
  const theme = getCampaignTheme(campaign)
  const primaryButtonStyle = getCampaignButtonStyles(campaign, 'primary')

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
    <div className={cn(
      "relative w-full overflow-hidden flex items-center justify-center",
      deviceInfo?.type === 'mobile' ? "min-h-full" : "min-h-screen"
    )}>
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
      <div className={cn(
        "relative z-10 text-center max-w-4xl mx-auto",
        deviceInfo?.type === 'mobile' 
          ? "space-y-4 px-3 py-6" 
          : "space-y-8 px-6"
      )}>
        {settings.title && (
          <h1 className={cn(
            "font-bold text-white leading-tight",
            deviceInfo?.type === 'mobile' 
              ? "text-2xl" 
              : "text-5xl md:text-6xl lg:text-7xl"
          )}>
            {settings.title}
          </h1>
        )}
        
        {settings.subtitle && (
          <p className={cn(
            "text-white/90 mx-auto leading-relaxed",
            deviceInfo?.type === 'mobile' 
              ? "text-base max-w-sm px-1" 
              : "text-xl md:text-2xl max-w-3xl"
          )}>
            {settings.subtitle}
          </p>
        )}

        {settings.showButton && (
          <div className={cn(
            deviceInfo?.type === 'mobile' ? "pt-3" : "pt-4"
          )}>
            <button
              onClick={handleContinue}
              className={cn(
                'font-semibold rounded-md transition-colors',
                deviceInfo?.type === 'mobile' 
                  ? "text-sm px-5 py-2.5 mx-4" 
                  : "text-lg px-8 py-4"
              )}
              style={primaryButtonStyle}
            >
              {settings.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 