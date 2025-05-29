/**
 * Error Handling System
 * 
 * Comprehensive error handling for the Variable Interpolation Engine
 * with structured error types, recovery strategies, and UI-friendly
 * error messages with debugging context.
 */

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

export enum ErrorSeverity {
  /** Information - no action required */
  INFO = 'info',
  /** Warning - operation succeeded but with issues */
  WARNING = 'warning',
  /** Error - operation failed but recoverable */
  ERROR = 'error',
  /** Critical - system-level failure requiring intervention */
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  /** Variable resolution and dependency issues */
  VARIABLE = 'variable',
  /** Expression parsing and evaluation errors */
  EXPRESSION = 'expression',
  /** AI API and external service failures */
  API = 'api',
  /** Dependency graph and circular reference issues */
  DEPENDENCY = 'dependency',
  /** System and configuration errors */
  SYSTEM = 'system',
  /** Performance and resource issues */
  PERFORMANCE = 'performance'
}

export interface ErrorContext {
  /** Location where error occurred */
  location?: {
    file?: string
    function?: string
    line?: number
    section?: string
    variable?: string
  }
  /** Stack trace for debugging */
  stackTrace?: string
  /** Additional context data */
  metadata?: Record<string, any>
  /** Related variable IDs */
  relatedVariables?: string[]
  /** Dependency chain context */
  dependencyChain?: string[]
  /** User session information */
  sessionId?: string
  /** Campaign context */
  campaignId?: string
}

export interface RecoveryAction {
  /** Action type identifier */
  type: 'retry' | 'fallback' | 'skip' | 'manual' | 'reset'
  /** Human-readable description */
  description: string
  /** Automated recovery function */
  execute?: () => Promise<any>
  /** Manual recovery instructions */
  instructions?: string
  /** Recovery success probability */
  successProbability?: number
}

export interface VariableError extends Error {
  /** Unique error identifier */
  id: string
  /** Error severity level */
  severity: ErrorSeverity
  /** Error category */
  category: ErrorCategory
  /** User-friendly error message */
  userMessage: string
  /** Technical error message for developers */
  technicalMessage: string
  /** Error context and debugging information */
  context: ErrorContext
  /** Suggested recovery actions */
  recoveryActions: RecoveryAction[]
  /** Timestamp when error occurred */
  timestamp: Date
  /** Whether error is recoverable */
  recoverable: boolean
  /** Related errors (for error chains) */
  relatedErrors?: VariableError[]
}

// =============================================================================
// SPECIFIC ERROR CLASSES
// =============================================================================

export class VariableNotFoundError extends Error implements VariableError {
  readonly id: string
  readonly severity = ErrorSeverity.ERROR
  readonly category = ErrorCategory.VARIABLE
  readonly timestamp = new Date()
  readonly recoverable = true

  constructor(
    public variableId: string,
    public context: ErrorContext = {},
    public relatedErrors?: VariableError[]
  ) {
    super(`Variable '${variableId}' not found`)
    this.name = 'VariableNotFoundError'
    this.id = `var_not_found_${variableId}_${Date.now()}`
  }

  get userMessage(): string {
    return `The variable "${this.variableId}" is not available. This might happen if the variable hasn't been defined yet or was removed.`
  }

  get technicalMessage(): string {
    return `Variable resolution failed: Variable '${this.variableId}' not found in variable registry. Context: ${JSON.stringify(this.context, null, 2)}`
  }

  get recoveryActions(): RecoveryAction[] {
    return [
      {
        type: 'fallback',
        description: 'Use default value',
        execute: async () => ({ defaultValue: '' }),
        successProbability: 0.9
      },
      {
        type: 'manual',
        description: 'Define the missing variable',
        instructions: `Create a variable with ID "${this.variableId}" in the campaign builder`,
        successProbability: 1.0
      },
      {
        type: 'skip',
        description: 'Skip this variable and continue',
        execute: async () => ({ skipped: true }),
        successProbability: 0.7
      }
    ]
  }
}

export class ExpressionSyntaxError extends Error implements VariableError {
  readonly id: string
  readonly severity = ErrorSeverity.ERROR
  readonly category = ErrorCategory.EXPRESSION
  readonly timestamp = new Date()
  readonly recoverable = true

  constructor(
    public expression: string,
    public syntaxError: string,
    public context: ErrorContext = {},
    public relatedErrors?: VariableError[]
  ) {
    super(`Syntax error in expression: ${syntaxError}`)
    this.name = 'ExpressionSyntaxError'
    this.id = `expr_syntax_${Date.now()}`
  }

  get userMessage(): string {
    return `There's a syntax error in the expression "${this.expression}". ${this.syntaxError}`
  }

  get technicalMessage(): string {
    return `Expression parsing failed: ${this.syntaxError} in expression "${this.expression}". Context: ${JSON.stringify(this.context, null, 2)}`
  }

  get recoveryActions(): RecoveryAction[] {
    return [
      {
        type: 'fallback',
        description: 'Use expression as plain text',
        execute: async () => ({ fallbackValue: this.expression }),
        successProbability: 0.8
      },
      {
        type: 'manual',
        description: 'Fix the expression syntax',
        instructions: `Correct the syntax error: ${this.syntaxError}`,
        successProbability: 1.0
      }
    ]
  }
}

export class APIServiceError extends Error implements VariableError {
  readonly id: string
  readonly severity: ErrorSeverity
  readonly category = ErrorCategory.API
  readonly timestamp = new Date()
  readonly recoverable: boolean

  constructor(
    public service: string,
    public operation: string,
    public statusCode?: number,
    public context: ErrorContext = {},
    public relatedErrors?: VariableError[]
  ) {
    super(`API service error: ${service} ${operation}`)
    this.name = 'APIServiceError'
    this.id = `api_error_${service}_${Date.now()}`
    this.severity = statusCode && statusCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR
    this.recoverable = statusCode ? statusCode < 500 : true
  }

  get userMessage(): string {
    if (this.statusCode) {
      return `The ${this.service} service is currently unavailable (Error ${this.statusCode}). Please try again in a few moments.`
    }
    return `Unable to connect to ${this.service} service. Please check your internet connection.`
  }

  get technicalMessage(): string {
    return `API call failed: ${this.service} ${this.operation} returned ${this.statusCode || 'unknown error'}. Context: ${JSON.stringify(this.context, null, 2)}`
  }

  get recoveryActions(): RecoveryAction[] {
    const actions: RecoveryAction[] = [
      {
        type: 'retry',
        description: 'Retry the API call',
        execute: async () => ({ retry: true }),
        successProbability: this.statusCode && this.statusCode >= 500 ? 0.3 : 0.7
      }
    ]

    if (this.recoverable) {
      actions.push({
        type: 'fallback',
        description: 'Use cached or default response',
        execute: async () => ({ fallbackValue: 'Service temporarily unavailable' }),
        successProbability: 0.9
      })
    }

    return actions
  }
}

export class CircularDependencyError extends Error implements VariableError {
  readonly id: string
  readonly severity = ErrorSeverity.ERROR
  readonly category = ErrorCategory.DEPENDENCY
  readonly timestamp = new Date()
  readonly recoverable = false

  constructor(
    public dependencyChain: string[],
    public context: ErrorContext = {},
    public relatedErrors?: VariableError[]
  ) {
    super(`Circular dependency detected: ${dependencyChain.join(' -> ')}`)
    this.name = 'CircularDependencyError'
    this.id = `circular_dep_${Date.now()}`
  }

  get userMessage(): string {
    return `There's a circular dependency in your variables: ${this.dependencyChain.join(' → ')}. Variables cannot depend on themselves.`
  }

  get technicalMessage(): string {
    return `Circular dependency detected in dependency chain: ${this.dependencyChain.join(' -> ')}. Context: ${JSON.stringify(this.context, null, 2)}`
  }

  get recoveryActions(): RecoveryAction[] {
    return [
      {
        type: 'manual',
        description: 'Remove circular dependency',
        instructions: `Remove the dependency that creates the circle: ${this.dependencyChain.join(' → ')}`,
        successProbability: 1.0
      },
      {
        type: 'skip',
        description: 'Skip affected variables',
        execute: async () => ({ skippedVariables: this.dependencyChain }),
        successProbability: 0.5
      }
    ]
  }
}

export class PerformanceError extends Error implements VariableError {
  readonly id: string
  readonly severity = ErrorSeverity.WARNING
  readonly category = ErrorCategory.PERFORMANCE
  readonly timestamp = new Date()
  readonly recoverable = true

  constructor(
    public operation: string,
    public actualTime: number,
    public threshold: number,
    public context: ErrorContext = {},
    public relatedErrors?: VariableError[]
  ) {
    super(`Performance threshold exceeded: ${operation} took ${actualTime}ms (threshold: ${threshold}ms)`)
    this.name = 'PerformanceError'
    this.id = `perf_error_${operation}_${Date.now()}`
  }

  get userMessage(): string {
    return `The operation "${this.operation}" is taking longer than expected. This might affect campaign performance.`
  }

  get technicalMessage(): string {
    return `Performance threshold exceeded: ${this.operation} took ${this.actualTime}ms (threshold: ${this.threshold}ms). Context: ${JSON.stringify(this.context, null, 2)}`
  }

  get recoveryActions(): RecoveryAction[] {
    return [
      {
        type: 'retry',
        description: 'Retry with optimization',
        execute: async () => ({ optimized: true }),
        successProbability: 0.6
      },
      {
        type: 'fallback',
        description: 'Use cached result if available',
        execute: async () => ({ useCached: true }),
        successProbability: 0.8
      }
    ]
  }
}

// =============================================================================
// ERROR HANDLER CLASS
// =============================================================================

export interface ErrorHandlerConfig {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Retry delay in milliseconds */
  retryDelay: number
  /** Performance thresholds */
  performanceThresholds: {
    variableResolution: number
    expressionEvaluation: number
    apiCall: number
  }
  /** Enable automatic recovery */
  autoRecovery: boolean
  /** Log errors to console */
  logErrors: boolean
  /** Custom error handlers */
  customHandlers?: Record<string, (error: VariableError) => Promise<any>>
}

export class ErrorHandler {
  private errorHistory: VariableError[] = []
  private retryCounters = new Map<string, number>()
  private errorListeners: Array<(error: VariableError) => void> = []

  constructor(private config: ErrorHandlerConfig) {}

  /**
   * Handle an error with recovery strategies
   */
  async handleError(error: VariableError): Promise<any> {
    // Add to error history
    this.errorHistory.push(error)

    // Notify listeners
    this.notifyErrorListeners(error)

    // Log error if enabled
    if (this.config.logErrors) {
      this.logError(error)
    }

    // Attempt recovery if enabled
    if (this.config.autoRecovery && error.recoverable) {
      return this.attemptRecovery(error)
    }

    // Re-throw if no recovery possible
    throw error
  }

  /**
   * Create a structured error from a generic error
   */
  createError(
    originalError: Error,
    category: ErrorCategory,
    context: ErrorContext = {}
  ): VariableError {
    const baseError: VariableError = {
      ...originalError,
      id: `error_${category}_${Date.now()}`,
      severity: ErrorSeverity.ERROR,
      category,
      userMessage: this.generateUserFriendlyMessage(originalError, category),
      technicalMessage: originalError.message,
      context: {
        ...context,
        stackTrace: originalError.stack
      },
      recoveryActions: this.generateRecoveryActions(originalError, category),
      timestamp: new Date(),
      recoverable: true
    }

    return baseError
  }

  /**
   * Wrap a function with error handling
   */
  withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> {
    return operation().catch(async (error) => {
      const structuredError = error instanceof Error && 'category' in error
        ? error as VariableError
        : this.createError(error, ErrorCategory.SYSTEM, context)

      return this.handleError(structuredError)
    })
  }

  /**
   * Add error listener
   */
  onError(listener: (error: VariableError) => void): void {
    this.errorListeners.push(listener)
  }

  /**
   * Remove error listener
   */
  offError(listener: (error: VariableError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): VariableError[] {
    return [...this.errorHistory]
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = []
    this.retryCounters.clear()
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number
    errorsByCategory: Record<ErrorCategory, number>
    errorsBySeverity: Record<ErrorSeverity, number>
    recoverySuccessRate: number
  } {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoverySuccessRate: 0
    }

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0
    })

    // Count errors
    let recoveredErrors = 0
    for (const error of this.errorHistory) {
      stats.errorsByCategory[error.category]++
      stats.errorsBySeverity[error.severity]++
      if (error.recoverable) recoveredErrors++
    }

    // Calculate recovery success rate
    const recoverableErrors = this.errorHistory.filter(e => e.recoverable).length
    stats.recoverySuccessRate = recoverableErrors > 0 ? recoveredErrors / recoverableErrors : 0

    return stats
  }

  private async attemptRecovery(error: VariableError): Promise<any> {
    const retryKey = error.id.split('_').slice(0, -1).join('_') // Remove timestamp
    const retryCount = this.retryCounters.get(retryKey) || 0

    if (retryCount >= this.config.maxRetries) {
      throw new Error(`Max retries exceeded for ${retryKey}`)
    }

    // Try recovery actions in order of success probability
    const sortedActions = error.recoveryActions.sort(
      (a, b) => (b.successProbability || 0) - (a.successProbability || 0)
    )

    for (const action of sortedActions) {
      if (action.execute) {
        try {
          this.retryCounters.set(retryKey, retryCount + 1)
          
          if (action.type === 'retry') {
            await this.delay(this.config.retryDelay)
          }

          const result = await action.execute()
          console.log(`Recovery successful for ${error.id} using ${action.type}`)
          return result

        } catch (recoveryError) {
          console.warn(`Recovery action ${action.type} failed for ${error.id}:`, recoveryError)
          continue
        }
      }
    }

    // If all recovery actions failed, throw the original error
    throw error
  }

  private generateUserFriendlyMessage(error: Error, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.VARIABLE:
        return 'There was an issue accessing a variable. Please check that all required variables are defined.'
      case ErrorCategory.EXPRESSION:
        return 'There was a problem with an expression in your campaign. Please check the syntax.'
      case ErrorCategory.API:
        return 'There was a problem connecting to an external service. Please try again.'
      case ErrorCategory.DEPENDENCY:
        return 'There was an issue with variable dependencies. Please check for circular references.'
      case ErrorCategory.SYSTEM:
        return 'A system error occurred. Please contact support if this persists.'
      case ErrorCategory.PERFORMANCE:
        return 'An operation is taking longer than expected. Performance may be affected.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  private generateRecoveryActions(error: Error, category: ErrorCategory): RecoveryAction[] {
    const commonActions: RecoveryAction[] = [
      {
        type: 'retry',
        description: 'Try again',
        successProbability: 0.5
      }
    ]

    switch (category) {
      case ErrorCategory.API:
        return [
          ...commonActions,
          {
            type: 'fallback',
            description: 'Use cached data',
            successProbability: 0.8
          }
        ]
      case ErrorCategory.VARIABLE:
        return [
          {
            type: 'fallback',
            description: 'Use default value',
            successProbability: 0.9
          },
          {
            type: 'skip',
            description: 'Skip this variable',
            successProbability: 0.7
          }
        ]
      default:
        return commonActions
    }
  }

  private logError(error: VariableError): void {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' :
                    error.severity === ErrorSeverity.ERROR ? 'error' :
                    error.severity === ErrorSeverity.WARNING ? 'warn' : 'info'

    console[logLevel](`[${error.category.toUpperCase()}] ${error.userMessage}`, {
      id: error.id,
      technical: error.technicalMessage,
      context: error.context,
      recoverable: error.recoverable,
      timestamp: error.timestamp
    })
  }

  private notifyErrorListeners(error: VariableError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error listener failed:', listenerError)
      }
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create default error handler
 */
export function createErrorHandler(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
  const defaultConfig: ErrorHandlerConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    performanceThresholds: {
      variableResolution: 5000,
      expressionEvaluation: 3000,
      apiCall: 10000
    },
    autoRecovery: true,
    logErrors: true,
    ...config
  }

  return new ErrorHandler(defaultConfig)
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = createErrorHandler() 