/**
 * Interpolation Dependency Resolver
 * 
 * Bridges the interpolation parser with the dependency tracking system
 * to automatically manage variable dependencies and execution order.
 */

import {
  parseInterpolations,
  extractVariableDependencies,
  InterpolationNode,
  ExpressionNode
} from './interpolation-parser'
import { dependencyTracker, DependencyTrackerImpl } from './dependency-tracker'
import { variableRegistry } from './variable-registry'
import {
  VariableMetadata,
  VariableValidationResult,
  ExecutionContext
} from '../types/variable-system'

// =============================================================================
// DEPENDENCY RESOLUTION TYPES
// =============================================================================

export interface DependencyResolutionStrategy {
  name: string
  description: string
  resolve: (variableId: string, context: ExecutionContext) => Promise<any>
}

export interface ResolutionResult {
  success: boolean
  value?: any
  error?: string
  dependencies: string[]
  executionTimeMs: number
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>
  edges: Map<string, string[]>
  roots: string[]
  leaves: string[]
}

export interface DependencyNode {
  id: string
  type: 'variable' | 'section' | 'computed'
  source?: string
  interpolations: InterpolationNode[]
  dependencies: string[]
  dependents: string[]
  resolved: boolean
  lastResolvedAt?: Date
  cachedValue?: any
  executionOrder: number
}

export interface ResolutionPlan {
  executionOrder: string[]
  batchGroups: string[][]
  estimatedTime: number
  parallelizable: boolean
}

// =============================================================================
// INTERPOLATION DEPENDENCY RESOLVER
// =============================================================================

export class InterpolationDependencyResolver {
  private dependencyTracker: DependencyTrackerImpl
  private resolutionCache = new Map<string, ResolutionResult>()
  private strategies = new Map<string, DependencyResolutionStrategy>()
  private executionPlan?: ResolutionPlan

  constructor() {
    this.dependencyTracker = dependencyTracker as DependencyTrackerImpl
    this.initializeDefaultStrategies()
  }

  /**
   * Analyze text content and register all dependencies
   */
  async analyzeAndRegisterDependencies(
    sourceId: string,
    content: string,
    context?: ExecutionContext
  ): Promise<VariableValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Parse interpolations from content
      const parseResult = parseInterpolations(content)
      
      if (!parseResult.success) {
        errors.push(...parseResult.errors.map(e => e.message))
      }

      // Register dependencies
      for (const dependency of parseResult.dependencies) {
        try {
          this.dependencyTracker.addDependency(sourceId, dependency)
        } catch (error) {
          // Handle circular dependencies gracefully
          if (error instanceof Error && error.message.includes('circular')) {
            errors.push(`Circular dependency detected: ${sourceId} -> ${dependency}`)
          } else {
            errors.push(`Failed to register dependency: ${error}`)
          }
        }
      }

      // Validate the overall dependency graph
      const graphValidation = this.dependencyTracker.validateGraph()
      errors.push(...graphValidation.errors)
      warnings.push(...graphValidation.warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to analyze dependencies: ${error}`],
        warnings
      }
    }
  }

  /**
   * Create execution plan for variable resolution
   */
  createExecutionPlan(variableIds: string[]): ResolutionPlan {
    try {
      // Get topological order
      const topologicalOrder = this.dependencyTracker.getTopologicalOrder()
      
      // Filter to only requested variables and their dependencies
      const requiredVariables = new Set<string>()
      for (const variableId of variableIds) {
        requiredVariables.add(variableId)
        const transitiveDeps = this.dependencyTracker.getTransitiveDependencies(variableId)
        transitiveDeps.forEach(dep => requiredVariables.add(dep))
      }

      const executionOrder = topologicalOrder.filter(id => requiredVariables.has(id))

      // Create batch groups for parallel execution
      const batchGroups = this.createBatchGroups(executionOrder)
      
      // Estimate execution time (simple heuristic)
      const estimatedTime = this.estimateExecutionTime(executionOrder)

      this.executionPlan = {
        executionOrder,
        batchGroups,
        estimatedTime,
        parallelizable: batchGroups.length > 1
      }

      return this.executionPlan

    } catch (error) {
      console.error('Failed to create execution plan:', error)
      
      // Fallback to simple order
      return {
        executionOrder: variableIds,
        batchGroups: [variableIds],
        estimatedTime: variableIds.length * 100, // 100ms per variable
        parallelizable: false
      }
    }
  }

  /**
   * Resolve variable with dependency management
   */
  async resolveVariable(
    variableId: string,
    context: ExecutionContext,
    strategy: string = 'default'
  ): Promise<ResolutionResult> {
    const startTime = Date.now()

    try {
      // Check cache first
      const cached = this.resolutionCache.get(variableId)
      if (cached && this.isCacheValid(cached)) {
        return {
          ...cached,
          executionTimeMs: Date.now() - startTime
        }
      }

      // Get resolution strategy
      const resolverStrategy = this.strategies.get(strategy)
      if (!resolverStrategy) {
        throw new Error(`Unknown resolution strategy: ${strategy}`)
      }

      // Resolve dependencies first
      const dependencies = this.dependencyTracker.getDependencies(variableId)
      const resolvedDependencies: Record<string, any> = {}
      
      for (const depId of dependencies) {
        const depResult = await this.resolveVariable(depId, context, strategy)
        if (!depResult.success) {
          throw new Error(`Failed to resolve dependency '${depId}': ${depResult.error}`)
        }
        resolvedDependencies[depId] = depResult.value
      }

      // Resolve the variable
      const value = await resolverStrategy.resolve(variableId, context)

      const result: ResolutionResult = {
        success: true,
        value,
        dependencies,
        executionTimeMs: Date.now() - startTime
      }

      // Cache the result
      this.resolutionCache.set(variableId, result)

      return result

    } catch (error) {
      const result: ResolutionResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        dependencies: this.dependencyTracker.getDependencies(variableId),
        executionTimeMs: Date.now() - startTime
      }

      return result
    }
  }

  /**
   * Resolve multiple variables in optimal order
   */
  async resolveVariables(
    variableIds: string[],
    context: ExecutionContext,
    strategy: string = 'default'
  ): Promise<Record<string, ResolutionResult>> {
    const results: Record<string, ResolutionResult> = {}
    
    // Create execution plan
    const plan = this.createExecutionPlan(variableIds)
    
    // Execute in batches for potential parallelization
    for (const batch of plan.batchGroups) {
      const batchPromises = batch.map(async (variableId) => {
        const result = await this.resolveVariable(variableId, context, strategy)
        return { variableId, result }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          const { variableId, result } = promiseResult.value
          results[variableId] = result
        } else {
          console.error('Batch resolution failed:', promiseResult.reason)
        }
      }
    }

    return results
  }

  /**
   * Get dependency graph for visualization
   */
  getDependencyGraph(): DependencyGraph {
    const nodes = new Map<string, DependencyNode>()
    const edges = new Map<string, string[]>()

    // Get all items from dependency tracker
    const dependencyMap = this.dependencyTracker.getDependencyGraph()
    const allItems = new Set<string>()
    
    for (const [dependent, dependencies] of dependencyMap.entries()) {
      allItems.add(dependent)
      dependencies.forEach(dep => allItems.add(dep))
      edges.set(dependent, dependencies)
    }

    // Create nodes
    let executionOrder = 0
    for (const itemId of allItems) {
      const dependencies = this.dependencyTracker.getDependencies(itemId)
      const dependents = this.dependencyTracker.getDependents(itemId)
      
      nodes.set(itemId, {
        id: itemId,
        type: this.inferNodeType(itemId),
        dependencies,
        dependents,
        resolved: this.resolutionCache.has(itemId),
        lastResolvedAt: this.resolutionCache.get(itemId) ? new Date() : undefined,
        cachedValue: this.resolutionCache.get(itemId)?.value,
        executionOrder: executionOrder++,
        interpolations: [] // Would be populated from content analysis
      })
    }

    // Identify roots and leaves
    const roots = Array.from(allItems).filter(id => 
      this.dependencyTracker.getDependencies(id).length === 0
    )
    
    const leaves = Array.from(allItems).filter(id => 
      this.dependencyTracker.getDependents(id).length === 0
    )

    return { nodes, edges, roots, leaves }
  }

  /**
   * Invalidate cache for variable and dependents
   */
  invalidateCache(variableId: string): void {
    this.resolutionCache.delete(variableId)
    
    // Invalidate dependents
    const dependents = this.dependencyTracker.getDependents(variableId)
    for (const dependent of dependents) {
      this.invalidateCache(dependent)
    }
  }

  /**
   * Clear all caches and reset state
   */
  reset(): void {
    this.resolutionCache.clear()
    this.executionPlan = undefined
  }

  /**
   * Get resolution statistics
   */
  getStatistics(): {
    cachedVariables: number
    totalResolutions: number
    averageResolutionTime: number
    cacheHitRate: number
    dependencyGraphStats: any
  } {
    const cached = Array.from(this.resolutionCache.values())
    const successful = cached.filter(r => r.success)
    
    return {
      cachedVariables: this.resolutionCache.size,
      totalResolutions: cached.length,
      averageResolutionTime: successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.executionTimeMs, 0) / successful.length 
        : 0,
      cacheHitRate: cached.length > 0 ? successful.length / cached.length : 0,
      dependencyGraphStats: this.dependencyTracker.getStatistics()
    }
  }

  // Private helper methods

  private initializeDefaultStrategies(): void {
    // Default strategy: resolve from variable registry
    this.strategies.set('default', {
      name: 'default',
      description: 'Resolve from variable registry',
      resolve: async (variableId: string, context: ExecutionContext) => {
        const value = context.variables.getValue(variableId)
        if (value === undefined) {
          const metadata = context.variables.getVariable(variableId)
          return metadata?.defaultValue
        }
        return value
      }
    })

    // Lazy strategy: only resolve when explicitly requested
    this.strategies.set('lazy', {
      name: 'lazy',
      description: 'Resolve only when explicitly requested',
      resolve: async (variableId: string, context: ExecutionContext) => {
        // Only resolve if not in cache
        return context.variables.getValue(variableId)
      }
    })

    // Eager strategy: pre-resolve all dependencies
    this.strategies.set('eager', {
      name: 'eager',
      description: 'Pre-resolve all dependencies',
      resolve: async (variableId: string, context: ExecutionContext) => {
        // This would implement eager resolution logic
        return context.variables.getValue(variableId)
      }
    })
  }

  private createBatchGroups(executionOrder: string[]): string[][] {
    const batches: string[][] = []
    const processed = new Set<string>()
    
    while (processed.size < executionOrder.length) {
      const currentBatch: string[] = []
      
      for (const variableId of executionOrder) {
        if (processed.has(variableId)) continue
        
        // Check if all dependencies are processed
        const dependencies = this.dependencyTracker.getDependencies(variableId)
        const canProcess = dependencies.every(dep => processed.has(dep))
        
        if (canProcess) {
          currentBatch.push(variableId)
          processed.add(variableId)
        }
      }
      
      if (currentBatch.length === 0) {
        // Circular dependency or other issue
        break
      }
      
      batches.push(currentBatch)
    }
    
    return batches
  }

  private estimateExecutionTime(variableIds: string[]): number {
    // Simple heuristic: 50ms base + 25ms per variable
    return 50 + (variableIds.length * 25)
  }

  private isCacheValid(result: ResolutionResult): boolean {
    // Simple cache validation - could be more sophisticated
    return result.success && Date.now() - result.executionTimeMs < 60000 // 1 minute TTL
  }

  private inferNodeType(itemId: string): 'variable' | 'section' | 'computed' {
    // This would be enhanced with actual metadata
    if (itemId.includes('.')) return 'computed'
    if (itemId.startsWith('section_')) return 'section'
    return 'variable'
  }
}

// =============================================================================
// FACTORY AND UTILITIES
// =============================================================================

/**
 * Singleton instance of the interpolation dependency resolver
 */
export const interpolationResolver = new InterpolationDependencyResolver()

/**
 * Register dependencies from text content
 */
export async function registerTextDependencies(
  sourceId: string,
  content: string,
  context?: ExecutionContext
): Promise<VariableValidationResult> {
  return interpolationResolver.analyzeAndRegisterDependencies(sourceId, content, context)
}

/**
 * Resolve all variables in text content
 */
export async function resolveTextVariables(
  content: string,
  context: ExecutionContext,
  strategy: string = 'default'
): Promise<Record<string, ResolutionResult>> {
  const dependencies = extractVariableDependencies(content)
  return interpolationResolver.resolveVariables(dependencies, context, strategy)
} 