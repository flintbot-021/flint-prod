/**
 * Variable System and Modular Section Architecture
 * 
 * This module provides the core infrastructure for managing variables
 * and modular section types in the campaign builder.
 */

// Export types
export * from '../types/variable-system'

// Export registry implementations
export { VariableRegistryImpl, variableRegistry } from './variable-registry'
export { SectionRegistryImpl, sectionRegistry } from './section-registry'
export { DependencyTrackerImpl, dependencyTracker } from './dependency-tracker'

// Export validation framework
export * from './validation-framework'

// Export execution context and runtime system
export * from './execution-context'

// Export interpolation parser
export * from './interpolation-parser'

// Export interpolation dependency resolver
export * from './interpolation-dependency-resolver'

// Export enhanced runtime execution engine
export * from './runtime-execution-engine'

// Export performance cache system
export * from './performance-cache'

// Export cached runtime execution engine
export * from './cached-runtime-engine'

// Export error handling system
export * from './error-handling'

// Export real-time update system
export * from './realtime-update-system'

// Export logging system
export * from './logging-system'

// Export helper utilities (to be implemented)
// export { ExecutionContextImpl } from './execution-context' 