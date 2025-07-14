/**
 * AI Prompt Auto-Generation Service
 * 
 * Analyzes campaign sections and generates contextual AI prompts
 * using GPT-4o mini to suggest suitable prompts based on questions and content.
 */

import { CampaignSection } from '@/lib/types/campaign-builder'
import { extractRichContextForSection } from '@/lib/utils/variable-extractor'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PromptGenerationRequest {
  sections: CampaignSection[]
  currentSectionOrder: number
  existingPrompt?: string
  outputVariables?: Array<{ name: string; description: string }>
  campaignContext?: {
    name?: string
    description?: string
    industry?: string
  }
}

export interface PromptGenerationResponse {
  success: boolean
  suggestedPrompt: string
  suggestedOutputVariables: Array<{ name: string; description: string }>
  reasoning: string
  variables: string[]
  error?: string
  processingTime: number
}

export interface SectionContext {
  title: string
  type: string
  content?: string
  questions?: string[]
  options?: string[]
  variableName?: string
  order: number
}

// =============================================================================
// MAIN SERVICE CLASS
// =============================================================================

export class PromptGenerationService {
  private readonly MODEL = 'gpt-4o-mini'
  private readonly MAX_TOKENS = 1000
  private readonly TEMPERATURE = 0.7

  /**
   * Generate a contextual AI prompt based on campaign sections
   */
  async generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    const startTime = Date.now()
    console.log('🎯 Starting prompt generation...')

    try {
      console.log('📊 Extracting rich context...')
      // Extract rich context from sections
      const context = this.extractRichContext(request.sections, request.currentSectionOrder)
      console.log('📊 Context extracted:', {
        contextCount: context.length,
        sectionTypes: context.map(c => c.type)
      })
      
      console.log('🔨 Building generation prompt...')
      // Build the generation prompt for GPT-4o mini
      const generationPrompt = this.buildGenerationPrompt(context, request)
      console.log('🔨 Generation prompt built, length:', generationPrompt.length)
      
      console.log('🤖 Calling OpenAI API...')
      // Call OpenAI API
      const response = await this.callOpenAI(generationPrompt)
      console.log('🤖 OpenAI response received, length:', response.length)
      
      console.log('🔍 Parsing response...')
      // Parse the response
      const parsed = this.parseGenerationResponse(response)
      console.log('🔍 Response parsed:', {
        hasPrompt: !!parsed.prompt,
        promptLength: parsed.prompt?.length,
        outputVarsCount: parsed.outputVariables?.length
      })
      
      const processingTime = Date.now() - startTime
      console.log('✅ Prompt generation completed in', processingTime, 'ms')

      return {
        success: true,
        suggestedPrompt: parsed.prompt,
        suggestedOutputVariables: parsed.outputVariables,
        reasoning: parsed.reasoning,
        variables: parsed.variables,
        processingTime
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('❌ Prompt generation failed after', processingTime, 'ms:', error)
      
      return {
        success: false,
        suggestedPrompt: '',
        suggestedOutputVariables: [],
        reasoning: '',
        variables: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime
      }
    }
  }

  /**
   * Extract rich context from campaign sections
   */
  private extractRichContext(sections: CampaignSection[], currentOrder: number): SectionContext[] {
    const precedingSections = sections.filter(s => s.order < currentOrder)
    const contexts: SectionContext[] = []
    
    precedingSections.forEach(section => {
      const settings = section.settings as any
      
      // Skip capture sections - they're for lead generation, not AI processing
      if (section.type.includes('capture')) {
        return
      }

      // Handle question sections
      if (section.type.includes('question-')) {
        if (section.type === 'question-slider-multiple') {
          // Handle multiple sliders - create context for each individual slider
          if (settings.sliders && Array.isArray(settings.sliders)) {
            settings.sliders.forEach((slider: any) => {
              if (slider.variableName && slider.label) {
                contexts.push({
                  title: slider.label,
                  type: 'question-slider',
                  content: slider.label,
                  variableName: slider.variableName,
                  order: section.order,
                  // Add slider-specific metadata
                  options: [`Range: ${slider.minValue || 0} to ${slider.maxValue || 10}`, `Step: ${slider.step || 1}`]
                })
              }
            })
          }
        } else if (section.title) {
          // Handle single-input question sections
          const context: SectionContext = {
            title: section.title,
            type: section.type,
            content: settings?.content || settings?.questionText || section.title,
            variableName: settings?.variableName || this.createVariableName(section.title) || `question_${section.order}`,
            order: section.order
          }

        // Extract options for multiple choice
        if (section.type === 'question-multiple-choice' && settings?.options) {
          context.options = settings.options.map((opt: any) => opt.text || opt.label || opt)
        }
        
        // Extract slider range for single sliders
        if (section.type === 'question-slider') {
          context.options = [`Range: ${settings?.minValue || 0} to ${settings?.maxValue || 10}`, `Step: ${settings?.step || 1}`]
        }

          contexts.push(context)
        }
      } else if (section.type.includes('content-') || section.type === 'info') {
        // Handle content sections (for context, but no variables)
        contexts.push({
          title: section.title || 'Untitled Section',
          type: section.type,
          content: settings?.content || settings?.text || section.title,
          order: section.order
        })
      }
    })

    return contexts
  }

  /**
   * Build the prompt for GPT-4o mini to generate the AI logic prompt
   */
  private buildGenerationPrompt(context: SectionContext[], request: PromptGenerationRequest): string {
    const outputVars = request.outputVariables || []
    
    // Get rich context including subheadings and detailed content
    const richContext = extractRichContextForSection(request.sections, request.currentSectionOrder)
    
    let prompt = `You are an expert prompt writer. A user is creating a custom form and has asked their users the following questions:

`

    // Build clean question descriptions
    const questionDescriptions: string[] = []
    
    // Get sections that come before the current AI logic section
    const precedingSections = request.sections
      .filter(s => s.order < request.currentSectionOrder && s.type.includes('question-'))
      .sort((a, b) => a.order - b.order)
    
    precedingSections.forEach((section, index) => {
      const settings = section.settings as any
      const questionNumber = index + 1
      
      if (section.type === 'question-slider-multiple') {
        // Handle multiple sliders
        if (settings.sliders && Array.isArray(settings.sliders)) {
          settings.sliders.forEach((slider: any, sliderIndex: number) => {
            if (slider.label && slider.variableName) {
              const sliderNum = questionNumber + sliderIndex
              questionDescriptions.push(
                `Question ${sliderNum}: "${slider.label}" (Slider: ${slider.minValue || 0} to ${slider.maxValue || 10}) - Variable: @${slider.variableName}`
              )
            }
          })
        }
      } else if (section.type === 'question-slider') {
        // Handle single slider
        const questionText = settings?.question || settings?.content || settings?.questionText || section.title || 'Untitled Question'
        const variableName = settings?.variableName || this.createVariableName(section.title) || `question_${section.order}`
        const minValue = settings?.minValue || 0
        const maxValue = settings?.maxValue || 10
        
        questionDescriptions.push(
          `Question ${questionNumber}: "${questionText}" (Slider: ${minValue} to ${maxValue}) - Variable: @${variableName}`
        )
      } else if (section.type === 'question-multiple-choice') {
        // Handle multiple choice
        const questionText = settings?.question || settings?.content || settings?.questionText || section.title || 'Untitled Question'
        const variableName = settings?.variableName || this.createVariableName(section.title) || `question_${section.order}`
        const options = settings?.options?.map((opt: any) => opt.text || opt.label || opt) || []
        
        questionDescriptions.push(
          `Question ${questionNumber}: "${questionText}" (Multiple Choice: ${options.join(', ')}) - Variable: @${variableName}`
        )
      } else {
        // Handle text and other question types
        const questionText = settings?.question || settings?.content || settings?.questionText || section.title || 'Untitled Question'
        const variableName = settings?.variableName || this.createVariableName(section.title) || `question_${section.order}`
        
        questionDescriptions.push(
          `Question ${questionNumber}: "${questionText}" (Text Input) - Variable: @${variableName}`
        )
      }
    })

    // Add the question descriptions to the prompt
    questionDescriptions.forEach(desc => {
      prompt += `${desc}\n`
    })

    prompt += `
Based on these questions and user responses, create an AI prompt that will process the answers and provide helpful output.

IMPORTANT FORMAT REQUIREMENTS:

For TEXT questions, use this format:
"The user was asked '[QUESTION TEXT]' and they responded with @[variable_name]."

For SLIDER questions, use this format:
"The user was asked '[QUESTION TEXT]' and they rated it @[variable_name] out of [max_value]."

For MULTIPLE CHOICE questions, use this format:
"The user was asked '[QUESTION TEXT]' and they selected @[variable_name] from the available options."

EXAMPLE of good prompt structure:
"You are an expert fitness coach. The user was asked 'What is your name?' and they responded with @name. The user was asked 'How often do you train?' and they rated it @training_frequency out of 7. The user was asked 'What is your preferred distance?' and they selected @distance from the available options."

CRITICAL RULES - FOLLOW EXACTLY:
- Start your prompt with: "You are an expert [whatever role makes sense for this context]..."
- Use each variable (@variable_name) exactly ONCE in the prompt
- DO NOT ask for anything back or request specific outputs in the prompt
- DO NOT include phrases like "Based on these responses, provide..." or "suggest..." or "recommend..."
- DO NOT include any instructions about what to do with the information
- The prompt should ONLY provide context about who the AI is and what information it has
- The prompt should END after stating all the user responses - nothing more
- Keep it conversational and clear but DO NOT request any actions or outputs

${outputVars.length > 0 ? `
The user already has these existing outputs defined:
${outputVars.map(v => `- ${v.name}: ${v.description}`).join('\n')}

DO NOT include these existing outputs in your response. Only suggest NEW, ADDITIONAL outputs that complement the existing ones.
` : ''}

${request.existingPrompt ? `
Current prompt (improve this):
"${request.existingPrompt}"
` : ''}

Return your response as JSON:
{
  "prompt": "The complete AI prompt starting with 'You are an expert...' and using @variable references",
  "outputVariables": [
    {"name": "recommendation", "description": "Personalized recommendation based on responses"},
    {"name": "score", "description": "Numerical score or rating"}
  ],
  "reasoning": "Brief explanation of your approach"
}

For outputVariables, suggest exactly 2 NEW meaningful variables that the AI should generate based on the campaign context. Consider variables like:
- recommendation, advice, plan, strategy (for personalized guidance)
- score, rating, percentage (for numerical assessments) 
- insights, analysis, summary (for analytical content)
- timeline, duration, steps (for process-oriented outputs)
- category, type, level (for classification)

IMPORTANT: 
- Generate exactly 2 NEW output variables that are DIFFERENT from any existing outputs
- Be creative and innovative - think of unique variables that would be valuable for this specific campaign context
- Do NOT repeat or include any existing output variable names
- Make the prompt clear, conversational, and easy to understand

Random seed: ${Math.random().toString(36).substring(7)}`

    return prompt
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: 0.9, // Higher temperature for more randomness
        top_p: 0.95, // Add nucleus sampling for more variety
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.3, // Encourage new concepts
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API')
    }

    return data.choices[0].message.content
  }

  /**
   * Create a valid variable name from a section title
   */
  private createVariableName(title: string): string {
    if (!title) return 'untitled_variable'
    
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s_]/g, '') // Remove special characters but keep underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .substring(0, 50) // Limit length
      || 'untitled_variable' // Fallback if empty
  }

  /**
   * Parse the GPT-4o mini response
   */
  private parseGenerationResponse(response: string): {
    prompt: string
    outputVariables: Array<{ name: string; description: string }>
    reasoning: string
    variables: string[]
  } {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response

      const parsed = JSON.parse(jsonContent)
      
      return {
        prompt: parsed.prompt || '',
        outputVariables: Array.isArray(parsed.outputVariables) ? parsed.outputVariables : [],
        reasoning: parsed.reasoning || 'Auto-generated based on campaign context',
        variables: Array.isArray(parsed.variables) ? parsed.variables : []
      }
    } catch (error) {
      // Fallback: try to extract content manually
      const promptMatch = response.match(/"prompt":\s*"([^"]*(?:\\.[^"]*)*)"/)
      const reasoningMatch = response.match(/"reasoning":\s*"([^"]*(?:\\.[^"]*)*)"/)
      
      return {
        prompt: promptMatch ? promptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
        outputVariables: [],
        reasoning: reasoningMatch ? reasoningMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Could not parse reasoning from response',
        variables: []
      }
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const promptGenerationService = new PromptGenerationService() 