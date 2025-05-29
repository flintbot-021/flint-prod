/**
 * Variable Store Management
 * 
 * Centralized store for managing variables throughout a campaign, including
 * both user inputs from question sections and AI-generated outputs from logic sections.
 */

import React from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { VariableInfo, extractVariablesFromCampaign } from '@/lib/utils/variable-extractor'
import { OutputDefinition } from '@/lib/types/logic-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VariableValue {
  id: string
  name: string
  value: any
  type: string
  source: 'user_input' | 'ai_output' | 'system'
  sectionId: string
  sectionOrder: number
  timestamp: string
  metadata?: {
    outputDefinitionId?: string
    aiResponseId?: string
    processed?: boolean
  }
}

export interface VariableScope {
  sectionId: string
  sectionOrder: number
  availableVariables: string[]
  localVariables: string[]
}

export interface VariableStoreState {
  values: Map<string, VariableValue>
  scopes: Map<string, VariableScope>
  availableVariablesCache: Map<string, VariableInfo[]>
  previewValues: Map<string, any>
  lastUpdated: string
}

export interface VariableUpdateEvent {
  type: 'variable_added' | 'variable_updated' | 'variable_removed' | 'scope_changed'
  variableName: string
  oldValue?: any
  newValue?: any
  sectionId: string
  timestamp: string
}

export interface VariableStoreOptions {
  enablePreview?: boolean
  enableHistory?: boolean
  maxHistorySize?: number
  autoCleanup?: boolean
}

// =============================================================================
// VARIABLE STORE CLASS
// =============================================================================

export class VariableStore {
  private state: VariableStoreState
  private sections: CampaignSection[]
  private options: VariableStoreOptions
  private listeners: ((event: VariableUpdateEvent) => void)[]
  private history: VariableUpdateEvent[]

  constructor(sections: CampaignSection[] = [], options: VariableStoreOptions = {}) {
    this.sections = sections
    this.options = {
      enablePreview: true,
      enableHistory: false,
      maxHistorySize: 100,
      autoCleanup: true,
      ...options
    }
    this.listeners = []
    this.history = []
    
    this.state = {
      values: new Map(),
      scopes: new Map(),
      availableVariablesCache: new Map(),
      previewValues: new Map(),
      lastUpdated: new Date().toISOString()
    }

    this.initializeFromSections()
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeFromSections(): void {
    // Extract all available variables from sections
    const allVariables = extractVariablesFromCampaign(this.sections, {
      includePreviewValues: this.options.enablePreview
    })

    // Initialize scopes for each section
    this.sections.forEach(section => {
      const availableVariables = extractVariablesFromCampaign(
        this.sections.filter(s => s.order < section.order),
        { includePreviewValues: this.options.enablePreview }
      )

      this.state.scopes.set(section.id, {
        sectionId: section.id,
        sectionOrder: section.order,
        availableVariables: availableVariables.map(v => v.name),
        localVariables: []
      })

      this.state.availableVariablesCache.set(section.id, availableVariables)
    })

    // Initialize preview values if enabled
    if (this.options.enablePreview) {
      this.initializePreviewValues()
    }

    this.updateTimestamp()
  }

  private initializePreviewValues(): void {
    const allVariables = extractVariablesFromCampaign(this.sections, {
      includePreviewValues: true
    })

    allVariables.forEach(variable => {
      if (variable.previewValue) {
        this.state.previewValues.set(variable.name, variable.previewValue)
      }
    })
  }

  // =============================================================================
  // SECTION MANAGEMENT
  // =============================================================================

  updateSections(sections: CampaignSection[]): void {
    this.sections = sections
    this.initializeFromSections()
    
    // Clean up variables from removed sections
    if (this.options.autoCleanup) {
      this.cleanupRemovedSections()
    }
  }

  private cleanupRemovedSections(): void {
    const sectionIds = new Set(this.sections.map(s => s.id))
    
    // Remove values from deleted sections
    for (const [variableName, value] of this.state.values.entries()) {
      if (!sectionIds.has(value.sectionId)) {
        this.removeVariable(variableName)
      }
    }

    // Remove scopes from deleted sections
    for (const sectionId of this.state.scopes.keys()) {
      if (!sectionIds.has(sectionId)) {
        this.state.scopes.delete(sectionId)
        this.state.availableVariablesCache.delete(sectionId)
      }
    }
  }

  // =============================================================================
  // VARIABLE MANAGEMENT
  // =============================================================================

  setVariable(
    name: string,
    value: any,
    type: string,
    source: 'user_input' | 'ai_output' | 'system',
    sectionId: string,
    metadata?: any
  ): void {
    const section = this.sections.find(s => s.id === sectionId)
    if (!section) {
      throw new Error(`Section with ID ${sectionId} not found`)
    }

    const oldValue = this.state.values.get(name)?.value
    const variableValue: VariableValue = {
      id: `${sectionId}_${name}_${Date.now()}`,
      name,
      value,
      type,
      source,
      sectionId,
      sectionOrder: section.order,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.state.values.set(name, variableValue)
    
    // Update local variables for the section
    const scope = this.state.scopes.get(sectionId)
    if (scope && !scope.localVariables.includes(name)) {
      scope.localVariables.push(name)
    }

    this.updateTimestamp()
    this.emitEvent({
      type: oldValue ? 'variable_updated' : 'variable_added',
      variableName: name,
      oldValue,
      newValue: value,
      sectionId,
      timestamp: new Date().toISOString()
    })
  }

  getVariable(name: string): VariableValue | undefined {
    return this.state.values.get(name)
  }

  getVariableValue(name: string): any {
    return this.state.values.get(name)?.value
  }

  removeVariable(name: string): void {
    const variable = this.state.values.get(name)
    if (!variable) return

    this.state.values.delete(name)
    
    // Remove from local variables
    const scope = this.state.scopes.get(variable.sectionId)
    if (scope) {
      scope.localVariables = scope.localVariables.filter(v => v !== name)
    }

    this.updateTimestamp()
    this.emitEvent({
      type: 'variable_removed',
      variableName: name,
      oldValue: variable.value,
      sectionId: variable.sectionId,
      timestamp: new Date().toISOString()
    })
  }

  // =============================================================================
  // SCOPE MANAGEMENT
  // =============================================================================

  getAvailableVariables(sectionId: string): VariableInfo[] {
    return this.state.availableVariablesCache.get(sectionId) || []
  }

  getAvailableVariableNames(sectionId: string): string[] {
    const scope = this.state.scopes.get(sectionId)
    return scope?.availableVariables || []
  }

  getVariablesForSection(sectionOrder: number): VariableValue[] {
    return Array.from(this.state.values.values())
      .filter(variable => variable.sectionOrder < sectionOrder)
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
  }

  canAccessVariable(variableName: string, fromSectionId: string): boolean {
    const variable = this.state.values.get(variableName)
    if (!variable) return false

    const fromSection = this.sections.find(s => s.id === fromSectionId)
    if (!fromSection) return false

    // Variables can only be accessed by sections that come after them
    return variable.sectionOrder < fromSection.order
  }

  // =============================================================================
  // AI OUTPUT MANAGEMENT
  // =============================================================================

  setAIOutputs(
    outputs: Record<string, any>,
    outputDefinitions: OutputDefinition[],
    sectionId: string,
    aiResponseId?: string
  ): void {
    outputDefinitions.forEach(definition => {
      const outputValue = outputs[definition.name]
      if (outputValue !== undefined) {
        this.setVariable(
          definition.name,
          outputValue,
          definition.dataType,
          'ai_output',
          sectionId,
          {
            outputDefinitionId: definition.id,
            aiResponseId,
            processed: true
          }
        )
      }
    })
  }

  getAIOutputs(sectionId: string): Record<string, any> {
    const outputs: Record<string, any> = {}
    
    for (const [name, variable] of this.state.values.entries()) {
      if (variable.sectionId === sectionId && variable.source === 'ai_output') {
        outputs[name] = variable.value
      }
    }
    
    return outputs
  }

  // =============================================================================
  // PREVIEW SYSTEM
  // =============================================================================

  getPreviewValue(variableName: string): any {
    // First check if we have an actual value
    const actualValue = this.getVariableValue(variableName)
    if (actualValue !== undefined) {
      return actualValue
    }

    // Fall back to preview value
    return this.state.previewValues.get(variableName)
  }

  setPreviewValue(variableName: string, value: any): void {
    this.state.previewValues.set(variableName, value)
    this.updateTimestamp()
  }

  getAllPreviewValues(): Record<string, any> {
    const preview: Record<string, any> = {}
    
    // Add actual values first
    for (const [name, variable] of this.state.values.entries()) {
      preview[name] = variable.value
    }
    
    // Add preview values for variables without actual values
    for (const [name, value] of this.state.previewValues.entries()) {
      if (!(name in preview)) {
        preview[name] = value
      }
    }
    
    return preview
  }

  // =============================================================================
  // EVENTS & LISTENERS
  // =============================================================================

  addEventListener(listener: (event: VariableUpdateEvent) => void): void {
    this.listeners.push(listener)
  }

  removeEventListener(listener: (event: VariableUpdateEvent) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  private emitEvent(event: VariableUpdateEvent): void {
    if (this.options.enableHistory) {
      this.history.push(event)
      if (this.history.length > (this.options.maxHistorySize || 100)) {
        this.history.shift()
      }
    }

    this.listeners.forEach(listener => listener(event))
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private updateTimestamp(): void {
    this.state.lastUpdated = new Date().toISOString()
  }

  getState(): Readonly<VariableStoreState> {
    return {
      ...this.state,
      values: new Map(this.state.values),
      scopes: new Map(this.state.scopes),
      availableVariablesCache: new Map(this.state.availableVariablesCache),
      previewValues: new Map(this.state.previewValues)
    }
  }

  getHistory(): VariableUpdateEvent[] {
    return [...this.history]
  }

  clear(): void {
    this.state.values.clear()
    this.state.previewValues.clear()
    this.history.length = 0
    this.updateTimestamp()
  }

  // =============================================================================
  // SERIALIZATION
  // =============================================================================

  toJSON(): any {
    return {
      values: Array.from(this.state.values.entries()),
      scopes: Array.from(this.state.scopes.entries()),
      previewValues: Array.from(this.state.previewValues.entries()),
      lastUpdated: this.state.lastUpdated,
      history: this.history
    }
  }

  static fromJSON(data: any, sections: CampaignSection[]): VariableStore {
    const store = new VariableStore(sections)
    
    if (data.values) {
      store.state.values = new Map(data.values)
    }
    
    if (data.scopes) {
      store.state.scopes = new Map(data.scopes)
    }
    
    if (data.previewValues) {
      store.state.previewValues = new Map(data.previewValues)
    }
    
    if (data.lastUpdated) {
      store.state.lastUpdated = data.lastUpdated
    }
    
    if (data.history) {
      store.history = data.history
    }
    
    return store
  }
}

// =============================================================================
// REACT HOOK
// =============================================================================

export interface UseVariableStoreOptions extends VariableStoreOptions {
  sections: CampaignSection[]
  autoUpdate?: boolean
}

/**
 * React hook for using the variable store
 */
export function useVariableStore(options: UseVariableStoreOptions) {
  const storeRef = React.useRef<VariableStore | null>(null)
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0)

  // Initialize store
  if (!storeRef.current) {
    storeRef.current = new VariableStore(options.sections, options)
  }

  // Update sections when they change
  React.useEffect(() => {
    if (storeRef.current && options.autoUpdate !== false) {
      storeRef.current.updateSections(options.sections)
    }
  }, [options.sections, options.autoUpdate])

  // Set up event listener for updates
  React.useEffect(() => {
    const store = storeRef.current
    if (!store) return

    const handleUpdate = () => {
      forceUpdate()
    }

    store.addEventListener(handleUpdate)
    return () => store.removeEventListener(handleUpdate)
  }, [])

  return storeRef.current
} 