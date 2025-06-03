/**
 * API Route: /api/generate-prompt
 * 
 * Generates contextual AI prompts based on campaign sections using GPT-4o mini
 */

import { NextRequest, NextResponse } from 'next/server'
import { promptGenerationService, PromptGenerationRequest } from '@/lib/services/prompt-generation'

export async function POST(request: NextRequest) {
  try {
    const body: PromptGenerationRequest = await request.json()

    // Validate required fields
    if (!body.sections || !Array.isArray(body.sections)) {
      return NextResponse.json(
        { error: 'sections array is required' },
        { status: 400 }
      )
    }

    if (typeof body.currentSectionOrder !== 'number') {
      return NextResponse.json(
        { error: 'currentSectionOrder is required' },
        { status: 400 }
      )
    }

    // Generate the prompt
    const result = await promptGenerationService.generatePrompt(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in generate-prompt API:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 