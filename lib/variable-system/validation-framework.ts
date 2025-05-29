/**
 * Enhanced Variable Validation Framework
 * 
 * Provides composable validators, schema validation, and advanced
 * validation patterns for the variable system.
 */

import {
  VariableType,
  VariableValidationResult,
  VariableValidationRule,
  ExecutionContext
} from '../types/variable-system'

// =============================================================================
// VALIDATION BUILDER TYPES
// =============================================================================

export interface ValidatorConfig {
  message?: string
  stopOnFirstError?: boolean
  async?: boolean
}

export interface ValidatorFunction<T = any> {
  (value: T, context?: ExecutionContext): boolean | Promise<boolean>
}

export interface AsyncValidatorFunction<T = any> {
  (value: T, context?: ExecutionContext): Promise<boolean>
}

export interface ValidationSchema {
  type: VariableType
  required?: boolean
  validators?: CompositeValidator[]
  properties?: Record<string, ValidationSchema>
  items?: ValidationSchema
}

export interface CrossVariableValidator {
  name: string
  variables: string[]
  validator: (values: Record<string, any>, context?: ExecutionContext) => boolean | Promise<boolean>
  message?: string
}

// =============================================================================
// VALIDATION FRAMEWORK CLASSES
// =============================================================================

/**
 * Base validator class
 */
export abstract class BaseValidator {
  protected config: ValidatorConfig

  constructor(config: ValidatorConfig = {}) {
    this.config = {
      stopOnFirstError: false,
      async: false,
      ...config
    }
  }

  abstract validate(value: any, context?: ExecutionContext): boolean | Promise<boolean>

  getErrorMessage(value: any): string {
    return this.config.message || `Validation failed for value: ${value}`
  }

  isAsync(): boolean {
    return this.config.async === true
  }
}

/**
 * Composite validator that combines multiple validators
 */
export class CompositeValidator extends BaseValidator {
  private validators: BaseValidator[] = []

  constructor(config: ValidatorConfig = {}) {
    super(config)
  }

  addValidator(validator: BaseValidator): this {
    this.validators.push(validator)
    if (validator.isAsync()) {
      this.config.async = true
    }
    return this
  }

  addValidators(validators: BaseValidator[]): this {
    validators.forEach(v => this.addValidator(v))
    return this
  }

  async validate(value: any, context?: ExecutionContext): Promise<boolean> {
    for (const validator of this.validators) {
      const result = await validator.validate(value, context)
      if (!result && this.config.stopOnFirstError) {
        return false
      }
      if (!result) {
        return false
      }
    }
    return true
  }

  async validateWithDetails(value: any, context?: ExecutionContext): Promise<VariableValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(value, context)
        if (!result) {
          errors.push(validator.getErrorMessage(value))
          if (this.config.stopOnFirstError) {
            break
          }
        }
      } catch (error) {
        errors.push(`Validation error: ${error}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// =============================================================================
// BUILT-IN VALIDATORS
// =============================================================================

/**
 * String length validator
 */
export class StringLengthValidator extends BaseValidator {
  constructor(
    private minLength?: number,
    private maxLength?: number,
    config: ValidatorConfig = {}
  ) {
    super(config)
  }

  validate(value: any): boolean {
    if (typeof value !== 'string') return false
    
    if (this.minLength !== undefined && value.length < this.minLength) {
      return false
    }
    
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return false
    }
    
    return true
  }

  getErrorMessage(value: any): string {
    if (this.config.message) return this.config.message
    
    const length = typeof value === 'string' ? value.length : 'N/A'
    return `String length ${length} is not between ${this.minLength || 0} and ${this.maxLength || '∞'}`
  }
}

/**
 * Number range validator
 */
export class NumberRangeValidator extends BaseValidator {
  constructor(
    private min?: number,
    private max?: number,
    config: ValidatorConfig = {}
  ) {
    super(config)
  }

  validate(value: any): boolean {
    if (typeof value !== 'number' || isNaN(value)) return false
    
    if (this.min !== undefined && value < this.min) {
      return false
    }
    
    if (this.max !== undefined && value > this.max) {
      return false
    }
    
    return true
  }

  getErrorMessage(value: any): string {
    if (this.config.message) return this.config.message
    
    return `Number ${value} is not between ${this.min || '-∞'} and ${this.max || '∞'}`
  }
}

/**
 * Pattern validator using regular expressions
 */
export class PatternValidator extends BaseValidator {
  private regex: RegExp

  constructor(pattern: string | RegExp, config: ValidatorConfig = {}) {
    super(config)
    this.regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  }

  validate(value: any): boolean {
    if (typeof value !== 'string') return false
    return this.regex.test(value)
  }

  getErrorMessage(value: any): string {
    if (this.config.message) return this.config.message
    return `Value "${value}" does not match required pattern`
  }
}

/**
 * Custom function validator
 */
export class CustomValidator extends BaseValidator {
  constructor(
    private validatorFn: ValidatorFunction,
    config: ValidatorConfig = {}
  ) {
    super(config)
  }

  async validate(value: any, context?: ExecutionContext): Promise<boolean> {
    try {
      const result = this.validatorFn(value, context)
      return result instanceof Promise ? await result : result
    } catch (error) {
      console.error('Custom validator error:', error)
      return false
    }
  }
}

/**
 * Array validator
 */
export class ArrayValidator extends BaseValidator {
  constructor(
    private itemValidator?: BaseValidator,
    private minItems?: number,
    private maxItems?: number,
    config: ValidatorConfig = {}
  ) {
    super(config)
  }

  async validate(value: any, context?: ExecutionContext): Promise<boolean> {
    if (!Array.isArray(value)) return false
    
    if (this.minItems !== undefined && value.length < this.minItems) {
      return false
    }
    
    if (this.maxItems !== undefined && value.length > this.maxItems) {
      return false
    }
    
    if (this.itemValidator) {
      for (const item of value) {
        const result = await this.itemValidator.validate(item, context)
        if (!result) return false
      }
    }
    
    return true
  }

  getErrorMessage(value: any): string {
    if (this.config.message) return this.config.message
    
    const length = Array.isArray(value) ? value.length : 'N/A'
    return `Array length ${length} is not between ${this.minItems || 0} and ${this.maxItems || '∞'}`
  }
}

/**
 * Object schema validator
 */
export class ObjectValidator extends BaseValidator {
  constructor(
    private schema: Record<string, BaseValidator>,
    private allowAdditionalProperties: boolean = true,
    config: ValidatorConfig = {}
  ) {
    super(config)
  }

  async validate(value: any, context?: ExecutionContext): Promise<boolean> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }
    
    // Validate required properties
    for (const [key, validator] of Object.entries(this.schema)) {
      if (!(key in value)) {
        return false // Required property missing
      }
      
      const result = await validator.validate(value[key], context)
      if (!result) return false
    }
    
    // Check for additional properties
    if (!this.allowAdditionalProperties) {
      const allowedKeys = new Set(Object.keys(this.schema))
      for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
          return false
        }
      }
    }
    
    return true
  }
}

// =============================================================================
// VALIDATION FRAMEWORK
// =============================================================================

/**
 * Main validation framework class
 */
export class ValidationFramework {
  private validators = new Map<string, CompositeValidator>()
  private crossVariableValidators: CrossVariableValidator[] = []
  private schemas = new Map<string, ValidationSchema>()

  /**
   * Register a validator for a variable type
   */
  registerValidator(variableId: string, validator: CompositeValidator): void {
    this.validators.set(variableId, validator)
  }

  /**
   * Register a schema for a variable type
   */
  registerSchema(variableId: string, schema: ValidationSchema): void {
    this.schemas.set(variableId, schema)
    
    // Create validator from schema
    const validator = this.createValidatorFromSchema(schema)
    this.validators.set(variableId, validator)
  }

  /**
   * Add cross-variable validator
   */
  addCrossVariableValidator(validator: CrossVariableValidator): void {
    this.crossVariableValidators.push(validator)
  }

  /**
   * Validate a single variable
   */
  async validateVariable(
    variableId: string, 
    value: any, 
    context?: ExecutionContext
  ): Promise<VariableValidationResult> {
    const validator = this.validators.get(variableId)
    if (!validator) {
      return { isValid: true, errors: [], warnings: [] }
    }

    return await validator.validateWithDetails(value, context)
  }

  /**
   * Validate multiple variables with cross-variable validation
   */
  async validateVariables(
    variables: Record<string, any>,
    context?: ExecutionContext
  ): Promise<VariableValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate individual variables
    for (const [variableId, value] of Object.entries(variables)) {
      const result = await this.validateVariable(variableId, value, context)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }

    // Run cross-variable validators
    for (const crossValidator of this.crossVariableValidators) {
      try {
        const requiredVars = crossValidator.variables.reduce((acc, varId) => {
          if (varId in variables) {
            acc[varId] = variables[varId]
          }
          return acc
        }, {} as Record<string, any>)

        if (Object.keys(requiredVars).length === crossValidator.variables.length) {
          const result = await crossValidator.validator(requiredVars, context)
          if (!result) {
            errors.push(crossValidator.message || `Cross-variable validation failed: ${crossValidator.name}`)
          }
        }
      } catch (error) {
        errors.push(`Cross-variable validation error: ${error}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Create validator from schema
   */
  private createValidatorFromSchema(schema: ValidationSchema): CompositeValidator {
    const validator = new CompositeValidator()

    // Add type validation
    validator.addValidator(new CustomValidator((value) => {
      return this.validateType(value, schema.type)
    }, { message: `Expected type ${schema.type}` }))

    // Add custom validators from schema
    if (schema.validators) {
      validator.addValidators(schema.validators)
    }

    return validator
  }

  private validateType(value: any, type: VariableType): boolean {
    switch (type) {
      case 'string': return typeof value === 'string'
      case 'number': return typeof value === 'number' && !isNaN(value)
      case 'boolean': return typeof value === 'boolean'
      case 'array': return Array.isArray(value)
      case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'date': return value instanceof Date || !isNaN(Date.parse(value))
      case 'email': return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone': return typeof value === 'string' && /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))
      case 'url': {
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      }
      default: return false
    }
  }
}

// =============================================================================
// VALIDATION BUILDER UTILITIES
// =============================================================================

/**
 * Fluent builder for creating validators
 */
export class ValidationBuilder {
  private validator = new CompositeValidator()

  string(minLength?: number, maxLength?: number): this {
    this.validator.addValidator(new StringLengthValidator(minLength, maxLength))
    return this
  }

  number(min?: number, max?: number): this {
    this.validator.addValidator(new NumberRangeValidator(min, max))
    return this
  }

  pattern(regex: string | RegExp, message?: string): this {
    this.validator.addValidator(new PatternValidator(regex, { message }))
    return this
  }

  custom(fn: ValidatorFunction, message?: string): this {
    this.validator.addValidator(new CustomValidator(fn, { message }))
    return this
  }

  array(itemValidator?: BaseValidator, minItems?: number, maxItems?: number): this {
    this.validator.addValidator(new ArrayValidator(itemValidator, minItems, maxItems))
    return this
  }

  required(message?: string): this {
    this.validator.addValidator(new CustomValidator(
      (value) => value !== null && value !== undefined && value !== '',
      { message: message || 'This field is required' }
    ))
    return this
  }

  build(): CompositeValidator {
    return this.validator
  }
}

/**
 * Factory function for creating validation builder
 */
export function validate(): ValidationBuilder {
  return new ValidationBuilder()
}

/**
 * Singleton validation framework instance
 */
export const validationFramework = new ValidationFramework() 