'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Hash, Type, ToggleLeft, CheckSquare, User, Mail, Phone, Calendar, Upload } from 'lucide-react'
import type { VariableSuggestion, VariableInfo } from '@/hooks/use-variable-access'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface VariableSuggestionDropdownProps {
  suggestions: VariableSuggestion[]
  selectedIndex: number
  onSelect: (suggestion: VariableSuggestion) => void
  className?: string
  maxHeight?: number
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getVariableIcon(variable: VariableInfo) {
  switch (variable.type) {
    case 'number':
      return Hash
    case 'boolean':
      return ToggleLeft
    case 'array':
      return CheckSquare
    default:
      return Type
  }
}

function getSectionIcon(sectionType: string) {
  switch (sectionType) {
    case 'question-text':
      return Type
    case 'question-multiple-choice':
      return CheckSquare
    case 'question-slider':
      return Hash
    case 'question-date-time':
      return Calendar
    case 'question-upload':
      return Upload
    case 'capture':
      return User
    default:
      return Type
  }
}

function getVariableTypeColor(type: string): string {
  switch (type) {
    case 'text':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'number':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'boolean':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'array':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

function getFieldIcon(variableName: string) {
  if (variableName.includes('email')) return Mail
  if (variableName.includes('phone')) return Phone
  if (variableName.includes('name')) return User
  return Type
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VariableSuggestionDropdown({
  suggestions,
  selectedIndex,
  onSelect,
  className,
  maxHeight = 300
}: VariableSuggestionDropdownProps) {
  if (suggestions.length === 0) {
    return (
      <div className={cn(
        "absolute z-50 w-full min-w-[300px] overflow-hidden rounded-md border bg-background p-4 shadow-md",
        className
      )}>
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          No variables available
        </div>
      </div>
    )
  }

  // Group suggestions by section
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const sectionTitle = suggestion.variable.sectionTitle || 'Untitled Section'
    if (!groups[sectionTitle]) {
      groups[sectionTitle] = []
    }
    groups[sectionTitle].push(suggestion)
    return groups
  }, {} as Record<string, VariableSuggestion[]>)

  return (
    <div className={cn(
      "absolute z-50 w-full min-w-[400px] overflow-hidden rounded-md border bg-background shadow-lg",
      className
    )}>
      <div 
        className="overflow-y-auto" 
        style={{ maxHeight }}
      >
        {Object.entries(groupedSuggestions).map(([sectionTitle, sectionSuggestions]) => {
          const firstVariable = sectionSuggestions[0]?.variable
          const SectionIcon = firstVariable ? getSectionIcon(firstVariable.sectionType) : Type
          
          return (
            <div key={sectionTitle} className="border-b border-gray-100 last:border-b-0">
              {/* Section Header */}
              <div className="px-3 py-2 bg-muted border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <SectionIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {sectionTitle}
                  </span>
                </div>
              </div>

              {/* Section Variables */}
              {sectionSuggestions.map((suggestion) => {
                const globalIndex = suggestions.findIndex(s => s === suggestion)
                const isSelected = globalIndex === selectedIndex
                const variable = suggestion.variable
                const VariableIcon = getVariableIcon(variable)
                const FieldIcon = getFieldIcon(variable.name)

                return (
                  <div
                    key={variable.id}
                    onClick={() => onSelect(suggestion)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-muted transition-colors",
                      isSelected && "bg-blue-50 border-blue-100"
                    )}
                  >
                    {/* Variable Icon */}
                    <div className="flex-shrink-0">
                      {variable.sectionType === 'capture' ? (
                        <FieldIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <VariableIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Variable Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono font-medium text-foreground">
                          {suggestion.displayText}
                        </code>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getVariableTypeColor(variable.type))}
                        >
                          {variable.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {variable.description}
                      </div>
                    </div>

                    {/* Preview Value */}
                    {variable.previewValue && (
                      <div className="flex-shrink-0">
                        <div className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded font-mono max-w-[120px] truncate">
                          {variable.previewValue}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// VARIANT COMPONENTS
// =============================================================================

/**
 * Compact version for smaller spaces
 */
export function VariableSuggestionDropdownCompact({
  suggestions,
  selectedIndex,
  onSelect,
  className,
  maxHeight = 200
}: VariableSuggestionDropdownProps) {
  if (suggestions.length === 0) {
    return (
      <div className={cn(
        "absolute z-50 w-full min-w-[250px] overflow-hidden rounded-md border bg-background p-3 shadow-md",
        className
      )}>
        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          No variables available
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "absolute z-50 w-full min-w-[250px] overflow-hidden rounded-md border bg-background shadow-lg",
      className
    )}>
      <div 
        className="overflow-y-auto" 
        style={{ maxHeight }}
      >
        {suggestions.map((suggestion, index) => {
          const isSelected = index === selectedIndex
          const variable = suggestion.variable
          const VariableIcon = getVariableIcon(variable)

          return (
            <div
              key={variable.id}
              onClick={() => onSelect(suggestion)}
              className={cn(
                "flex items-center space-x-2 px-2 py-1.5 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-muted transition-colors text-sm",
                isSelected && "bg-blue-50 border-blue-100"
              )}
            >
              <VariableIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <code className="font-mono font-medium text-foreground flex-1">
                {suggestion.displayText}
              </code>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getVariableTypeColor(variable.type))}
              >
                {variable.type}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VariableSuggestionDropdown 