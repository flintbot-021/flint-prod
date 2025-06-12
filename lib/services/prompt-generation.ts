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
                  order: section.order
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
            variableName: (typeof section.title === 'string' ? section.title.toLowerCase().replace(/\s+/g, '_') : '') ||
                         `question_${section.order}`,
            order: section.order
          }

        // Extract options for multiple choice
        if (section.type === 'question-multiple-choice' && settings?.options) {
          context.options = settings.options.map((opt: any) => opt.text || opt.label || opt)
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

    // Add question context in simple format
    richContext.questionContext.forEach((question, index) => {
      const section = context[index]
      prompt += `Question ${index + 1}: ${section?.type || 'text question'}: section name: ${section?.title || 'Untitled'}`
      if (section?.content && section.content !== section.title) {
        prompt += `, content: ${section.content}`
      }
      if (section?.options?.length) {
        prompt += `, potential answers: ${section.options.join(', ')}`
      }
      // Add the variable name that will be used
      if (section?.variableName) {
        prompt += `, variable: @${section.variableName}`
      }
      prompt += `\n`
    })

    prompt += `
We will then use the answers from those questions to create a custom prompt.

Based on their inputs, what do you think a suitable prompt might be?

Start with: "You are an expert [whatever you think they are trying to be] - a user has..."

IMPORTANT: You MUST use the @variable names in your prompt. The available variables are:
${richContext.variables.map(v => `@${v}`).join(', ')}

Use these variables in your prompt by referencing them as @variableName where appropriate.

${outputVars.length > 0 ? `
The prompt should generate these outputs:
${outputVars.map(v => `- ${v.name}: ${v.description}`).join('\n')}
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

For outputVariables, suggest 2-4 meaningful variables that the AI should generate based on the campaign context. Consider variables like:
- recommendation, advice, plan, strategy (for personalized guidance)
- score, rating, percentage (for numerical assessments) 
- insights, analysis, summary (for analytical content)
- timeline, duration, steps (for process-oriented outputs)
- category, type, level (for classification)

Make it conversational and helpful. Remember to include the @variable references in the prompt.`

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
        temperature: this.TEMPERATURE,
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