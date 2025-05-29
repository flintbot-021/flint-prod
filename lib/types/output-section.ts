/**
 * Output Section Types
 * 
 * Types for output sections that display personalized results combining
 * user inputs and AI-generated outputs with variable interpolation.
 */

import { CampaignSection } from './campaign-builder'
import { VariableInfo } from '@/lib/utils/variable-extractor'

// =============================================================================
// CORE OUTPUT SECTION TYPES
// =============================================================================

export interface OutputSectionSettings {
  title: string
  content: string
  template?: string
  variables?: string[]
  showScore?: boolean
  fileUrl?: string
  fileName?: string
  url?: string
  delay?: number
  message?: string
  enableVariableInterpolation?: boolean
  formatting?: OutputFormattingOptions
  conditionalContent?: ConditionalContentRule[]
}

export interface OutputFormattingOptions {
  dateFormat?: string
  numberFormat?: {
    style?: 'decimal' | 'currency' | 'percent'
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  customFormatters?: Record<string, (value: any) => string>
}

// =============================================================================
// VARIABLE INTERPOLATION TYPES
// =============================================================================

export interface VariableInterpolationContext {
  variables: Record<string, any>
  availableVariables: VariableInfo[]
  formatters?: Record<string, (value: any) => string>
  conditionalRules?: ConditionalContentRule[]
}

export interface VariableReference {
  name: string
  path?: string[] // For nested object access like @user.profile.name
  formatter?: string
  defaultValue?: any
  condition?: VariableCondition
}

export interface VariableCondition {
  type: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value?: any
  variableName?: string
}

// =============================================================================
// CONDITIONAL CONTENT TYPES
// =============================================================================

export interface ConditionalContentRule {
  id: string
  condition: VariableCondition
  content: string
  priority: number
  fallbackContent?: string
}

export interface ContentBlock {
  id: string
  type: 'text' | 'variable' | 'conditional' | 'formatted'
  content: string
  variable?: VariableReference
  condition?: VariableCondition
  formatting?: OutputFormattingOptions
}

// =============================================================================
// INTERPOLATION RESULT TYPES
// =============================================================================

export interface InterpolationResult {
  success: boolean
  content: string
  processedVariables: string[]
  missingVariables: string[]
  errors: string[]
  warnings: string[]
  usedConditionalRules: string[]
}

export interface VariablePreviewContext {
  variables: Record<string, any>
  previewMode: boolean
  showMissingVariables: boolean
  highlightVariables: boolean
}

// =============================================================================
// OUTPUT SECTION COMPONENT TYPES
// =============================================================================

export interface OutputSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  variableContext?: VariableInterpolationContext
  previewContext?: VariablePreviewContext
}

export interface VariableInterpolatorProps {
  content: string
  context: VariableInterpolationContext
  onUpdate?: (result: InterpolationResult) => void
  className?: string
  enableRealTimePreview?: boolean
}

// =============================================================================
// PARSING AND VALIDATION TYPES
// =============================================================================

export interface VariableParseResult {
  variables: VariableReference[]
  blocks: ContentBlock[]
  errors: string[]
  warnings: string[]
}

export interface OutputValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingVariables: string[]
  unresolvedReferences: string[]
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface VariableFormatter {
  name: string
  description: string
  example: string
  formatter: (value: any, options?: any) => string
}

export interface InterpolationOptions {
  enableConditionalContent?: boolean
  enableFormatting?: boolean
  enableNestedAccess?: boolean
  strictMode?: boolean
  maxDepth?: number
  missingVariablePlaceholder?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_INTERPOLATION_OPTIONS: InterpolationOptions = {
  enableConditionalContent: true,
  enableFormatting: true,
  enableNestedAccess: true,
  strictMode: false,
  maxDepth: 5,
  missingVariablePlaceholder: '[variable not found]'
}

export const BUILT_IN_FORMATTERS: Record<string, VariableFormatter> = {
  uppercase: {
    name: 'uppercase',
    description: 'Convert text to uppercase',
    example: '@name | uppercase',
    formatter: (value: any) => String(value).toUpperCase()
  },
  lowercase: {
    name: 'lowercase',
    description: 'Convert text to lowercase',
    example: '@name | lowercase',
    formatter: (value: any) => String(value).toLowerCase()
  },
  capitalize: {
    name: 'capitalize',
    description: 'Capitalize first letter of each word',
    example: '@name | capitalize',
    formatter: (value: any) => String(value).replace(/\b\w/g, l => l.toUpperCase())
  },
  currency: {
    name: 'currency',
    description: 'Format number as currency',
    example: '@price | currency',
    formatter: (value: any, options = { currency: 'USD' }) => {
      const num = Number(value)
      return isNaN(num) ? String(value) : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: options.currency
      }).format(num)
    }
  },
  date: {
    name: 'date',
    description: 'Format date value',
    example: '@created_at | date',
    formatter: (value: any, options = { dateStyle: 'medium' }) => {
      const date = new Date(value)
      return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', options)
    }
  },
  truncate: {
    name: 'truncate',
    description: 'Truncate text to specified length',
    example: '@description | truncate:100',
    formatter: (value: any, options = { length: 50 }) => {
      const str = String(value)
      return str.length > options.length ? str.substring(0, options.length) + '...' : str
    }
  }
}

export const VARIABLE_REFERENCE_PATTERNS = {
  // Basic variable: @variableName
  basic: /@([a-zA-Z_][a-zA-Z0-9_]*)/g,
  
  // Nested variable: @user.profile.name
  nested: /@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
  
  // Variable with formatter: @variableName | formatter
  formatted: /@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\|\s*([a-zA-Z_][a-zA-Z0-9_]*(?::[^@\|\}]+)?)/g,
  
  // Conditional variable: {if @variableName}content{/if}
  conditional: /\{if\s+@([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*([=!<>]+\s*[^}]+)?\}([\s\S]*?)\{\/if\}/g
} 