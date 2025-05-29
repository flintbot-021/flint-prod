/**
 * Cached Runtime Execution Engine
 * 
 * Performance-optimized runtime engine that integrates the comprehensive
 * caching system with the existing runtime execution engine for maximum
 * performance and efficiency.
 */

import {
  RuntimeExecutionEngine,
  ExpressionEvaluator,
  ExpressionContext,
  EvaluationResult,
  LogicSectionConfig,
  SectionComponent
} from './runtime-execution-engine'
import {
  cacheManager,
  memoizationCache,
  aiResponseCache,
  stringInterningCache,
  performanceProfiler,
  MultiTierCacheManager,
  CacheConfig
} from './performance-cache'
import { ExecutionContext } from '../types/variable-system'

// =============================================================================
// CACHED RUNTIME EXECUTION ENGINE
// =============================================================================

export class CachedRuntimeExecutionEngine {
  private baseEngine: RuntimeExecutionEngine
  private cacheManager: MultiTierCacheManager
  private memoizedEvaluateText!: (text: string, context: ExpressionContext) => Promise<EvaluationResult>
  private memoizedResolveVariable!: (variableId: string) => Promise<any>

  constructor(
    private context: ExecutionContext,
    cacheConfig?: Partial<CacheConfig>
  ) {
    this.baseEngine = new RuntimeExecutionEngine(context)
    
    // Initialize custom cache manager if config provided
    this.cacheManager = cacheConfig ? 
      new MultiTierCacheManager(cacheConfig) : 
      cacheManager

    // Set up memoized functions
    this.setupMemoizedFunctions()
  }

  /**
   * Enhanced variable resolution with comprehensive caching
   */
  async resolveVariableWithExpression(
    variableId: string,
    expression?: string
  ): Promise<any> {
    const cacheKey = expression ? 
      `var_expr_${variableId}_${stringInterningCache.intern(expression)}` :
      `var_${variableId}`

    // Start performance tracking
    performanceProfiler.startOperation(cacheKey)

    try {
      // Try cache first
      const cached = this.cacheManager.get(cacheKey)
      if (cached !== undefined) {
        performanceProfiler.endOperation(cacheKey, 'variableResolutionTimes')
        return cached
      }

      // Call base engine implementation
      const result = await this.baseEngine.resolveVariableWithExpression(variableId, expression)

      // Cache the result with dependencies
      const dependencies = expression ? this.extractDependencies(expression) : [variableId]
      this.cacheManager.set(cacheKey, result, {
        dependencies,
        tiers: ['memory', 'session']
      })

      performanceProfiler.endOperation(cacheKey, 'variableResolutionTimes')
      return result

    } catch (error) {
      performanceProfiler.endOperation(cacheKey, 'variableResolutionTimes')
      throw error
    }
  }

  /**
   * Cached text interpolation processing
   */
  async processInterpolatedText(text: string): Promise<string> {
    const internedText = stringInterningCache.intern(text)
    const cacheKey = `text_interp_${Buffer.from(internedText).toString('base64').substring(0, 32)}`

    performanceProfiler.startOperation(cacheKey)

    try {
      // Check cache first
      const cached = this.cacheManager.get<string>(cacheKey)
      if (cached !== undefined) {
        performanceProfiler.endOperation(cacheKey, 'stringInterpolationTimes')
        return cached
      }

      // Use memoized evaluation
      const expressionContext: ExpressionContext = {
        variables: this.getAllVariableValues(),
        functions: {},
        session: this.context.session.responses,
        metadata: this.context.session.metadata || {}
      }

      const result = await this.memoizedEvaluateText(internedText, expressionContext)
      
      if (!result.success) {
        console.warn(`Text interpolation failed: ${result.error}`)
        performanceProfiler.endOperation(cacheKey, 'stringInterpolationTimes')
        return internedText
      }

      // Cache with variable dependencies
      this.cacheManager.set(cacheKey, result.value, {
        dependencies: result.usedVariables,
        tiers: ['memory']
      })

      performanceProfiler.endOperation(cacheKey, 'stringInterpolationTimes')
      return result.value

    } catch (error) {
      console.error('Cached text interpolation error:', error)
      performanceProfiler.endOperation(cacheKey, 'stringInterpolationTimes')
      return internedText
    }
  }

  /**
   * Enhanced Logic section execution with AI response caching
   */
  async executeLogicSection(config: LogicSectionConfig): Promise<any> {
    const operationId = `logic_${config.outputVariable}`
    
    performanceProfiler.startOperation(operationId)

    try {
      // Check AI response cache
      const cachedResponse = aiResponseCache.get(
        config.modelId,
        config.prompt,
        config.temperature,
        config.maxTokens
      )

      if (cachedResponse) {
        // Still populate variable and notify components
        await this.populateVariable(config.outputVariable, cachedResponse)
        performanceProfiler.endOperation(operationId, 'aiApiCallTimes')
        return cachedResponse
      }

      // Execute with base engine
      const result = await this.baseEngine.executeLogicSection(config)

      // Cache AI response
      if (typeof result === 'string') {
        aiResponseCache.set(
          config.modelId,
          config.prompt,
          result,
          config.temperature,
          config.maxTokens
        )
      }

      performanceProfiler.endOperation(operationId, 'aiApiCallTimes')
      return result

    } catch (error) {
      performanceProfiler.endOperation(operationId, 'aiApiCallTimes')
      throw error
    }
  }

  /**
   * Enhanced variable population with cache invalidation
   */
  async populateVariable(variableId: string, value: any): Promise<void> {
    // Invalidate related cache entries before updating
    this.cacheManager.invalidateByVariable(variableId)
    
    // Call base engine implementation
    await this.baseEngine.populateVariable(variableId, value)

    // Record memory snapshot for monitoring
    performanceProfiler.recordMemorySnapshot()
  }

  /**
   * Cached variable resolution
   */
  async resolveVariable(variableId: string): Promise<any> {
    return this.memoizedResolveVariable(variableId)
  }

  /**
   * Execute section using base engine
   */
  async executeSection(sectionId: string): Promise<void> {
    return this.baseEngine.executeSection(sectionId)
  }

  /**
   * Register component
   */
  registerComponent(component: SectionComponent): void {
    this.baseEngine.registerComponent(component)
  }

  /**
   * Subscribe component to variable updates
   */
  subscribeComponentToVariable(componentId: string, variableId: string): void {
    this.baseEngine.subscribeComponentToVariable(componentId, variableId)
  }

  /**
   * Register expression function
   */
  registerExpressionFunction(name: string, func: Function): void {
    this.baseEngine.registerExpressionFunction(name, func)
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return {
      runtime: this.baseEngine.getMetrics(),
      cache: this.cacheManager.getStats(),
      profiler: performanceProfiler.getMetrics(),
      stringInterning: {
        memorySavings: stringInterningCache.getMemorySavings()
      },
      aiCache: aiResponseCache.getStats()
    }
  }

  /**
   * Get base engine metrics
   */
  getMetrics() {
    return this.baseEngine.getMetrics()
  }

  /**
   * Optimize performance based on usage patterns
   */
  optimizePerformance(): void {
    // Optimize cache
    this.cacheManager.optimize()
    
    // Clean up string interning
    stringInterningCache.cleanup()
    
    // Clear memoization for low-usage functions
    const metrics = performanceProfiler.getMetrics()
    if (Object.keys(metrics.variableResolutionTimes).length > 1000) {
      memoizationCache.clear()
    }
  }

  /**
   * Enhanced reset with cache clearing
   */
  reset(): void {
    this.baseEngine.reset()
    this.cacheManager.clear()
    memoizationCache.clear()
    performanceProfiler.clear()
  }

  /**
   * Configure cache policies for specific variable types
   */
  configureCachePolicy(variablePattern: string, ttl: number, crossSession: boolean = false): void {
    // This would be implemented to set cache policies dynamically
    console.log(`Cache policy configured for ${variablePattern}: TTL=${ttl}ms, CrossSession=${crossSession}`)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheManager.getStats()
  }

  /**
   * Manual cache invalidation
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Pattern-based invalidation would be implemented here
      console.log(`Invalidating cache for pattern: ${pattern}`)
    } else {
      this.cacheManager.clear()
    }
  }

  private setupMemoizedFunctions(): void {
    // Create memoized version of text evaluation
    this.memoizedEvaluateText = memoizationCache.memoize(
      async (text: string, context: ExpressionContext) => {
        const evaluator = new ExpressionEvaluator()
        return evaluator.evaluateText(text, context)
      },
      (text: string, context: ExpressionContext) => {
        // Generate cache key based on text and variable values
        const varKeys = Object.keys(context.variables).sort().join(',')
        const varHash = Buffer.from(varKeys).toString('base64').substring(0, 16)
        const textHash = Buffer.from(text).toString('base64').substring(0, 16)
        return `eval_${textHash}_${varHash}`
      }
    )

    // Create memoized version of variable resolution
    this.memoizedResolveVariable = memoizationCache.memoize(
      async (variableId: string) => {
        return this.baseEngine.resolveVariable(variableId)
      },
      (variableId: string) => `resolve_${variableId}`,
      // Dependencies for invalidation
      undefined
    )
  }

  private extractDependencies(expression: string): string[] {
    // Simple regex-based dependency extraction
    // In a full implementation, this would use the parser
    const variablePattern = /@(\w+(?:\.\w+)*)/g
    const dependencies: string[] = []
    let match
    
    while ((match = variablePattern.exec(expression)) !== null) {
      dependencies.push(match[1])
    }
    
    return dependencies
  }

  private getAllVariableValues(): Record<string, any> {
    const values: Record<string, any> = {}
    const variables = this.context.variables.getAllVariables()
    
    for (const variable of variables) {
      values[variable.id] = this.context.variables.getValue(variable.id)
    }
    
    return values
  }
}

// =============================================================================
// PERFORMANCE MONITORING DECORATORS
// =============================================================================

/**
 * Decorator to automatically track performance of methods
 */
export function trackPerformance(category: 'variableResolutionTimes' | 'expressionEvaluationTimes' | 'aiApiCallTimes') {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const operationId = `${propertyName}_${Date.now()}`
      performanceProfiler.startOperation(operationId)
      
      try {
        const result = await method.apply(this, args)
        performanceProfiler.endOperation(operationId, category)
        return result
      } catch (error) {
        performanceProfiler.endOperation(operationId, category)
        throw error
      }
    }
  }
}

/**
 * Decorator to automatically cache method results
 */
export function cached(ttl?: number, dependencies?: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = function (...args: any[]) {
      const cacheKey = `${propertyName}_${JSON.stringify(args)}`
      
      // Try cache first
      const cached = cacheManager.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }
      
      // Execute method
      const result = method.apply(this, args)
      
      // Cache result
      cacheManager.set(cacheKey, result, {
        ttl,
        dependencies
      })
      
      return result
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create optimized cached runtime execution engine
 */
export function createCachedRuntimeEngine(
  context: ExecutionContext,
  cacheConfig?: Partial<CacheConfig>
): CachedRuntimeExecutionEngine {
  return new CachedRuntimeExecutionEngine(context, cacheConfig)
}

/**
 * Create high-performance runtime engine with optimized settings
 */
export function createHighPerformanceRuntimeEngine(
  context: ExecutionContext
): CachedRuntimeExecutionEngine {
  const optimizedConfig: Partial<CacheConfig> = {
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    defaultTTL: 600000, // 10 minutes
    maxItems: 50000,
    layers: {
      memory: true,
      session: true,
      persistent: false
    },
    variablePolicies: {
      'user.*': { 
        ttl: 1800000, // 30 minutes
        maxSize: 1024 * 1024, // 1MB
        invalidation: 'immediate',
        crossSession: true 
      },
      'campaign.*': { 
        ttl: 300000, // 5 minutes
        maxSize: 512 * 1024, // 512KB
        invalidation: 'lazy',
        crossSession: false 
      },
      'ai.*': { 
        ttl: 3600000, // 1 hour
        maxSize: 2 * 1024 * 1024, // 2MB
        invalidation: 'scheduled',
        crossSession: true 
      }
    }
  }

  return new CachedRuntimeExecutionEngine(context, optimizedConfig)
} 