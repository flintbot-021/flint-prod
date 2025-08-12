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
    Object.assign(map, getAITestResults() || {})
    return map
  }, [sections, userInputs])

  const rows = (config as any)?.rows || []
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
        return (
          <a className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white">
            {item.content || 'Button'}
          </a>
        )
      case 'image':
        return item.src ? (
          <img src={item.src} alt={item.alt || ''} className="rounded-lg w-full object-cover" />
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

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="flex-1 px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {rows.map((row: any, idx: number) => (
            <div key={row.id} className="grid grid-cols-3 gap-4" style={{ marginBottom: idx === rows.length - 1 ? 0 : 24 }}>
              {(row.blocks || []).map(renderBlock)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OutputAdvancedSection


