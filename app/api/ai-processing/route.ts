import { NextRequest, NextResponse } from 'next/server'
import { createAIProcessingEngine, AITestRequest } from '@/lib/services/ai-processing-engine'

export async function POST(request: NextRequest) {
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  const instanceId = request.headers.get('X-Instance-Id') || 'unknown'
  const clientRequestId = request.headers.get('X-Request-Id') || 'unknown'
  
  console.log(`🎯 [API] AI Processing request received - ${requestId}`)

  try {
    const body: AITestRequest = await request.json()
    
    // Request body parsed successfully
    
    // Validate request
    if (!body.prompt || typeof body.prompt !== 'string') {
      console.log(`❌ [API-${requestId}] Invalid prompt`)
      return NextResponse.json(
        { success: false, error: 'Valid prompt is required' },
        { status: 400 }
      )
    }

    if (!body.variables || typeof body.variables !== 'object') {
      console.log(`❌ [API-${requestId}] Invalid variables`)
      return NextResponse.json(
        { success: false, error: 'Variables object is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.outputVariables)) {
      console.log(`❌ [API-${requestId}] Invalid output variables`)
      return NextResponse.json(
        { success: false, error: 'Output variables array is required' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.log(`❌ [API-${requestId}] OpenAI API key not configured`)
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log(`🤖 [API-${requestId}] Starting AI processing`)
    console.log(`📤 [API-${requestId}] Final prompt sent to AI:`, body.prompt)
    console.log(`📋 [API-${requestId}] Variables sent to AI:`, body.variables)

    // Create AI processing engine and process the request
    const engine = createAIProcessingEngine(openaiApiKey)
    const result = await engine.processPrompt(body)

    console.log(`✅ [API-${requestId}] AI processing completed successfully`)
    console.log(`📥 [API-${requestId}] Data returned from AI:`, result.outputs)

    return NextResponse.json(result)

  } catch (error) {
    console.error(`❌ [API-${requestId}] AI processing API error:`, {
      instanceId,
      clientRequestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
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