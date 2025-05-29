/**
 * Runtime Variable Population System
 * 
 * Provides execution context and runtime engine for efficient variable
 * population during campaign execution.
 */

import { Campaign } from '../types/database'
import {
  ExecutionContext,
  SessionData,
  ExecutionHistoryEntry,
  ExecutionMetrics,
  VariableRegistry,
  VariableValidationResult
} from '../types/variable-system'
import { variableRegistry } from './variable-registry'
import { dependencyTracker } from './dependency-tracker'
import { validationFramework } from './validation-framework'

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Session manager for handling user session data
 */
export class SessionManager {
  private sessions = new Map<string, SessionData>()

  createSession(userId?: string): SessionData {
    const sessionId = this.generateSessionId()
    const session: SessionData = {
      sessionId,
      userId,
      startTime: new Date(),
      responses: {},
      metadata: {}
    }
    
    this.sessions.set(sessionId, session)
    return session
  }

  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId)
  }

  updateSession(sessionId: string, updates: Partial<SessionData>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      Object.assign(session, updates)
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  addResponse(sessionId: string, key: string, value: any): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.responses[key] = value
    }
  }

  setLeadData(sessionId: string, leadData: Record<string, any>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.leadData = leadData
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// =============================================================================
// VARIABLE RESOLVER
// =============================================================================

/**
 * Variable resolver for handling complex dependency chains
 */
export class VariableResolver {
  private cache = new Map<string, any>()
  private resolving = new Set<string>()

  constructor(
    private variableRegistry: VariableRegistry,
    private context: ExecutionContext
  ) {}

  async resolveVariable(variableId: string): Promise<any> {
    // Check cache first
    if (this.cache.has(variableId)) {
      return this.cache.get(variableId)
    }

    // Check for circular resolution
    if (this.resolving.has(variableId)) {
      throw new Error(`Circular dependency detected while resolving variable: ${variableId}`)
    }

    this.resolving.add(variableId)

    try {
      // Get variable metadata
      const metadata = this.variableRegistry.getVariable(variableId)
      if (!metadata) {
        throw new Error(`Variable '${variableId}' is not registered`)
      }

      // Check if value is already set
      let value = this.variableRegistry.getValue(variableId)
      
      // If no value, try to resolve from dependencies
      if (value === undefined) {
        value = await this.resolveFromDependencies(variableId)
      }

      // Use default value if still undefined
      if (value === undefined) {
        value = metadata.defaultValue
      }

      // Validate resolved value
      const validationResult = await validationFramework.validateVariable(
        variableId,
        value,
        this.context
      )

      if (!validationResult.isValid) {
        throw new Error(`Variable validation failed: ${validationResult.errors.join(', ')}`)
      }

      // Cache and return
      this.cache.set(variableId, value)
      return value

    } finally {
      this.resolving.delete(variableId)
    }
  }

  async resolveVariables(variableIds: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    // Resolve in dependency order
    const orderedIds = this.getResolutionOrder(variableIds)
    
    for (const variableId of orderedIds) {
      try {
        results[variableId] = await this.resolveVariable(variableId)
      } catch (error) {
        console.error(`Failed to resolve variable ${variableId}:`, error)
        // Continue with other variables
      }
    }

    return results
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidateVariable(variableId: string): void {
    this.cache.delete(variableId)
    
    // Invalidate dependents
    const dependents = dependencyTracker.getDependents(variableId)
    for (const dependent of dependents) {
      this.cache.delete(dependent)
    }
  }

  private async resolveFromDependencies(variableId: string): Promise<any> {
    // Get dependencies for this variable
    const dependencies = dependencyTracker.getDependencies(variableId)
    
    // Resolve all dependencies first
    const dependencyValues: Record<string, any> = {}
    for (const depId of dependencies) {
      dependencyValues[depId] = await this.resolveVariable(depId)
    }

    // Check if we can derive value from dependencies
    // This would be implemented based on section-specific logic
    return undefined
  }

  private getResolutionOrder(variableIds: string[]): string[] {
    // Use topological sort from dependency tracker
    try {
      const allOrder = dependencyTracker.getTopologicalOrder()
      return variableIds.sort((a, b) => {
        const indexA = allOrder.indexOf(a)
        const indexB = allOrder.indexOf(b)
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
      })
    } catch (error) {
      console.warn('Failed to get topological order, using original order:', error)
      return variableIds
    }
  }
}

// =============================================================================
// RUNTIME ENGINE
// =============================================================================

/**
 * Runtime engine for orchestrating variable population
 */
export class RuntimeEngine {
  private resolver: VariableResolver
  private isRunning = false
  private metrics: ExecutionMetrics

  constructor(private context: ExecutionContext) {
    this.resolver = new VariableResolver(context.variables, context)
    this.metrics = context.metrics
  }

  async executeSection(sectionId: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Record section execution start
      this.recordSectionStart(sectionId)
      
      // Get section variables that need to be resolved
      const sectionVariables = this.context.variables.getVariablesBySource(sectionId)
      
      // Resolve any dependency variables first
      const dependencyIds = new Set<string>()
      for (const variable of sectionVariables) {
        const deps = dependencyTracker.getDependencies(variable.id)
        deps.forEach(dep => dependencyIds.add(dep))
      }
      
      if (dependencyIds.size > 0) {
        await this.resolver.resolveVariables(Array.from(dependencyIds))
      }
      
      // Execute section-specific logic here
      // This would be implemented based on section type
      
      // Record execution completion
      const duration = Date.now() - startTime
      this.recordSectionCompletion(sectionId, duration)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordSectionError(sectionId, duration, error as Error)
      throw error
    }
  }

  async populateVariable(variableId: string, value: any): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Validate value
      const validationResult = await validationFramework.validateVariable(
        variableId,
        value,
        this.context
      )
      
      if (!validationResult.isValid) {
        throw new Error(`Variable validation failed: ${validationResult.errors.join(', ')}`)
      }
      
      // Set value in registry
      this.context.variables.setValue(variableId, value)
      
      // Invalidate cache for this variable and dependents
      this.resolver.invalidateVariable(variableId)
      
      // Update metrics
      const duration = Date.now() - startTime
      this.metrics.variableLookupTimes[variableId] = duration
      
    } catch (error) {
      console.error(`Failed to populate variable ${variableId}:`, error)
      throw error
    }
  }

  async resolveVariable(variableId: string): Promise<any> {
    const startTime = Date.now()
    
    try {
      const value = await this.resolver.resolveVariable(variableId)
      
      // Update metrics
      const duration = Date.now() - startTime
      this.metrics.variableLookupTimes[variableId] = duration
      
      return value
      
    } catch (error) {
      console.error(`Failed to resolve variable ${variableId}:`, error)
      throw error
    }
  }

  getMetrics(): ExecutionMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.resolver.clearCache()
    this.isRunning = false
    this.context.executionHistory = []
    this.resetMetrics()
  }

  private recordSectionStart(sectionId: string): void {
    this.context.currentSection = sectionId
  }

  private recordSectionCompletion(sectionId: string, duration: number): void {
    const historyEntry: ExecutionHistoryEntry = {
      sectionId,
      timestamp: new Date(),
      variablesProduced: {},
      duration
    }
    
    this.context.executionHistory.push(historyEntry)
    this.metrics.sectionRenderTimes[sectionId] = duration
    this.metrics.totalTime += duration
  }

  private recordSectionError(sectionId: string, duration: number, error: Error): void {
    const historyEntry: ExecutionHistoryEntry = {
      sectionId,
      timestamp: new Date(),
      variablesProduced: {},
      duration,
      errors: [error.message]
    }
    
    this.context.executionHistory.push(historyEntry)
    this.metrics.sectionRenderTimes[sectionId] = duration
    this.metrics.totalTime += duration
  }

  private resetMetrics(): void {
    this.metrics.totalTime = 0
    this.metrics.variableLookupTimes = {}
    this.metrics.sectionRenderTimes = {}
    this.metrics.memoryUsage = {
      variableCount: 0,
      totalVariableSize: 0,
      cacheHitRate: 0
    }
  }
}

// =============================================================================
// EXECUTION CONTEXT IMPLEMENTATION
// =============================================================================

/**
 * Execution context implementation
 */
export class ExecutionContextImpl implements ExecutionContext {
  public executionHistory: ExecutionHistoryEntry[] = []
  public metrics: ExecutionMetrics
  public currentSection?: string

  constructor(
    public campaign: Campaign,
    public variables: VariableRegistry,
    public session: SessionData
  ) {
    this.metrics = {
      totalTime: 0,
      variableLookupTimes: {},
      sectionRenderTimes: {},
      memoryUsage: {
        variableCount: 0,
        totalVariableSize: 0,
        cacheHitRate: 0
      }
    }
  }

  updateMetrics(): void {
    this.metrics.memoryUsage.variableCount = this.variables.getAllVariables().length
    
    // Calculate cache hit rate if available
    // This would be implemented based on cache statistics
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create execution context for a campaign
 */
export function createExecutionContext(
  campaign: Campaign,
  sessionData?: Partial<SessionData>
): ExecutionContext {
  const sessionManager = new SessionManager()
  const session = sessionManager.createSession(sessionData?.userId)
  
  // Apply any provided session data
  if (sessionData) {
    Object.assign(session, sessionData)
  }
  
  return new ExecutionContextImpl(campaign, variableRegistry, session)
}

/**
 * Create runtime engine for execution context
 */
export function createRuntimeEngine(context: ExecutionContext): RuntimeEngine {
  return new RuntimeEngine(context)
}

/**
 * Singleton session manager
 */
export const sessionManager = new SessionManager() 