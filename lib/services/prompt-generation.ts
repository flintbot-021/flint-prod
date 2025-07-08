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

    try {
      // Extract rich context from sections
      const context = this.extractRichContext(request.sections, request.currentSectionOrder)
      
      // Build the generation prompt for GPT-4o mini
      const generationPrompt = this.buildGenerationPrompt(context, request)
      
      // Call OpenAI API
      const response = await this.callOpenAI(generationPrompt)
      
      // Parse the response
      const parsed = this.parseGenerationResponse(response)
      
      const processingTime = Date.now() - startTime

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
    const campaignInfo = request.campaignContext || {}
    const outputVars = request.outputVariables || []
    
    // Get rich context including subheadings and detailed content
    const richContext = extractRichContextForSection(request.sections, request.currentSectionOrder)
    
    let prompt = `You are an expert prompt writer. A user is creating a custom form and has asked their users questions.

`

    // Add question context in enhanced format with proper context
    // Match questions with their corresponding variables
    richContext.questionContext.forEach((question, index) => {
      const variable = richContext.variables[index]
      
      if (question && variable) {
        // Find the corresponding section context for additional details
        const sectionContext = context.find(ctx => 
          ctx.variableName === variable || 
          ctx.title === question ||
          ctx.content === question
        )
        
        const questionType = sectionContext?.type || 'text question'
        
        prompt += `Question ${index + 1} (${questionType}): "${question}"`
        
        // Add type-specific information
        if (questionType.includes('slider')) {
          const rangeInfo = sectionContext?.options?.find(opt => opt.startsWith('Range:')) || 'Range: 0 to 10'
          prompt += ` - ${rangeInfo}`
        } else if (questionType === 'question-multiple-choice' && sectionContext?.options?.length) {
          prompt += ` - Options: ${sectionContext.options.join(', ')}`
        }
        
        // Add the variable name that will be used
        prompt += ` - Variable: @${variable}`
        prompt += `\n`
      }
    })

    prompt += `
We will then use the answers from those questions to create a custom prompt.

Based on their inputs, what do you think a suitable prompt might be?

Start with: "You are an expert [whatever you think they are trying to be] - a user has..."

IMPORTANT: You MUST include the question context in your prompt using this format:

For TEXT questions, use this format:
"The user was asked '[QUESTION TEXT]' and they responded with a text answer of @[variable_name]."

For SLIDER questions, use this format:
"The user was asked '[QUESTION TEXT]' and they responded with a slider answer of @[variable_name] out of [max_value]."

For MULTIPLE CHOICE questions, use this format:
"The user was asked '[QUESTION TEXT]' and they selected @[variable_name] from the available options."

EXAMPLE of good prompt structure:
"You are an expert business consultant. The user was asked 'Do we have a clear marketing strategy that supports our business goals?' and they responded with a text answer of @marketing_strategy. The user was asked 'How confident are you in your current approach?' and they responded with a slider answer of @confidence_level out of 10. Based on these responses, provide..."

The available variables are:
${richContext.variables.map(v => `@${v}`).join(', ')}

Always include the full question text before mentioning the variable to provide proper context.

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

IMPORTANT: The "outputVariables" array should contain ONLY the NEW additional output variables you are suggesting. Do NOT include any existing outputs that were already provided above.

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

Make it conversational and helpful. Remember to include the @variable references in the prompt.

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
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
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