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
1. Create a compelling campaign name (2–6 words, engaging and descriptive; Title Case; no emojis). It should make sense on a public website and be legible to AI assistants.

2. Create 3–6 input questions required to produce personalised results **and** capture useful qualification data for the business (e.g., budget band, timeframe, role/title, use case). Each input must include:
   - "id": sequential string starting at "1"
   - "type": one of
       • "text_question"      (open-ended response)
       • "multiple_choice"    (single-select from predefined options; max 5)
       • "slider"             (rating/numeric with min/max/step; only when maxValue ≤ 100)
       • "date_time_question" (date, time, or datetime as plain text instruction)
       • "upload_question"    (file upload)
   - "variableName": snake_case, descriptive, unique
   - "headline": clear question text
   - "subheading": concise clarifier (may be empty)
   - "placeholder": only for text questions (else empty)
   - "options": only for multiple_choice; provide 2–5 mutually exclusive options (cap at 5)
   - "minValue", "maxValue", "step": only for sliders (ensure maxValue ≤ 100)
   - "minLabel", "maxLabel": human-friendly anchors for sliders (e.g., "Basic" ↔ "Premium")
   - "required": true unless the question is explicitly optional

   Guidance:
   - If a numeric range might exceed 100, use bucketed multiple_choice ranges (e.g., "0–100", "101–250", "251–500+") or switch to a text_question.
   - Phrase questions to minimise ambiguity and cognitive load.
   - Avoid collecting sensitive/PII unless essential; mark optional where appropriate.

3. Create 2–4 output variables that the AI will generate from the inputs. Outputs should:
   - Deliver immediate value to the user (e.g., a recommendation, plan, estimate, or curated selection).
   - Include at least one business-oriented insight when relevant (e.g., a "segment_tag" or "priority_score") to support qualification.
   For each output include:
   - "id": sequential string starting at "1"
   - "variableName": snake_case (e.g., "recommended_combo")
   - "name": short display label (e.g., "Recommended Flower Combo")
   - "description": what the output should contain, constraints/length, data source limits, and any explicit conditions.
     • You may reference inputs with @variableName here to instruct conditional behaviour.
     • If an output must extract an exact value (e.g., a URL), say "Return the exact URL ... no extra text".

4. Generate a contextual AI prompt that processes the inputs using this pattern:
   - "You are an expert [role]. The user was asked '[question1]' and they [responded with/selected/rated] @variable1[ /max if slider]. The user was asked '[question2]' and they [responded/selected/rated] @variable2 …"
   - Choose [role] to match the campaign domain (e.g., "wedding florist", "customer experience analyst").
   - Use only @variableName (snake_case) to refer to user answers.
   - Keep it concise, precise, and grounded in the available inputs/knowledge. Do not reference unavailable data.

5. Return JSON in this exact format:
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
      "options": ["For multiple choice only (2–5 items, max 5)"],
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
      "description": "What this output represents + constraints/conditions. You may reference @input_variables here."
    }
  ],
  "aiPrompt": "You are an expert [role]. The user was asked '[question1]' and they responded with @variable1. The user was asked '[question2]' and they selected @variable2 from the available options."
}

6. Additional constraints:
   - Multiple choice options: ≤ 5.
   - Sliders: only when maxValue ≤ 100; otherwise use bucketed multiple_choice or a text_question.
   - Use en-GB spelling; keep language clear, practical.
   - Do not include CTA labels or capture-field states. Do not fabricate privacy links.
   - Do not use @variables in questions or subheadings; only in aiPrompt and (optionally) output descriptions.
   - Prefer inputs/outputs that shorten time-to-value for the user and increase qualification clarity for the business.`

  const prompt = inputType === 'business' 
    ? `You are an expert campaign designer for interactive, self-serve tools.

A user has described their business: "${idea}"

Context (why this tool exists):
Flint tools help service businesses modernise lead generation and qualification by replacing passive "Contact Us" forms with interactive mini-products (calculators, selectors, quote generators, matchers, audits, assessments). These tools deliver instant value to prospects while capturing rich qualification signals for the business, enabling product-led workflows without building full software. They keep data handling simple/compliant, make experimentation cheap, and prepare for an AI-assistant-driven search world where specific, interactive capabilities outperform static content.

Your job:
1. First, generate a specific lead magnet idea/tool concept that would be genuinely valuable to visitors of this business's website (e.g., "ROI Calculator for Marketing Spend", "Wedding Style Quiz", "Security Assessment Tool", "Pricing Estimator").
2. Then design a coherent campaign around that specific tool concept, ensuring all inputs and outputs work together to deliver that tool's promise.
3. The tool should:
   - deliver immediate, tailored value to the prospect related to the specific tool concept, and
   - return useful qualification signals for the business (e.g., budget band, intent/timeline, role, segment).

Design rules (additive to the base requirements):
• The campaignName should clearly reflect the specific tool concept you've generated (e.g., "Marketing ROI Calculator", "Wedding Style Quiz").
• All inputs and outputs must be coherent with and serve the specific tool concept - everything should feel like it belongs to the same focused tool.
• Ask only what's needed to deliver that specific tool's value and qualify the lead (≤6 questions).
• Multiple choice: ≤ 5 mutually exclusive options.
• Sliders: only when max ≤ 100; otherwise use bucketed multiple choice (e.g., "0–100", "101–250", "251–500+") or a text question.
• Use snake_case for every variableName; IDs are sequential strings starting at "1".
• If any outputs are conditional, express the condition explicitly in the output description (e.g., "If @budget ≤ 5000 … else …").
• Do not use @variables in question or subheading text; only in aiPrompt and, if helpful, output descriptions.
• Do not include CTA labels or capture-field states, and do not fabricate privacy links.
• Avoid collecting sensitive/PII unless essential; mark optional if included.
• Keep language en-GB, clear, practical.
• No emojis in titles or labels.

REQUIREMENTS:${baseRequirements}`
    : `You are an expert campaign designer for interactive tools. A user wants to create: "${idea}"

Context (why this tool exists):
Flint tools help service businesses modernise lead generation and qualification by replacing passive "Contact Us" forms with interactive, self-serve mini-products (calculators, selectors, quote generators, matchers). These tools reduce time-to-value for prospects (instant, tailored results) while collecting rich qualification signals for the business. They enable product-led workflows without building full software, keep data handling simple/compliant, make experimentation cheap, and prepare for an AI-assistant-driven search world where specific interactive capabilities beat static content.

Your job: return a clean JSON campaign spec that can be used to build the tool end-to-end. Use plain English (en-GB), concise copy, and sensible defaults if details are missing.

Design rules:
• Campaign name: short, clear, professional (no emojis).
• Inputs (3–6): ask only what's needed to personalise results AND produce useful qualification signals (e.g., intent, budget/tier, timeframe, role). Keep questions unambiguous.
• Types: choose the best type for each input (see base requirements).
• Multiple choice: ≤ 5 mutually exclusive options; avoid overlap.
• Sliders: only when max ≤ 100; otherwise use bucketed multiple choice (e.g., "0–100", "101–250", "251–500+") or text.
• Sliders must include minValue, maxValue, step, minLabel, maxLabel.
• Use snake_case for every variableName; make them unique and descriptive.
• IDs are sequential strings starting at "1" in both inputs and outputs.
• Outputs (2–4): must deliver immediate user value (clear, actionable results) AND, where relevant, a business-useful signal (e.g., segment/tag/priority). If any output is conditional, spell out the condition explicitly in the description (e.g., "If @budget ≤ 5000 then … else …").
• Only use @variable references in the aiPrompt and (optionally) in output descriptions to guide AI behaviour. Do not use @variables in questions or subheadings.
• Do not include CTA labels or capture-form field states. Do not invent privacy links.
• Respect data minimisation: avoid sensitive/PII unless essential—and mark it optional if included.
• Keep tone "clear, practical".

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
