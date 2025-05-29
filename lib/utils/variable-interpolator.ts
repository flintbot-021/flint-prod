/**
 * Variable Interpolation Utility
 * 
 * Core system for processing variable references in content and replacing them
 * with actual values from user inputs and AI outputs.
 */

import { 
  VariableInterpolationContext,
  VariableReference,
  InterpolationResult,
  VariableParseResult,
  VariableCondition,
  InterpolationOptions,
  DEFAULT_INTERPOLATION_OPTIONS,
  BUILT_IN_FORMATTERS,
  VARIABLE_REFERENCE_PATTERNS
} from '@/lib/types/output-section'

// =============================================================================
// MAIN INTERPOLATION CLASS
// =============================================================================

export class VariableInterpolator {
  private options: InterpolationOptions
  private formatters: Record<string, (value: any, options?: any) => string>

  constructor(options: Partial<InterpolationOptions> = {}) {
    this.options = { ...DEFAULT_INTERPOLATION_OPTIONS, ...options }
    this.formatters = {}
    
    // Register built-in formatters
    Object.entries(BUILT_IN_FORMATTERS).forEach(([name, formatter]) => {
      this.formatters[name] = formatter.formatter
    })
  }

  // =============================================================================
  // PUBLIC INTERFACE
  // =============================================================================

  /**
   * Main interpolation method - processes content with variables
   */
  interpolate(content: string, context: VariableInterpolationContext): InterpolationResult {
    const result: InterpolationResult = {
      success: true,
      content,
      processedVariables: [],
      missingVariables: [],
      errors: [],
      warnings: [],
      usedConditionalRules: []
    }

    try {
      // Step 1: Parse variable references
      const parseResult = this.parseVariableReferences(content)
      if (parseResult.errors.length > 0) {
        result.errors.push(...parseResult.errors)
      }
      if (parseResult.warnings.length > 0) {
        result.warnings.push(...parseResult.warnings)
      }

      // Step 2: Process conditional content
      let processedContent = content
      if (this.options.enableConditionalContent) {
        processedContent = this.processConditionalContent(processedContent, context, result)
      }

      // Step 3: Replace variable references
      processedContent = this.replaceVariableReferences(processedContent, context, result)

      result.content = processedContent
      result.success = result.errors.length === 0

    } catch (error) {
      result.success = false
      result.errors.push(`Interpolation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Parse content to find all variable references
   */
  parseVariableReferences(content: string): VariableParseResult {
    const result: VariableParseResult = {
      variables: [],
      blocks: [],
      errors: [],
      warnings: []
    }

    try {
      // Find all variable patterns
      const patterns = [
        { type: 'formatted', regex: VARIABLE_REFERENCE_PATTERNS.formatted },
        { type: 'nested', regex: VARIABLE_REFERENCE_PATTERNS.nested },
        { type: 'basic', regex: VARIABLE_REFERENCE_PATTERNS.basic }
      ]

      const foundVariables = new Set<string>()

      patterns.forEach(({ type, regex }) => {
        let match
        const regexCopy = new RegExp(regex.source, regex.flags)
        
        while ((match = regexCopy.exec(content)) !== null) {
          const fullMatch = match[0]
          const variableName = match[1]
          const formatter = type === 'formatted' ? match[2] : undefined

          if (!foundVariables.has(variableName)) {
            foundVariables.add(variableName)
            
            const variableRef: VariableReference = {
              name: variableName,
              path: variableName.includes('.') ? variableName.split('.') : undefined,
              formatter: formatter
            }

            result.variables.push(variableRef)
          }
        }
      })

    } catch (error) {
      result.errors.push(`Failed to parse variable references: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Add a custom formatter
   */
  addFormatter(name: string, formatter: (value: any, options?: any) => string): void {
    this.formatters[name] = formatter
  }

  // =============================================================================
  // PRIVATE IMPLEMENTATION
  // =============================================================================

  /**
   * Process conditional content blocks
   */
  private processConditionalContent(
    content: string, 
    context: VariableInterpolationContext, 
    result: InterpolationResult
  ): string {
    const conditionalRegex = new RegExp(VARIABLE_REFERENCE_PATTERNS.conditional.source, VARIABLE_REFERENCE_PATTERNS.conditional.flags)
    
    return content.replace(conditionalRegex, (match, variableName, condition, conditionalContent) => {
      try {
        const variableValue = this.getVariableValue(variableName, context)
        const shouldShow = this.evaluateCondition(variableName, variableValue, condition, context)
        
        if (shouldShow) {
          result.usedConditionalRules.push(`if ${variableName}`)
          return conditionalContent
        } else {
          return ''
        }
      } catch (error) {
        result.warnings.push(`Failed to process conditional content for ${variableName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return match // Return original if processing fails
      }
    })
  }

  /**
   * Replace variable references with actual values
   */
  private replaceVariableReferences(
    content: string, 
    context: VariableInterpolationContext, 
    result: InterpolationResult
  ): string {
    // Process formatted variables first
    content = content.replace(VARIABLE_REFERENCE_PATTERNS.formatted, (match, variableName, formatterSpec) => {
      return this.processVariableReplacement(variableName, context, result, formatterSpec)
    })

    // Process remaining basic variables
    content = content.replace(VARIABLE_REFERENCE_PATTERNS.basic, (match, variableName) => {
      // Skip if already processed as formatted
      if (content.includes(`@${variableName} |`) || content.includes(`@${variableName}|`)) {
        return match
      }
      return this.processVariableReplacement(variableName, context, result)
    })

    return content
  }

  /**
   * Process a single variable replacement
   */
  private processVariableReplacement(
    variableName: string,
    context: VariableInterpolationContext,
    result: InterpolationResult,
    formatterSpec?: string
  ): string {
    try {
      const value = this.getVariableValue(variableName, context)
      
      if (value === undefined || value === null) {
        result.missingVariables.push(variableName)
        return this.options.missingVariablePlaceholder || `[${variableName} not found]`
      }

      result.processedVariables.push(variableName)

      // Apply formatting if specified
      if (formatterSpec && this.options.enableFormatting) {
        return this.applyFormatter(value, formatterSpec, result)
      }

      return this.formatValue(value)
    } catch (error) {
      result.errors.push(`Failed to process variable ${variableName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return `[Error: ${variableName}]`
    }
  }

  /**
   * Get variable value with nested property support
   */
  private getVariableValue(variableName: string, context: VariableInterpolationContext): any {
    if (!this.options.enableNestedAccess || !variableName.includes('.')) {
      return context.variables[variableName]
    }

    // Handle nested access like user.profile.name
    const path = variableName.split('.')
    let value = context.variables[path[0]]

    for (let i = 1; i < path.length && value !== undefined && value !== null; i++) {
      if (typeof value === 'object' && path[i] in value) {
        value = value[path[i]]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Apply formatter to a value
   */
  private applyFormatter(value: any, formatterSpec: string, result: InterpolationResult): string {
    try {
      const [formatterName, optionsStr] = formatterSpec.split(':')
      const formatter = this.formatters[formatterName]

      if (!formatter) {
        result.warnings.push(`Unknown formatter: ${formatterName}`)
        return this.formatValue(value)
      }

      let options: any = {}
      if (optionsStr) {
        try {
          // Simple options parsing (can be enhanced)
          if (optionsStr.includes('=')) {
            // Parse key=value pairs
            optionsStr.split(',').forEach(pair => {
              const [key, val] = pair.split('=')
              if (key && val) {
                options[key.trim()] = isNaN(Number(val)) ? val.trim() : Number(val)
              }
            })
          } else {
            // Single numeric option
            options = { length: Number(optionsStr) }
          }
        } catch {
          // Ignore parsing errors for options
        }
      }

      return formatter(value, options)
    } catch (error) {
      result.warnings.push(`Formatter error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return this.formatValue(value)
    }
  }

  /**
   * Basic value formatting
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  /**
   * Evaluate a condition for conditional content
   */
  private evaluateCondition(
    variableName: string,
    variableValue: any,
    conditionStr: string | undefined,
    context: VariableInterpolationContext
  ): boolean {
    // If no condition specified, just check if variable exists and is truthy
    if (!conditionStr) {
      return variableValue !== undefined && variableValue !== null && variableValue !== ''
    }

    try {
      // Parse simple conditions like "= value", "> 5", "!= null"
      const trimmed = conditionStr.trim()
      
      if (trimmed.startsWith('=')) {
        const expectedValue = trimmed.substring(1).trim()
        return String(variableValue) === expectedValue
      }
      
      if (trimmed.startsWith('!=')) {
        const expectedValue = trimmed.substring(2).trim()
        return String(variableValue) !== expectedValue
      }
      
      if (trimmed.startsWith('>')) {
        const expectedValue = trimmed.substring(1).trim()
        return Number(variableValue) > Number(expectedValue)
      }
      
      if (trimmed.startsWith('<')) {
        const expectedValue = trimmed.substring(1).trim()
        return Number(variableValue) < Number(expectedValue)
      }

      // Default to existence check
      return variableValue !== undefined && variableValue !== null && variableValue !== ''
    } catch {
      // If parsing fails, default to existence check
      return variableValue !== undefined && variableValue !== null && variableValue !== ''
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick interpolation function for simple use cases
 */
export function interpolateVariables(
  content: string, 
  variables: Record<string, any>, 
  options?: Partial<InterpolationOptions>
): InterpolationResult {
  const interpolator = new VariableInterpolator(options)
  const context: VariableInterpolationContext = {
    variables,
    availableVariables: []
  }
  
  return interpolator.interpolate(content, context)
}

/**
 * Extract all variable references from content
 */
export function extractVariableReferences(content: string): string[] {
  const interpolator = new VariableInterpolator()
  const parseResult = interpolator.parseVariableReferences(content)
  return parseResult.variables.map(v => v.name)
}

/**
 * Validate content for variable interpolation
 */
export function validateInterpolationContent(content: string, availableVariables: string[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingVariables: string[]
} {
  const references = extractVariableReferences(content)
  const availableSet = new Set(availableVariables)
  const missingVariables = references.filter(ref => !availableSet.has(ref))

  return {
    isValid: missingVariables.length === 0,
    errors: [],
    warnings: missingVariables.length > 0 ? [`Missing variables: ${missingVariables.join(', ')}`] : [],
    missingVariables
  }
}

export default VariableInterpolator 