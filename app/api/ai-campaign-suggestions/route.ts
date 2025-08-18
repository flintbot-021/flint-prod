import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// AI SUGGESTION GENERATOR
// =============================================================================

async function generateSuggestions(idea: string, inputType: 'idea' | 'business' = 'idea'): Promise<AISuggestions> {
  // Use OpenAI to intelligently generate suggestions based on the campaign idea or business description
  try {
    const aiResponse = await callOpenAIForSuggestions(idea, inputType)
    return aiResponse
  } catch (error) {
    console.error('AI suggestion generation failed:', error)
    // Fallback to basic suggestions if AI fails
    return generateFallbackSuggestions(idea)
  }
}

async function callOpenAIForSuggestions(idea: string, inputType: 'idea' | 'business' = 'idea'): Promise<AISuggestions> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const baseRequirements = `
1. Create a compelling campaign name (2-6 words, engaging and descriptive)
2. Create 3-6 input questions that would be needed to provide personalized results
3. For each input, determine the best question type:
   - "text_question" for open-ended text responses
   - "multiple_choice" for selecting from predefined options
   - "slider" for rating/numeric values with min/max ranges
   - "date_time_question" for dates or times
   - "upload_question" for file uploads

4. Create 2-4 output variables that the AI would generate based on the inputs
5. Generate a contextual AI prompt that processes the inputs (following the pattern: "You are an expert [role]. The user was asked '[question]' and they [responded with/selected/rated] @variable_name...")

Return JSON in this exact format:
{
  "campaignName": "Compelling Campaign Name",
  "inputs": [
    {
      "id": "1",
      "type": "text_question|multiple_choice|slider|date_time_question|upload_question",
      "variableName": "snake_case_name",
      "headline": "Question headline",
      "subheading": "Optional clarifying text",
      "placeholder": "For text questions only",
      "options": ["For multiple choice only"],
      "minValue": 0,
      "maxValue": 10,
      "step": 1,
      "minLabel": "Min label for sliders",
      "maxLabel": "Max label for sliders",
      "required": true
    }
  ],
  "outputs": [
    {
      "id": "1",
      "variableName": "snake_case_name",
      "name": "Display Name",
      "description": "What this output represents"
    }
  ],
  "aiPrompt": "You are an expert [role]. The user was asked '[question1]' and they responded with @variable1. The user was asked '[question2]' and they selected @variable2 from the available options."
}

Make the campaign name catchy and professional. Make the questions relevant and specific to the campaign idea. Ensure variable names are descriptive and use snake_case.`

  const prompt = inputType === 'business' 
    ? `You are an expert campaign designer. A user has described their business: "${idea}"

Based on this business description, suggest a suitable campaign type and generate appropriate input questions, output results, and a compelling campaign name that would help this business engage their audience and generate leads.

REQUIREMENTS:${baseRequirements}`
    : `You are an expert campaign designer. A user wants to create: "${idea}"

Based on this campaign idea, generate appropriate input questions, output results, and a compelling campaign name.

REQUIREMENTS:${baseRequirements}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
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

  const parsed = JSON.parse(data.choices[0].message.content)
  
  return {
    inputs: parsed.inputs || [],
    outputs: parsed.outputs || [],
    aiPrompt: parsed.aiPrompt || '',
    campaignName: parsed.campaignName || 'AI Generated Campaign'
  }
}

function generateFallbackSuggestions(idea: string): AISuggestions {
  // Fallback suggestions if AI fails
  const lowerIdea = idea.toLowerCase()
  const inputs: SuggestedInput[] = []
  const outputs: SuggestedOutput[] = []
  
  // Determine campaign type for fallback
  let campaignType = 'general'
  if (lowerIdea.includes('marathon') || lowerIdea.includes('running') || lowerIdea.includes('training')) {
    campaignType = 'fitness'
  } else if (lowerIdea.includes('calculator') || lowerIdea.includes('roi') || lowerIdea.includes('budget')) {
    campaignType = 'calculator'
  } else if (lowerIdea.includes('quiz') || lowerIdea.includes('personality') || lowerIdea.includes('assessment')) {
    campaignType = 'quiz'
  } else if (lowerIdea.includes('nutrition') || lowerIdea.includes('diet') || lowerIdea.includes('meal')) {
    campaignType = 'nutrition'
  }

  // Generate fallback inputs based on campaign type
  switch (campaignType) {
    case 'fitness':
      inputs.push(
        {
          id: '1',
          type: 'multiple_choice',
          variableName: 'fitness_level',
          headline: 'What\'s your current fitness level?',
          subheading: 'This helps us tailor your training plan',
          options: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
          required: true
        },
        {
          id: '2',
          type: 'slider',
          variableName: 'weekly_hours',
          headline: 'How many hours per week can you train?',
          subheading: 'Be realistic about your available time',
          minValue: 1,
          maxValue: 20,
          step: 1,
          minLabel: '1 hour',
          maxLabel: '20+ hours',
          required: true
        },
        {
          id: '3',
          type: 'date_time_question',
          variableName: 'target_date',
          headline: 'When is your target race date?',
          subheading: 'We\'ll work backwards from this date',
          required: true
        },
        {
          id: '4',
          type: 'multiple_choice',
          variableName: 'running_experience',
          headline: 'How long have you been running?',
          subheading: 'Your experience level matters for training intensity',
          options: ['Less than 6 months', '6 months - 2 years', '2-5 years', '5+ years'],
          required: true
        }
      )
      
      outputs.push(
        {
          id: '1',
          variableName: 'training_plan',
          name: 'Personalized Training Plan',
          description: 'A detailed week-by-week training schedule tailored to your fitness level and goals'
        },
        {
          id: '2',
          variableName: 'weekly_mileage',
          name: 'Weekly Mileage Progression',
          description: 'How your weekly running distance will increase over time'
        },
        {
          id: '3',
          variableName: 'nutrition_tips',
          name: 'Nutrition & Recovery Tips',
          description: 'Specific advice for fueling your training and recovery'
        }
      )
      break

    case 'calculator':
      inputs.push(
        {
          id: '1',
          type: 'slider',
          variableName: 'monthly_budget',
          headline: 'What\'s your monthly marketing budget?',
          subheading: 'Include all marketing expenses',
          minValue: 500,
          maxValue: 50000,
          step: 500,
          minLabel: '$500',
          maxLabel: '$50k+',
          required: true
        },
        {
          id: '2',
          type: 'multiple_choice',
          variableName: 'business_type',
          headline: 'What type of business do you have?',
          subheading: 'Different industries have different ROI expectations',
          options: ['E-commerce', 'SaaS', 'Local Service', 'B2B Consulting', 'Other'],
          required: true
        },
        {
          id: '3',
          type: 'slider',
          variableName: 'target_roi',
          headline: 'What\'s your target ROI percentage?',
          subheading: 'Most businesses aim for 300-500% ROI',
          minValue: 100,
          maxValue: 1000,
          step: 50,
          minLabel: '100%',
          maxLabel: '1000%+',
          required: true
        }
      )
      
      outputs.push(
        {
          id: '1',
          variableName: 'projected_roi',
          name: 'Projected ROI',
          description: 'Expected return on investment based on your inputs and industry benchmarks'
        },
        {
          id: '2',
          variableName: 'budget_breakdown',
          name: 'Recommended Budget Allocation',
          description: 'How to split your budget across different marketing channels'
        },
        {
          id: '3',
          variableName: 'action_plan',
          name: 'Next Steps Action Plan',
          description: 'Specific recommendations for implementing your marketing strategy'
        }
      )
      break

    case 'quiz':
      inputs.push(
        {
          id: '1',
          type: 'multiple_choice',
          variableName: 'work_style',
          headline: 'How do you prefer to work?',
          subheading: 'Choose the option that best describes you',
          options: ['Independently', 'In small teams', 'In large groups', 'Mix of both'],
          required: true
        },
        {
          id: '2',
          type: 'slider',
          variableName: 'risk_tolerance',
          headline: 'How comfortable are you with taking risks?',
          subheading: '1 = Very conservative, 10 = Love taking risks',
          minValue: 1,
          maxValue: 10,
          step: 1,
          minLabel: 'Conservative',
          maxLabel: 'Risk-taker',
          required: true
        },
        {
          id: '3',
          type: 'text_question',
          variableName: 'career_goals',
          headline: 'What are your main career goals?',
          subheading: 'Be specific about what you want to achieve',
          placeholder: 'e.g., Lead a team, start my own business, become an expert...',
          required: true
        }
      )
      
      outputs.push(
        {
          id: '1',
          variableName: 'personality_type',
          name: 'Your Personality Type',
          description: 'A detailed analysis of your work personality and strengths'
        },
        {
          id: '2',
          variableName: 'career_matches',
          name: 'Recommended Career Paths',
          description: 'Specific roles and industries that match your personality and goals'
        },
        {
          id: '3',
          variableName: 'development_plan',
          name: 'Personal Development Plan',
          description: 'Skills to develop and steps to take to reach your career goals'
        }
      )
      break

    default:
      // Generic suggestions
      inputs.push(
        {
          id: '1',
          type: 'text_question',
          variableName: 'user_name',
          headline: 'What\'s your name?',
          subheading: 'We\'ll personalize your experience',
          placeholder: 'Enter your name...',
          required: true
        },
        {
          id: '2',
          type: 'multiple_choice',
          variableName: 'experience_level',
          headline: 'What\'s your experience level?',
          subheading: 'This helps us tailor our recommendations',
          options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
          required: true
        }
      )
      
      outputs.push(
        {
          id: '1',
          variableName: 'recommendation',
          name: 'Personalized Recommendation',
          description: 'A customized recommendation based on your inputs'
        },
        {
          id: '2',
          variableName: 'next_steps',
          name: 'Next Steps',
          description: 'Actionable steps you can take based on your results'
        }
      )
  }

  // Generate AI prompt following prompt-generation.ts pattern
  let aiPrompt = `You are an expert ${campaignType === 'fitness' ? 'fitness coach' : 
                                    campaignType === 'calculator' ? 'business consultant' : 
                                    campaignType === 'quiz' ? 'career advisor' : 
                                    campaignType === 'nutrition' ? 'nutritionist' : 'advisor'}.`

  // Add context for each input variable
  inputs.forEach(input => {
    if (input.type === 'text_question') {
      aiPrompt += ` The user was asked '${input.headline}' and they responded with @${input.variableName}.`
    } else if (input.type === 'slider') {
      aiPrompt += ` The user was asked '${input.headline}' and they rated it @${input.variableName} out of ${input.maxValue || 10}.`
    } else if (input.type === 'multiple_choice') {
      aiPrompt += ` The user was asked '${input.headline}' and they selected @${input.variableName} from the available options.`
    } else if (input.type === 'date_time_question') {
      aiPrompt += ` The user was asked '${input.headline}' and they selected @${input.variableName} as their date.`
    }
  })

  // Generate fallback campaign name
  const campaignName = campaignType === 'fitness' ? 'Fitness Assessment' :
                      campaignType === 'calculator' ? 'Business Calculator' :
                      campaignType === 'quiz' ? 'Personality Quiz' :
                      campaignType === 'nutrition' ? 'Nutrition Planner' :
                      'Personalized Assessment'

  return {
    inputs,
    outputs,
    aiPrompt,
    campaignName
  }
}

// =============================================================================
// API HANDLER
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
    const { idea, inputType = 'idea' } = body

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({ 
        error: 'Campaign idea is required' 
      }, { status: 400 })
    }

    // Generate suggestions using AI
    const suggestions = await generateSuggestions(idea, inputType)

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('AI Suggestions Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
