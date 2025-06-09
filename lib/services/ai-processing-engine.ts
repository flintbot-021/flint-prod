/**
 * AI Processing Engine
 * 
 * Handles AI prompt processing and output extraction for Logic sections.
 * Simplified version with sensible defaults.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface OutputVariable {
  id: string
  name: string
  description: string
}

export interface AITestRequest {
  prompt: string
  variables: Record<string, any>
  outputVariables: OutputVariable[]
}

export interface AITestResponse {
  success: boolean
  outputs?: Record<string, any>
  rawResponse?: string
  error?: string
  processingTime: number
}

// =============================================================================
// AI PROCESSING ENGINE CLASS
// =============================================================================

export class AIProcessingEngine {
  private apiKey: string
  
  // Sensible defaults - no user configuration needed
  private readonly DEFAULT_MODEL = 'gpt-4o' // Supports JSON mode and is latest
  private readonly DEFAULT_TEMPERATURE = 0.7
  private readonly DEFAULT_MAX_TOKENS = 1000
  private readonly DEFAULT_TIMEOUT = 30000

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // =============================================================================
  // MAIN PROCESSING METHOD
  // =============================================================================

  /**
   * Process a prompt with variable substitution and AI execution
   */
  async processPrompt(request: AITestRequest): Promise<AITestResponse> {
    const startTime = Date.now()

    try {
      // 1. Replace variables in prompt
      const processedPrompt = this.replaceVariables(request.prompt, request.variables)

      // 2. Prepare AI request with defaults
      const aiRequest = this.prepareAIRequest(processedPrompt, request.outputVariables)

      // 3. Call OpenAI API
      const aiResponse = await this.callOpenAI(aiRequest)

      // 4. Extract outputs from response
      const outputs = this.extractOutputs(aiResponse.content, request.outputVariables)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        outputs,
        rawResponse: aiResponse.content,
        processingTime
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

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

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

  /**
   * Prepare the OpenAI API request with sensible defaults
   */
  private prepareAIRequest(prompt: string, outputVariables: OutputVariable[]) {
    // Combine user's domain prompt with output instructions
    const combinedPrompt = this.buildCombinedPrompt(prompt, outputVariables)

    return {
      model: this.DEFAULT_MODEL,
      messages: [
        {
          role: 'user' as const,
          content: combinedPrompt
        }
      ],
      max_tokens: this.DEFAULT_MAX_TOKENS,
      temperature: this.DEFAULT_TEMPERATURE,
      response_format: outputVariables.length > 0 ? { type: 'json_object' as const } : undefined
    }
  }

  /**
   * Build combined prompt with user's domain expertise + output format instructions
   */
  private buildCombinedPrompt(userPrompt: string, outputVariables: OutputVariable[]): string {
    if (outputVariables.length === 0) {
      return userPrompt
    }

    const outputDescriptions = outputVariables.map(variable => 
      `- ${variable.name}: ${variable.description}`
    ).join('\n')

    return `${userPrompt}

Please provide your response as a JSON object containing these exact fields:
${outputDescriptions}

Requirements:
- Return only valid JSON
- Be specific and helpful in your responses
- Use realistic values based on the context provided
- If you cannot determine a field value, provide a reasonable estimate or explanation

JSON Response:`
  }

  /**
   * Build system prompt for structured output
   * @deprecated - replaced by buildCombinedPrompt
   */
  private buildSystemPrompt(outputVariables: OutputVariable[]): string {
    if (outputVariables.length === 0) {
      return 'You are a helpful assistant. Provide a clear and comprehensive response to the user\'s request.'
    }

    const outputDescriptions = outputVariables.map(variable => 
      `- ${variable.name}: ${variable.description}`
    ).join('\n')

    return `You are a helpful assistant that provides structured responses in JSON format.

Please respond with a JSON object containing these fields:
${outputDescriptions}

Guidelines:
- Always return valid JSON
- Be clear and helpful in your responses
- If you cannot determine a field value, use a reasonable default or explanation`
  }

  /**
   * Call the OpenAI API
   */
  private async callOpenAI(request: any): Promise<{ content: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
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
      content: data.choices[0].message.content
    }
  }

  /**
   * Extract structured outputs from AI response
   */
  private extractOutputs(content: string, outputVariables: OutputVariable[]): Record<string, any> {
    if (outputVariables.length === 0) {
      return {}
    }

    try {
      // Try to parse as JSON first
      const parsedContent = JSON.parse(content)
      const outputs: Record<string, any> = {}
      
      // Extract each defined output
      outputVariables.forEach(variable => {
        const value = parsedContent[variable.name]
        if (value !== undefined) {
          outputs[variable.name] = value
        }
      })

      return outputs
    } catch (error) {
      // If JSON parsing fails, try simple text extraction
      const outputs: Record<string, any> = {}
      
      outputVariables.forEach(variable => {
        // Look for patterns like "variableName: value"
        const patterns = [
          new RegExp(`${variable.name}\\s*[:=]\\s*(.+?)(?:\\n|$)`, 'i'),
          new RegExp(`"${variable.name}"\\s*[:=]\\s*"([^"]+)"`, 'i')
        ]

        for (const pattern of patterns) {
          const match = content.match(pattern)
          if (match && match[1]) {
            outputs[variable.name] = match[1].trim()
            break
          }
        }
      })

      return outputs
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
export function createAIProcessingEngine(apiKey: string): AIProcessingEngine {
  return new AIProcessingEngine(apiKey)
}

export default AIProcessingEngine 