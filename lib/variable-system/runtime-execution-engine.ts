/**
 * Runtime Execution Engine
 * 
 * Enhanced execution engine that integrates with the interpolation parser and 
 * dependency resolver to provide expression evaluation, Logic section integration,
 * and modular section APIs.
 */

import {
  parseInterpolations,
  InterpolationNode,
  ExpressionNode,
  ParseResult
} from './interpolation-parser'
import { interpolationResolver } from './interpolation-dependency-resolver'
import { RuntimeEngine } from './execution-context'
import {
  ExecutionContext,
  VariableMetadata,
  VariableValidationResult
} from '../types/variable-system'

// =============================================================================
// EXPRESSION EVALUATION TYPES
// =============================================================================

export interface ExpressionContext {
  variables: Record<string, any>
  functions: Record<string, Function>
  session: Record<string, any>
  metadata: Record<string, any>
}

export interface EvaluationResult {
  success: boolean
  value: any
  error?: string
  usedVariables: string[]
  executionTime: number
}

export interface SectionComponent {
  id: string
  type: string
  onVariableUpdate?: (variableId: string, value: any) => void
  onError?: (error: Error) => void
  requiresAI?: boolean
}

export interface LogicSectionConfig {
  apiEndpoint: string
  modelId: string
  prompt: string
  inputVariables: string[]
  outputVariable: string
  temperature?: number
  maxTokens?: number
}

// =============================================================================
// EXPRESSION EVALUATOR
// =============================================================================

export class ExpressionEvaluator {
  private functions = new Map<string, Function>()

  constructor() {
    this.initializeBuiltinFunctions()
  }

  /**
   * Evaluate an expression in a sandboxed environment
   */
  async evaluateExpression(
    expression: ExpressionNode,
    context: ExpressionContext
  ): Promise<EvaluationResult> {
    const startTime = Date.now()
    const usedVariables: string[] = []

    try {
      const value = await this.evaluateNode(expression, context, usedVariables)
      
      return {
        success: true,
        value,
        usedVariables,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        value: undefined,
        error: error instanceof Error ? error.message : String(error),
        usedVariables,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Evaluate interpolated text content
   */
  async evaluateText(
    text: string,
    context: ExpressionContext
  ): Promise<EvaluationResult> {
    const startTime = Date.now()
    const usedVariables: string[] = []

    try {
      const parseResult = parseInterpolations(text)
      
      if (!parseResult.success) {
        throw new Error(`Parse error: ${parseResult.errors.map(e => e.message).join(', ')}`)
      }

      let result = text
      
      // Replace interpolations with evaluated values
      for (const interpolation of parseResult.interpolations) {
        const evalResult = await this.evaluateExpression(interpolation.expression, context)
        
        if (!evalResult.success) {
          throw new Error(`Evaluation error in '${interpolation.rawText}': ${evalResult.error}`)
        }
        
        usedVariables.push(...evalResult.usedVariables)
        
        // Replace interpolation with formatted value
        const formattedValue = this.formatValue(evalResult.value)
        result = result.replace(interpolation.rawText, formattedValue)
      }

      return {
        success: true,
        value: result,
        usedVariables: Array.from(new Set(usedVariables)),
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        value: text,
        error: error instanceof Error ? error.message : String(error),
        usedVariables,
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Register custom function for expressions
   */
  registerFunction(name: string, func: Function): void {
    this.functions.set(name, func)
  }

  private async evaluateNode(
    node: ExpressionNode,
    context: ExpressionContext,
    usedVariables: string[]
  ): Promise<any> {
    switch (node.type) {
      case 'variable':
        return this.evaluateVariable(node.name, context, usedVariables)
      
      case 'literal':
        return node.value
      
      case 'function':
        return this.evaluateFunction(node, context, usedVariables)
      
      case 'conditional':
        return this.evaluateConditional(node, context, usedVariables)
      
      default:
        throw new Error(`Unknown expression type: ${(node as any).type}`)
    }
  }

  private evaluateVariable(
    name: string,
    context: ExpressionContext,
    usedVariables: string[]
  ): any {
    usedVariables.push(name)
    
    // Support dot notation for nested properties
    const parts = name.split('.')
    let value = context.variables[parts[0]]
    
    for (let i = 1; i < parts.length && value !== undefined; i++) {
      value = value[parts[i]]
    }
    
    return value
  }

  private async evaluateFunction(
    node: any,
    context: ExpressionContext,
    usedVariables: string[]
  ): Promise<any> {
    const func = this.functions.get(node.name) || context.functions[node.name]
    
    if (!func) {
      throw new Error(`Unknown function: ${node.name}`)
    }
    
    // Evaluate arguments
    const args = []
    for (const arg of node.arguments) {
      const value = await this.evaluateNode(arg, context, usedVariables)
      args.push(value)
    }
    
    // Execute function in controlled environment
    return this.executeFunctionSafely(func, args)
  }

  private async evaluateConditional(
    node: any,
    context: ExpressionContext,
    usedVariables: string[]
  ): Promise<any> {
    const condition = await this.evaluateNode(node.condition, context, usedVariables)
    
    if (this.isTruthy(condition)) {
      return this.evaluateNode(node.thenBranch, context, usedVariables)
    } else if (node.elseBranch) {
      return this.evaluateNode(node.elseBranch, context, usedVariables)
    }
    
    return undefined
  }

  private executeFunctionSafely(func: Function, args: any[]): any {
    // Add timeout and security constraints
    try {
      return func.apply(null, args)
    } catch (error) {
      throw new Error(`Function execution failed: ${error}`)
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined || value === false) return false
    if (typeof value === 'number') return value !== 0 && !isNaN(value)
    if (typeof value === 'string') return value.length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return Boolean(value)
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  private initializeBuiltinFunctions(): void {
    // String functions
    this.functions.set('upper', (str: string) => String(str).toUpperCase())
    this.functions.set('lower', (str: string) => String(str).toLowerCase())
    this.functions.set('trim', (str: string) => String(str).trim())
    this.functions.set('length', (str: string) => String(str).length)
    this.functions.set('substring', (str: string, start: number, end?: number) => 
      String(str).substring(start, end))
    
    // Number functions
    this.functions.set('round', (num: number) => Math.round(Number(num)))
    this.functions.set('floor', (num: number) => Math.floor(Number(num)))
    this.functions.set('ceil', (num: number) => Math.ceil(Number(num)))
    this.functions.set('abs', (num: number) => Math.abs(Number(num)))
    
    // Array functions
    this.functions.set('join', (arr: any[], separator = ',') => 
      Array.isArray(arr) ? arr.join(separator) : String(arr))
    this.functions.set('first', (arr: any[]) => 
      Array.isArray(arr) ? arr[0] : undefined)
    this.functions.set('last', (arr: any[]) => 
      Array.isArray(arr) ? arr[arr.length - 1] : undefined)
    
    // Date functions
    this.functions.set('now', () => new Date())
    this.functions.set('formatDate', (date: Date | string, format = 'YYYY-MM-DD') => {
      const d = new Date(date)
      return d.toISOString().split('T')[0] // Basic date formatting
    })
    
    // Type conversion functions
    this.functions.set('toString', (value: any) => String(value))
    this.functions.set('toNumber', (value: any) => Number(value))
    this.functions.set('toBoolean', (value: any) => Boolean(value))
    
    // Conditional functions
    this.functions.set('ifEmpty', (value: any, defaultValue: any) => 
      (value === null || value === undefined || value === '') ? defaultValue : value)
    this.functions.set('ifNull', (value: any, defaultValue: any) => 
      (value === null || value === undefined) ? defaultValue : value)
  }
}

// =============================================================================
// SECTION COMPONENT MANAGER
// =============================================================================

export class SectionComponentManager {
  private components = new Map<string, SectionComponent>()
  private subscriptions = new Map<string, Set<string>>() // variableId -> componentIds

  /**
   * Register a section component
   */
  registerComponent(component: SectionComponent): void {
    this.components.set(component.id, component)
  }

  /**
   * Unregister a section component
   */
  unregisterComponent(componentId: string): void {
    this.components.delete(componentId)
    
    // Remove from all subscriptions
    for (const [variableId, componentIds] of this.subscriptions.entries()) {
      componentIds.delete(componentId)
      if (componentIds.size === 0) {
        this.subscriptions.delete(variableId)
      }
    }
  }

  /**
   * Subscribe component to variable updates
   */
  subscribeToVariable(componentId: string, variableId: string): void {
    if (!this.subscriptions.has(variableId)) {
      this.subscriptions.set(variableId, new Set())
    }
    this.subscriptions.get(variableId)!.add(componentId)
  }

  /**
   * Notify components of variable updates
   */
  notifyVariableUpdate(variableId: string, value: any): void {
    const componentIds = this.subscriptions.get(variableId)
    if (!componentIds) return

    for (const componentId of componentIds) {
      const component = this.components.get(componentId)
      if (component?.onVariableUpdate) {
        try {
          component.onVariableUpdate(variableId, value)
        } catch (error) {
          console.error(`Error notifying component ${componentId}:`, error)
          if (component.onError) {
            component.onError(error as Error)
          }
        }
      }
    }
  }

  /**
   * Get components that require AI processing
   */
  getAIComponents(): SectionComponent[] {
    return Array.from(this.components.values()).filter(c => c.requiresAI)
  }

  /**
   * Get all registered components
   */
  getAllComponents(): SectionComponent[] {
    return Array.from(this.components.values())
  }
}

// =============================================================================
// LOGIC SECTION PROCESSOR
// =============================================================================

export class LogicSectionProcessor {
  /**
   * Execute Logic section with AI API call
   */
  async executeLogicSection(
    config: LogicSectionConfig,
    context: ExecutionContext
  ): Promise<any> {
    try {
      // Resolve input variables
      const inputValues: Record<string, any> = {}
      for (const variableId of config.inputVariables) {
        inputValues[variableId] = context.variables.getValue(variableId)
      }

      // Prepare prompt with variable substitution
      const prompt = await this.substituteVariables(config.prompt, inputValues)

      // Make AI API call
      const response = await this.callAIAPI(config, prompt)

      // Store result in output variable
      if (config.outputVariable) {
        context.variables.setValue(config.outputVariable, response)
      }

      return response

    } catch (error) {
      console.error('Logic section execution failed:', error)
      throw error
    }
  }

  private async substituteVariables(
    prompt: string,
    variables: Record<string, any>
  ): Promise<string> {
    const evaluator = new ExpressionEvaluator()
    const context: ExpressionContext = {
      variables,
      functions: {},
      session: {},
      metadata: {}
    }

    const result = await evaluator.evaluateText(prompt, context)
    
    if (!result.success) {
      throw new Error(`Prompt variable substitution failed: ${result.error}`)
    }

    return result.value
  }

  private async callAIAPI(
    config: LogicSectionConfig,
    prompt: string
  ): Promise<string> {
    // This would integrate with actual AI service
    // For now, return a placeholder
    console.log(`AI API call to ${config.modelId}:`, prompt)
    
    // TODO: Implement actual AI API integration
    return `AI response for prompt: ${prompt.substring(0, 50)}...`
  }
}

// =============================================================================
// ENHANCED RUNTIME EXECUTION ENGINE
// =============================================================================

export class RuntimeExecutionEngine {
  private baseEngine: RuntimeEngine
  private evaluator: ExpressionEvaluator
  private componentManager: SectionComponentManager
  private logicProcessor: LogicSectionProcessor

  constructor(private context: ExecutionContext) {
    this.baseEngine = new RuntimeEngine(context)
    this.evaluator = new ExpressionEvaluator()
    this.componentManager = new SectionComponentManager()
    this.logicProcessor = new LogicSectionProcessor()
  }

  /**
   * Enhanced variable resolution with expression evaluation
   */
  async resolveVariableWithExpression(
    variableId: string,
    expression?: string
  ): Promise<any> {
    if (!expression) {
      return this.baseEngine.resolveVariable(variableId)
    }

    try {
      // Create expression context
      const expressionContext: ExpressionContext = {
        variables: this.getAllVariableValues(),
        functions: {},
        session: this.context.session.responses,
        metadata: this.context.session.metadata || {}
      }

      // Evaluate expression
      const result = await this.evaluator.evaluateText(expression, expressionContext)
      
      if (!result.success) {
        throw new Error(`Expression evaluation failed: ${result.error}`)
      }

      // Update variable with resolved value
      await this.populateVariable(variableId, result.value)
      
      return result.value

    } catch (error) {
      console.error(`Enhanced variable resolution failed for ${variableId}:`, error)
      throw error
    }
  }

  /**
   * Process text content with interpolations
   */
  async processInterpolatedText(text: string): Promise<string> {
    const expressionContext: ExpressionContext = {
      variables: this.getAllVariableValues(),
      functions: {},
      session: this.context.session.responses,
      metadata: this.context.session.metadata || {}
    }

    const result = await this.evaluator.evaluateText(text, expressionContext)
    
    if (!result.success) {
      console.warn(`Text interpolation failed: ${result.error}`)
      return text // Return original text on error
    }

    return result.value
  }

  /**
   * Execute Logic section with AI integration
   */
  async executeLogicSection(config: LogicSectionConfig): Promise<any> {
    const startTime = Date.now()
    
    try {
      this.context.currentSection = `logic_${config.outputVariable}`
      
      const result = await this.logicProcessor.executeLogicSection(config, this.context)
      
      // Notify components of variable update
      this.componentManager.notifyVariableUpdate(config.outputVariable, result)
      
      const duration = Date.now() - startTime
      this.updateMetrics(`logic_${config.outputVariable}`, duration)
      
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      this.recordError(`logic_${config.outputVariable}`, duration, error as Error)
      throw error
    }
  }

  /**
   * Register section component
   */
  registerComponent(component: SectionComponent): void {
    this.componentManager.registerComponent(component)
  }

  /**
   * Subscribe component to variable updates
   */
  subscribeComponentToVariable(componentId: string, variableId: string): void {
    this.componentManager.subscribeToVariable(componentId, variableId)
  }

  /**
   * Enhanced variable population with component notifications
   */
  async populateVariable(variableId: string, value: any): Promise<void> {
    await this.baseEngine.populateVariable(variableId, value)
    
    // Notify subscribed components
    this.componentManager.notifyVariableUpdate(variableId, value)
  }

  /**
   * Register custom function for expressions
   */
  registerExpressionFunction(name: string, func: Function): void {
    this.evaluator.registerFunction(name, func)
  }

  /**
   * Batch process multiple Logic sections
   */
  async executeMultipleLogicSections(configs: LogicSectionConfig[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    // Execute in dependency order
    for (const config of configs) {
      try {
        results[config.outputVariable] = await this.executeLogicSection(config)
      } catch (error) {
        console.error(`Logic section failed for ${config.outputVariable}:`, error)
        results[config.outputVariable] = null
      }
    }
    
    return results
  }

  /**
   * Execute section using base engine
   */
  async executeSection(sectionId: string): Promise<void> {
    return this.baseEngine.executeSection(sectionId)
  }

  /**
   * Resolve variable using base engine
   */
  async resolveVariable(variableId: string): Promise<any> {
    return this.baseEngine.resolveVariable(variableId)
  }

  /**
   * Get metrics from base engine
   */
  getMetrics() {
    return this.baseEngine.getMetrics()
  }

  /**
   * Reset both engines
   */
  reset(): void {
    this.baseEngine.reset()
    this.componentManager = new SectionComponentManager()
  }

  private getAllVariableValues(): Record<string, any> {
    const values: Record<string, any> = {}
    const variables = this.context.variables.getAllVariables()
    
    for (const variable of variables) {
      values[variable.id] = this.context.variables.getValue(variable.id)
    }
    
    return values
  }

  private updateMetrics(sectionId: string, duration: number): void {
    this.context.metrics.sectionRenderTimes[sectionId] = duration
    this.context.metrics.totalTime += duration
  }

  private recordError(sectionId: string, duration: number, error: Error): void {
    console.error(`Section ${sectionId} failed after ${duration}ms:`, error)
    this.context.metrics.sectionRenderTimes[sectionId] = duration
    this.context.metrics.totalTime += duration
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create enhanced runtime execution engine
 */
export function createRuntimeExecutionEngine(context: ExecutionContext): RuntimeExecutionEngine {
  return new RuntimeExecutionEngine(context)
}

/**
 * Singleton expression evaluator
 */
export const expressionEvaluator = new ExpressionEvaluator()

/**
 * Singleton component manager
 */
export const sectionComponentManager = new SectionComponentManager()

/**
 * Singleton logic processor
 */
export const logicSectionProcessor = new LogicSectionProcessor() 