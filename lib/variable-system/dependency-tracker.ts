/**
 * Dependency Tracker Implementation
 * 
 * Tracks dependencies between sections based on variable usage.
 * Provides circular dependency detection and impact analysis.
 */

import {
  DependencyTracker,
  VariableValidationResult
} from '../types/variable-system'

/**
 * Dependency tracker implementation with efficient graph algorithms
 */
export class DependencyTrackerImpl implements DependencyTracker {
  private dependencies = new Map<string, Set<string>>()
  private dependents = new Map<string, Set<string>>()
  private transitiveDependenciesCache = new Map<string, string[]>()
  private lastGraphVersion = 0

  /**
   * Add dependency relationship
   */
  addDependency(dependent: string, dependency: string): void {
    // Validate inputs
    if (!dependent || !dependency) {
      throw new Error('Both dependent and dependency must be provided')
    }

    if (dependent === dependency) {
      throw new Error('An item cannot depend on itself')
    }

    // Check if this would create a circular dependency
    if (this.wouldCreateCycle(dependent, dependency)) {
      throw new Error(`Adding dependency '${dependent} -> ${dependency}' would create a circular dependency`)
    }

    // Add to dependencies map
    if (!this.dependencies.has(dependent)) {
      this.dependencies.set(dependent, new Set())
    }
    this.dependencies.get(dependent)!.add(dependency)

    // Add to dependents map (reverse lookup)
    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set())
    }
    this.dependents.get(dependency)!.add(dependent)

    // Invalidate transitive cache
    this.invalidateTransitiveCache()

    console.log(`Dependency added: ${dependent} -> ${dependency}`)
  }

  /**
   * Remove dependency relationship
   */
  removeDependency(dependent: string, dependency: string): void {
    // Remove from dependencies map
    const deps = this.dependencies.get(dependent)
    if (deps) {
      deps.delete(dependency)
      if (deps.size === 0) {
        this.dependencies.delete(dependent)
      }
    }

    // Remove from dependents map
    const dependentsList = this.dependents.get(dependency)
    if (dependentsList) {
      dependentsList.delete(dependent)
      if (dependentsList.size === 0) {
        this.dependents.delete(dependency)
      }
    }

    // Invalidate transitive cache
    this.invalidateTransitiveCache()

    console.log(`Dependency removed: ${dependent} -> ${dependency}`)
  }

  /**
   * Get direct dependencies
   */
  getDependencies(itemId: string): string[] {
    return Array.from(this.dependencies.get(itemId) || [])
  }

  /**
   * Get all dependents
   */
  getDependents(itemId: string): string[] {
    return Array.from(this.dependents.get(itemId) || [])
  }

  /**
   * Get transitive dependencies (all dependencies recursively)
   */
  getTransitiveDependencies(itemId: string): string[] {
    // Check cache first
    const cached = this.transitiveDependenciesCache.get(itemId)
    if (cached) {
      return cached
    }

    const visited = new Set<string>()
    const result: string[] = []

    const traverse = (currentId: string) => {
      if (visited.has(currentId)) {
        return // Avoid cycles
      }
      visited.add(currentId)

      const directDeps = this.getDependencies(currentId)
      for (const dep of directDeps) {
        if (!result.includes(dep)) {
          result.push(dep)
        }
        traverse(dep)
      }
    }

    traverse(itemId)

    // Cache result
    this.transitiveDependenciesCache.set(itemId, result)
    return result
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(itemId: string): boolean {
    return this.findCycles().some(cycle => cycle.includes(itemId))
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    for (const [dependent, dependencies] of this.dependencies.entries()) {
      graph.set(dependent, Array.from(dependencies))
    }
    return graph
  }

  /**
   * Calculate impact of removing item
   */
  getRemovalImpact(itemId: string): string[] {
    const impact = new Set<string>()
    
    // Add direct dependents
    const directDependents = this.getDependents(itemId)
    directDependents.forEach(dep => impact.add(dep))

    // Add transitive dependents
    const transitiveImpact = new Set<string>()
    const findTransitiveDependents = (id: string) => {
      const dependents = this.getDependents(id)
      for (const dependent of dependents) {
        if (!transitiveImpact.has(dependent)) {
          transitiveImpact.add(dependent)
          impact.add(dependent)
          findTransitiveDependents(dependent)
        }
      }
    }

    findTransitiveDependents(itemId)

    return Array.from(impact)
  }

  /**
   * Validate dependency graph
   */
  validateGraph(): VariableValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for cycles
    const cycles = this.findCycles()
    if (cycles.length > 0) {
      errors.push(...cycles.map(cycle => `Circular dependency detected: ${cycle.join(' -> ')}`))
    }

    // Check for orphaned dependencies
    const allItems = new Set<string>()
    for (const [dependent, dependencies] of this.dependencies.entries()) {
      allItems.add(dependent)
      dependencies.forEach(dep => allItems.add(dep))
    }

    for (const item of allItems) {
      const hasDependencies = this.dependencies.has(item)
      const hasDependents = this.dependents.has(item)
      
      if (!hasDependencies && !hasDependents) {
        warnings.push(`Item '${item}' has no dependencies or dependents`)
      }
    }

    // Check for unreachable items
    const reachableItems = new Set<string>()
    const roots = this.getRootItems()
    
    for (const root of roots) {
      const transitiveDeps = this.getTransitiveDependencies(root)
      reachableItems.add(root)
      transitiveDeps.forEach(dep => reachableItems.add(dep))
    }

    for (const item of allItems) {
      if (!reachableItems.has(item)) {
        warnings.push(`Item '${item}' is not reachable from any root item`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get topological sort order
   */
  getTopologicalOrder(): string[] {
    const graph = this.getDependencyGraph()
    const visited = new Set<string>()
    const tempVisited = new Set<string>()
    const result: string[] = []

    const visit = (node: string) => {
      if (tempVisited.has(node)) {
        throw new Error(`Circular dependency detected involving: ${node}`)
      }
      if (visited.has(node)) {
        return
      }

      tempVisited.add(node)
      const deps = graph.get(node) || []
      for (const dep of deps) {
        visit(dep)
      }
      tempVisited.delete(node)
      visited.add(node)
      result.unshift(node) // Add to front for correct order
    }

    // Visit all nodes
    const allNodes = new Set<string>()
    for (const [node, deps] of graph.entries()) {
      allNodes.add(node)
      deps.forEach(dep => allNodes.add(dep))
    }

    for (const node of allNodes) {
      if (!visited.has(node)) {
        visit(node)
      }
    }

    return result
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear()
    this.dependents.clear()
    this.transitiveDependenciesCache.clear()
    this.lastGraphVersion = 0
    console.log('Dependency tracker cleared')
  }

  /**
   * Get statistics about the dependency graph
   */
  getStatistics(): {
    totalItems: number
    totalDependencies: number
    averageDependencies: number
    maxDependencies: number
    rootItems: number
    leafItems: number
    cycles: number
  } {
    const allItems = new Set<string>()
    let totalDependencies = 0

    for (const [dependent, dependencies] of this.dependencies.entries()) {
      allItems.add(dependent)
      totalDependencies += dependencies.size
      dependencies.forEach(dep => allItems.add(dep))
    }

    for (const [dependency] of this.dependents.entries()) {
      allItems.add(dependency)
    }

    const dependencyCounts = Array.from(allItems).map(item => 
      this.dependencies.get(item)?.size || 0
    )

    const rootItems = Array.from(allItems).filter(item => 
      (this.dependencies.get(item)?.size || 0) === 0
    ).length

    const leafItems = Array.from(allItems).filter(item => 
      (this.dependents.get(item)?.size || 0) === 0
    ).length

    return {
      totalItems: allItems.size,
      totalDependencies,
      averageDependencies: allItems.size > 0 ? totalDependencies / allItems.size : 0,
      maxDependencies: Math.max(...dependencyCounts, 0),
      rootItems,
      leafItems,
      cycles: this.findCycles().length
    }
  }

  // Private helper methods

  private wouldCreateCycle(dependent: string, dependency: string): boolean {
    // Check if dependency has dependent in its transitive dependencies
    const transitiveDeps = this.getTransitiveDependencies(dependency)
    return transitiveDeps.includes(dependent)
  }

  private findCycles(): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()
    const path: string[] = []

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) {
        // Found a cycle - extract the cycle from path
        const cycleStart = path.indexOf(node)
        if (cycleStart >= 0) {
          const cycle = path.slice(cycleStart).concat([node])
          cycles.push(cycle)
        }
        return true
      }

      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recStack.add(node)
      path.push(node)

      const dependencies = this.dependencies.get(node) || new Set()
      for (const dep of dependencies) {
        if (dfs(dep)) {
          // Cycle found in subtree
        }
      }

      recStack.delete(node)
      path.pop()
      return false
    }

    // Check all nodes
    const allNodes = new Set<string>()
    for (const [node, deps] of this.dependencies.entries()) {
      allNodes.add(node)
      deps.forEach(dep => allNodes.add(dep))
    }

    for (const node of allNodes) {
      if (!visited.has(node)) {
        dfs(node)
      }
    }

    return cycles
  }

  private getRootItems(): string[] {
    const allItems = new Set<string>()
    for (const [dependent, dependencies] of this.dependencies.entries()) {
      allItems.add(dependent)
      dependencies.forEach(dep => allItems.add(dep))
    }

    return Array.from(allItems).filter(item => 
      (this.dependencies.get(item)?.size || 0) === 0
    )
  }

  private invalidateTransitiveCache(): void {
    this.transitiveDependenciesCache.clear()
    this.lastGraphVersion++
  }
}

/**
 * Singleton instance of the dependency tracker
 */
export const dependencyTracker = new DependencyTrackerImpl() 