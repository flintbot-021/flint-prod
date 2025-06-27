import { NextRequest, NextResponse } from 'next/server'
import { createAIProcessingEngine, AITestRequest } from '@/lib/services/ai-processing-engine'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AIProcessingWithFilesRequest extends AITestRequest {
  leadId?: string
  campaignId?: string
  userInputs?: Record<string, any>
}

export async function POST(request: NextRequest) {
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  
  console.log(`🎯 [API] AI Processing with Files request received - ${requestId}`)

  try {
    // Parse FormData instead of JSON
    const formData = await request.formData()
    
    // Extract basic parameters from FormData
    const prompt = formData.get('prompt') as string
    const variablesStr = formData.get('variables') as string
    const outputVariablesStr = formData.get('outputVariables') as string
    const hasFileVariables = formData.get('hasFileVariables') === 'true'
    const fileVariableNamesStr = formData.get('fileVariableNames') as string
    const knowledgeBaseContext = formData.get('knowledgeBaseContext') as string | null
    
    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid prompt is required' },
        { status: 400 }
      )
    }

    let variables: Record<string, any> = {}
    let outputVariables: any[] = []
    let fileVariableNames: string[] = []
    
    try {
      variables = variablesStr ? JSON.parse(variablesStr) : {}
      outputVariables = outputVariablesStr ? JSON.parse(outputVariablesStr) : []
      fileVariableNames = fileVariableNamesStr ? JSON.parse(fileVariableNamesStr) : []
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in variables or outputVariables' },
        { status: 400 }
      )
    }

    if (!variables || typeof variables !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Variables object is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(outputVariables)) {
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

    console.log(`🤖 [API-${requestId}] Starting AI processing with file support`)
    
    // Enhanced variables and file objects for direct OpenAI upload
    let enhancedVariables = { ...variables }
    let fileObjects: Record<string, { file: File; variableName: string }> = {}
    
    // Process uploaded test files from FormData - prepare for direct OpenAI upload
    if (hasFileVariables && fileVariableNames.length > 0) {
      console.log(`📁 [API-${requestId}] Processing file variables for direct OpenAI upload:`, fileVariableNames)
      
      try {
        // Process each uploaded test file from FormData
        for (const variableName of fileVariableNames) {
          const file = formData.get(`file_${variableName}`) as File
          
          if (file && file instanceof File) {
            console.log(`📄 [API-${requestId}] Preparing file for direct OpenAI upload: ${file.name} (${file.type})`)
            
            // Send all files directly to OpenAI (PDFs, documents, images, etc.)
            fileObjects[variableName] = {
              file: file,
              variableName: variableName
            }
            
            // Add placeholder in variables to reference the file
            enhancedVariables[variableName] = `[FILE: ${file.name} - will be processed directly by OpenAI]`
            console.log(`📋 [API-${requestId}] Added file ${file.name} for direct OpenAI processing`)
            
          } else {
            console.log(`⚠️ [API-${requestId}] No test file found for variable ${variableName}`)
            enhancedVariables[variableName] = `[FILE VARIABLE: ${variableName} - no file provided]`
          }
        }
      } catch (fileError) {
        console.error(`❌ [API-${requestId}] File processing error:`, fileError)
        // Continue with processing even if file preparation fails
      }
    }

    console.log(`📤 [API-${requestId}] Final prompt sent to AI:`, prompt)
    console.log(`📋 [API-${requestId}] Enhanced variables sent to AI:`, Object.keys(enhancedVariables))
    console.log(`📁 [API-${requestId}] Files for direct upload:`, Object.keys(fileObjects))

    // Create AI processing engine and process the request with direct file support
    const engine = createAIProcessingEngine(openaiApiKey)
    const result = await engine.processPrompt({
      prompt,
      variables: enhancedVariables,
      outputVariables,
      hasFileVariables,
      fileVariableNames,
      fileObjects: Object.keys(fileObjects).length > 0 ? fileObjects : undefined,
      knowledgeBaseContext: knowledgeBaseContext || undefined
    })

    console.log(`✅ [API-${requestId}] AI processing completed successfully`)
    console.log(`📥 [API-${requestId}] Data returned from AI:`, result.outputs)

    return NextResponse.json(result)

  } catch (error) {
    console.error(`❌ [API-${requestId}] AI processing with files API error:`, {
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