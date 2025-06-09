'use client'

import { useState, useCallback, useRef } from 'react'
import { VariableContext } from '@/components/campaign-renderer/types'

// =============================================================================
// VARIABLE ENGINE HOOK
// =============================================================================

interface VariableEngineReturn {
  context: VariableContext
  updateContext: (updates: Partial<VariableContext>) => void
  interpolateText: (text: string) => Promise<string>
  processVariables: (content: string, additionalContext?: Record<string, any>) => Promise<string>
  clearContext: () => void
}

export function useVariableEngine(
  initialContext?: Partial<VariableContext>
): VariableEngineReturn {
  const [context, setContext] = useState<VariableContext>(() => ({
    leadData: {},
    campaignData: {},
    sessionData: {},
    ...initialContext
  }))

  const processingCacheRef = useRef<Map<string, string>>(new Map())

  const updateContext = useCallback((updates: Partial<VariableContext>) => {
    setContext(prev => ({
      leadData: { ...prev.leadData, ...updates.leadData },
      campaignData: { ...prev.campaignData, ...updates.campaignData },
      sessionData: { ...prev.sessionData, ...updates.sessionData }
    }))
    
    // Clear cache when context changes
    processingCacheRef.current.clear()
  }, [])

  const interpolateText = useCallback(async (text: string): Promise<string> => {
    if (!text) return text

    // Check cache first
    const cacheKey = `${text}:${JSON.stringify(context)}`
    const cached = processingCacheRef.current.get(cacheKey)
    if (cached) return cached

    try {
      let result = text

      // Simple variable interpolation using regex
      // Matches patterns like {{variable.path}} or {variable}
      const variableRegex = /\{\{?([^}]+)\}?\}/g
      
      result = result.replace(variableRegex, (match, variablePath) => {
        const trimmedPath = variablePath.trim()
        
        // Try to resolve the variable path
        const value = resolveVariablePath(trimmedPath, context)
        
        if (value !== undefined) {
          return String(value)
        }
        
        // Return original if not found
        return match
      })

      // Cache the result
      processingCacheRef.current.set(cacheKey, result)
      
      return result
    } catch (error) {
      console.error('Variable interpolation error:', error)
      return text // Return original text on error
    }
  }, [context])

  const processVariables = useCallback(async (
    content: string, 
    additionalContext?: Record<string, any>
  ): Promise<string> => {
    if (!content) return content

    // Merge additional context if provided
    const mergedContext: VariableContext = additionalContext ? {
      leadData: { ...context.leadData, ...additionalContext },
      campaignData: { ...context.campaignData },
      sessionData: { ...context.sessionData }
    } : context

    // Use temporary context for processing
    const originalContext = context
    if (additionalContext) {
      setContext(mergedContext)
    }

    try {
      const result = await interpolateText(content)
      return result
    } finally {
      // Restore original context if we temporarily changed it
      if (additionalContext) {
        setContext(originalContext)
      }
    }
  }, [context, interpolateText])

  const clearContext = useCallback(() => {
    setContext({
      leadData: {},
      campaignData: {},
      sessionData: {}
    })
    processingCacheRef.current.clear()
  }, [])

  return {
    context,
    updateContext,
    interpolateText,
    processVariables,
    clearContext
  }
}

// Helper function to resolve nested variable paths
function resolveVariablePath(path: string, context: VariableContext): any {
  const parts = path.split('.')
  let current: any = context

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }

  return current
} 