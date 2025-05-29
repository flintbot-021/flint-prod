'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Type, Hash, ToggleLeft, CheckSquare, AlertCircle, Zap } from 'lucide-react'
import { VariableSuggestionDropdown } from './variable-suggestion-dropdown'
import { useVariableMentions, type VariableSuggestion } from '@/hooks/use-variable-access'
import type { CampaignSection } from '@/lib/types/campaign-builder'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  sections: CampaignSection[]
  currentSectionOrder: number
  placeholder?: string
  className?: string
  disabled?: boolean
  minHeight?: number
  maxHeight?: number
  showValidation?: boolean
  showVariableCount?: boolean
  onValidationChange?: (validation: PromptValidation) => void
}

export interface PromptValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  variableCount: number
  invalidVariables: string[]
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PromptEditor({
  value,
  onChange,
  sections,
  currentSectionOrder,
  placeholder = 'Enter your AI prompt here... Type @ to reference variables from previous sections.',
  className,
  disabled = false,
  minHeight = 120,
  maxHeight = 400,
  showValidation = true,
  showVariableCount = true,
  onValidationChange
}: PromptEditorProps) {
  // =============================================================================
  // STATE & REFS
  // =============================================================================

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [textareaRect, setTextareaRect] = useState<DOMRect | null>(null)

  // Variable mentions hook
  const {
    availableVariables,
    getVariableSuggestions,
    mentionState,
    handleMentionTrigger,
    updateMentionQuery,
    hideMentionSuggestions,
    navigateMentionSuggestions,
    getSelectedSuggestion,
    validateVariableMentions,
    extractVariableMentions,
    replaceVariableMentions,
    isLoading
  } = useVariableMentions(sections, currentSectionOrder, {
    includePreviewValues: true
  })

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validation = React.useMemo((): PromptValidation => {
    const validationResult = validateVariableMentions(value)
    const variableMentions = extractVariableMentions(value)
    
    const errors: string[] = []
    const warnings: string[] = []

    // Check for invalid variables
    if (validationResult.invalidVariables.length > 0) {
      errors.push(`Unknown variables: ${validationResult.invalidVariables.map(v => `@${v}`).join(', ')}`)
    }

    // Check for empty prompt
    if (!value.trim()) {
      warnings.push('Prompt is empty')
    }

    // Check for very short prompts
    if (value.trim().length < 10 && value.trim().length > 0) {
      warnings.push('Prompt might be too short for effective AI responses')
    }

    // Check if using no variables (might be intentional)
    if (variableMentions.length === 0 && availableVariables.length > 0) {
      warnings.push('No variables used - consider adding context from previous sections')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      variableCount: variableMentions.length,
      invalidVariables: validationResult.invalidVariables
    }
  }, [value, availableVariables, validateVariableMentions, extractVariableMentions])

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validation)
  }, [validation, onValidationChange])

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTextChange = useCallback((newValue: string) => {
    onChange(newValue)
    
    // Check if @ was just typed
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = newValue.substring(0, cursorPos)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        // If there's an @ with only word characters after it (no spaces), show suggestions
        if (/^\w*$/.test(textAfterAt)) {
          handleMentionTrigger(textAfterAt)
          updateTextareaRect()
          return
        }
      }
    }
    
    // If @ was not typed or conditions don't match, hide suggestions
    if (mentionState.isShowingSuggestions) {
      hideMentionSuggestions()
    }
  }, [onChange, handleMentionTrigger, mentionState.isShowingSuggestions, hideMentionSuggestions])

  const updateTextareaRect = useCallback(() => {
    if (textareaRef.current) {
      setTextareaRect(textareaRef.current.getBoundingClientRect())
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!mentionState.isShowingSuggestions) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        navigateMentionSuggestions('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        navigateMentionSuggestions('down')
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        const selectedSuggestion = getSelectedSuggestion()
        if (selectedSuggestion) {
          insertVariable(selectedSuggestion)
        }
        break
      case 'Escape':
        e.preventDefault()
        hideMentionSuggestions()
        break
    }
  }, [mentionState.isShowingSuggestions, navigateMentionSuggestions, getSelectedSuggestion, hideMentionSuggestions])

  const insertVariable = useCallback((suggestion: VariableSuggestion) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const textAfterCursor = value.substring(cursorPos)
    
    // Find the @ that triggered this suggestion
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    if (lastAtIndex === -1) return

    // Replace from @ to cursor with the variable
    const newValue = 
      value.substring(0, lastAtIndex) + 
      suggestion.displayText + 
      textAfterCursor

    onChange(newValue)
    hideMentionSuggestions()

    // Set cursor after the inserted variable
    setTimeout(() => {
      const newCursorPos = lastAtIndex + suggestion.displayText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }, [value, onChange, hideMentionSuggestions])

  const handleSuggestionSelect = useCallback((suggestion: VariableSuggestion) => {
    insertVariable(suggestion)
  }, [insertVariable])

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const getPreviewText = useCallback(() => {
    if (!value) return ''
    return replaceVariableMentions(value, undefined, '[Preview Value]')
  }, [value, replaceVariableMentions])

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderValidationFeedback = () => {
    if (!showValidation || (!validation.errors.length && !validation.warnings.length)) {
      return null
    }

    return (
      <div className="mt-2 space-y-1">
        {validation.errors.map((error, index) => (
          <div key={`error-${index}`} className="flex items-center space-x-1 text-red-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        ))}
        {validation.warnings.map((warning, index) => (
          <div key={`warning-${index}`} className="flex items-center space-x-1 text-amber-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{warning}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderVariableStats = () => {
    if (!showVariableCount) return null

    return (
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3" />
          <span>{validation.variableCount} variables</span>
        </div>
        <div className="flex items-center space-x-1">
          <Type className="h-3 w-3" />
          <span>{value.length} characters</span>
        </div>
        {availableVariables.length > 0 && (
          <div className="text-gray-400">
            {availableVariables.length} available
          </div>
        )}
      </div>
    )
  }

  // Current suggestions for dropdown
  const currentSuggestions = mentionState.isShowingSuggestions 
    ? getVariableSuggestions(mentionState.currentQuery)
    : []

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Editor */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={updateTextareaRect}
          onScroll={updateTextareaRect}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[120px] resize-none font-mono text-sm leading-relaxed',
            mentionState.isShowingSuggestions && 'z-10'
          )}
          style={{ 
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`
          }}
        />

        {/* Variable Suggestions Dropdown */}
        {mentionState.isShowingSuggestions && currentSuggestions.length > 0 && (
          <VariableSuggestionDropdown
            suggestions={currentSuggestions}
            selectedIndex={mentionState.selectedIndex}
            onSelect={handleSuggestionSelect}
            className="top-full left-0 mt-1"
          />
        )}
      </div>

      {/* Stats and Validation */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {renderValidationFeedback()}
        </div>
        {renderVariableStats()}
      </div>

      {/* Preview Section */}
      {value && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Preview with sample values:</div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border font-mono whitespace-pre-wrap">
            {getPreviewText() || 'No preview available'}
          </div>
        </div>
      )}

      {/* Available Variables Hint */}
      {availableVariables.length > 0 && !value && (
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
          <strong>Tip:</strong> Type @ to reference variables from previous sections. 
          Available: {availableVariables.slice(0, 3).map(v => `@${v.name}`).join(', ')}
          {availableVariables.length > 3 && ` and ${availableVariables.length - 3} more...`}
        </div>
      )}
    </div>
  )
}

export default PromptEditor 