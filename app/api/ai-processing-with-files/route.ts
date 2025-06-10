import { NextRequest, NextResponse } from 'next/server'
import { createAIProcessingEngine, AITestRequest } from '@/lib/services/ai-processing-engine'
import { extractFileContentFromBuffer, combineFileContents } from '@/lib/utils/file-content-extractor'
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
    
    // Enhanced variables with file content
    let enhancedVariables = { ...variables }
    let imageVariables: Record<string, { base64Data: string; mimeType: string; fileName: string }> = {}
    
    // Process uploaded test files from FormData
    if (hasFileVariables && fileVariableNames.length > 0) {
      console.log(`📁 [API-${requestId}] Processing file variables:`, fileVariableNames)
      
      try {
        // Process each uploaded test file from FormData
        for (const variableName of fileVariableNames) {
          const file = formData.get(`file_${variableName}`) as File
          
          if (file && file instanceof File) {
            console.log(`📄 [API-${requestId}] Processing test file for ${variableName}: ${file.name}`)
            
            // Extract content directly from file buffer
            const fileBuffer = await file.arrayBuffer()
            
            try {
              const contentResult = await extractFileContentFromBuffer(
                fileBuffer,
                file.name,
                file.type
              )
              
              if (contentResult.success) {
                if (contentResult.isImage && contentResult.base64Data) {
                  // Handle image files with Vision API
                  imageVariables[variableName] = {
                    base64Data: contentResult.base64Data,
                    mimeType: contentResult.mimeType || file.type,
                    fileName: file.name
                  }
                  console.log(`🖼️ [API-${requestId}] Added image variable ${variableName} for Vision API`)
                } else if (contentResult.content) {
                  // Handle text/document files normally
                  enhancedVariables[variableName] = `File: ${file.name}\n${contentResult.content}`
                  console.log(`✅ [API-${requestId}] Enhanced variable ${variableName} with test file content`)
                }
              } else {
                enhancedVariables[variableName] = `File: ${file.name}\n[Error: ${contentResult.error || 'Could not extract content'}]`
                console.log(`⚠️ [API-${requestId}] Failed to extract content from ${file.name}`)
              }
            } catch (extractError) {
              console.error(`❌ [API-${requestId}] Error extracting content from ${file.name}:`, extractError)
              enhancedVariables[variableName] = `File: ${file.name}\n[Error: Failed to extract content]`
            }
          } else {
            console.log(`⚠️ [API-${requestId}] No test file found for variable ${variableName}`)
            
            // Try to get the file from variables (which might contain file data from user inputs)
            const fileVariable = variables[variableName]
            if (fileVariable && typeof fileVariable === 'object' && fileVariable.url) {
              try {
                console.log(`🔄 [API-${requestId}] Attempting to fetch file from storage: ${fileVariable.url}`)
                
                // For now, add a placeholder that indicates we found a file reference
                enhancedVariables[variableName] = `File: ${fileVariable.name || 'uploaded_file'}\n[File uploaded to campaign - Vision API processing not available for storage files yet]`
                console.log(`📁 [API-${requestId}] Added storage file placeholder for ${variableName}`)
              } catch (fetchError) {
                console.error(`❌ [API-${requestId}] Error fetching storage file:`, fetchError)
                enhancedVariables[variableName] = `[File variable: ${variableName} - error accessing file]`
              }
            } else {
              // No file found at all
              enhancedVariables[variableName] = `[File variable: ${variableName} - no file provided]`
            }
          }
        }
      } catch (fileError) {
        console.error(`❌ [API-${requestId}] File processing error:`, fileError)
        // Continue with processing even if file extraction fails
      }
    }

    console.log(`📤 [API-${requestId}] Final prompt sent to AI:`, prompt)
    console.log(`📋 [API-${requestId}] Enhanced variables sent to AI:`, Object.keys(enhancedVariables))
    console.log(`🖼️ [API-${requestId}] Image variables sent to AI:`, Object.keys(imageVariables))

    // Create AI processing engine and process the request
    const engine = createAIProcessingEngine(openaiApiKey)
    const result = await engine.processPrompt({
      prompt,
      variables: enhancedVariables,
      outputVariables,
      hasFileVariables,
      fileVariableNames,
      imageVariables: Object.keys(imageVariables).length > 0 ? imageVariables : undefined
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