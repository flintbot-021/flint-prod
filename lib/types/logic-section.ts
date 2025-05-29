/**
 * Logic Section Types
 * 
 * Types for AI prompt building system with variable access and output definitions
 */

// =============================================================================
// OUTPUT DEFINITION TYPES
// =============================================================================

export type OutputDataType = 'text' | 'number' | 'boolean' | 'json' | 'array'

export interface OutputDefinition {
  id: string
  name: string
  description: string
  dataType: OutputDataType
  required: boolean
  validation?: OutputValidationRule[]
  format?: OutputFormat
  defaultValue?: any
}

export interface OutputValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom'
  value: any
  message?: string
}

export interface OutputFormat {
  // For text outputs
  maxLength?: number
  minLength?: number
  
  // For number outputs
  precision?: number
  range?: { min: number; max: number }
  
  // For array outputs
  itemType?: OutputDataType
  maxItems?: number
  minItems?: number
  
  // For JSON outputs
  schema?: Record<string, any>
}

// =============================================================================
// LOGIC SECTION CONFIGURATION
// =============================================================================

export interface LogicSectionSettings {
  title: string
  description?: string
  prompt: string
  outputDefinitions: OutputDefinition[]
  aiProvider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeout?: number
  retryConfig?: {
    maxRetries: number
    backoffMs: number
  }
}

export interface LogicSectionData extends LogicSectionSettings {
  lastResponse?: AIResponse
  processingHistory?: AIProcessingRecord[]
}

// =============================================================================
// AI RESPONSE TYPES
// =============================================================================

export interface AIResponse {
  id: string
  timestamp: string
  rawResponse: string
  extractedOutputs: Record<string, any>
  processingTimeMs: number
  model: string
  provider: string
  tokenUsage?: {
    input: number
    output: number
    total: number
  }
  cost?: {
    amount: number
    currency: string
  }
  success: boolean
  error?: string
}

export interface AIProcessingRecord {
  id: string
  timestamp: string
  inputs: Record<string, any>
  prompt: string
  response?: AIResponse
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

// =============================================================================
// OUTPUT EXTRACTION TYPES
// =============================================================================

export interface OutputExtractionConfig {
  method: 'json' | 'structured' | 'regex' | 'natural'
  patterns?: Record<string, string | RegExp>
  jsonPath?: Record<string, string>
  structuredFormat?: string
  naturalLanguageInstructions?: string
}

export interface OutputExtractionResult {
  outputs: Record<string, any>
  success: boolean
  errors: string[]
  warnings: string[]
  rawResponse: string
  extractionMethod: string
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface OutputDefinitionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  duplicateNames: string[]
  invalidNames: string[]
}

export interface LogicSectionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  promptValidation?: {
    hasVariables: boolean
    invalidVariables: string[]
    estimatedLength: number
  }
  outputValidation?: OutputDefinitionValidation
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface CreateOutputDefinition {
  name: string
  description: string
  dataType: OutputDataType
  required?: boolean
  validation?: OutputValidationRule[]
  format?: OutputFormat
}

export interface UpdateOutputDefinition extends Partial<CreateOutputDefinition> {
  id: string
}

export type OutputDefinitionField = keyof OutputDefinition

export interface OutputDefinitionFormData {
  name: string
  description: string
  dataType: OutputDataType
  required: boolean
  validation: OutputValidationRule[]
  format: OutputFormat
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const OUTPUT_DATA_TYPES: { value: OutputDataType; label: string; description: string }[] = [
  { 
    value: 'text', 
    label: 'Text', 
    description: 'Free-form text response' 
  },
  { 
    value: 'number', 
    label: 'Number', 
    description: 'Numeric value (integer or decimal)' 
  },
  { 
    value: 'boolean', 
    label: 'Boolean', 
    description: 'True/false value' 
  },
  { 
    value: 'json', 
    label: 'JSON Object', 
    description: 'Structured JSON data' 
  },
  { 
    value: 'array', 
    label: 'Array', 
    description: 'List of values' 
  }
]

export const VALIDATION_RULE_TYPES = [
  { value: 'min', label: 'Minimum Value/Length' },
  { value: 'max', label: 'Maximum Value/Length' },
  { value: 'pattern', label: 'Regular Expression Pattern' },
  { value: 'enum', label: 'Allowed Values List' },
  { value: 'custom', label: 'Custom Validation Function' }
] as const

export const DEFAULT_OUTPUT_DEFINITION: Partial<OutputDefinition> = {
  dataType: 'text',
  required: true,
  validation: [],
  format: {}
} 