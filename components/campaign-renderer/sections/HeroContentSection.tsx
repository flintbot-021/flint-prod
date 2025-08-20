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
  sections,
  isPreview
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
      // Use full height for public mode, header-adjusted height for preview mode
      isPreview 
        ? "min-h-[calc(100vh-4rem)]"
        : deviceInfo?.type === 'mobile' ? "min-h-screen" : "min-h-screen"
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
            "font-black text-white leading-tight tracking-tight",
            deviceInfo?.type === 'mobile' 
              ? "text-4xl" 
              : "text-6xl md:text-7xl lg:text-8xl"
          )}>
            {settings.title}
          </h1>
        )}
        
        {settings.subtitle && (
          <p className={cn(
            "text-white/90 mx-auto leading-relaxed font-medium",
            deviceInfo?.type === 'mobile' 
              ? "text-lg max-w-sm px-1" 
              : "text-2xl md:text-3xl max-w-4xl"
          )}>
            {settings.subtitle}
          </p>
        )}

        {settings.showButton && (
          <div className={cn(
            deviceInfo?.type === 'mobile' ? "pt-6" : "pt-8"
          )}>
            <button
              onClick={handleContinue}
              className={cn(
                'font-bold rounded-2xl backdrop-blur-md border transition-all duration-300 ease-out',
                'hover:shadow-2xl hover:scale-105 active:scale-95 shadow-xl',
                deviceInfo?.type === 'mobile' 
                  ? "text-base px-6 py-3 mx-4" 
                  : "text-xl px-10 py-5"
              )}
              style={{
                ...primaryButtonStyle,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              {settings.buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 