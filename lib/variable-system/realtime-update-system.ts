/**
 * Real-time Update System
 * 
 * Event-driven real-time update system for the Variable Interpolation Engine
 * with observer pattern, automatic dependency propagation, and performance
 * optimization for cascading updates.
 */

import { dependencyTracker } from './dependency-tracker'
import { globalErrorHandler, VariableError, ErrorCategory } from './error-handling'

// =============================================================================
// EVENT TYPES AND INTERFACES
// =============================================================================

export enum UpdateEventType {
  /** Variable value changed */
  VARIABLE_CHANGED = 'variable_changed',
  /** Variable created */
  VARIABLE_CREATED = 'variable_created',
  /** Variable deleted */
  VARIABLE_DELETED = 'variable_deleted',
  /** Dependency added */
  DEPENDENCY_ADDED = 'dependency_added',
  /** Dependency removed */
  DEPENDENCY_REMOVED = 'dependency_removed',
  /** Update batch started */
  BATCH_START = 'batch_start',
  /** Update batch completed */
  BATCH_END = 'batch_end',
  /** Update failed */
  UPDATE_FAILED = 'update_failed',
  /** Update recovered */
  UPDATE_RECOVERED = 'update_recovered'
}

export interface UpdateEvent {
  /** Event type */
  type: UpdateEventType
  /** Variable ID that triggered the event */
  variableId: string
  /** New value (for change events) */
  newValue?: any
  /** Previous value (for change events) */
  previousValue?: any
  /** Timestamp when event occurred */
  timestamp: Date
  /** Session ID */
  sessionId?: string
  /** Campaign ID */
  campaignId?: string
  /** Additional event metadata */
  metadata?: Record<string, any>
  /** Source of the change */
  source?: string
  /** Batch ID for grouped updates */
  batchId?: string
}

export interface UpdateListener {
  /** Listener ID */
  id: string
  /** Variables this listener is interested in */
  variables: string[] | '*'
  /** Event types to listen for */
  eventTypes: UpdateEventType[]
  /** Callback function */
  callback: (event: UpdateEvent) => Promise<void> | void
  /** Priority for execution order (higher = earlier) */
  priority?: number
  /** Whether this listener should debounce updates */
  debounce?: number
  /** Maximum retry attempts on failure */
  maxRetries?: number
}

export interface UpdateOptions {
  /** Whether to propagate to dependents */
  propagate?: boolean
  /** Source identifier */
  source?: string
  /** Whether to batch with other updates */
  batch?: boolean
  /** Custom batch ID */
  batchId?: string
  /** Validation function */
  validate?: (value: any) => boolean | Promise<boolean>
  /** Transform function applied before setting */
  transform?: (value: any) => any | Promise<any>
  /** Whether to skip cache invalidation */
  skipCacheInvalidation?: boolean
}

export interface BatchUpdateResult {
  /** Batch ID */
  batchId: string
  /** Successfully updated variables */
  successful: string[]
  /** Failed updates with errors */
  failed: Array<{ variableId: string; error: VariableError }>
  /** Total processing time */
  processingTime: number
  /** Number of dependents updated */
  dependentsUpdated: number
}

// =============================================================================
// DEBOUNCER CLASS
// =============================================================================

class UpdateDebouncer {
  private timers = new Map<string, NodeJS.Timeout>()
  private pendingUpdates = new Map<string, UpdateEvent>()

  /**
   * Debounce an update event
   */
  debounce(
    key: string,
    event: UpdateEvent,
    delay: number,
    callback: (event: UpdateEvent) => void
  ): void {
    // Clear existing timer
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Store the latest event
    this.pendingUpdates.set(key, event)

    // Set new timer
    const timer = setTimeout(() => {
      const pendingEvent = this.pendingUpdates.get(key)
      if (pendingEvent) {
        callback(pendingEvent)
        this.pendingUpdates.delete(key)
        this.timers.delete(key)
      }
    }, delay)

    this.timers.set(key, timer)
  }

  /**
   * Cancel debounced update
   */
  cancel(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
      this.pendingUpdates.delete(key)
    }
  }

  /**
   * Clear all debounced updates
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.pendingUpdates.clear()
  }
}

// =============================================================================
// REAL-TIME UPDATE SYSTEM
// =============================================================================

export class RealTimeUpdateSystem {
  private listeners = new Map<string, UpdateListener>()
  private debouncer = new UpdateDebouncer()
  private updateQueue: UpdateEvent[] = []
  private processing = false
  private batchedUpdates = new Map<string, UpdateEvent[]>()
  private retryAttempts = new Map<string, number>()

  constructor(
    private variableGetter: (id: string) => any,
    private variableSetter: (id: string, value: any) => Promise<void>,
    private cacheInvalidator?: (variableId: string) => void
  ) {}

  /**
   * Subscribe to variable updates
   */
  subscribe(listener: UpdateListener): () => void {
    this.listeners.set(listener.id, listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener.id)
      this.debouncer.cancel(listener.id)
    }
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId)
    this.debouncer.cancel(listenerId)
  }

  /**
   * Update a variable with real-time propagation
   */
  async updateVariable(
    variableId: string,
    newValue: any,
    options: UpdateOptions = {}
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Get current value for comparison
      const previousValue = this.variableGetter(variableId)

      // Validate new value if validator provided
      if (options.validate) {
        const isValid = await options.validate(newValue)
        if (!isValid) {
          throw new Error(`Validation failed for variable ${variableId}`)
        }
      }

      // Transform value if transformer provided
      let finalValue = newValue
      if (options.transform) {
        finalValue = await options.transform(newValue)
      }

      // Update the variable
      await this.variableSetter(variableId, finalValue)

      // Invalidate cache if not skipped
      if (!options.skipCacheInvalidation && this.cacheInvalidator) {
        this.cacheInvalidator(variableId)
      }

      // Create update event
      const event: UpdateEvent = {
        type: UpdateEventType.VARIABLE_CHANGED,
        variableId,
        newValue: finalValue,
        previousValue,
        timestamp: new Date(),
        source: options.source,
        batchId: options.batchId
      }

      // Queue the event for processing
      await this.queueEvent(event)

      // Propagate to dependents if enabled
      if (options.propagate !== false) {
        await this.propagateToDependents(variableId, options)
      }

      console.log(`Variable ${variableId} updated in ${Date.now() - startTime}ms`)

    } catch (error) {
      const structuredError = globalErrorHandler.createError(
        error as Error,
        ErrorCategory.VARIABLE,
        {
          location: { variable: variableId },
          metadata: { options, newValue }
        }
      )

      // Emit failure event
      await this.queueEvent({
        type: UpdateEventType.UPDATE_FAILED,
        variableId,
        newValue,
        timestamp: new Date(),
        source: options.source,
        metadata: { error: structuredError }
      })

      throw structuredError
    }
  }

  /**
   * Batch multiple variable updates
   */
  async batchUpdate(
    updates: Array<{ variableId: string; value: any; options?: UpdateOptions }>,
    batchOptions: { batchId?: string; source?: string } = {}
  ): Promise<BatchUpdateResult> {
    const batchId = batchOptions.batchId || `batch_${Date.now()}`
    const startTime = Date.now()
    const successful: string[] = []
    const failed: Array<{ variableId: string; error: VariableError }> = []

    // Emit batch start event
    await this.queueEvent({
      type: UpdateEventType.BATCH_START,
      variableId: 'batch',
      timestamp: new Date(),
      batchId,
      source: batchOptions.source,
      metadata: { updateCount: updates.length }
    })

    try {
      // Process updates sequentially to maintain dependency order
      for (const update of updates) {
        try {
          await this.updateVariable(update.variableId, update.value, {
            ...update.options,
            batchId,
            source: batchOptions.source,
            propagate: false // Handle propagation at batch level
          })
          successful.push(update.variableId)

        } catch (error) {
          failed.push({
            variableId: update.variableId,
            error: error as VariableError
          })
        }
      }

      // Propagate to all dependents of updated variables
      const allDependents = new Set<string>()
      for (const variableId of successful) {
        const dependents = dependencyTracker.getDependents(variableId)
        dependents.forEach(dep => allDependents.add(dep))
      }

      // Update dependents
      for (const dependentId of allDependents) {
        try {
          await this.recalculateDependent(dependentId, batchId)
        } catch (error) {
          console.warn(`Failed to update dependent ${dependentId}:`, error)
        }
      }

      const result: BatchUpdateResult = {
        batchId,
        successful,
        failed,
        processingTime: Date.now() - startTime,
        dependentsUpdated: allDependents.size
      }

      // Emit batch end event
      await this.queueEvent({
        type: UpdateEventType.BATCH_END,
        variableId: 'batch',
        timestamp: new Date(),
        batchId,
        source: batchOptions.source,
        metadata: result
      })

      return result

    } catch (error) {
      // Emit batch failure event
      await this.queueEvent({
        type: UpdateEventType.UPDATE_FAILED,
        variableId: 'batch',
        timestamp: new Date(),
        batchId,
        source: batchOptions.source,
        metadata: { error, successful, failed }
      })

      throw error
    }
  }

  /**
   * Create a variable
   */
  async createVariable(
    variableId: string,
    initialValue: any,
    options: UpdateOptions = {}
  ): Promise<void> {
    await this.variableSetter(variableId, initialValue)

    await this.queueEvent({
      type: UpdateEventType.VARIABLE_CREATED,
      variableId,
      newValue: initialValue,
      timestamp: new Date(),
      source: options.source
    })
  }

  /**
   * Delete a variable
   */
  async deleteVariable(variableId: string, options: UpdateOptions = {}): Promise<void> {
    const previousValue = this.variableGetter(variableId)

    // Invalidate cache
    if (this.cacheInvalidator) {
      this.cacheInvalidator(variableId)
    }

    await this.queueEvent({
      type: UpdateEventType.VARIABLE_DELETED,
      variableId,
      previousValue,
      timestamp: new Date(),
      source: options.source
    })
  }

  /**
   * Force recalculation of a variable and its dependents
   */
  async recalculateVariable(variableId: string): Promise<void> {
    const dependents = dependencyTracker.getDependents(variableId)
    
    // Recalculate this variable first
    await this.recalculateDependent(variableId)
    
    // Then recalculate all dependents
    for (const dependentId of dependents) {
      await this.recalculateDependent(dependentId)
    }
  }

  /**
   * Get current update queue status
   */
  getQueueStatus(): {
    queueLength: number
    processing: boolean
    batchedUpdates: number
    listeners: number
  } {
    return {
      queueLength: this.updateQueue.length,
      processing: this.processing,
      batchedUpdates: this.batchedUpdates.size,
      listeners: this.listeners.size
    }
  }

  /**
   * Get all active listeners
   */
  getListeners(): UpdateListener[] {
    return Array.from(this.listeners.values())
  }

  /**
   * Clear all listeners and pending updates
   */
  clear(): void {
    this.listeners.clear()
    this.debouncer.clear()
    this.updateQueue = []
    this.batchedUpdates.clear()
    this.retryAttempts.clear()
  }

  /**
   * Pause update processing
   */
  pause(): void {
    this.processing = false
  }

  /**
   * Resume update processing
   */
  resume(): void {
    if (!this.processing) {
      this.processing = true
      this.processQueue()
    }
  }

  private async queueEvent(event: UpdateEvent): Promise<void> {
    this.updateQueue.push(event)
    
    if (!this.processing) {
      this.processing = true
      await this.processQueue()
    }
  }

  private async processQueue(): Promise<void> {
    while (this.updateQueue.length > 0 && this.processing) {
      const event = this.updateQueue.shift()
      if (event) {
        await this.processEvent(event)
      }
    }
    this.processing = false
  }

  private async processEvent(event: UpdateEvent): Promise<void> {
    // Get relevant listeners
    const relevantListeners = this.getRelevantListeners(event)
    
    // Sort by priority (higher first)
    relevantListeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    // Process each listener
    for (const listener of relevantListeners) {
      try {
        if (listener.debounce) {
          // Debounce the update
          this.debouncer.debounce(
            `${listener.id}_${event.variableId}`,
            event,
            listener.debounce,
            async (debouncedEvent) => {
              await this.executeListener(listener, debouncedEvent)
            }
          )
        } else {
          // Execute immediately
          await this.executeListener(listener, event)
        }

      } catch (error) {
        console.error(`Listener ${listener.id} failed:`, error)
        
        // Track retry attempts
        const retryKey = `${listener.id}_${event.variableId}`
        const attempts = this.retryAttempts.get(retryKey) || 0
        
        if (attempts < (listener.maxRetries || 3)) {
          this.retryAttempts.set(retryKey, attempts + 1)
          // Re-queue for retry
          setTimeout(() => {
            this.updateQueue.push(event)
          }, 1000 * Math.pow(2, attempts)) // Exponential backoff
        } else {
          this.retryAttempts.delete(retryKey)
          console.error(`Max retries exceeded for listener ${listener.id}`)
        }
      }
    }
  }

  private async executeListener(listener: UpdateListener, event: UpdateEvent): Promise<void> {
    const result = listener.callback(event)
    if (result instanceof Promise) {
      await result
    }
  }

  private getRelevantListeners(event: UpdateEvent): UpdateListener[] {
    const relevant: UpdateListener[] = []
    
    for (const listener of this.listeners.values()) {
      // Check event type filter
      if (listener.eventTypes.length > 0 && !listener.eventTypes.includes(event.type)) {
        continue
      }
      
      // Check variable filter
      if (listener.variables !== '*') {
        if (!listener.variables.includes(event.variableId)) {
          continue
        }
      }
      
      relevant.push(listener)
    }
    
    return relevant
  }

  private async propagateToDependents(
    variableId: string,
    options: UpdateOptions
  ): Promise<void> {
    const dependents = dependencyTracker.getDependents(variableId)
    
    for (const dependentId of dependents) {
      try {
        await this.recalculateDependent(dependentId, options.batchId)
      } catch (error) {
        console.error(`Failed to propagate update to ${dependentId}:`, error)
        
        // Try to recover by emitting recovery event
        await this.queueEvent({
          type: UpdateEventType.UPDATE_RECOVERED,
          variableId: dependentId,
          timestamp: new Date(),
          metadata: { 
            originalError: error,
            recoveryAttempt: true 
          }
        })
      }
    }
  }

  private async recalculateDependent(variableId: string, batchId?: string): Promise<void> {
    // This would integrate with the runtime execution engine
    // to recalculate the variable based on its dependencies
    
    // For now, emit an event that the runtime engine can listen to
    await this.queueEvent({
      type: UpdateEventType.VARIABLE_CHANGED,
      variableId,
      timestamp: new Date(),
      batchId,
      metadata: { 
        recalculated: true,
        trigger: 'dependency_update'
      }
    })
  }
}

// =============================================================================
// COMPONENT UPDATE MANAGER
// =============================================================================

export class ComponentUpdateManager {
  private componentSubscriptions = new Map<string, Set<string>>()
  private variableSubscriptions = new Map<string, Set<string>>()

  constructor(private updateSystem: RealTimeUpdateSystem) {
    // Subscribe to variable change events
    this.updateSystem.subscribe({
      id: 'component_manager',
      variables: '*',
      eventTypes: [UpdateEventType.VARIABLE_CHANGED],
      callback: this.handleVariableChange.bind(this),
      priority: 100, // High priority for UI updates
      debounce: 50 // Debounce rapid changes
    })
  }

  /**
   * Subscribe a component to variable updates
   */
  subscribeComponentToVariable(componentId: string, variableId: string): void {
    // Track component -> variables
    if (!this.componentSubscriptions.has(componentId)) {
      this.componentSubscriptions.set(componentId, new Set())
    }
    this.componentSubscriptions.get(componentId)!.add(variableId)

    // Track variable -> components
    if (!this.variableSubscriptions.has(variableId)) {
      this.variableSubscriptions.set(variableId, new Set())
    }
    this.variableSubscriptions.get(variableId)!.add(componentId)
  }

  /**
   * Unsubscribe component from variable
   */
  unsubscribeComponentFromVariable(componentId: string, variableId: string): void {
    // Remove from component subscriptions
    const componentVars = this.componentSubscriptions.get(componentId)
    if (componentVars) {
      componentVars.delete(variableId)
      if (componentVars.size === 0) {
        this.componentSubscriptions.delete(componentId)
      }
    }

    // Remove from variable subscriptions
    const variableComponents = this.variableSubscriptions.get(variableId)
    if (variableComponents) {
      variableComponents.delete(componentId)
      if (variableComponents.size === 0) {
        this.variableSubscriptions.delete(variableId)
      }
    }
  }

  /**
   * Unsubscribe component from all variables
   */
  unsubscribeComponent(componentId: string): void {
    const subscribedVariables = this.componentSubscriptions.get(componentId)
    if (subscribedVariables) {
      for (const variableId of subscribedVariables) {
        this.unsubscribeComponentFromVariable(componentId, variableId)
      }
    }
  }

  /**
   * Get components subscribed to a variable
   */
  getSubscribedComponents(variableId: string): string[] {
    const components = this.variableSubscriptions.get(variableId)
    return components ? Array.from(components) : []
  }

  /**
   * Get variables a component is subscribed to
   */
  getComponentSubscriptions(componentId: string): string[] {
    const variables = this.componentSubscriptions.get(componentId)
    return variables ? Array.from(variables) : []
  }

  private async handleVariableChange(event: UpdateEvent): Promise<void> {
    const subscribedComponents = this.getSubscribedComponents(event.variableId)
    
    // Notify each subscribed component
    for (const componentId of subscribedComponents) {
      try {
        // This would trigger a component re-render or update
        console.log(`Notifying component ${componentId} of variable ${event.variableId} change`)
        
        // In a real implementation, this would trigger component updates
        // through a framework-specific mechanism (React state, Vue reactive, etc.)
        
      } catch (error) {
        console.error(`Failed to notify component ${componentId}:`, error)
      }
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create real-time update system
 */
export function createRealTimeUpdateSystem(
  variableGetter: (id: string) => any,
  variableSetter: (id: string, value: any) => Promise<void>,
  cacheInvalidator?: (variableId: string) => void
): RealTimeUpdateSystem {
  return new RealTimeUpdateSystem(variableGetter, variableSetter, cacheInvalidator)
}

/**
 * Create component update manager
 */
export function createComponentUpdateManager(
  updateSystem: RealTimeUpdateSystem
): ComponentUpdateManager {
  return new ComponentUpdateManager(updateSystem)
} 