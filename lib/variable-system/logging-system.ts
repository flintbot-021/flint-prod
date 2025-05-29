/**
 * Logging System
 * 
 * Comprehensive logging system for the Variable Interpolation Engine
 * with configurable verbosity levels, structured logging, and 
 * debugging hooks for development and troubleshooting.
 */

// =============================================================================
// LOGGING TYPES AND INTERFACES
// =============================================================================

export enum LogLevel {
  /** Detailed debug information */
  DEBUG = 0,
  /** General information */
  INFO = 1,
  /** Warning conditions */
  WARN = 2,
  /** Error conditions */
  ERROR = 3,
  /** Critical conditions requiring immediate attention */
  CRITICAL = 4,
  /** No logging */
  SILENT = 5
}

export enum LogCategory {
  /** Variable resolution and management */
  VARIABLE = 'variable',
  /** Expression parsing and evaluation */
  EXPRESSION = 'expression',
  /** Dependency tracking and resolution */
  DEPENDENCY = 'dependency',
  /** Real-time updates and events */
  REALTIME = 'realtime',
  /** Performance and caching */
  PERFORMANCE = 'performance',
  /** API calls and external services */
  API = 'api',
  /** Error handling and recovery */
  ERROR = 'error',
  /** System and configuration */
  SYSTEM = 'system'
}

export interface LogEntry {
  /** Unique log entry ID */
  id: string
  /** Log level */
  level: LogLevel
  /** Log category */
  category: LogCategory
  /** Log message */
  message: string
  /** Timestamp when logged */
  timestamp: Date
  /** Additional structured data */
  data?: Record<string, any>
  /** Error object if applicable */
  error?: Error
  /** Session ID */
  sessionId?: string
  /** Campaign ID */
  campaignId?: string
  /** Variable ID if relevant */
  variableId?: string
  /** Source location */
  source?: {
    file?: string
    function?: string
    line?: number
  }
  /** Performance metrics */
  metrics?: {
    duration?: number
    memoryUsage?: number
    operationId?: string
  }
}

export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel
  /** Categories to log */
  categories: LogCategory[] | '*'
  /** Output targets */
  outputs: LogOutput[]
  /** Maximum log entries to keep in memory */
  maxEntries: number
  /** Whether to include stack traces */
  includeStackTrace: boolean
  /** Custom formatters */
  formatters?: Record<string, LogFormatter>
  /** Performance tracking */
  trackPerformance: boolean
}

export interface LogOutput {
  /** Output identifier */
  id: string
  /** Output type */
  type: 'console' | 'file' | 'remote' | 'buffer'
  /** Minimum level for this output */
  level?: LogLevel
  /** Categories for this output */
  categories?: LogCategory[]
  /** Formatter to use */
  formatter?: string
  /** Output configuration */
  config?: Record<string, any>
}

export type LogFormatter = (entry: LogEntry) => string

// =============================================================================
// BUILT-IN FORMATTERS
// =============================================================================

export const defaultFormatter: LogFormatter = (entry: LogEntry): string => {
  const timestamp = entry.timestamp.toISOString()
  const level = LogLevel[entry.level].padEnd(8)
  const category = entry.category.toUpperCase().padEnd(12)
  
  let message = `[${timestamp}] ${level} ${category} ${entry.message}`
  
  if (entry.variableId) {
    message += ` (variable: ${entry.variableId})`
  }
  
  if (entry.metrics?.duration) {
    message += ` (${entry.metrics.duration}ms)`
  }
  
  return message
}

export const jsonFormatter: LogFormatter = (entry: LogEntry): string => {
  return JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp.toISOString(),
    level: LogLevel[entry.level],
    category: entry.category,
    message: entry.message,
    data: entry.data,
    error: entry.error ? {
      name: entry.error.name,
      message: entry.error.message,
      stack: entry.error.stack
    } : undefined,
    sessionId: entry.sessionId,
    campaignId: entry.campaignId,
    variableId: entry.variableId,
    source: entry.source,
    metrics: entry.metrics
  })
}

export const compactFormatter: LogFormatter = (entry: LogEntry): string => {
  const time = entry.timestamp.toTimeString().substring(0, 8)
  const level = LogLevel[entry.level].substring(0, 1)
  const category = entry.category.substring(0, 3).toUpperCase()
  
  return `${time} [${level}/${category}] ${entry.message}`
}

export const developmentFormatter: LogFormatter = (entry: LogEntry): string => {
  const colors: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[36m',     // Cyan
    [LogLevel.INFO]: '\x1b[32m',      // Green
    [LogLevel.WARN]: '\x1b[33m',      // Yellow
    [LogLevel.ERROR]: '\x1b[31m',     // Red
    [LogLevel.CRITICAL]: '\x1b[35m',  // Magenta
    [LogLevel.SILENT]: '\x1b[0m'      // Reset/No color
  }
  
  const reset = '\x1b[0m'
  const color = colors[entry.level] || ''
  
  let message = `${color}[${LogLevel[entry.level]}]${reset} ${entry.category}: ${entry.message}`
  
  if (entry.data && Object.keys(entry.data).length > 0) {
    message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`
  }
  
  if (entry.error) {
    message += `\n  Error: ${entry.error.message}`
    if (entry.error.stack) {
      message += `\n  Stack: ${entry.error.stack}`
    }
  }
  
  return message
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

export class Logger {
  private entries: LogEntry[] = []
  private outputs: Map<string, LogOutput> = new Map()
  private formatters: Map<string, LogFormatter> = new Map()
  private operationStack: string[] = []
  private performanceTimers = new Map<string, number>()

  constructor(private config: LoggerConfig) {
    // Register built-in formatters
    this.formatters.set('default', defaultFormatter)
    this.formatters.set('json', jsonFormatter)
    this.formatters.set('compact', compactFormatter)
    this.formatters.set('development', developmentFormatter)
    
    // Register custom formatters
    if (config.formatters) {
      for (const [name, formatter] of Object.entries(config.formatters)) {
        this.formatters.set(name, formatter)
      }
    }
    
    // Register outputs
    for (const output of config.outputs) {
      this.outputs.set(output.id, output)
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, any>, options?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, LogCategory.SYSTEM, message, data, options)
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, any>, options?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, LogCategory.SYSTEM, message, data, options)
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, any>, options?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, LogCategory.SYSTEM, message, data, options)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: Record<string, any>, options?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, LogCategory.ERROR, message, data, { ...options, error })
  }

  /**
   * Log a critical message
   */
  critical(message: string, error?: Error, data?: Record<string, any>, options?: Partial<LogEntry>): void {
    this.log(LogLevel.CRITICAL, LogCategory.ERROR, message, data, { ...options, error })
  }

  /**
   * Log a variable operation
   */
  variable(level: LogLevel, message: string, variableId: string, data?: Record<string, any>): void {
    this.log(level, LogCategory.VARIABLE, message, data, { variableId })
  }

  /**
   * Log an expression operation
   */
  expression(level: LogLevel, message: string, expression: string, data?: Record<string, any>): void {
    this.log(level, LogCategory.EXPRESSION, message, { ...data, expression })
  }

  /**
   * Log a dependency operation
   */
  dependency(level: LogLevel, message: string, dependencyChain: string[], data?: Record<string, any>): void {
    this.log(level, LogCategory.DEPENDENCY, message, { ...data, dependencyChain })
  }

  /**
   * Log a real-time update event
   */
  realtime(level: LogLevel, message: string, variableId: string, data?: Record<string, any>): void {
    this.log(level, LogCategory.REALTIME, message, data, { variableId })
  }

  /**
   * Log a performance metric
   */
  performance(message: string, metrics: { duration?: number; memoryUsage?: number; operationId?: string }): void {
    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, undefined, { metrics })
  }

  /**
   * Log an API operation
   */
  api(level: LogLevel, message: string, service: string, operation: string, data?: Record<string, any>): void {
    this.log(level, LogCategory.API, message, { ...data, service, operation })
  }

  /**
   * Start a performance timer
   */
  startTimer(operationId: string): void {
    if (this.config.trackPerformance) {
      this.performanceTimers.set(operationId, Date.now())
      this.operationStack.push(operationId)
      this.debug(`Started operation: ${operationId}`, { operationId })
    }
  }

  /**
   * End a performance timer and log the duration
   */
  endTimer(operationId: string, message?: string): number {
    if (!this.config.trackPerformance) return 0
    
    const startTime = this.performanceTimers.get(operationId)
    if (!startTime) {
      this.warn(`Timer not found for operation: ${operationId}`)
      return 0
    }
    
    const duration = Date.now() - startTime
    this.performanceTimers.delete(operationId)
    
    // Remove from operation stack
    const index = this.operationStack.indexOf(operationId)
    if (index > -1) {
      this.operationStack.splice(index, 1)
    }
    
    this.performance(message || `Completed operation: ${operationId}`, {
      operationId,
      duration,
      memoryUsage: this.getMemoryUsage()
    })
    
    return duration
  }

  /**
   * Log with timing wrapper
   */
  withTiming<T>(operationId: string, operation: () => T | Promise<T>): Promise<T> {
    this.startTimer(operationId)
    
    const handleResult = (result: T) => {
      this.endTimer(operationId)
      return result
    }
    
    const handleError = (error: Error) => {
      this.endTimer(operationId, `Failed operation: ${operationId}`)
      throw error
    }
    
    try {
      const result = operation()
      if (result instanceof Promise) {
        return result.then(handleResult).catch(handleError)
      } else {
        return Promise.resolve(handleResult(result))
      }
    } catch (error) {
      handleError(error as Error)
      return Promise.reject(error)
    }
  }

  /**
   * Create a scoped logger with default context
   */
  scope(context: Partial<LogEntry>): ScopedLogger {
    return new ScopedLogger(this, context)
  }

  /**
   * Get recent log entries
   */
  getEntries(options?: {
    level?: LogLevel
    category?: LogCategory
    limit?: number
    since?: Date
  }): LogEntry[] {
    let filtered = this.entries
    
    if (options?.level !== undefined) {
      filtered = filtered.filter(entry => entry.level >= options.level!)
    }
    
    if (options?.category) {
      filtered = filtered.filter(entry => entry.category === options.category)
    }
    
    if (options?.since) {
      filtered = filtered.filter(entry => entry.timestamp >= options.since!)
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit)
    }
    
    return filtered
  }

  /**
   * Get log statistics
   */
  getStats(): {
    totalEntries: number
    entriesByLevel: Record<string, number>
    entriesByCategory: Record<string, number>
    activeOperations: string[]
    memoryUsage: number
  } {
    const entriesByLevel: Record<string, number> = {}
    const entriesByCategory: Record<string, number> = {}
    
    // Initialize counters
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'string') {
        entriesByLevel[level] = 0
      }
    })
    Object.values(LogCategory).forEach(category => {
      entriesByCategory[category] = 0
    })
    
    // Count entries
    for (const entry of this.entries) {
      entriesByLevel[LogLevel[entry.level]]++
      entriesByCategory[entry.category]++
    }
    
    return {
      totalEntries: this.entries.length,
      entriesByLevel,
      entriesByCategory,
      activeOperations: [...this.operationStack],
      memoryUsage: this.getMemoryUsage()
    }
  }

  /**
   * Clear log entries
   */
  clear(): void {
    this.entries = []
    this.performanceTimers.clear()
    this.operationStack = []
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    Object.assign(this.config, config)
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    options?: Partial<LogEntry>
  ): void {
    // Check if logging is enabled for this level and category
    if (!this.shouldLog(level, category)) {
      return
    }
    
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      level,
      category,
      message,
      timestamp: new Date(),
      data,
      ...options
    }
    
    // Add stack trace if enabled and appropriate
    if (this.config.includeStackTrace && level >= LogLevel.ERROR) {
      entry.source = this.getSourceLocation()
    }
    
    // Store entry
    this.entries.push(entry)
    
    // Trim entries if exceeding limit
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries)
    }
    
    // Output to configured targets
    this.outputEntry(entry)
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (level < this.config.level) {
      return false
    }
    
    if (this.config.categories !== '*' && !this.config.categories.includes(category)) {
      return false
    }
    
    return true
  }

  private outputEntry(entry: LogEntry): void {
    for (const output of this.outputs.values()) {
      // Check if output should handle this entry
      if (output.level !== undefined && entry.level < output.level) {
        continue
      }
      
      if (output.categories && !output.categories.includes(entry.category)) {
        continue
      }
      
      // Format entry
      const formatter = this.formatters.get(output.formatter || 'default')
      if (!formatter) {
        console.error(`Formatter not found: ${output.formatter}`)
        continue
      }
      
      const formatted = formatter(entry)
      
      // Output based on type
      switch (output.type) {
        case 'console':
          console.log(formatted)
          break
        case 'buffer':
          // Would store in a buffer for later retrieval
          break
        case 'file':
          // Would write to file
          break
        case 'remote':
          // Would send to remote logging service
          break
      }
    }
  }

  private getSourceLocation(): { file?: string; function?: string; line?: number } {
    const stack = new Error().stack
    if (!stack) return {}
    
    const lines = stack.split('\n')
    // Skip the first few lines (Error constructor, this method, log method)
    const relevantLine = lines[4]
    if (!relevantLine) return {}
    
    const match = relevantLine.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/)
    if (match) {
      return {
        function: match[1],
        file: match[2],
        line: parseInt(match[3])
      }
    }
    
    return {}
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }
}

// =============================================================================
// SCOPED LOGGER
// =============================================================================

export class ScopedLogger {
  constructor(
    private parent: Logger,
    private context: Partial<LogEntry>
  ) {}

  debug(message: string, data?: Record<string, any>): void {
    this.parent.debug(message, data, this.context)
  }

  info(message: string, data?: Record<string, any>): void {
    this.parent.info(message, data, this.context)
  }

  warn(message: string, data?: Record<string, any>): void {
    this.parent.warn(message, data, this.context)
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.parent.error(message, error, data, this.context)
  }

  critical(message: string, error?: Error, data?: Record<string, any>): void {
    this.parent.critical(message, error, data, this.context)
  }

  variable(level: LogLevel, message: string, variableId: string, data?: Record<string, any>): void {
    this.parent.variable(level, message, variableId, data)
  }

  scope(additionalContext: Partial<LogEntry>): ScopedLogger {
    return new ScopedLogger(this.parent, { ...this.context, ...additionalContext })
  }

  startTimer(operationId: string): void {
    this.parent.startTimer(operationId)
  }

  endTimer(operationId: string, message?: string): number {
    return this.parent.endTimer(operationId, message)
  }

  withTiming<T>(operationId: string, operation: () => T | Promise<T>): Promise<T> {
    return this.parent.withTiming(operationId, operation)
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create logger with default configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const defaultConfig: LoggerConfig = {
    level: LogLevel.INFO,
    categories: '*',
    outputs: [
      {
        id: 'console',
        type: 'console',
        formatter: 'development'
      }
    ],
    maxEntries: 1000,
    includeStackTrace: true,
    trackPerformance: true,
    ...config
  }
  
  return new Logger(defaultConfig)
}

/**
 * Create production logger
 */
export function createProductionLogger(): Logger {
  return createLogger({
    level: LogLevel.WARN,
    categories: [LogCategory.ERROR, LogCategory.SYSTEM, LogCategory.API],
    outputs: [
      {
        id: 'console',
        type: 'console',
        formatter: 'json'
      }
    ],
    includeStackTrace: true,
    trackPerformance: false
  })
}

/**
 * Create development logger
 */
export function createDevelopmentLogger(): Logger {
  return createLogger({
    level: LogLevel.DEBUG,
    categories: '*',
    outputs: [
      {
        id: 'console',
        type: 'console',
        formatter: 'development'
      }
    ],
    includeStackTrace: true,
    trackPerformance: true
  })
}

/**
 * Global logger instance
 */
export const logger = createLogger() 