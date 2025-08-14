'use client'

import React, { useMemo } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'

export function OutputAdvancedSection({ section, config, userInputs = {}, sections = [], deviceInfo, campaign }: SectionRendererProps) {
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
  const pageSettings = (config as any)?.settings || {}
  const interpolator = useMemo(() => new VariableInterpolator(), [])

  const renderItem = (item: any) => {
    switch (item.type) {
      case 'headline':
        return (
          <h1 className={cn('font-bold', deviceInfo?.type === 'mobile' ? 'text-3xl' : 'text-4xl')}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </h1>
        )
      case 'subheading':
        return (
          <div className={cn('text-muted-foreground', deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl')}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'paragraph':
        return (
          <div className={cn('leading-relaxed', deviceInfo?.type === 'mobile' ? 'text-base' : 'text-lg')}>
            {interpolator.interpolate(item.content || '', { variables: variableMap, availableVariables: [] }).content}
          </div>
        )
      case 'divider':
        return <hr className="border-input" />
      case 'button':
        const buttonHref = interpolator.interpolate((item as any).href || '#', { variables: variableMap, availableVariables: [] }).content
        const buttonText = interpolator.interpolate(item.content || 'Button', { variables: variableMap, availableVariables: [] }).content
        return (
          <div className="flex justify-center">
            <a 
              href={buttonHref}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium text-center hover:bg-blue-700 transition-colors"
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
            className="rounded-lg w-full object-cover" 
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
    return (
      <div
        key={block.id}
        className={cn('rounded-lg')}
        style={{
          background: block.backgroundColor || 'transparent',
          color: block.textColor || undefined,
          border: block.borderColor ? `1px solid ${block.borderColor}` : undefined,
          borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
          padding: block.padding ?? 24,
          gridColumnStart: String(block.startPosition),
          gridColumnEnd: `span ${block.width}`,
        }}
      >
        <div className={cn(
          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
        )} style={{ rowGap: (block.spacing ?? 12), display: 'grid' }}>
          {(block.content || []).map((item: any) => (
            <div key={item.id}>{renderItem(item)}</div>
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
      <div className="flex-1 px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {rows.map((row: any, idx: number) => (
            <div 
              key={row.id} 
              className="grid gap-4" 
              style={{ 
                gridTemplateColumns: `repeat(${maxColumns}, 1fr)`,
                gap: `${gridGap}px`,
                marginBottom: idx === rows.length - 1 ? 0 : `${rowSpacing}px`
              }}
            >
              {(row.blocks || []).map(renderBlock)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OutputAdvancedSection


