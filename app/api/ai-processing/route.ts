import { NextRequest, NextResponse } from 'next/server'
import { createAIProcessingEngine, AITestRequest } from '@/lib/services/ai-processing-engine'

export async function POST(request: NextRequest) {
  try {
    const body: AITestRequest = await request.json()
    
    // Validate request
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid prompt is required' },
        { status: 400 }
      )
    }

    if (!body.variables || typeof body.variables !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Variables object is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.outputVariables)) {
      return NextResponse.json(
        { success: false, error: 'Output variables array is required' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create AI processing engine and process the request
    const engine = createAIProcessingEngine(openaiApiKey)
    const result = await engine.processPrompt(body)

    return NextResponse.json(result)

  } catch (error) {
    console.error('AI processing API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        processingTime: 0
      },
      { status: 500 }
    )
  }
} 