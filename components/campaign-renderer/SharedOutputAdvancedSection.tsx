'use client'

import React, { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { getCampaignTheme, getMobileClasses } from './utils'
import { Button } from '@/components/ui/button'
import { PoweredByFlint } from '@/components/ui/powered-by-flint'

interface SharedOutputAdvancedSectionProps {
  campaign: Campaign
  sharedData: {
    aiResults: Record<string, any>
    sectionConfig?: Record<string, any>
    campaignId: string
    timestamp: number
  }
  config: Record<string, any>
}

export function SharedOutputAdvancedSection({
  campaign,
  sharedData,
  config
}: SharedOutputAdvancedSectionProps) {
  
  // Get campaign theme colors
  const campaignTheme = getCampaignTheme(campaign)

  // Build variable map from AI results only
  const variableMap = useMemo(() => {
    const map: Record<string, any> = {}
    
    // Only use AI results - no user input data stored
    if (sharedData.aiResults) {
      Object.entries(sharedData.aiResults).forEach(([key, value]) => {
        map[key] = String(value)
      })
    }
    
    console.log('🔍 Shared results variable map (AI results only):', map)
    return map
  }, [sharedData.aiResults])

  // Simple variable interpolation function
  const interpolateText = (text: string): string => {
    if (!text || typeof text !== 'string') return text || ''
    
    let result = text
    
    // Replace @variable patterns
    Object.entries(variableMap).forEach(([key, value]) => {
      result = result.replace(new RegExp(`@${key}\\b`, 'g'), String(value))
    })
    
    return result
  }

  // Helper functions for responsive units
  const pxToRem = (px: number): number => px / 16
  const formatPaddingValue = (value: number): string => `${pxToRem(value)}rem`
  
  // Helper function to convert hex color and opacity to rgba
  const hexToRgba = (hex: string, opacity: number = 1): string => {
    hex = hex.replace('#', '')
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Helper function to generate button hover color
  const getButtonHoverColor = (baseColor: string) => {
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

  const renderItem = (item: any, blockTextColor?: string, align: 'left' | 'center' | 'right' = 'center') => {
    const textColor = blockTextColor || campaignTheme.textColor
    
    switch (item.type) {
      case 'headline':
        return (
          <h1 className="font-black tracking-tight leading-tight text-4xl sm:text-5xl lg:text-6xl" 
              style={{ color: textColor }}>
            {interpolateText(item.content || '')}
          </h1>
        )
      case 'subheading':
        return (
          <div className="font-medium leading-relaxed text-xl sm:text-2xl lg:text-3xl" 
               style={{ color: `${textColor}CC` }}>
            {interpolateText(item.content || '')}
          </div>
        )
      case 'h3':
        return (
          <h3 className="font-semibold leading-relaxed text-lg sm:text-xl lg:text-2xl" 
              style={{ color: `${textColor}DD` }}>
            {interpolateText(item.content || '')}
          </h3>
        )
      case 'paragraph':
        return (
          <div className="leading-relaxed font-medium whitespace-pre-wrap text-lg sm:text-xl" 
               style={{ color: textColor }}>
            {interpolateText(item.content || '')}
          </div>
        )
      case 'divider':
        const dividerColor = hexToRgba(item.color || '#e5e7eb', item.opacity ?? 1)
        const dividerThickness = item.thickness ?? 1
        const dividerStyle = item.style || 'solid'
        const dividerPaddingTop = formatPaddingValue(item.paddingTop ?? 12)
        const dividerPaddingBottom = formatPaddingValue(item.paddingBottom ?? 12)
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
        const buttonHref = interpolateText(item.href || '#')
        const buttonText = interpolateText(item.content || 'Button')
        const buttonColor = item.color || campaignTheme.buttonColor
        const buttonTextColor = item.textColor || campaignTheme.buttonTextColor
        const buttonHoverColor = getButtonHoverColor(buttonColor)
        const buttonAlignment = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
        return (
          <div className={`flex ${buttonAlignment}`}>
            <a 
              href={buttonHref}
              className="inline-flex items-center justify-center font-semibold text-center backdrop-blur-md border transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 active:scale-95 shadow-2xl px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg"
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
        const imageSrc = interpolateText(item.src || '')
        const isCoverMode = item.coverMode
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
          : item.maxHeight 
            ? { maxHeight: `${item.maxHeight}px`, height: 'auto', objectFit: 'cover' as const }
            : { objectFit: 'cover' as const }
        
        return imageSrc ? (
          isCoverMode ? (
            <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
              <img 
                src={imageSrc} 
                alt={item.alt || ''} 
                className={cn(
                  "rounded-2xl",
                  item.showShadow !== false ? "shadow-2xl" : ""
                )} 
                style={imageStyle}
              />
            </div>
          ) : (
            <img 
              src={imageSrc} 
              alt={item.alt || ''} 
              className={cn(
                "rounded-2xl w-full",
                item.showShadow !== false ? "shadow-2xl" : ""
              )} 
              style={imageStyle}
            />
          )
        ) : null
      case 'numbered-list':
        return (
          <ol className="list-decimal pl-5 space-y-1">
            {(item.items || []).map((li: string, idx: number) => (
              <li key={idx}>{interpolateText(li)}</li>
            ))}
          </ol>
        )
      case 'bullet-list':
        return (
          <ul className="list-disc pl-5 space-y-1">
            {(item.items || []).map((li: string, idx: number) => (
              <li key={idx}>{interpolateText(li)}</li>
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
    
    const hasCoverModeImage = (block.content || []).some((item: any) => item.type === 'image' && item.coverMode)
    
    const paddingTop = block.paddingTop ?? block.padding ?? 24
    const paddingBottom = block.paddingBottom ?? block.padding ?? 24
    const paddingLeft = block.paddingLeft ?? block.padding ?? 24
    const paddingRight = block.paddingRight ?? block.padding ?? 24
    
    const blockPadding = hasCoverModeImage 
      ? 0
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
          hasCoverModeImage ? 'overflow-hidden' : ''
        )}
        style={{
          background: hasCustomBackground ? block.backgroundColor : 'transparent',
          color: block.textColor || undefined,
          border: hasCustomBorder 
            ? `${block.borderWidth || 1}px solid ${block.borderColor}` 
            : hasGlassEffect && hasCustomBackground 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : undefined,
          borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
          padding: blockPadding,
          ...(isMobile ? {} : {
            gridColumnStart: String(block.startPosition),
            gridColumnEnd: `span ${block.width}`
          }),
          boxShadow: hasGlassEffect 
            ? hasCustomBorder && block.borderColor
              ? `0 0 20px ${block.borderColor}80, 0 0 40px ${block.borderColor}40, 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : undefined,
          minHeight: hasCoverModeImage ? '300px' : undefined,
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

  const rows = config?.rows || []
  const pageSettings = config?.pageSettings || {}

  if (!rows || rows.length === 0) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center p-8 text-muted-foreground">
          <p>No results to display</p>
        </div>
      </div>
    )
  }

  const maxColumns = pageSettings.maxColumns || 3
  const gridGap = pageSettings.gridGap || 16
  const rowSpacing = pageSettings.rowSpacing ?? 24
  const backgroundColor = pageSettings.backgroundColor

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const responsiveGridGap = isMobile ? Math.max(12, gridGap * 0.75) : gridGap
  const responsiveRowSpacing = isMobile ? (rowSpacing === 0 ? 0 : Math.max(16, rowSpacing * 0.75)) : rowSpacing

  const handleTryThisTool = () => {
    const campaignUrl = `/c/${(campaign as any).user_key}/${campaign.published_url}`
    window.open(campaignUrl, '_blank')
  }

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className={cn("flex-1", isMobile ? "py-8" : "py-12")}>
        {rows.map((row: any, idx: number) => (
          <div key={row.id}>
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
              {row.backgroundImage && row.overlayColor && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: row.overlayColor,
                    opacity: (row.overlayOpacity || 50) / 100
                  }}
                />
              )}
              
              {row.topLineColor && (
                <div 
                  className="w-full relative z-20"
                  style={{
                    height: `${row.topLineWidth || 1}px`,
                    backgroundColor: row.topLineColor
                  }}
                />
              )}
              
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
                    "flex flex-col space-y-4 md:grid md:space-y-0",
                    isMobile ? "!flex !flex-col !space-y-4" : "!grid !space-y-0"
                  )}
                  style={{ 
                    ...(!isMobile && {
                      gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
                      gap: `${responsiveGridGap}px`
                    }),
                    position: 'relative'
                  }}
                >
                  {isMobile ? (
                    (row.blocks || [])
                      .sort((a: any, b: any) => {
                        const aRow = Math.floor((a.startPosition - 1) / maxColumns)
                        const bRow = Math.floor((b.startPosition - 1) / maxColumns)
                        if (aRow !== bRow) return aRow - bRow
                        return a.startPosition - b.startPosition
                      })
                      .map((block: any) => renderBlock(block, true))
                  ) : (
                    (row.blocks || []).map((block: any) => renderBlock(block, false))
                  )}
                </div>
              </div>
              
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

      {/* Bottom Action Bar */}
      <div 
        className="w-full backdrop-blur-xl border-t shadow-2xl mt-8"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <PoweredByFlint variant="dark" size="sm" showIcon={false} />
            
            <Button
              onClick={handleTryThisTool}
              className="px-6 py-3 rounded-xl font-semibold backdrop-blur-md border transition-all duration-300 ease-out flex items-center space-x-2 hover:shadow-xl hover:scale-105 active:scale-95"
              style={{
                backgroundColor: campaignTheme.buttonColor,
                color: campaignTheme.buttonTextColor,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Try This Tool</span>
            </Button>
            
            {/* Spacer to balance the layout */}
            <div className="w-[120px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
