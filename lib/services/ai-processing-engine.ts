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
  hasFileVariables?: boolean
  fileVariableNames?: string[]
  fileObjects?: Record<string, { file: File; variableName: string }>
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
  private openai: any // We'll import OpenAI client
  
  // Sensible defaults - no user configuration needed
  private readonly DEFAULT_MODEL = 'gpt-4o' // Supports JSON mode, vision, and is latest
  private readonly DEFAULT_TEMPERATURE = 0.7
  private readonly DEFAULT_MAX_TOKENS = 10000
  private readonly DEFAULT_TIMEOUT = 30000

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.apiKey = apiKey
  }

  // =============================================================================
  // MAIN PROCESSING METHOD
  // =============================================================================

  /**
   * Process AI request with support for direct file uploads
   */
  async processPrompt(request: AITestRequest): Promise<AITestResponse> {
    const startTime = Date.now()

    try {
      console.log('🔄 Processing AI request with direct file support...')

      // Handle direct file uploads to OpenAI
      if (request.fileObjects && Object.keys(request.fileObjects).length > 0) {
        return await this.processPromptWithDirectFileUpload(request, startTime)
      }

      // Fallback for text-only processing
      const finalPrompt = this.replaceVariables(request.prompt, request.variables)

      const aiRequest = this.prepareAIRequest(finalPrompt, request.outputVariables)
      const response = await this.callOpenAI(aiRequest)

      const outputs = this.extractOutputs(response.content, request.outputVariables)

      console.log('✅ AI processing completed successfully')

      return {
        success: true,
        outputs,
        rawResponse: response.content,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ AI processing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Process prompt with direct file uploads to OpenAI
   */
  private async processPromptWithDirectFileUpload(request: AITestRequest, startTime: number): Promise<AITestResponse> {
    try {
      console.log('📁 Processing with direct OpenAI file upload...')

      // Create OpenAI client
      const OpenAI = (await import('openai')).default
      const openai = new OpenAI({ apiKey: this.apiKey })

      // Upload files to OpenAI first
      const uploadedFiles: Record<string, string> = {}
      
      if (request.fileObjects) {
        for (const [variableName, fileObj] of Object.entries(request.fileObjects)) {
          try {
            console.log(`📤 Uploading ${fileObj.file.name} to OpenAI...`)
            
            // Convert File to the format OpenAI expects
            const fileBuffer = await fileObj.file.arrayBuffer()
            const file = new File([fileBuffer], fileObj.file.name, { type: fileObj.file.type })
            
            const uploadedFile = await openai.files.create({
              file: file,
              purpose: 'user_data'
            })
            
            uploadedFiles[variableName] = uploadedFile.id
            console.log(`✅ Uploaded ${fileObj.file.name} with ID: ${uploadedFile.id}`)
            
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${fileObj.file.name}:`, uploadError)
            // Continue with other files
          }
        }
      }

      // Build content array for OpenAI
      const content: Array<any> = []

      // Add uploaded files to content
      Object.entries(uploadedFiles).forEach(([variableName, fileId]) => {
        content.push({
          type: 'file',
          file: {
            file_id: fileId
          }
        })
      })

      // Replace variables in prompt (excluding file variables since they're handled above)
      const textVariables = { ...request.variables }
      if (request.fileObjects) {
        Object.keys(request.fileObjects).forEach(variableName => {
          delete textVariables[variableName] // Remove file variables from text replacement
        })
      }

      const finalPrompt = this.replaceVariables(request.prompt, textVariables)

      // Add the text prompt
      content.push({
        type: 'text',
        text: this.buildCombinedPrompt(finalPrompt, request.outputVariables)
      })

      // Make the API call with files
      const response = await openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: this.DEFAULT_MAX_TOKENS,
        temperature: this.DEFAULT_TEMPERATURE,
        response_format: request.outputVariables.length > 0 ? { type: 'json_object' } : undefined
      })

      const responseContent = response.choices[0]?.message?.content || ''
      const outputs = this.extractOutputs(responseContent, request.outputVariables)

      console.log('✅ AI processing with files completed successfully')

      return {
        success: true,
        outputs,
        rawResponse: responseContent,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('❌ AI processing with files failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File processing error',
        processingTime: Date.now() - startTime
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

    console.log('🔄 Starting variable replacement...')
    console.log('🔄 Original prompt:', prompt)
    console.log('🔄 Available variables:', variables)

    // Replace @variable mentions with actual values
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`@${name}\\b`, 'g')
      const stringValue = this.formatVariableValue(value)
      const beforeReplace = processedPrompt
      processedPrompt = processedPrompt.replace(regex, stringValue)
      
      if (beforeReplace !== processedPrompt) {
        console.log(`🔄 Replaced @${name} with "${stringValue}"`)
      }
    })

    console.log('🔄 Final processed prompt:', processedPrompt)
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
  private prepareAIRequest(prompt: string, outputVariables: OutputVariable[]): any {
    // Combine user's domain prompt with output instructions
    const combinedPrompt = this.buildCombinedPrompt(prompt, outputVariables)
    
    console.log('🚀 Final prompt being sent to OpenAI:', combinedPrompt)

    // Fallback to text-only request
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

    // First, list all the output field names clearly
    const outputNames = outputVariables.map(variable => variable.name).join(', ')
    
    // Then, provide descriptions separately for clarity
    const outputDescriptions = outputVariables.map(variable => 
      `- ${variable.name} = ${variable.description}`
    ).join('\n')

    return `${userPrompt}

Please return the following outputs: ${outputNames}

Output descriptions:
${outputDescriptions}

Return only a JSON object with these exact fields and no additional text.`
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