/**
 * Variable System and Modular Section Architecture Types
 * 
 * This file defines the core interfaces for the variable system that enables
 * dynamic content generation and modular section architecture.
 */

import React from 'react'
import { Campaign } from './database'

// =============================================================================
// VARIABLE SYSTEM CORE TYPES
// =============================================================================

/**
 * Supported variable data types
 */
export type VariableType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'date'
  | 'email'
  | 'phone'
  | 'url'

/**
 * Variable metadata stored in the registry
 */
export interface VariableMetadata {
  /** Unique variable identifier */
  id: string
  /** Human-readable variable name */
  name: string
  /** Description of what this variable represents */
  description: string
  /** Data type of the variable */
  type: VariableType
  /** ID of the section that produces this variable */
  sourceSection: string
  /** Namespace to prevent naming conflicts */
  namespace?: string
  /** Default value if none provided */
  defaultValue?: any
  /** Validation rules for the variable */
  validation?: VariableValidationRule[]
  /** Whether this variable is required */
  required: boolean
  /** Timestamp when variable was registered */
  createdAt: Date
  /** Timestamp when variable was last updated */
  updatedAt: Date
}

/**
 * Variable validation rule
 */
export interface VariableValidationRule {
  /** Rule type identifier */
  type: string
  /** Rule configuration */
  config: Record<string, any>
  /** Custom error message */
  message?: string
}

/**
 * Variable validation result
 */
export interface VariableValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Validation errors if any */
  errors: string[]
  /** Warnings that don't fail validation */
  warnings: string[]
}

/**
 * Variable definition for producers (sections that create variables)
 */
export interface VariableProducerDefinition {
  /** Variable identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Description of the variable */
  description: string
  /** Variable data type */
  type: VariableType
  /** Default value */
  defaultValue?: any
  /** Validation rules */
  validation?: VariableValidationRule[]
  /** Whether this variable is always produced */
  required: boolean
}

/**
 * Variable definition for consumers (sections that use variables)
 */
export interface VariableConsumerDefinition {
  /** Variable identifier to consume */
  id: string
  /** Human-readable name in this context */
  name: string
  /** Description of how variable is used */
  description: string
  /** Expected variable data type */
  type: VariableType
  /** Whether this variable is required for section to function */
  required: boolean
  /** Fallback value if variable not available */
  fallbackValue?: any
}

// =============================================================================
// SECTION ARCHITECTURE INTERFACES
// =============================================================================

/**
 * Enhanced section type definition with variable capabilities
 */
export interface SectionTypeDefinition {
  /** Unique section type identifier */
  id: string
  /** Human-readable section name */
  name: string
  /** Description of section functionality */
  description: string
  /** Icon identifier for UI */
  icon: string
  /** Section category */
  category: 'input' | 'content' | 'logic' | 'output'
  /** UI styling information */
  color: string
  /** Variables this section type can produce */
  variableProducers?: VariableProducerDefinition[]
  /** Variables this section type can consume */
  variableConsumers?: VariableConsumerDefinition[]
  /** Default settings for new instances */
  defaultSettings?: Record<string, any>
  /** Version for compatibility tracking */
  version: string
  /** Whether section can be used multiple times */
  allowMultiple: boolean
}

/**
 * Base interface for all section settings
 */
export interface BaseSectionSettings {
  /** Section type identifier */
  type: string
  /** Section title */
  title?: string
  /** Whether section is visible */
  visible?: boolean
  /** Custom CSS classes */
  className?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Generic section interface with strongly typed settings
 */
export interface Section<T extends BaseSectionSettings = BaseSectionSettings> {
  /** Unique section instance ID */
  id: string
  /** Section type identifier */
  type: string
  /** Section configuration */
  settings: T
  /** Section order in campaign */
  order: number
  /** Whether section is visible */
  isVisible: boolean
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
  
  /** Get variables this section produces */
  getVariableProducers(): VariableProducer[]
  /** Get variables this section consumes */
  getVariableConsumers(): VariableConsumer[]
  /** Validate section configuration */
  validate(): VariableValidationResult
}

/**
 * Runtime variable producer instance
 */
export interface VariableProducer {
  /** Producer definition */
  definition: VariableProducerDefinition
  /** Section that owns this producer */
  sectionId: string
  /** Get current variable value */
  getValue(context: ExecutionContext): any
  /** Set variable value */
  setValue(value: any, context: ExecutionContext): void
}

/**
 * Runtime variable consumer instance
 */
export interface VariableConsumer {
  /** Consumer definition */
  definition: VariableConsumerDefinition
  /** Section that owns this consumer */
  sectionId: string
  /** Get consumed variable value */
  getValue(context: ExecutionContext): any
  /** Check if required variable is available */
  isAvailable(context: ExecutionContext): boolean
}

/**
 * Section component props interface
 */
export interface SectionProps<T extends BaseSectionSettings = BaseSectionSettings> {
  /** Section instance */
  section: Section<T>
  /** Execution context */
  context: ExecutionContext
  /** Whether section is in edit mode */
  isEditing?: boolean
  /** Callback for settings updates */
  onUpdate?: (settings: Partial<T>) => void
  /** Callback for variable updates */
  onVariableUpdate?: (variableId: string, value: any) => void
  /** Additional props */
  [key: string]: any
}

/**
 * Section settings component props
 */
export interface SectionSettingsProps<T extends BaseSectionSettings = BaseSectionSettings> {
  /** Current section settings */
  settings: T
  /** Available variables from other sections */
  availableVariables: VariableMetadata[]
  /** Callback for settings changes */
  onChange: (settings: Partial<T>) => void
  /** Validation errors */
  errors?: Record<string, string>
}

/**
 * Section configuration for registry
 */
export interface SectionConfig<T extends BaseSectionSettings = BaseSectionSettings> {
  /** Section type definition */
  type: SectionTypeDefinition
  /** React component for rendering */
  component: React.ComponentType<SectionProps<T>>
  /** React component for settings panel */
  settingsComponent?: React.ComponentType<SectionSettingsProps<T>>
  /** Settings validator function */
  validator?: (settings: T) => VariableValidationResult
  /** Custom initialization logic */
  initializer?: (settings: Partial<T>) => T
}

// =============================================================================
// EXECUTION CONTEXT
// =============================================================================

/**
 * Runtime execution context
 */
export interface ExecutionContext {
  /** Campaign being executed */
  campaign: Campaign
  /** Variable registry */
  variables: VariableRegistry
  /** User session data */
  session: SessionData
  /** Current section being processed */
  currentSection?: string
  /** Section execution history */
  executionHistory: ExecutionHistoryEntry[]
  /** Performance metrics */
  metrics: ExecutionMetrics
}

/**
 * User session data during campaign execution
 */
export interface SessionData {
  /** Unique session identifier */
  sessionId: string
  /** User identifier if available */
  userId?: string
  /** Session start time */
  startTime: Date
  /** User responses to questions */
  responses: Record<string, any>
  /** Lead capture data */
  leadData?: Record<string, any>
  /** Custom session metadata */
  metadata: Record<string, any>
}

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  /** Section that was executed */
  sectionId: string
  /** Execution timestamp */
  timestamp: Date
  /** Variables produced */
  variablesProduced: Record<string, any>
  /** Execution duration in ms */
  duration: number
  /** Any errors that occurred */
  errors?: string[]
}

/**
 * Execution performance metrics
 */
export interface ExecutionMetrics {
  /** Total execution time */
  totalTime: number
  /** Variable lookup times */
  variableLookupTimes: Record<string, number>
  /** Section render times */
  sectionRenderTimes: Record<string, number>
  /** Memory usage statistics */
  memoryUsage: {
    variableCount: number
    totalVariableSize: number
    cacheHitRate: number
  }
}

// =============================================================================
// VARIABLE REGISTRY INTERFACES
// =============================================================================

/**
 * Variable registry for managing variables across sections
 */
export interface VariableRegistry {
  /** Register a new variable */
  register(metadata: Omit<VariableMetadata, 'createdAt' | 'updatedAt'>): void
  
  /** Unregister a variable */
  unregister(variableId: string): void
  
  /** Get variable metadata */
  getVariable(variableId: string): VariableMetadata | undefined
  
  /** Get all variables */
  getAllVariables(): VariableMetadata[]
  
  /** Get variables by namespace */
  getVariablesByNamespace(namespace: string): VariableMetadata[]
  
  /** Get variables by source section */
  getVariablesBySource(sectionId: string): VariableMetadata[]
  
  /** Set variable value */
  setValue(variableId: string, value: any): void
  
  /** Get variable value */
  getValue(variableId: string): any
  
  /** Check if variable exists */
  hasVariable(variableId: string): boolean
  
  /** Validate variable value */
  validateValue(variableId: string, value: any): VariableValidationResult
  
  /** Clear all variables */
  clear(): void
  
  /** Get variable dependencies */
  getDependencies(variableId: string): string[]
  
  /** Get dependent variables */
  getDependents(variableId: string): string[]
}

/**
 * Section registry for managing section types
 */
export interface SectionRegistry {
  /** Register a section type */
  register<T extends BaseSectionSettings>(config: SectionConfig<T>): void
  
  /** Unregister a section type */
  unregister(typeId: string): void
  
  /** Get section type definition */
  getType(typeId: string): SectionTypeDefinition | undefined
  
  /** Get all section types */
  getTypes(): SectionTypeDefinition[]
  
  /** Get section types by category */
  getTypesByCategory(category: SectionTypeDefinition['category']): SectionTypeDefinition[]
  
  /** Get section configuration */
  getConfig<T extends BaseSectionSettings>(typeId: string): SectionConfig<T> | undefined
  
  /** Check if section type is registered */
  hasType(typeId: string): boolean
  
  /** Create section instance */
  createSection<T extends BaseSectionSettings>(
    typeId: string, 
    settings: Partial<T>
  ): Section<T> | undefined
}

/**
 * Dependency tracker for sections and variables
 */
export interface DependencyTracker {
  /** Add dependency relationship */
  addDependency(dependent: string, dependency: string): void
  
  /** Remove dependency relationship */
  removeDependency(dependent: string, dependency: string): void
  
  /** Get direct dependencies */
  getDependencies(itemId: string): string[]
  
  /** Get all dependents */
  getDependents(itemId: string): string[]
  
  /** Get transitive dependencies */
  getTransitiveDependencies(itemId: string): string[]
  
  /** Check for circular dependencies */
  hasCircularDependency(itemId: string): boolean
  
  /** Get dependency graph */
  getDependencyGraph(): Map<string, string[]>
  
  /** Calculate impact of removing item */
  getRemovalImpact(itemId: string): string[]
  
  /** Validate dependency graph */
  validateGraph(): VariableValidationResult
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Type guard for section settings
 */
export type SectionSettingsFor<T extends string> = T extends 'capture' 
  ? CaptureSettings 
  : T extends 'question-multiple-choice'
  ? MultipleChoiceSettings
  : T extends 'output-results'
  ? OutputSettings
  : BaseSectionSettings

/**
 * Extract section settings type from section type ID
 */
export type ExtractSectionSettings<T extends SectionTypeDefinition> = 
  T['id'] extends string ? SectionSettingsFor<T['id']> : BaseSectionSettings

// =============================================================================
// CONCRETE SECTION SETTINGS (Examples)
// =============================================================================

/**
 * Capture section settings
 */
export interface CaptureSettings extends BaseSectionSettings {
  type: 'capture'
  title: string
  subheading?: string
  enabledFields: {
    name: boolean
    email: boolean
    phone: boolean
  }
  requiredFields: {
    name: boolean
    email: boolean
    phone: boolean
  }
  fieldLabels: {
    name: string
    email: string
    phone: string
  }
  fieldPlaceholders: {
    name: string
    email: string
    phone: string
  }
  submitButtonText: string
  gdprConsent: boolean
  marketingConsent: boolean
}

/**
 * Multiple choice question settings
 */
export interface MultipleChoiceSettings extends BaseSectionSettings {
  type: 'question-multiple-choice'
  question: string
  options: string[]
  allowMultiple: boolean
  required: boolean
  randomizeOptions?: boolean
  showOtherOption?: boolean
}

/**
 * Output section settings
 */
export interface OutputSettings extends BaseSectionSettings {
  type: 'output-results'
  title: string
  content: string
  showScore: boolean
  variableReferences: string[]
} 