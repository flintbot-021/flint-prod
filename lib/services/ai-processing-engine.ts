/**
 * AI Processing Engine
 * 
 * Handles AI prompt processing, response parsing, and output extraction
 * for Logic sections in the campaign builder.
 */

import { OutputDefinition, LogicSectionSettings, AIResponse, AIProcessingRecord } from '@/lib/types/logic-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AIProcessingOptions {
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface PromptTestRequest {
  prompt: string
  variables: Record<string, any>
  outputDefinitions: OutputDefinition[]
  settings?: LogicSectionSettings
}

export interface PromptTestResponse {
  success: boolean
  response?: AIResponse
  outputs?: Record<string, any>
  error?: string
  processingTime: number
  tokensUsed?: number
  cost?: number
}

export interface OutputExtractionResult {
  success: boolean
  outputs: Record<string, any>
  errors: string[]
  warnings: string[]
  extractedCount: number
  totalExpected: number
}

// =============================================================================
// AI PROCESSING ENGINE CLASS
// =============================================================================

export class AIProcessingEngine {
  private apiKey: string
  private defaultOptions: AIProcessingOptions

  constructor(apiKey: string, options: AIProcessingOptions = {}) {
    this.apiKey = apiKey
    this.defaultOptions = {
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      timeout: 30000,
      ...options
    }
  }

  // =============================================================================
  // PROMPT PROCESSING
  // =============================================================================

  /**
   * Process a prompt with variable substitution and AI execution
   */
  async processPrompt(request: PromptTestRequest): Promise<PromptTestResponse> {
    const startTime = Date.now()

    try {
      // 1. Replace variables in prompt
      const processedPrompt = this.replaceVariables(request.prompt, request.variables)

      // 2. Prepare AI request
      const aiRequest = this.prepareAIRequest(processedPrompt, request.outputDefinitions, request.settings)

      // 3. Call OpenAI API
      const aiResponse = await this.callOpenAI(aiRequest)

      // 4. Extract outputs from response
      const extractionResult = this.extractOutputs(aiResponse.content, request.outputDefinitions)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        response: {
          id: `ai_${Date.now()}`,
          timestamp: new Date().toISOString(),
          rawResponse: aiResponse.content,
          extractedOutputs: extractionResult.outputs,
          processingTimeMs: processingTime,
          model: aiRequest.model,
          provider: 'openai',
          tokenUsage: aiResponse.usage ? {
            input: aiResponse.usage.prompt_tokens || 0,
            output: aiResponse.usage.completion_tokens || 0,
            total: aiResponse.usage.total_tokens || 0
          } : undefined,
          cost: this.calculateCost(aiResponse.usage?.total_tokens, aiRequest.model),
          success: true
        },
        outputs: extractionResult.outputs,
        processingTime,
        tokensUsed: aiResponse.usage?.total_tokens,
        cost: this.calculateCost(aiResponse.usage?.total_tokens, aiRequest.model).amount
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime
      }
    }
  }

  /**
   * Replace variables in prompt text with actual values
   */
  private replaceVariables(prompt: string, variables: Record<string, any>): string {
    let processedPrompt = prompt

    // Replace @variable mentions with actual values
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`@${name}\\b`, 'g')
      const stringValue = this.formatVariableValue(value)
      processedPrompt = processedPrompt.replace(regex, stringValue)
    })

    return processedPrompt
  }

  /**
   * Format variable value for prompt insertion
   */
  private formatVariableValue(value: any): string {
    if (value === null || value === undefined) {
      return '[not provided]'
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  // =============================================================================
  // OPENAI API INTEGRATION
  // =============================================================================

  /**
   * Prepare the OpenAI API request
   */
  private prepareAIRequest(
    prompt: string, 
    outputDefinitions: OutputDefinition[], 
    settings?: LogicSectionSettings
  ) {
    const systemPrompt = this.buildSystemPrompt(outputDefinitions)
    const model = settings?.model || this.defaultOptions.model || 'gpt-4'
    const maxTokens = settings?.maxTokens || this.defaultOptions.maxTokens || 2000
    const temperature = settings?.temperature || this.defaultOptions.temperature || 0.7

    return {
      model,
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: outputDefinitions.length > 0 ? { type: 'json_object' as const } : undefined
    }
  }

  /**
   * Build system prompt for structured output
   */
  private buildSystemPrompt(outputDefinitions: OutputDefinition[]): string {
    if (outputDefinitions.length === 0) {
      return 'You are a helpful assistant. Provide a clear and comprehensive response to the user\'s request.'
    }

    const outputDescriptions = outputDefinitions.map(def => 
      `- ${def.name} (${def.dataType}): ${def.description}${def.required ? ' [REQUIRED]' : ''}`
    ).join('\n')

    return `You are a helpful assistant that provides structured responses in JSON format.

Please respond with a JSON object containing the following fields:
${outputDescriptions}

Important guidelines:
- Always return valid JSON
- Include all required fields
- Use appropriate data types (string, number, boolean, array, object)
- If a field cannot be determined, use null for optional fields or provide a reasonable default for required fields
- Be concise but informative in your responses`
  }

  /**
   * Call the OpenAI API
   */
  private async callOpenAI(request: any): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.defaultOptions.timeout || 30000)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI API')
    }

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }

  // =============================================================================
  // OUTPUT EXTRACTION
  // =============================================================================

  /**
   * Extract structured outputs from AI response
   */
  private extractOutputs(content: string, outputDefinitions: OutputDefinition[]): OutputExtractionResult {
    const result: OutputExtractionResult = {
      success: false,
      outputs: {},
      errors: [],
      warnings: [],
      extractedCount: 0,
      totalExpected: outputDefinitions.length
    }

    if (outputDefinitions.length === 0) {
      // No structured output expected
      result.success = true
      return result
    }

    try {
      // Try to parse as JSON
      const parsedContent = JSON.parse(content)
      
      // Extract each defined output
      outputDefinitions.forEach(definition => {
        const value = parsedContent[definition.name]
        
        if (value !== undefined && value !== null) {
          // Validate and convert the value
          const validatedValue = this.validateAndConvertValue(value, definition)
          result.outputs[definition.name] = validatedValue
          result.extractedCount++
        } else if (definition.required) {
          result.errors.push(`Required output '${definition.name}' not found in response`)
        } else {
          result.warnings.push(`Optional output '${definition.name}' not found in response`)
        }
      })

      result.success = result.errors.length === 0
    } catch (error) {
      // If JSON parsing fails, try to extract values using regex or other methods
      result.errors.push(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Attempt fallback extraction for simple cases
      this.attemptFallbackExtraction(content, outputDefinitions, result)
    }

    return result
  }

  /**
   * Validate and convert value according to output definition
   */
  private validateAndConvertValue(value: any, definition: OutputDefinition): any {
    switch (definition.dataType) {
      case 'text':
        return String(value)
      
      case 'number':
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error(`Invalid number value for ${definition.name}: ${value}`)
        }
        return num
      
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          const lower = value.toLowerCase()
          if (lower === 'true' || lower === 'yes' || lower === '1') return true
          if (lower === 'false' || lower === 'no' || lower === '0') return false
        }
        throw new Error(`Invalid boolean value for ${definition.name}: ${value}`)
      
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Expected array for ${definition.name}, got ${typeof value}`)
        }
        return value
      
      case 'json':
        if (typeof value === 'object') return value
        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          } catch {
            throw new Error(`Invalid JSON value for ${definition.name}`)
          }
        }
        throw new Error(`Invalid JSON value for ${definition.name}: ${typeof value}`)
      
      default:
        return value
    }
  }

  /**
   * Attempt fallback extraction when JSON parsing fails
   */
  private attemptFallbackExtraction(
    content: string, 
    outputDefinitions: OutputDefinition[], 
    result: OutputExtractionResult
  ): void {
    // Simple regex-based extraction for common patterns
    outputDefinitions.forEach(definition => {
      if (definition.dataType === 'text') {
        // Look for patterns like "fieldname: value" or "fieldname = value"
        const patterns = [
          new RegExp(`${definition.name}\\s*[:=]\\s*(.+?)(?:\\n|$)`, 'i'),
          new RegExp(`"${definition.name}"\\s*[:=]\\s*"([^"]+)"`, 'i'),
          new RegExp(`'${definition.name}'\\s*[:=]\\s*'([^']+)'`, 'i')
        ]

        for (const pattern of patterns) {
          const match = content.match(pattern)
          if (match && match[1]) {
            result.outputs[definition.name] = match[1].trim()
            result.extractedCount++
            break
          }
        }
      }
    })

    if (result.extractedCount > 0) {
      result.warnings.push('Used fallback extraction method - results may be incomplete')
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Calculate estimated cost for API usage
   */
  private calculateCost(tokens?: number, model?: string): { amount: number; currency: string } {
    if (!tokens) return { amount: 0, currency: 'USD' }

    // Rough cost estimates (as of 2024) - should be updated with current pricing
    const costPerToken = {
      'gpt-4': 0.00003,
      'gpt-4-turbo': 0.00001,
      'gpt-3.5-turbo': 0.000002
    }

    const rate = costPerToken[model as keyof typeof costPerToken] || costPerToken['gpt-4']
    return {
      amount: tokens * rate,
      currency: 'USD'
    }
  }

  /**
   * Create a processing record for audit trail
   */
  createProcessingRecord(
    request: PromptTestRequest,
    response: PromptTestResponse
  ): AIProcessingRecord {
    return {
      id: `proc_${Date.now()}`,
      timestamp: new Date().toISOString(),
      inputs: request.variables,
      prompt: request.prompt,
      response: response.response,
      status: response.success ? 'completed' : 'failed',
      error: response.error
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return {
          success: false,
          error: `API connection failed: ${response.status} ${response.statusText}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create an AI processing engine instance
 */
export function createAIProcessingEngine(apiKey: string, options?: AIProcessingOptions): AIProcessingEngine {
  return new AIProcessingEngine(apiKey, options)
}

export default AIProcessingEngine 