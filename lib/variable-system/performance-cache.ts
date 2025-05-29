/**
 * Performance Cache System
 * 
 * Comprehensive caching and performance optimization for the Variable 
 * Interpolation Engine with multi-tier caching, smart invalidation,
 * and performance monitoring.
 */

import { dependencyTracker } from './dependency-tracker'
import { ExpressionNode } from './interpolation-parser'
import { EvaluationResult } from './runtime-execution-engine'

// =============================================================================
// CACHE CONFIGURATION & TYPES
// =============================================================================

export interface CacheConfig {
  /** Maximum memory usage in bytes */
  maxMemoryUsage: number
  /** Default TTL in milliseconds */
  defaultTTL: number
  /** Maximum number of items per cache tier */
  maxItems: number
  /** Enable/disable different cache layers */
  layers: {
    memory: boolean
    session: boolean
    persistent: boolean
  }
  /** Variable-specific cache policies */
  variablePolicies: Record<string, CachePolicy>
}

export interface CachePolicy {
  /** Time to live in milliseconds */
  ttl: number
  /** Maximum memory for this variable type */
  maxSize: number
  /** Invalidation strategy */
  invalidation: 'immediate' | 'lazy' | 'scheduled'
  /** Whether to cache across sessions */
  crossSession: boolean
}

export interface CacheEntry<T = any> {
  /** Cached value */
  value: T
  /** Cache key */
  key: string
  /** Timestamp when cached */
  timestamp: number
  /** Time to live in milliseconds */
  ttl: number
  /** Size in bytes (estimated) */
  size: number
  /** Number of times accessed */
  accessCount: number
  /** Last access timestamp */
  lastAccess: number
  /** Dependencies that would invalidate this entry */
  dependencies: string[]
  /** Cache tier where stored */
  tier: 'memory' | 'session' | 'persistent'
}

export interface CacheStats {
  /** Hit rate percentage */
  hitRate: number
  /** Miss rate percentage */
  missRate: number
  /** Total hits */
  totalHits: number
  /** Total misses */
  totalMisses: number
  /** Memory usage in bytes */
  memoryUsage: number
  /** Number of items in cache */
  itemCount: number
  /** Average access time in ms */
  averageAccessTime: number
  /** Cache efficiency score */
  efficiencyScore: number
}

export interface PerformanceMetrics {
  /** Variable resolution times */
  variableResolutionTimes: Record<string, number[]>
  /** Expression evaluation times */
  expressionEvaluationTimes: Record<string, number[]>
  /** AI API call times */
  aiApiCallTimes: Record<string, number[]>
  /** String interpolation times */
  stringInterpolationTimes: number[]
  /** Memory snapshots */
  memorySnapshots: Array<{ timestamp: number; usage: number }>
  /** Bottleneck detection */
  bottlenecks: Array<{ operation: string; avgTime: number; frequency: number }>
}

// =============================================================================
// LRU CACHE IMPLEMENTATION
// =============================================================================

export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder = new Map<string, number>()
  private accessCounter = 0

  constructor(
    private maxSize: number,
    private defaultTTL: number = 300000 // 5 minutes
  ) {}

  set(key: string, value: T, ttl?: number, dependencies: string[] = []): void {
    const now = Date.now()
    const entryTTL = ttl || this.defaultTTL
    
    // Remove expired entries
    this.cleanup()
    
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      value,
      key,
      timestamp: now,
      ttl: entryTTL,
      size: this.estimateSize(value),
      accessCount: 1,
      lastAccess: now,
      dependencies,
      tier: 'memory'
    }

    this.cache.set(key, entry)
    this.accessOrder.set(key, ++this.accessCounter)
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }

    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      return undefined
    }

    // Update access information
    entry.accessCount++
    entry.lastAccess = Date.now()
    this.accessOrder.set(key, ++this.accessCounter)

    return entry.value
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.accessOrder.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
  }

  size(): number {
    return this.cache.size
  }

  getStats(): CacheStats {
    let totalSize = 0
    let totalAccesses = 0
    let totalHits = 0
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size
      totalAccesses += entry.accessCount
      totalHits += entry.accessCount
    }

    return {
      hitRate: 0, // Would be calculated by parent cache manager
      missRate: 0,
      totalHits,
      totalMisses: 0,
      memoryUsage: totalSize,
      itemCount: this.cache.size,
      averageAccessTime: 0,
      efficiencyScore: 0
    }
  }

  invalidateByDependencies(changedDependencies: string[]): string[] {
    const invalidatedKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      // Check if any of this entry's dependencies have changed
      const hasChangedDependency = entry.dependencies.some(dep => 
        changedDependencies.includes(dep)
      )
      
      if (hasChangedDependency) {
        this.delete(key)
        invalidatedKeys.push(key)
      }
    }
    
    return invalidatedKeys
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key)
    }
  }

  private evictLRU(): void {
    let oldestKey: string | undefined
    let oldestAccess = Infinity
    
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2 // UTF-16
    } else if (typeof value === 'number') {
      return 8
    } else if (typeof value === 'boolean') {
      return 4
    } else if (value === null || value === undefined) {
      return 0
    } else if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item), 0)
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2
    }
    return 0
  }
}

// =============================================================================
// MULTI-TIER CACHE MANAGER
// =============================================================================

export class MultiTierCacheManager {
  private memoryCache: LRUCache
  private sessionCache = new Map<string, any>()
  private performanceMetrics: PerformanceMetrics
  private cacheStats: CacheStats
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      defaultTTL: 300000, // 5 minutes
      maxItems: 10000,
      layers: { memory: true, session: true, persistent: false },
      variablePolicies: {},
      ...config
    }

    this.memoryCache = new LRUCache(this.config.maxItems, this.config.defaultTTL)
    this.performanceMetrics = this.initializeMetrics()
    this.cacheStats = this.initializeStats()
  }

  /**
   * Get value from cache with tier fallback
   */
  get<T>(key: string): T | undefined {
    const startTime = Date.now()
    
    try {
      // Try memory cache first
      if (this.config.layers.memory) {
        const memoryValue = this.memoryCache.get(key)
        if (memoryValue !== undefined) {
          this.recordCacheHit('memory', Date.now() - startTime)
          return memoryValue as T
        }
      }

      // Try session cache
      if (this.config.layers.session) {
        const sessionValue = this.sessionCache.get(key)
        if (sessionValue !== undefined) {
          // Promote to memory cache
          this.memoryCache.set(key, sessionValue)
          this.recordCacheHit('session', Date.now() - startTime)
          return sessionValue as T
        }
      }

      this.recordCacheMiss(Date.now() - startTime)
      return undefined

    } catch (error) {
      console.error('Cache get error:', error)
      this.recordCacheMiss(Date.now() - startTime)
      return undefined
    }
  }

  /**
   * Set value in appropriate cache tiers
   */
  set<T>(
    key: string, 
    value: T, 
    options: {
      ttl?: number
      dependencies?: string[]
      policy?: string
      tiers?: ('memory' | 'session' | 'persistent')[]
    } = {}
  ): void {
    const { ttl, dependencies = [], policy, tiers = ['memory'] } = options
    
    const effectiveTTL = ttl || this.getTTLForPolicy(policy)
    
    // Store in requested tiers
    for (const tier of tiers) {
      switch (tier) {
        case 'memory':
          if (this.config.layers.memory) {
            this.memoryCache.set(key, value, effectiveTTL, dependencies)
          }
          break
        case 'session':
          if (this.config.layers.session) {
            this.sessionCache.set(key, value)
          }
          break
      }
    }
  }

  /**
   * Invalidate cache entries based on variable dependencies
   */
  invalidateByVariable(variableId: string): void {
    const startTime = Date.now()
    
    try {
      // Get all dependents of this variable
      const dependents = dependencyTracker.getDependents(variableId)
      const allAffected = [variableId, ...dependents]
      
      // Invalidate in memory cache
      const invalidatedKeys = this.memoryCache.invalidateByDependencies(allAffected)
      
      // Invalidate in session cache
      for (const key of this.sessionCache.keys()) {
        if (allAffected.some(dep => key.includes(dep))) {
          this.sessionCache.delete(key)
          invalidatedKeys.push(key)
        }
      }

      console.log(`Invalidated ${invalidatedKeys.length} cache entries for variable ${variableId}`)
      
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    const memoryStats = this.memoryCache.getStats()
    
    return {
      ...this.cacheStats,
      memoryUsage: memoryStats.memoryUsage,
      itemCount: memoryStats.itemCount + this.sessionCache.size
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear()
    this.sessionCache.clear()
    this.cacheStats = this.initializeStats()
  }

  /**
   * Optimize cache based on usage patterns
   */
  optimize(): void {
    // Analyze usage patterns
    const stats = this.getStats()
    
    // If hit rate is low, adjust TTL policies
    if (stats.hitRate < 0.5) {
      console.log('Low cache hit rate detected, optimizing TTL policies')
    }
    
    // If memory usage is high, trigger cleanup
    if (stats.memoryUsage > this.config.maxMemoryUsage * 0.8) {
      console.log('High memory usage detected, triggering cleanup')
      this.cleanup()
    }
  }

  private getTTLForPolicy(policy?: string): number {
    if (policy && this.config.variablePolicies[policy]) {
      return this.config.variablePolicies[policy].ttl
    }
    return this.config.defaultTTL
  }

  private recordCacheHit(tier: string, accessTime: number): void {
    this.cacheStats.totalHits++
    this.updateHitRate()
  }

  private recordCacheMiss(accessTime: number): void {
    this.cacheStats.totalMisses++
    this.updateHitRate()
  }

  private updateHitRate(): void {
    const total = this.cacheStats.totalHits + this.cacheStats.totalMisses
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.totalHits / total : 0
    this.cacheStats.missRate = total > 0 ? this.cacheStats.totalMisses / total : 0
  }

  private cleanup(): void {
    // Force garbage collection of expired entries
    // Implementation would include memory pressure handling
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      variableResolutionTimes: {},
      expressionEvaluationTimes: {},
      aiApiCallTimes: {},
      stringInterpolationTimes: [],
      memorySnapshots: [],
      bottlenecks: []
    }
  }

  private initializeStats(): CacheStats {
    return {
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      memoryUsage: 0,
      itemCount: 0,
      averageAccessTime: 0,
      efficiencyScore: 0
    }
  }
}

// =============================================================================
// MEMOIZATION DECORATORS
// =============================================================================

export class MemoizationCache {
  private cache = new LRUCache(1000) // Smaller cache for function results

  /**
   * Memoize function results with dependency tracking
   */
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    dependencies?: string[]
  ): T {
    const cache = this.cache
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      const cached = cache.get(key)
      if (cached !== undefined) {
        return cached
      }
      
      const result = func(...args)
      cache.set(key, result, undefined, dependencies)
      
      return result
    }) as T
  }

  /**
   * Clear memoization cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate memoized results by dependencies
   */
  invalidateByDependencies(changedDependencies: string[]): void {
    this.cache.invalidateByDependencies(changedDependencies)
  }
}

// =============================================================================
// AI RESPONSE CACHE
// =============================================================================

export class AIResponseCache {
  private cache = new LRUCache<string>(500, 3600000) // 1 hour TTL for AI responses

  /**
   * Generate cache key for AI request
   */
  private generateKey(
    modelId: string,
    prompt: string,
    temperature?: number,
    maxTokens?: number
  ): string {
    const params = {
      modelId,
      prompt: prompt.substring(0, 1000), // Truncate for key generation
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1000
    }
    
    // Generate hash of parameters
    return `ai_${Buffer.from(JSON.stringify(params)).toString('base64').substring(0, 32)}`
  }

  /**
   * Get cached AI response
   */
  get(
    modelId: string,
    prompt: string,
    temperature?: number,
    maxTokens?: number
  ): string | undefined {
    const key = this.generateKey(modelId, prompt, temperature, maxTokens)
    return this.cache.get(key)
  }

  /**
   * Cache AI response
   */
  set(
    modelId: string,
    prompt: string,
    response: string,
    temperature?: number,
    maxTokens?: number,
    ttl?: number
  ): void {
    const key = this.generateKey(modelId, prompt, temperature, maxTokens)
    this.cache.set(key, response, ttl)
  }

  /**
   * Clear AI response cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats()
  }
}

// =============================================================================
// STRING INTERNING FOR PERFORMANCE
// =============================================================================

export class StringInterningCache {
  private internedStrings = new Map<string, string>()
  private usageCount = new Map<string, number>()

  /**
   * Intern a string to reuse memory
   */
  intern(str: string): string {
    if (this.internedStrings.has(str)) {
      const interned = this.internedStrings.get(str)!
      this.usageCount.set(str, (this.usageCount.get(str) || 0) + 1)
      return interned
    }

    this.internedStrings.set(str, str)
    this.usageCount.set(str, 1)
    return str
  }

  /**
   * Check if string is interned
   */
  isInterned(str: string): boolean {
    return this.internedStrings.has(str)
  }

  /**
   * Get memory savings from interning
   */
  getMemorySavings(): number {
    let savings = 0
    for (const [str, count] of this.usageCount.entries()) {
      if (count > 1) {
        savings += str.length * 2 * (count - 1) // UTF-16 savings
      }
    }
    return savings
  }

  /**
   * Clear interned strings with low usage
   */
  cleanup(minUsage: number = 2): void {
    for (const [str, count] of this.usageCount.entries()) {
      if (count < minUsage) {
        this.internedStrings.delete(str)
        this.usageCount.delete(str)
      }
    }
  }
}

// =============================================================================
// PERFORMANCE PROFILER
// =============================================================================

export class PerformanceProfiler {
  private activeOperations = new Map<string, number>()
  private metrics: PerformanceMetrics

  constructor() {
    this.metrics = {
      variableResolutionTimes: {},
      expressionEvaluationTimes: {},
      aiApiCallTimes: {},
      stringInterpolationTimes: [],
      memorySnapshots: [],
      bottlenecks: []
    }
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string): void {
    this.activeOperations.set(operationId, Date.now())
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(operationId: string, category: keyof PerformanceMetrics): number {
    const startTime = this.activeOperations.get(operationId)
    if (!startTime) return 0

    const duration = Date.now() - startTime
    this.activeOperations.delete(operationId)

    // Record metric based on category
    switch (category) {
      case 'variableResolutionTimes':
      case 'expressionEvaluationTimes':
      case 'aiApiCallTimes':
        if (!this.metrics[category][operationId]) {
          this.metrics[category][operationId] = []
        }
        this.metrics[category][operationId].push(duration)
        break
      case 'stringInterpolationTimes':
        this.metrics.stringInterpolationTimes.push(duration)
        break
    }

    return duration
  }

  /**
   * Record memory snapshot
   */
  recordMemorySnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      this.metrics.memorySnapshots.push({
        timestamp: Date.now(),
        usage: usage.heapUsed
      })
    }
  }

  /**
   * Detect performance bottlenecks
   */
  detectBottlenecks(thresholdMs: number = 100): void {
    this.metrics.bottlenecks = []

    // Analyze variable resolution times
    for (const [operation, times] of Object.entries(this.metrics.variableResolutionTimes)) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      if (avgTime > thresholdMs) {
        this.metrics.bottlenecks.push({
          operation: `Variable: ${operation}`,
          avgTime,
          frequency: times.length
        })
      }
    }

    // Sort by average time descending
    this.metrics.bottlenecks.sort((a, b) => b.avgTime - a.avgTime)
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.detectBottlenecks()
    return { ...this.metrics }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.activeOperations.clear()
    this.metrics = {
      variableResolutionTimes: {},
      expressionEvaluationTimes: {},
      aiApiCallTimes: {},
      stringInterpolationTimes: [],
      memorySnapshots: [],
      bottlenecks: []
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS & SINGLETONS
// =============================================================================

/**
 * Global cache manager instance
 */
export const cacheManager = new MultiTierCacheManager()

/**
 * Global memoization cache
 */
export const memoizationCache = new MemoizationCache()

/**
 * Global AI response cache
 */
export const aiResponseCache = new AIResponseCache()

/**
 * Global string interning cache
 */
export const stringInterningCache = new StringInterningCache()

/**
 * Global performance profiler
 */
export const performanceProfiler = new PerformanceProfiler()

/**
 * Create custom cache manager with specific configuration
 */
export function createCacheManager(config: Partial<CacheConfig>): MultiTierCacheManager {
  return new MultiTierCacheManager(config)
} 