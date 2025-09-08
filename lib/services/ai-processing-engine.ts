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
  knowledgeBaseContext?: string
  knowledgeBaseFiles?: Array<{ url: string; type: string; name: string }>
  browseUrls?: {
    enabled: boolean
    urlVariables?: Array<{ name: string; url: string }>
  }
  sliderContext?: Record<string, {
    isMaxWithPlus?: boolean
    displayValue?: string
    maxValue?: number
  }>
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
  private readonly DEFAULT_MODEL = 'gpt-4.1' // Supports JSON mode, vision, browsing, and enhanced capabilities
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

      // Handle direct file uploads to OpenAI (either user files or knowledge base files)
      const hasUserFiles = request.fileObjects && Object.keys(request.fileObjects).length > 0
      const hasKnowledgeBaseFiles = request.knowledgeBaseFiles && request.knowledgeBaseFiles.length > 0
      const hasUrlBrowsing = request.browseUrls?.enabled && request.browseUrls?.urlVariables && request.browseUrls.urlVariables.length > 0
      
      if (hasUserFiles || hasKnowledgeBaseFiles || hasUrlBrowsing) {
        return await this.processPromptWithDirectFileUpload(request, startTime)
      }

      // Fallback for text-only processing
      const finalPrompt = this.replaceVariables(request.prompt, request.variables, request.sliderContext)

      const aiRequest = this.prepareAIRequest(finalPrompt, request.outputVariables, request.knowledgeBaseContext)
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

      // Process files - handle images and documents differently
      const uploadedFiles: Record<string, string> = {}
      const imageFiles: Record<string, string> = {}
      
      if (request.fileObjects) {
        for (const [variableName, fileObj] of Object.entries(request.fileObjects)) {
          try {
            // Check if this is an image file
            if (fileObj.file.type.startsWith('image/')) {
              console.log(`📷 Processing image ${fileObj.file.name} for direct vision analysis...`)
              
              // For images, create a data URL for direct use
              const fileBuffer = await fileObj.file.arrayBuffer()
              const base64 = Buffer.from(fileBuffer).toString('base64')
              const dataUrl = `data:${fileObj.file.type};base64,${base64}`
              
              imageFiles[variableName] = dataUrl
              console.log(`✅ Prepared image ${fileObj.file.name} for vision analysis`)
              
            } else {
              console.log(`📤 Uploading document ${fileObj.file.name} to OpenAI...`)
              
              // For documents, upload to OpenAI Files API
              const fileBuffer = await fileObj.file.arrayBuffer()
              const file = new File([fileBuffer], fileObj.file.name, { type: fileObj.file.type })
              
              const uploadedFile = await openai.files.create({
                file: file,
                purpose: 'user_data'
              })
              
              uploadedFiles[variableName] = uploadedFile.id
              console.log(`✅ Uploaded document ${fileObj.file.name} with ID: ${uploadedFile.id}`)
            }
            
          } catch (uploadError) {
            console.error(`❌ Failed to process ${fileObj.file.name}:`, uploadError)
            // Continue with other files
          }
        }
      }

      // Build content array for OpenAI
      const content: Array<any> = []

      // Add uploaded document files to content
      Object.entries(uploadedFiles).forEach(([variableName, fileId]) => {
        content.push({
          type: 'file',
          file: {
            file_id: fileId
          }
        })
      })

      // Add image files to content for vision analysis
      Object.entries(imageFiles).forEach(([variableName, dataUrl]) => {
        content.push({
          type: 'image_url',
          image_url: {
            url: dataUrl,
            detail: 'high' // Use high detail for better analysis
          }
        })
      })

      // Add knowledge base files to content for AI vision processing
      if (request.knowledgeBaseFiles && request.knowledgeBaseFiles.length > 0) {
        console.log('📚 Adding knowledge base files for AI processing:', request.knowledgeBaseFiles.length)
        
        for (const kbFile of request.knowledgeBaseFiles) {
          try {
            // For images, add them directly as image_url content
            if (kbFile.type.startsWith('image/')) {
              content.push({
                type: 'image_url',
                image_url: {
                  url: kbFile.url,
                  detail: 'high' // Use high detail for better analysis
                }
              })
              console.log(`📷 Added knowledge base image: ${kbFile.name}`)
            }
            // For PDFs and other documents, we'd need to upload them to OpenAI first
            // This is a more complex process that requires fetching the file and uploading
            else if (kbFile.type === 'application/pdf' || kbFile.type.startsWith('text/')) {
              // Fetch the file from Supabase and upload to OpenAI
              const fileResponse = await fetch(kbFile.url)
              if (fileResponse.ok) {
                const fileBuffer = await fileResponse.arrayBuffer()
                const file = new File([fileBuffer], kbFile.name, { type: kbFile.type })
                
                const OpenAI = (await import('openai')).default
                const openai = new OpenAI({ apiKey: this.apiKey })
                
                const uploadedFile = await openai.files.create({
                  file: file,
                  purpose: 'user_data'
                })
                
                content.push({
                  type: 'file',
                  file: {
                    file_id: uploadedFile.id
                  }
                })
                console.log(`📄 Added knowledge base document: ${kbFile.name} (${uploadedFile.id})`)
              }
            }
          } catch (error) {
            console.error(`❌ Failed to process knowledge base file ${kbFile.name}:`, error)
            // Continue with other files
          }
        }
      }

      // Replace variables in prompt (excluding file variables since they're handled above)
      const textVariables = { ...request.variables }
      if (request.fileObjects) {
        Object.keys(request.fileObjects).forEach(variableName => {
          delete textVariables[variableName] // Remove file variables from text replacement
        })
      }

      const finalPrompt = this.replaceVariables(request.prompt, textVariables, request.sliderContext)

      // Build URL browsing instructions if enabled
      let urlBrowsingInstructions = ''
      console.log('🔍 URL Browsing Debug:', {
        enabled: request.browseUrls?.enabled,
        urlVariables: request.browseUrls?.urlVariables,
        urlVariablesLength: request.browseUrls?.urlVariables?.length
      })
      
      if (request.browseUrls?.enabled && request.browseUrls?.urlVariables && request.browseUrls.urlVariables.length > 0) {
        const urlList = request.browseUrls.urlVariables.map(uv => `@${uv.name}: ${uv.url}`).join('\n')
        urlBrowsingInstructions = `\n\nIMPORTANT: You have access to web search capabilities. Please browse and analyze the content from these URLs:\n${urlList}\n\nUse the web search tool to gather current information from these URLs and incorporate the findings into your response.`
        console.log('🌐 URL browsing instructions added:', urlBrowsingInstructions)
      } else {
        console.log('❌ URL browsing not enabled or no URL variables found')
      }

      // Add the text prompt with URL browsing instructions
      content.push({
        type: 'text',
        text: this.buildCombinedPrompt(finalPrompt, request.outputVariables, request.knowledgeBaseContext) + urlBrowsingInstructions
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
  private replaceVariables(prompt: string, variables: Record<string, any>, sliderContext?: Record<string, any>): string {
    let processedPrompt = prompt

    console.log('🔄 Starting variable replacement...')
    console.log('🔄 Original prompt:', prompt)
    console.log('🔄 Available variables:', variables)
    console.log('🔄 Slider context:', sliderContext)

    // Replace @variable mentions with actual values
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`@${name}\\b`, 'g')
      const stringValue = this.formatVariableValue(value, name, sliderContext)
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
  private formatVariableValue(value: any, variableName?: string, sliderContext?: Record<string, any>): string {
    if (value === null || value === undefined) {
      return '[not provided]'
    }

    // Check if this is a slider variable with "plus" context
    if (variableName && sliderContext && sliderContext[variableName]) {
      const context = sliderContext[variableName]
      if (context.isMaxWithPlus && context.displayValue) {
        // For slider values that represent "or more", provide context to the AI
        return `${value} (${context.displayValue}, meaning ${value} or more)`
      }
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  /**
   * Prepare the OpenAI API request with sensible defaults
   */
  private prepareAIRequest(prompt: string, outputVariables: OutputVariable[], knowledgeBaseContext?: string): any {
    // Combine user's domain prompt with output instructions and knowledge base context
    const combinedPrompt = this.buildCombinedPrompt(prompt, outputVariables, knowledgeBaseContext)
    
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
   * Build combined prompt with user's domain expertise + output format instructions + knowledge base context
   */
  private buildCombinedPrompt(userPrompt: string, outputVariables: OutputVariable[], knowledgeBaseContext?: string): string {
    let combinedPrompt = userPrompt

    // Add knowledge base context if provided
    if (knowledgeBaseContext && knowledgeBaseContext.trim()) {
      combinedPrompt += '\n\n--- KNOWLEDGE BASE CONTEXT ---\n'
      combinedPrompt += 'Please reference the following knowledge base when generating content:\n\n'
      combinedPrompt += knowledgeBaseContext
      combinedPrompt += '\n--- END KNOWLEDGE BASE CONTEXT ---\n'
    }

    if (outputVariables.length === 0) {
      return combinedPrompt
    }

    // First, list all the output field names clearly
    const outputNames = outputVariables.map(variable => variable.name).join(', ')
    
    // Then, provide descriptions separately for clarity
    const outputDescriptions = outputVariables.map(variable => 
      `- ${variable.name} = ${variable.description}`
    ).join('\n')

    return `${combinedPrompt}

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

    // Check if content is null or undefined
    if (!content || typeof content !== 'string') {
      console.warn('⚠️ AI response content is null or invalid:', content)
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