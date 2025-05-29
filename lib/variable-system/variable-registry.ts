/**
 * Variable Registry Implementation
 * 
 * Centralized registry for managing variables across campaign sections.
 * Provides type-safe variable storage, validation, and dependency tracking.
 */

import {
  VariableRegistry,
  VariableMetadata,
  VariableValidationResult,
  VariableValidationRule,
  VariableType
} from '../types/variable-system'

/**
 * Variable registry implementation with in-memory storage
 */
export class VariableRegistryImpl implements VariableRegistry {
  private variables = new Map<string, VariableMetadata>()
  private values = new Map<string, any>()
  private dependencies = new Map<string, Set<string>>()
  private dependents = new Map<string, Set<string>>()

  /**
   * Register a new variable
   */
  register(metadata: Omit<VariableMetadata, 'createdAt' | 'updatedAt'>): void {
    const now = new Date()
    const fullMetadata: VariableMetadata = {
      ...metadata,
      createdAt: now,
      updatedAt: now
    }

    // Validate metadata
    this.validateMetadata(fullMetadata)

    // Check for conflicts
    if (this.variables.has(metadata.id)) {
      throw new Error(`Variable '${metadata.id}' is already registered`)
    }

    // Store metadata
    this.variables.set(metadata.id, fullMetadata)

    // Initialize with default value if provided
    if (metadata.defaultValue !== undefined) {
      this.values.set(metadata.id, metadata.defaultValue)
    }

    console.log(`Variable registered: ${metadata.id} (${metadata.type})`)
  }

  /**
   * Unregister a variable
   */
  unregister(variableId: string): void {
    if (!this.variables.has(variableId)) {
      throw new Error(`Variable '${variableId}' is not registered`)
    }

    // Remove from all maps
    this.variables.delete(variableId)
    this.values.delete(variableId)
    this.dependencies.delete(variableId)
    this.dependents.delete(variableId)

    // Remove from other variables' dependency lists
    for (const [id, deps] of this.dependencies.entries()) {
      deps.delete(variableId)
    }
    for (const [id, deps] of this.dependents.entries()) {
      deps.delete(variableId)
    }

    console.log(`Variable unregistered: ${variableId}`)
  }

  /**
   * Get variable metadata
   */
  getVariable(variableId: string): VariableMetadata | undefined {
    return this.variables.get(variableId)
  }

  /**
   * Get all variables
   */
  getAllVariables(): VariableMetadata[] {
    return Array.from(this.variables.values())
  }

  /**
   * Get variables by namespace
   */
  getVariablesByNamespace(namespace: string): VariableMetadata[] {
    return Array.from(this.variables.values()).filter(
      variable => variable.namespace === namespace
    )
  }

  /**
   * Get variables by source section
   */
  getVariablesBySource(sectionId: string): VariableMetadata[] {
    return Array.from(this.variables.values()).filter(
      variable => variable.sourceSection === sectionId
    )
  }

  /**
   * Set variable value
   */
  setValue(variableId: string, value: any): void {
    const metadata = this.variables.get(variableId)
    if (!metadata) {
      throw new Error(`Variable '${variableId}' is not registered`)
    }

    // Validate value
    const validationResult = this.validateValue(variableId, value)
    if (!validationResult.isValid) {
      throw new Error(`Invalid value for variable '${variableId}': ${validationResult.errors.join(', ')}`)
    }

    // Store value
    this.values.set(variableId, value)

    // Update metadata timestamp
    metadata.updatedAt = new Date()

    console.log(`Variable value updated: ${variableId} = ${JSON.stringify(value)}`)
  }

  /**
   * Get variable value
   */
  getValue(variableId: string): any {
    if (!this.variables.has(variableId)) {
      throw new Error(`Variable '${variableId}' is not registered`)
    }

    const value = this.values.get(variableId)
    const metadata = this.variables.get(variableId)!

    // Return default value if no value set
    return value !== undefined ? value : metadata.defaultValue
  }

  /**
   * Check if variable exists
   */
  hasVariable(variableId: string): boolean {
    return this.variables.has(variableId)
  }

  /**
   * Validate variable value
   */
  validateValue(variableId: string, value: any): VariableValidationResult {
    const metadata = this.variables.get(variableId)
    if (!metadata) {
      return {
        isValid: false,
        errors: [`Variable '${variableId}' is not registered`],
        warnings: []
      }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // Type validation
    if (!this.validateType(value, metadata.type)) {
      errors.push(`Expected type ${metadata.type}, got ${typeof value}`)
    }

    // Required validation
    if (metadata.required && (value === null || value === undefined || value === '')) {
      errors.push(`Variable '${variableId}' is required`)
    }

    // Custom validation rules
    if (metadata.validation) {
      for (const rule of metadata.validation) {
        const ruleResult = this.validateRule(value, rule)
        if (!ruleResult.isValid) {
          errors.push(...ruleResult.errors)
          warnings.push(...ruleResult.warnings)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Clear all variables
   */
  clear(): void {
    this.variables.clear()
    this.values.clear()
    this.dependencies.clear()
    this.dependents.clear()
    console.log('Variable registry cleared')
  }

  /**
   * Get variable dependencies
   */
  getDependencies(variableId: string): string[] {
    return Array.from(this.dependencies.get(variableId) || [])
  }

  /**
   * Get dependent variables
   */
  getDependents(variableId: string): string[] {
    return Array.from(this.dependents.get(variableId) || [])
  }

  // Private helper methods

  private validateMetadata(metadata: VariableMetadata): void {
    if (!metadata.id) {
      throw new Error('Variable ID is required')
    }
    if (!metadata.name) {
      throw new Error('Variable name is required')
    }
    if (!metadata.sourceSection) {
      throw new Error('Variable source section is required')
    }
    if (!this.isValidVariableType(metadata.type)) {
      throw new Error(`Invalid variable type: ${metadata.type}`)
    }
  }

  private validateType(value: any, type: VariableType): boolean {
    if (value === null || value === undefined) {
      return true // Null/undefined are valid for optional fields
    }

    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && !Array.isArray(value)
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value))
      case 'email':
        return typeof value === 'string' && this.isValidEmail(value)
      case 'phone':
        return typeof value === 'string' && this.isValidPhone(value)
      case 'url':
        return typeof value === 'string' && this.isValidUrl(value)
      default:
        return false
    }
  }

  private validateRule(value: any, rule: VariableValidationRule): VariableValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    switch (rule.type) {
      case 'min_length':
        if (typeof value === 'string' && value.length < rule.config.length) {
          errors.push(rule.message || `Minimum length is ${rule.config.length}`)
        }
        break

      case 'max_length':
        if (typeof value === 'string' && value.length > rule.config.length) {
          errors.push(rule.message || `Maximum length is ${rule.config.length}`)
        }
        break

      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.config.pattern).test(value)) {
          errors.push(rule.message || 'Value does not match required pattern')
        }
        break

      case 'range':
        if (typeof value === 'number') {
          if (rule.config.min !== undefined && value < rule.config.min) {
            errors.push(rule.message || `Value must be at least ${rule.config.min}`)
          }
          if (rule.config.max !== undefined && value > rule.config.max) {
            errors.push(rule.message || `Value must be at most ${rule.config.max}`)
          }
        }
        break

      case 'custom':
        if (rule.config.validator && typeof rule.config.validator === 'function') {
          try {
            const result = rule.config.validator(value)
            if (!result) {
              errors.push(rule.message || 'Custom validation failed')
            }
          } catch (error) {
            errors.push(rule.message || `Custom validation error: ${error}`)
          }
        }
        break

      default:
        warnings.push(`Unknown validation rule type: ${rule.type}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private isValidVariableType(type: string): type is VariableType {
    const validTypes: VariableType[] = [
      'string', 'number', 'boolean', 'array', 'object', 
      'date', 'email', 'phone', 'url'
    ]
    return validTypes.includes(type as VariableType)
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Singleton instance of the variable registry
 */
export const variableRegistry = new VariableRegistryImpl() 