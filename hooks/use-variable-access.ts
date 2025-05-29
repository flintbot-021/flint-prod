'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { 
  extractAvailableVariablesForSection,
  type VariableInfo,
  type VariableExtractionOptions
} from '@/lib/utils/variable-extractor'

// =============================================================================
// TYPE DEFINITIONS & EXPORTS
// =============================================================================

export type { VariableInfo } from '@/lib/utils/variable-extractor'

export interface VariableAccessHookOptions {
  includePreviewValues?: boolean
  filterByType?: string[]
  excludeSectionTypes?: string[]
}

export interface VariableAccessState {
  availableVariables: VariableInfo[]
  variableMap: Map<string, VariableInfo>
  isLoading: boolean
  error?: string
}

export interface VariableSuggestion {
  variable: VariableInfo
  matchScore: number
  displayText: string
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useVariableAccess(
  sections: CampaignSection[],
  currentSectionOrder: number,
  options: VariableAccessHookOptions = {}
) {
  const [state, setState] = useState<VariableAccessState>({
    availableVariables: [],
    variableMap: new Map(),
    isLoading: true,
    error: undefined
  })

  // Extract variables when sections or options change
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const extractionOptions: VariableExtractionOptions = {
        includePreviewValues: options.includePreviewValues,
        filterByType: options.filterByType as any,
        excludeSectionTypes: options.excludeSectionTypes
      }

      const variables = extractAvailableVariablesForSection(
        sections,
        currentSectionOrder,
        extractionOptions
      )

      const variableMap = new Map<string, VariableInfo>()
      variables.forEach(variable => {
        variableMap.set(variable.name, variable)
        variableMap.set(`@${variable.name}`, variable) // Also allow @-prefixed lookup
      })

      setState({
        availableVariables: variables,
        variableMap,
        isLoading: false,
        error: undefined
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to extract variables'
      }))
    }
  }, [sections, currentSectionOrder, options.includePreviewValues, options.filterByType, options.excludeSectionTypes])

  // Memoized functions
  const functions = useMemo(() => ({
    /**
     * Get variable by name (with or without @ prefix)
     */
    getVariable: (name: string): VariableInfo | undefined => {
      return state.variableMap.get(name.startsWith('@') ? name : `@${name}`)
    },

    /**
     * Check if a variable name exists
     */
    hasVariable: (name: string): boolean => {
      return state.variableMap.has(name.startsWith('@') ? name : `@${name}`)
    },

    /**
     * Get suggestions for @-mention autocomplete
     */
    getVariableSuggestions: (query: string): VariableSuggestion[] => {
      if (!query || query.length < 1) {
        // Return all variables if no query
        return state.availableVariables.map(variable => ({
          variable,
          matchScore: 1,
          displayText: `@${variable.name}`
        }))
      }

      const normalizedQuery = query.toLowerCase().replace(/^@/, '')
      
      return state.availableVariables
        .map(variable => {
          const name = variable.name.toLowerCase()
          const displayName = variable.displayName.toLowerCase()
          
          let matchScore = 0
          
          // Exact name match gets highest score
          if (name === normalizedQuery) {
            matchScore = 100
          }
          // Name starts with query gets high score
          else if (name.startsWith(normalizedQuery)) {
            matchScore = 80
          }
          // Display name starts with query gets medium score
          else if (displayName.startsWith(normalizedQuery)) {
            matchScore = 60
          }
          // Name contains query gets lower score
          else if (name.includes(normalizedQuery)) {
            matchScore = 40
          }
          // Display name contains query gets lowest score
          else if (displayName.includes(normalizedQuery)) {
            matchScore = 20
          }
          
          return {
            variable,
            matchScore,
            displayText: `@${variable.name}`
          }
        })
        .filter(suggestion => suggestion.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
    },

    /**
     * Replace variable mentions in text with their values or placeholders
     */
    replaceVariableMentions: (
      text: string, 
      values?: Map<string, string>,
      placeholder = '{{VARIABLE}}'
    ): string => {
      return text.replace(/@(\w+)/g, (match, variableName) => {
        const variable = state.variableMap.get(`@${variableName}`)
        if (!variable) return match // Keep original if variable not found
        
        // Use provided value, preview value, or placeholder
        return values?.get(variableName) || 
               variable.previewValue || 
               placeholder.replace('{{VARIABLE}}', variableName)
      })
    },

    /**
     * Extract variable mentions from text
     */
    extractVariableMentions: (text: string): string[] => {
      const mentions = text.match(/@(\w+)/g) || []
      return mentions
        .map(mention => mention.substring(1)) // Remove @ prefix
        .filter((name, index, array) => array.indexOf(name) === index) // Remove duplicates
        .filter(name => state.variableMap.has(`@${name}`)) // Only valid variables
    },

    /**
     * Validate that all variable mentions in text exist
     */
    validateVariableMentions: (text: string): { isValid: boolean; invalidVariables: string[] } => {
      const mentions = text.match(/@(\w+)/g) || []
      const invalidVariables: string[] = []
      
      for (const mention of mentions) {
        const variableName = mention.substring(1)
        if (!state.variableMap.has(`@${variableName}`)) {
          if (!invalidVariables.includes(variableName)) {
            invalidVariables.push(variableName)
          }
        }
      }
      
      return {
        isValid: invalidVariables.length === 0,
        invalidVariables
      }
    },

    /**
     * Get variables grouped by section
     */
    getVariablesBySection: (): Record<string, VariableInfo[]> => {
      const grouped: Record<string, VariableInfo[]> = {}
      
      state.availableVariables.forEach(variable => {
        const sectionTitle = variable.sectionTitle || 'Untitled Section'
        if (!grouped[sectionTitle]) {
          grouped[sectionTitle] = []
        }
        grouped[sectionTitle].push(variable)
      })
      
      return grouped
    }
  }), [state.availableVariables, state.variableMap])

  return {
    ...state,
    ...functions
  }
}

// =============================================================================
// VARIABLE MENTIONS FUNCTIONALITY
// =============================================================================

export interface MentionState {
  isShowingSuggestions: boolean
  currentQuery: string
  selectedIndex: number
}

export interface VariableValidation {
  isValid: boolean
  invalidVariables: string[]
  validVariables: string[]
}

/**
 * Hook for managing @ mentions in text editors
 */
export function useVariableMentions(
  sections: CampaignSection[],
  currentSectionOrder: number,
  options: VariableAccessHookOptions = {}
) {
  const [mentionState, setMentionState] = useState<MentionState>({
    isShowingSuggestions: false,
    currentQuery: '',
    selectedIndex: 0
  })

  // Get base variable access functionality
  const variableAccess = useVariableAccess(sections, currentSectionOrder, options)

  // =============================================================================
  // MENTION MANAGEMENT
  // =============================================================================

  const handleMentionTrigger = useCallback((query: string) => {
    setMentionState({
      isShowingSuggestions: true,
      currentQuery: query,
      selectedIndex: 0
    })
  }, [])

  const updateMentionQuery = useCallback((query: string) => {
    setMentionState(prev => ({
      ...prev,
      currentQuery: query,
      selectedIndex: 0
    }))
  }, [])

  const hideMentionSuggestions = useCallback(() => {
    setMentionState(prev => ({
      ...prev,
      isShowingSuggestions: false,
      currentQuery: '',
      selectedIndex: 0
    }))
  }, [])

  const navigateMentionSuggestions = useCallback((direction: 'up' | 'down') => {
    setMentionState(prev => {
      const suggestions = variableAccess.getVariableSuggestions(prev.currentQuery)
      const maxIndex = suggestions.length - 1
      
      let newIndex: number
      if (direction === 'up') {
        newIndex = prev.selectedIndex > 0 ? prev.selectedIndex - 1 : maxIndex
      } else {
        newIndex = prev.selectedIndex < maxIndex ? prev.selectedIndex + 1 : 0
      }
      
      return {
        ...prev,
        selectedIndex: newIndex
      }
    })
  }, [variableAccess])

  const getSelectedSuggestion = useCallback((): VariableSuggestion | null => {
    const suggestions = variableAccess.getVariableSuggestions(mentionState.currentQuery)
    return suggestions[mentionState.selectedIndex] || null
  }, [variableAccess, mentionState])

  // =============================================================================
  // VARIABLE PROCESSING
  // =============================================================================

  const extractVariableMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@([a-zA-Z_]\w*)/g
    const matches: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match[1])
    }

    return matches
  }, [])

  const validateVariableMentions = useCallback((text: string): VariableValidation => {
    const mentions = extractVariableMentions(text)
    const availableVariableNames = variableAccess.availableVariables.map(v => v.name)
    
    const validVariables: string[] = []
    const invalidVariables: string[] = []

    mentions.forEach(mention => {
      if (availableVariableNames.includes(mention)) {
        validVariables.push(mention)
      } else {
        invalidVariables.push(mention)
      }
    })

    return {
      isValid: invalidVariables.length === 0,
      invalidVariables,
      validVariables
    }
  }, [variableAccess.availableVariables, extractVariableMentions])

  const replaceVariableMentions = useCallback((
    text: string,
    variableValues?: Record<string, any>,
    defaultValue: string = '[Variable]'
  ): string => {
    const availableVariablesMap = variableAccess.variableMap

    return text.replace(/@([a-zA-Z_]\w*)/g, (match, variableName) => {
      const variable = availableVariablesMap.get(variableName)
      
      if (!variable) {
        return match // Keep original if variable not found
      }

      // Use provided value, then preview value, then default
      if (variableValues && variableValues[variableName] !== undefined) {
        return String(variableValues[variableName])
      }
      
      if (variable.previewValue) {
        return variable.previewValue
      }
      
      return defaultValue
    })
  }, [variableAccess.variableMap])

  // =============================================================================
  // RETURN COMBINED FUNCTIONALITY
  // =============================================================================

  return {
    // Base variable access
    ...variableAccess,
    
    // Mention-specific functionality
    mentionState,
    handleMentionTrigger,
    updateMentionQuery,
    hideMentionSuggestions,
    navigateMentionSuggestions,
    getSelectedSuggestion,
    
    // Variable processing
    extractVariableMentions,
    validateVariableMentions,
    replaceVariableMentions
  }
} 