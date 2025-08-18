import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CampaignSection } from '@/lib/types/campaign-builder'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface InputVariable {
  id: string
  name: string
  description: string
  type: 'text' | 'number' | 'choice' | 'slider' | 'date' | 'file'
  required: boolean
  options?: string[]
}

interface OutputGoal {
  id: string
  name: string
  description: string
}

interface SuggestedInput {
  id: string
  type: 'text_question' | 'multiple_choice' | 'slider' | 'date_time_question' | 'upload_question'
  variableName: string
  headline: string
  subheading: string
  placeholder?: string
  options?: string[]
  minValue?: number
  maxValue?: number
  step?: number
  minLabel?: string
  maxLabel?: string
  required: boolean
}

interface SuggestedOutput {
  id: string
  variableName: string
  name: string
  description: string
}

interface AISuggestions {
  inputs: SuggestedInput[]
  outputs: SuggestedOutput[]
  aiPrompt: string
  campaignName: string
}

interface GeneratedSection {
  type: string
  title: string
  subtitle?: string
  settings: any
  order: number
}

interface AIGenerationResponse {
  sections: GeneratedSection[]
  aiLogicPrompt: string
  outputTemplate: string
}

// =============================================================================
// SECTION TYPE MAPPINGS
// =============================================================================

const SECTION_TYPE_MAPPINGS = {
  'text': 'text_question',
  'number': 'text_question', // Use text_question for numbers too
  'choice': 'multiple_choice',
  'slider': 'slider',
  'date': 'date_time_question',
  'file': 'upload_question'
}

// =============================================================================
// AI PROMPT TEMPLATES
// =============================================================================

function generateSystemPrompt(): string {
  return `You are an expert campaign builder AI that creates interactive lead magnet campaigns. 

Your task is to generate a complete campaign structure based on user requirements, including:
1. Question sections to collect user inputs
2. An AI logic prompt that processes the inputs 
3. Output sections that display personalized results

IMPORTANT RULES:
- Always include a capture section for lead collection (email/name)
- Create engaging, conversational question titles and subtitles
- Generate a comprehensive AI logic prompt that uses all input variables
- Design output sections that reference the AI-generated variables
- Use proper variable naming (lowercase, underscores, descriptive)
- Ensure the AI prompt is detailed and produces actionable results

Return your response as valid JSON matching this exact schema:
{
  "sections": [
    {
      "type": "question-text|question-number|question-multiple-choice|question-slider|question-date-time|question-file-upload|content-hero|logic-ai|content-output|capture-lead",
      "title": "Section Title",
      "subtitle": "Optional subtitle", 
      "settings": {
        // Section-specific settings based on type
      },
      "order": 1
    }
  ],
  "aiLogicPrompt": "Detailed AI prompt that processes @variable_name inputs and generates specific outputs",
  "outputTemplate": "Template for displaying results with @output_variable references"
}`
}

function generateUserPrompt(requirements: CampaignRequirements): string {
  const { type, title, description, inputDescription, outputDescription } = requirements
  
  return `Create a ${type} campaign with the following requirements:

CAMPAIGN DETAILS:
- Title: ${title}
- Description: ${description}
- Type: ${type}

INPUT REQUIREMENTS:
${inputDescription}

OUTPUT REQUIREMENTS:
${outputDescription}

REQUIREMENTS:
1. Analyze the input requirements and create appropriate question sections
2. Determine the best question types (text, multiple choice, slider, etc.) for each input
3. Create engaging question titles and descriptions
4. Add a hero section with compelling copy
5. Include a capture section for lead collection  
6. Generate an AI logic section with a detailed prompt that uses all the inputs
7. Create an output section that displays the AI results
8. Use proper variable names (@variable_name format)
9. Make the AI prompt comprehensive and actionable
10. Ensure the output template references all generated variables

IMPORTANT: Based on the requirements, intelligently determine:
- What specific questions to ask and what input types work best
- What specific outputs to generate and how to structure them
- What variable names to use for inputs and outputs
- How to create a cohesive user experience from start to finish

Generate a complete, ready-to-use campaign structure.`
}

// =============================================================================
// SECTION GENERATORS
// =============================================================================

function generateQuestionSection(input: InputVariable, order: number): GeneratedSection {
  const baseSettings = {
    variableName: input.name,
    required: input.required,
    placeholder: `Enter your ${input.description.toLowerCase()}...`
  }

  let settings = { ...baseSettings }
  let sectionType = SECTION_TYPE_MAPPINGS[input.type] || 'question-text'

  // Type-specific settings
  switch (input.type) {
    case 'choice':
      settings = {
        ...baseSettings,
        options: input.options?.map((option, idx) => ({
          id: `option_${idx + 1}`,
          text: option,
          value: option.toLowerCase().replace(/\s+/g, '_')
        })) || []
      }
      break
      
    case 'slider':
      settings = {
        ...baseSettings,
        min: 0,
        max: 100,
        step: 1,
        showLabels: true,
        minLabel: 'Low',
        maxLabel: 'High'
      }
      break
      
    case 'number':
      settings = {
        ...baseSettings,
        min: 0,
        max: 1000000,
        step: 1
      }
      break
      
    case 'file':
      settings = {
        ...baseSettings,
        acceptedTypes: ['image/*', '.pdf', '.doc', '.docx'],
        maxSize: 10 // MB
      }
      break
  }

  return {
    type: sectionType,
    title: `What's your ${input.description}?`,
    subtitle: `Help us personalize your results by sharing your ${input.description.toLowerCase()}.`,
    settings,
    order
  }
}

function generateHeroSection(requirements: CampaignRequirements): GeneratedSection {
  return {
    type: 'content-hero',
    title: requirements.title,
    subtitle: `Discover personalized recommendations in just a few quick questions. ${requirements.description}`,
    settings: {
      backgroundType: 'gradient',
      gradientFrom: '#3B82F6',
      gradientTo: '#8B5CF6',
      textColor: 'white',
      showCTA: true,
      ctaText: 'Get Started',
      ctaAction: 'next_section'
    },
    order: 0
  }
}

function generateCaptureSection(): GeneratedSection {
  return {
    type: 'capture',
    title: 'Get Your Personalized Results',
    subtitle: 'Enter your details to receive your customized recommendations.',
    settings: {
      fields: [
        { name: 'email', label: 'Email Address', required: true, type: 'email' },
        { name: 'firstName', label: 'First Name', required: true, type: 'text' }
      ],
      submitText: 'Get My Results',
      privacyText: 'We respect your privacy. Unsubscribe at any time.'
    },
    order: 100
  }
}

function generateAILogicSection(requirements: CampaignRequirements): GeneratedSection {
  const prompt = `You are an expert ${requirements.type} advisor. Based on the user's inputs, provide personalized recommendations for ${requirements.description}.

USER INPUT REQUIREMENTS:
${requirements.inputDescription}

OUTPUT REQUIREMENTS:
${requirements.outputDescription}

INSTRUCTIONS:
1. Analyze each user input carefully based on the questions they answered
2. Consider how the inputs interact and influence the recommendations
3. Provide specific, actionable advice based on the output requirements
4. Use a friendly, professional tone
5. Include reasoning for your recommendations
6. Format your response with clear sections
7. Generate outputs that match the specified requirements

OUTPUT FORMAT:
Based on the output requirements, return a JSON object with appropriate keys and detailed values.
Be comprehensive, specific, and helpful in your analysis. Reference the user's specific inputs in your recommendations.

Example format:
{
  "main_recommendation": "Detailed primary recommendation",
  "score": "Numerical score if applicable",
  "reasoning": "Explanation of why this recommendation fits",
  "next_steps": "Actionable next steps"
}

Adapt the keys and structure to match the specific output requirements provided.`

  return {
    type: 'logic',
    title: 'AI Analysis Engine',
    subtitle: 'Processing your inputs to generate personalized recommendations...',
    settings: {
      prompt: prompt.trim(),
      inputVariables: [], // Will be populated by AI-generated sections
      outputVariables: [], // Will be determined by AI based on output description
      temperature: 0.7,
      maxTokens: 1000
    },
    order: 200
  }
}

function generateOutputSection(requirements: CampaignRequirements): GeneratedSection {
  return {
    type: 'output',
    title: 'Your Personalized Results',
    subtitle: 'Based on your responses, here are your customized recommendations:',
    settings: {
      content: `# Your ${requirements.type.charAt(0).toUpperCase() + requirements.type.slice(1)} Results

@main_recommendation

@score

@reasoning

@next_steps

---

*These recommendations are personalized based on your specific inputs. The AI will generate the appropriate output variables based on your requirements.*`,
      showDownload: true,
      downloadFormat: 'pdf',
      downloadFilename: `${requirements.type}_results`
    },
    order: 300
  }
}

// =============================================================================
// SUGGESTION TO SECTION CONVERSION
// =============================================================================

function convertSuggestedInputToSection(input: SuggestedInput, order: number): GeneratedSection {
  let configuration: any = {
    headline: input.headline,
    subheading: input.subheading,
    required: input.required,
    buttonText: 'Next'
  }

  switch (input.type) {
    case 'text_question':
      configuration = {
        ...configuration,
        inputType: 'text',
        maxLength: 500,
        placeholder: input.placeholder || 'Type your answer here...'
      }
      break

    case 'multiple_choice':
      configuration = {
        ...configuration,
        allowMultiple: false,
        options: input.options?.map((option, idx) => ({
          id: `option-${idx + 1}`,
          text: option,
          order: idx + 1
        })) || []
      }
      break

    case 'slider':
      configuration = {
        ...configuration,
        minValue: input.minValue || 0,
        maxValue: input.maxValue || 100,
        step: input.step || 1,
        showValue: true,
        defaultValue: Math.floor(((input.minValue || 0) + (input.maxValue || 100)) / 2),
        labels: {
          min: input.minLabel || (input.minValue || 0).toString(),
          max: input.maxLabel || (input.maxValue || 100).toString()
        }
      }
      break

    case 'date_time_question':
      configuration = {
        ...configuration,
        content: input.headline,
        includeDate: true,
        includeTime: false
      }
      break

    case 'upload_question':
      configuration = {
        ...configuration,
        allowedTypes: ['image/*', '.pdf', '.doc', '.docx'],
        maxFileSize: 10
      }
      break
  }

  return {
    type: input.type,
    title: input.variableName,
    subtitle: '',
    settings: configuration,
    order
  }
}

// =============================================================================
// AI-POWERED SECTION GENERATION
// =============================================================================

async function generateQuestionSectionsFromDescription(inputDescription: string, startingOrder: number): Promise<GeneratedSection[]> {
  // For now, create a simple parser that extracts common patterns
  // In a full implementation, this would use an AI API call
  
  const sections: GeneratedSection[] = []
  let order = startingOrder
  
  // Simple pattern matching to create sections
  const patterns = [
    { keywords: ['age', 'years old', 'how old'], type: 'text_question', variable: 'age', title: 'What\'s your age?', subtitle: 'This helps us provide age-appropriate recommendations.' },
    { keywords: ['budget', 'price', 'cost', 'spend', 'money'], type: 'slider', variable: 'budget', title: 'What\'s your budget range?', subtitle: 'Help us find options within your price range.' },
    { keywords: ['skin type', 'skin', 'oily', 'dry', 'combination'], type: 'multiple_choice', variable: 'skin_type', title: 'What\'s your skin type?', subtitle: 'Choose the option that best describes your skin.', options: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'] },
    { keywords: ['experience', 'level', 'beginner', 'advanced'], type: 'multiple_choice', variable: 'experience_level', title: 'What\'s your experience level?', subtitle: 'This helps us tailor our recommendations.', options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { keywords: ['goals', 'objectives', 'want to achieve'], type: 'text_question', variable: 'goals', title: 'What are your main goals?', subtitle: 'Tell us what you\'re hoping to achieve.' },
    { keywords: ['preferences', 'like', 'prefer', 'favorite'], type: 'text_question', variable: 'preferences', title: 'What are your preferences?', subtitle: 'Share your likes and dislikes with us.' },
    { keywords: ['concerns', 'problems', 'issues', 'challenges'], type: 'text_question', variable: 'concerns', title: 'Any specific concerns?', subtitle: 'Let us know about any challenges you\'re facing.' },
    { keywords: ['routine', 'current', 'currently using'], type: 'text_question', variable: 'current_routine', title: 'What\'s your current routine?', subtitle: 'Tell us about what you\'re currently doing.' }
  ]
  
  const lowerDescription = inputDescription.toLowerCase()
  const usedVariables = new Set<string>()
  
  // Find matching patterns
  for (const pattern of patterns) {
    const hasKeyword = pattern.keywords.some(keyword => lowerDescription.includes(keyword))
    if (hasKeyword && !usedVariables.has(pattern.variable)) {
      usedVariables.add(pattern.variable)
      
      let settings: any = {
        variableName: pattern.variable,
        required: true,
        placeholder: `Enter your ${pattern.title.toLowerCase().replace('what\'s your ', '').replace('?', '')}...`
      }
      
      // Add type-specific settings
      if (pattern.type === 'multiple_choice' && pattern.options) {
        settings.options = pattern.options.map((option, idx) => ({
          id: `option_${idx + 1}`,
          text: option,
          value: option.toLowerCase().replace(/\s+/g, '_')
        }))
      } else if (pattern.type === 'slider') {
        settings = {
          ...settings,
          min: 0,
          max: pattern.variable === 'budget' ? 10000 : 100,
          step: pattern.variable === 'budget' ? 100 : 1,
          showLabels: true,
          minLabel: pattern.variable === 'budget' ? '$0' : 'Low',
          maxLabel: pattern.variable === 'budget' ? '$10k+' : 'High'
        }
      }
      
      sections.push({
        type: pattern.type,
        title: pattern.title,
        subtitle: pattern.subtitle,
        settings,
        order
      })
      
      order += 10
    }
  }
  
  // If no patterns matched, create a few generic sections
  if (sections.length === 0) {
    const genericSections = [
      {
        type: 'text_question',
        title: 'Tell us about yourself',
        subtitle: 'Share some basic information to help us personalize your experience.',
        settings: {
          variableName: 'user_info',
          required: true,
          placeholder: 'Tell us about yourself...'
        },
        order: order
      },
      {
        type: 'text_question',
        title: 'What are your preferences?',
        subtitle: 'Help us understand what you\'re looking for.',
        settings: {
          variableName: 'preferences',
          required: true,
          placeholder: 'Describe your preferences...'
        },
        order: order + 10
      }
    ]
    sections.push(...genericSections)
  }
  
  return sections
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { suggestions, campaignId } = body as { 
      suggestions: AISuggestions
      campaignId: string 
    }

    if (!suggestions || !campaignId) {
      return NextResponse.json({ 
        error: 'Missing suggestions or campaignId' 
      }, { status: 400 })
    }

    // Validate campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ 
        error: 'Campaign not found or access denied' 
      }, { status: 404 })
    }

    // Generate sections from AI suggestions
    const sections: GeneratedSection[] = []
    let order = 0

    // 1. Hero section
    sections.push({
      type: 'content-hero',
      title: 'hero_section',
      subtitle: '',
      settings: {
        headline: 'Welcome to Your Personalized Experience',
        subheading: 'Answer a few questions to get customized recommendations just for you.',
        backgroundImage: '',
        overlayColor: '#000000',
        overlayOpacity: 40,
        buttonText: 'Get Started',
        showButton: true
      },
      order
    })
    order += 10

    // 2. Convert suggested inputs to question sections
    for (const input of suggestions.inputs) {
      const questionSection = convertSuggestedInputToSection(input, order)
      sections.push(questionSection)
      order += 10
    }

    // 3. Capture section
    sections.push({
      type: 'capture',
      title: 'Get Your Results',
      subtitle: 'Enter your details to receive your personalized recommendations.',
      settings: {
        fields: [
          { name: 'email', label: 'Email Address', required: true, type: 'email' },
          { name: 'firstName', label: 'First Name', required: true, type: 'text' }
        ],
        submitText: 'Get My Results',
        privacyText: 'We respect your privacy. Unsubscribe at any time.'
      },
      order
    })
    order += 10

    // 4. AI Logic section using the provided prompt
    sections.push({
      type: 'logic',
      title: 'AI Analysis Engine',
      subtitle: 'Processing your inputs to generate personalized recommendations...',
      settings: {
        prompt: suggestions.aiPrompt,
        inputVariables: suggestions.inputs.map(input => input.variableName),
        outputVariables: suggestions.outputs.map(output => ({
          id: output.id,
          name: output.variableName,
          description: output.description
        })),
        temperature: 0.7,
        maxTokens: 1000
      },
      order
    })
    order += 10

    // 5. Output section with dynamic variables
    const outputContent = suggestions.outputs.map(output => `**${output.name}**\n@${output.variableName}\n`).join('\n')
    sections.push({
      type: 'output',
      title: 'results_section',
      subtitle: '',
      settings: {
        title: 'Your Personalized Results',
        subtitle: 'Based on your responses, here are your customized recommendations:',
        content: `${outputContent}\n---\n\n*These recommendations are personalized based on your specific inputs.*`,
        image: '',
        textAlignment: 'center',
        showButton: false,
        buttonText: 'Download Results',
        buttonType: 'download'
      },
      order
    })

    // Update campaign name if provided
    if (suggestions.campaignName) {
      await supabase
        .from('campaigns')
        .update({ name: suggestions.campaignName })
        .eq('id', campaignId)
    }

    // Create sections in database
    const sectionsToInsert = sections.map(section => ({
      campaign_id: campaignId,
      type: section.type,
      title: section.title,
      description: section.subtitle || '',
      configuration: section.settings,
      order_index: section.order,
      required: false
    }))

    const { error: insertError } = await supabase
      .from('sections')
      .insert(sectionsToInsert)

    if (insertError) {
      console.error('Error inserting sections:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create sections' 
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Campaign generated successfully',
      sectionsCount: sections.length
    })

  } catch (error) {
    console.error('AI Campaign Generation Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
