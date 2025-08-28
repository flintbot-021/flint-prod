'use client'

import React, { useMemo } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'
import { getCampaignTheme } from '../utils'

export function OutputAdvancedSection({ section, config, userInputs = {}, sections = [], deviceInfo, campaign }: SectionRendererProps) {
  // Get campaign theme colors
  const campaignTheme = getCampaignTheme(campaign)

  // Helper function to get button color (item color override or campaign theme default)
  const getButtonColor = (buttonItem: any) => {
    if (buttonItem?.color) {
      return buttonItem.color
    }
    return campaignTheme.buttonColor
  }

  // Helper function to get button text color (item text color override or campaign theme default)
  const getButtonTextColor = (buttonItem: any) => {
    if (buttonItem?.textColor) {
      return buttonItem.textColor
    }
    return campaignTheme.buttonTextColor
  }

  // Helper functions for responsive units
  const pxToRem = (px: number): number => px / 16 // Assuming 16px = 1rem
  const formatPaddingValue = (value: number): string => `${pxToRem(value)}rem`
  
  // Helper function to convert hex color and opacity to rgba
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Helper function to generate button hover color (slightly darker)
  const getButtonHoverColor = (baseColor: string) => {
    // Simple color darkening - convert hex to RGB, darken by 20%, convert back
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      
      const darken = (value: number) => Math.max(0, Math.floor(value * 0.8))
      
      const darkR = darken(r).toString(16).padStart(2, '0')
      const darkG = darken(g).toString(16).padStart(2, '0')
      const darkB = darken(b).toString(16).padStart(2, '0')
      
      return `#${darkR}${darkG}${darkB}`
    }
    return baseColor
  }

  // Build variable map from inputs and AI outputs
  const variableMap = useMemo(() => {
    const map: Record<string, any> = {}
    const inputVars = buildVariablesFromInputs(sections, userInputs)
    Object.assign(map, inputVars)
    // Use campaign-scoped AI test results
    Object.assign(map, campaign?.id ? getAITestResults(campaign.id) : {})
    return map
  }, [sections, userInputs, campaign?.id])

  const rows = (config as any)?.rows || []
  const pageSettings = (config as any)?.pageSettings || {}
  const interpolator = useMemo(() => new VariableInterpolator(), [])

  const renderItem = (item: any, blockTextColor?: string, align: 'left' | 'center' | 'right' = 'center') => {
    // Use block text color if available, otherwise fall back to campaign theme
    const textColor = blockTextColor || campaignTheme.textColor
    
    switch (item.type) {
      case 'headline':
        return (
          <h1 className={cn(
            'font-black tracking-tight leading-tight',
            deviceInfo?.type === 'mobile' ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl'
          )} style={{ color: textColor }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </h1>
        )
      case 'subheading':
        return (
          <div className={cn(
            'font-medium leading-relaxed',
            deviceInfo?.type === 'mobile' ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl'
          )} style={{ color: `${textColor}CC` }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'h3':
        return (
          <h3 className={cn(
            'font-semibold leading-relaxed',
            deviceInfo?.type === 'mobile' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'
          )} style={{ color: `${textColor}DD` }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </h3>
        )
      case 'paragraph':
        return (
          <div className={cn(
            'leading-relaxed font-medium whitespace-pre-wrap',
            deviceInfo?.type === 'mobile' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          )} style={{ color: textColor }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'divider':
        const dividerItem = item as any
        const dividerColor = hexToRgba(dividerItem.color || '#e5e7eb', dividerItem.opacity ?? 1)
        const dividerThickness = dividerItem.thickness ?? 1
        const dividerStyle = dividerItem.style || 'solid'
        const dividerPaddingTop = formatPaddingValue(dividerItem.paddingTop ?? 12)
        const dividerPaddingBottom = formatPaddingValue(dividerItem.paddingBottom ?? 12)
        return (
          <div style={{
            paddingTop: dividerPaddingTop,
            paddingBottom: dividerPaddingBottom
          }}>
            <hr style={{
              border: 'none',
              borderTop: `${dividerThickness}px ${dividerStyle} ${dividerColor}`,
              margin: 0
            }} />
          </div>
        )
      case 'button':
        const buttonHref = interpolator.interpolate((item as any).href || '#', { variables: variableMap, availableVariables: [] }).content
        const buttonText = interpolator.interpolate(item.content || 'Button', { variables: variableMap, availableVariables: [] }).content
        const buttonColor = getButtonColor(item)
        const buttonTextColor = getButtonTextColor(item)
        const buttonHoverColor = getButtonHoverColor(buttonColor)
        const buttonAlignment = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
        return (
          <div className={`flex ${buttonAlignment}`}>
            <a 
              href={buttonHref}
              className={cn(
                "inline-flex items-center justify-center font-semibold text-center backdrop-blur-md border transition-all duration-300 ease-out",
                "hover:shadow-xl hover:scale-105 active:scale-95 shadow-2xl",
                deviceInfo?.type === 'mobile' 
                  ? 'px-5 py-3 rounded-xl text-sm sm:text-base' 
                  : 'px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg'
              )}
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = buttonHoverColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = buttonColor
              }}
              target={buttonHref.startsWith('http') ? '_blank' : undefined}
              rel={buttonHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {buttonText}
            </a>
          </div>
        )
      case 'image':
        const imageSrc = interpolator.interpolate(item.src || '', { variables: variableMap, availableVariables: [] }).content
        const isCoverMode = (item as any).coverMode
        const imageStyle = isCoverMode 
          ? { 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' as const, 
              position: 'absolute' as const,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }
          : (item as any).maxHeight 
            ? { maxHeight: `${(item as any).maxHeight}px`, height: 'auto', objectFit: 'cover' as const }
            : { objectFit: 'cover' as const }
        
        return imageSrc ? (
          isCoverMode ? (
            <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
              <img 
                src={imageSrc} 
                alt={item.alt || ''} 
                className="rounded-2xl shadow-2xl" 
                style={imageStyle}
              />
            </div>
          ) : (
            <img 
              src={imageSrc} 
              alt={item.alt || ''} 
              className="rounded-2xl w-full shadow-2xl" 
              style={imageStyle}
            />
          )
        ) : null
      case 'numbered-list':
        return (
          <ol className="list-decimal pl-5 space-y-1">
            {(item.items || []).map((li: string, idx: number) => (
              <li key={idx}>{interpolator.interpolate(li, { variables: variableMap, availableVariables: [] }).content}</li>
            ))}
          </ol>
        )
      case 'bullet-list':
        return (
          <ul className="list-disc pl-5 space-y-1">
            {(item.items || []).map((li: string, idx: number) => (
              <li key={idx}>{interpolator.interpolate(li, { variables: variableMap, availableVariables: [] }).content}</li>
            ))}
          </ul>
        )
      default:
        return null
    }
  }

  const renderBlock = (block: any, isMobile: boolean = false) => {
    const align = block.textAlignment || 'center'
    const hasCustomBackground = block.backgroundColor && block.backgroundColor !== 'transparent'
    const hasCustomBorder = block.borderColor
    const hasGlassEffect = block.glassEffect && (hasCustomBackground || hasCustomBorder)
    
    // Check if block contains any cover mode images
    const hasCoverModeImage = (block.content || []).some((item: any) => item.type === 'image' && item.coverMode)
    
    // Handle individual padding values with fallback to uniform padding
    const paddingTop = block.paddingTop ?? block.padding ?? 24
    const paddingBottom = block.paddingBottom ?? block.padding ?? 24
    const paddingLeft = block.paddingLeft ?? block.padding ?? 24
    const paddingRight = block.paddingRight ?? block.padding ?? 24
    
    // For cover mode images, we need to handle padding differently
    const blockPadding = hasCoverModeImage 
      ? 0 // No padding for cover mode images
      : isMobile 
        ? Math.max(16, Math.min(paddingTop, paddingBottom, paddingLeft, paddingRight) * 0.75) 
        : undefined
    
    const blockPaddingStyle = hasCoverModeImage ? {} : {
      paddingTop: formatPaddingValue(isMobile ? Math.max(12, paddingTop * 0.75) : paddingTop),
      paddingBottom: formatPaddingValue(isMobile ? Math.max(12, paddingBottom * 0.75) : paddingBottom),
      paddingLeft: formatPaddingValue(isMobile ? Math.max(12, paddingLeft * 0.75) : paddingLeft),
      paddingRight: formatPaddingValue(isMobile ? Math.max(12, paddingRight * 0.75) : paddingRight)
    }
    
    return (
      <div
        key={block.id}
        className={cn(
          'transition-all duration-300 ease-out',
          hasGlassEffect ? 'rounded-2xl backdrop-blur-md border hover:shadow-xl hover:scale-[1.02] shadow-2xl' : 'rounded-lg',
          hasCoverModeImage ? 'overflow-hidden' : '' // Ensure cover images don't overflow rounded corners
        )}
        style={{
          background: hasCustomBackground 
            ? block.backgroundColor 
            : 'transparent',
          color: block.textColor || undefined,
          border: hasCustomBorder 
            ? `${block.borderWidth || 1}px solid ${block.borderColor}` 
            : hasGlassEffect && hasCustomBackground 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : undefined,
          borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
          padding: blockPadding,
          // Remove grid positioning for mobile stacking
          ...(isMobile ? {} : {
            gridColumnStart: String(block.startPosition),
            gridColumnEnd: `span ${block.width}`
          }),
          boxShadow: hasGlassEffect 
            ? hasCustomBorder && block.borderColor
              ? `0 0 20px ${block.borderColor}80, 0 0 40px ${block.borderColor}40, 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : undefined,
          minHeight: hasCoverModeImage ? '300px' : undefined, // Ensure minimum height for cover images
          ...blockPaddingStyle
        }}
      >
        <div className={cn(
          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center',
          hasCoverModeImage ? 'h-full relative' : ''
        )} style={{ 
          rowGap: hasCoverModeImage ? 0 : (block.spacing ?? 12), 
          display: hasCoverModeImage ? 'block' : 'grid',
          height: hasCoverModeImage ? '100%' : 'auto',
          position: hasCoverModeImage ? 'relative' : 'static'
        }}>
          {(block.content || []).map((item: any) => (
            <div 
              key={item.id} 
              className={item.type === 'image' && item.coverMode ? 'absolute inset-0' : ''}
              style={item.type === 'image' && item.coverMode ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}}
            >
              {renderItem(item, block.textColor, align)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center p-8 text-muted-foreground">No content configured</div>
      </div>
    )
  }

  // Get page settings with defaults
  const maxColumns = pageSettings.maxColumns || 3
  const gridGap = pageSettings.gridGap || 16
  const rowSpacing = pageSettings.rowSpacing ?? 24
  const backgroundColor = pageSettings.backgroundColor

  // Determine if we're on mobile - use multiple detection methods
  const isMobile = useMemo(() => {
    // First check deviceInfo if provided
    if (deviceInfo?.type === 'mobile') {
      return true
    }
    
    // Check deviceInfo screenSize
    if (deviceInfo?.screenSize?.width && deviceInfo.screenSize.width < 768) {
      return true
    }
    
    // Fallback to window width detection
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 768) {
        return true
      }
    }
    
    return false
  }, [deviceInfo])
  
  // Debug logging (removed for production)
  
  // Mobile-responsive grid gap
  const responsiveGridGap = isMobile ? Math.max(12, gridGap * 0.75) : gridGap
  
  // Mobile-responsive row spacing - respect 0 values
  const responsiveRowSpacing = isMobile ? (rowSpacing === 0 ? 0 : Math.max(16, rowSpacing * 0.75)) : rowSpacing

  return (
    <div 
      className="h-full flex flex-col pb-20"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className={cn("flex-1", isMobile ? "py-8" : "py-12")}>
        {rows.map((row: any, idx: number) => (
          <div key={row.id}>
            {/* Full-width row background that breaks out of container */}
            <div 
              className="w-screen relative transition-all duration-200"
              style={{
                backgroundColor: row.backgroundColor || 'transparent',
                backgroundImage: row.backgroundImage ? `url(${row.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                marginBottom: idx === rows.length - 1 ? 0 : `${responsiveRowSpacing}px`
              }}
            >
              {/* Overlay */}
              {row.backgroundImage && row.overlayColor && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: row.overlayColor,
                    opacity: (row.overlayOpacity || 50) / 100
                  }}
                />
              )}
              
              {/* Top Line - Full Width */}
              {row.topLineColor && (
                <div 
                  className="w-full relative z-20"
                  style={{
                    height: `${row.topLineWidth || 1}px`,
                    backgroundColor: row.topLineColor
                  }}
                />
              )}
              
              {/* Content - Responsive Layout */}
              <div 
                className={cn(
                  "w-full mx-auto relative z-10",
                  isMobile ? "px-4 max-w-full" : "px-6 max-w-4xl"
                )}
                style={{
                  paddingTop: formatPaddingValue(isMobile ? Math.max(12, (row.paddingTop || 16) * 0.75) : (row.paddingTop || 16)),
                  paddingBottom: formatPaddingValue(isMobile ? Math.max(12, (row.paddingBottom || 16) * 0.75) : (row.paddingBottom || 16))
                }}
              >
                <div 
                  className={cn(
                    // CSS-based responsive layout as fallback
                    "flex flex-col space-y-4 md:grid md:space-y-0",
                    // JavaScript-based override
                    isMobile ? "!flex !flex-col !space-y-4" : "!grid !space-y-0"
                  )}
                  style={{ 
                    // Grid properties for desktop
                    ...(!isMobile && {
                      gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
                      gap: `${responsiveGridGap}px`
                    }),
                    position: 'relative'
                  }}
                >

                  
                  {/* Render blocks with appropriate sorting for mobile */}
                  {isMobile ? (
                    // Mobile: Sort blocks for logical reading order
                    (row.blocks || [])
                      .sort((a: any, b: any) => {
                        // Sort by row position first, then by start position
                        const aRow = Math.floor((a.startPosition - 1) / maxColumns)
                        const bRow = Math.floor((b.startPosition - 1) / maxColumns)
                        if (aRow !== bRow) return aRow - bRow
                        return a.startPosition - b.startPosition
                      })
                      .map((block: any) => renderBlock(block, true))
                  ) : (
                    // Desktop: Render blocks in original order for grid positioning
                    (row.blocks || []).map((block: any) => renderBlock(block, false))
                  )}
                </div>
              </div>
              
              {/* Bottom Line - Full Width */}
              {row.bottomLineColor && (
                <div 
                  className="w-full relative z-20"
                  style={{
                    height: `${row.bottomLineWidth || 1}px`,
                    backgroundColor: row.bottomLineColor
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OutputAdvancedSection


