/**
 * API Route: /api/generate-prompt
 * 
 * Generates contextual AI prompts based on campaign sections using GPT-4o mini
 */

import { NextRequest, NextResponse } from 'next/server'
import { promptGenerationService, PromptGenerationRequest } from '@/lib/services/prompt-generation'

export async function POST(request: NextRequest) {
  console.log('🚀 Generate prompt API called')
  
  try {
    const body: PromptGenerationRequest = await request.json()
    console.log('📝 Request body received:', {
      sectionsCount: body.sections?.length,
      currentSectionOrder: body.currentSectionOrder,
      hasExistingPrompt: !!body.existingPrompt,
      outputVariablesCount: body.outputVariables?.length
    })

    // Validate required fields
    if (!body.sections || !Array.isArray(body.sections)) {
      console.error('❌ Validation failed: sections array is required')
      return NextResponse.json(
        { error: 'sections array is required' },
        { status: 400 }
      )
    }

    if (typeof body.currentSectionOrder !== 'number') {
      console.error('❌ Validation failed: currentSectionOrder is required')
      return NextResponse.json(
        { error: 'currentSectionOrder is required' },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed, calling prompt generation service...')
    
    // Generate the prompt
    const result = await promptGenerationService.generatePrompt(body)
    console.log('📊 Generation result:', {
      success: result.success,
      error: result.error,
      promptLength: result.suggestedPrompt?.length,
      outputVariablesCount: result.suggestedOutputVariables?.length
    })

    if (!result.success) {
      console.error('❌ Generation failed:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ Generation successful, returning result')
    return NextResponse.json(result)

  } catch (error) {
    console.error('💥 Error in generate-prompt API:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 