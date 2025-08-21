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

  const renderItem = (item: any, blockTextColor?: string) => {
    // Use block text color if available, otherwise fall back to campaign theme
    const textColor = blockTextColor || campaignTheme.textColor
    
    switch (item.type) {
      case 'headline':
        return (
          <h1 className={cn('font-black tracking-tight leading-tight', deviceInfo?.type === 'mobile' ? 'text-4xl' : 'text-5xl lg:text-6xl')} style={{ color: textColor }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </h1>
        )
      case 'subheading':
        return (
          <div className={cn('font-medium leading-relaxed', deviceInfo?.type === 'mobile' ? 'text-xl' : 'text-2xl lg:text-3xl')} style={{ color: `${textColor}CC` }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'h3':
        return (
          <h3 className={cn('font-semibold leading-relaxed', deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl lg:text-2xl')} style={{ color: `${textColor}DD` }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </h3>
        )
      case 'paragraph':
        return (
          <div className={cn('leading-relaxed font-medium whitespace-pre-wrap', deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: textColor }}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'divider':
        return <hr className="border-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent backdrop-blur-sm" />
      case 'button':
        const buttonHref = interpolator.interpolate((item as any).href || '#', { variables: variableMap, availableVariables: [] }).content
        const buttonText = interpolator.interpolate(item.content || 'Button', { variables: variableMap, availableVariables: [] }).content
        const buttonColor = getButtonColor(item)
        const buttonHoverColor = getButtonHoverColor(buttonColor)
        return (
          <div className="flex justify-center">
            <a 
              href={buttonHref}
              className={cn(
                "inline-flex items-center justify-center font-semibold text-center backdrop-blur-md border transition-all duration-300 ease-out",
                "hover:shadow-xl hover:scale-105 active:scale-95 shadow-2xl",
                deviceInfo?.type === 'mobile' ? 'px-6 py-3 rounded-xl text-base' : 'px-8 py-4 rounded-2xl text-lg'
              )}
              style={{
                backgroundColor: buttonColor,
                color: campaignTheme.buttonTextColor,
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
        const maxHeightStyle = (item as any).maxHeight ? { maxHeight: `${(item as any).maxHeight}px`, height: 'auto' } : {}
        return imageSrc ? (
          <img 
            src={imageSrc} 
            alt={item.alt || ''} 
            className="rounded-2xl w-full object-cover shadow-2xl" 
            style={maxHeightStyle}
          />
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

  const renderBlock = (block: any) => {
    const align = block.textAlignment || 'center'
    const hasCustomBackground = block.backgroundColor && block.backgroundColor !== 'transparent'
    const hasCustomBorder = block.borderColor
    const hasGlassEffect = block.glassEffect && (hasCustomBackground || hasCustomBorder)
    
    return (
      <div
        key={block.id}
        className={cn(
          'transition-all duration-300 ease-out',
          hasGlassEffect ? 'rounded-2xl backdrop-blur-md border hover:shadow-xl hover:scale-[1.02] shadow-2xl' : 'rounded-lg'
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
          padding: block.padding ?? 24,
          gridColumnStart: String(block.startPosition),
          gridColumnEnd: `span ${block.width}`,
          boxShadow: hasGlassEffect 
            ? hasCustomBorder && block.borderColor
              ? `0 0 20px ${block.borderColor}80, 0 0 40px ${block.borderColor}40, 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : undefined
        }}
      >
        <div className={cn(
          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
        )} style={{ rowGap: (block.spacing ?? 12), display: 'grid' }}>
          {(block.content || []).map((item: any) => (
            <div key={item.id}>{renderItem(item, block.textColor)}</div>
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
  const rowSpacing = pageSettings.rowSpacing || 24
  const backgroundColor = pageSettings.backgroundColor

  return (
    <div 
      className="h-full flex flex-col pb-20"
      style={{ backgroundColor: backgroundColor || undefined }}
    >
      <div className="flex-1 py-12 space-y-8">
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
                marginBottom: idx === rows.length - 1 ? 0 : `${rowSpacing}px`
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
              
              {/* Grid Content - Constrained Width */}
              <div 
                className="w-full max-w-4xl mx-auto relative z-10 px-6"
                style={{
                  paddingTop: `${row.paddingTop || 16}px`,
                  paddingBottom: `${row.paddingBottom || 16}px`
                }}
              >
                <div 
                  className="grid" 
                  style={{ 
                    gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
                    gap: `${gridGap}px`
                  }}
                >
                  {(row.blocks || []).map(renderBlock)}
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


