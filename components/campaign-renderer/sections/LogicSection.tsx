'use client'

import React, { useEffect, useState, useRef, memo } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { storeAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'
import { buildVariablesFromInputs, extractInputVariablesWithTypes, isFileVariable } from '@/lib/utils/section-variables'

function LogicSectionComponent({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onSectionComplete,
  userInputs = {},
  sections = []
}: SectionRendererProps) {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState('Analyzing your responses...')
  
  // Add processing tracking to prevent duplicates
  const isProcessingRef = useRef(false)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple simultaneous processing
    if (isProcessingRef.current || hasCompletedRef.current) {
      return
    }

    // Mark as processing to prevent duplicate calls
    isProcessingRef.current = true

    // Clear any existing test data from campaign builder before processing real data
    clearAITestResults()
    processAILogic()
  }, []) // Empty dependency array - only run once on mount

  const processAILogic = async () => {
    try {
      // Double-check we haven't already completed
      if (hasCompletedRef.current) {
        return
      }
      
      // Get AI configuration from the section (stored from campaign builder)
      const aiConfig = config as any
      
      // Check if this is an AI logic section with proper configuration
      if (!aiConfig.prompt || !aiConfig.outputVariables) {
        setProcessingStatus('Processing...')
        setTimeout(() => {
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true
            onSectionComplete(index, {
              [section.id]: 'processed',
              logic_processed: true
            })
          }
        }, 1500)
        return
      }

      setProcessingStatus('Preparing AI processing...')
      
      // ✅ SUPER SIMPLE APPROACH - Use new helper functions
      
      console.log('🎯 =========================')
      console.log('🎯 SIMPLIFIED AI LOGIC PROCESSING')
      console.log('🎯 =========================')
      console.log('🔍 AI Config:', {
        prompt: aiConfig.prompt,
        outputVariables: aiConfig.outputVariables
      })
      
      console.log('📝 Raw userInputs received:', userInputs)
      console.log('📋 Total sections:', sections.length)
      
      // ADD DETAILED DEBUGGING
      console.log('🔍 Sections detailed analysis:')
      sections.forEach((section, idx) => {
        console.log(`  Section ${idx}:`, {
          id: section.id,
          title: section.title,
          type: section.type,
          hasOptions: !!section.options,
          optionsCount: section.options?.length || 0,
          options: section.options?.map(opt => ({ value: opt.value, label: opt.label })) || []
        })
      })
      
      console.log('🔍 UserInputs detailed analysis:')
      Object.entries(userInputs).forEach(([sectionId, response]) => {
        if (Array.isArray(response) && response.length > 0 && response[0]?.url) {
          console.log(`  📁 Files found for ${sectionId}:`, response.map(f => ({ name: f.name, type: f.type, url: f.url })))
        } else {
          console.log(`  📝 Input for ${sectionId}:`, response)
        }
      })
      
      // Super simple: build variables from section titles and user responses
      const variables = buildVariablesFromInputs(sections, userInputs)
      
      console.log('✅ Simple variable mapping:', variables)
      console.log('✅ Variables found:', Object.keys(variables))

      // Check if we have file variables that need special processing
      const variablesWithTypes = extractInputVariablesWithTypes(sections, index)
      const fileVariables = variablesWithTypes.filter(v => v.type === 'file')
      const hasFileVariables = fileVariables.length > 0
      
      console.log('📁 File variables detected:', fileVariables.map(v => v.name))

      setProcessingStatus(hasFileVariables ? 'Processing files and sending to AI...' : 'Sending to AI...')

      // Prepare the AI request using the predefined configuration
      const aiRequest = {
        prompt: aiConfig.prompt,
        variables: variables,
        outputVariables: aiConfig.outputVariables.map((v: { id: string; name: string; description: string }) => ({
          id: v.id,
          name: v.name,
          description: v.description
        })),
        hasFileVariables,
        fileVariableNames: fileVariables.map(v => v.name),
        // Add lead/campaign info for file processing
        leadId: userInputs.leadId || 'preview-lead',
        campaignId: userInputs.campaignId || 'preview-campaign'
      }

      console.log('🤖 AI Request being sent:', aiRequest)

      // Use the appropriate API endpoint based on whether we have file variables
      const apiEndpoint = hasFileVariables ? '/api/ai-processing-with-files' : '/api/ai-processing'
      
      let response: Response
      
      if (hasFileVariables) {
        // For file variables, we need to send FormData with actual file content
        setProcessingStatus('Retrieving uploaded files...')
        
        const formData = new FormData()
        formData.append('prompt', aiRequest.prompt)
        formData.append('variables', JSON.stringify(aiRequest.variables))
        formData.append('outputVariables', JSON.stringify(aiRequest.outputVariables))
        formData.append('hasFileVariables', 'true')
        formData.append('fileVariableNames', JSON.stringify(aiRequest.fileVariableNames))
        
        // Fetch actual files from storage and append them
        console.log('📁 Fetching files from storage for AI processing...')
        
        for (const fileVariable of fileVariables) {
          // Look for uploaded file info in userInputs
          // Files are stored under the section ID and may be in different formats
          let uploadedFiles: any[] = []
          
          // Check different possible keys where files might be stored
          const possibleKeys = [
            fileVariable.section.id,                    // Direct section ID
            `${fileVariable.section.id}_files`,         // Section ID + _files
            fileVariable.name,                          // Variable name
            `${fileVariable.section.id}_${fileVariable.name}` // Combined
          ]
          
          for (const key of possibleKeys) {
            const value = userInputs[key]
            if (Array.isArray(value) && value.length > 0) {
              // Check if these look like uploaded file objects
              if (value.some(item => item && typeof item === 'object' && item.url && item.name)) {
                uploadedFiles = value
                console.log(`📄 Found files for ${fileVariable.name} under key "${key}":`, uploadedFiles)
                break
              }
            }
          }
          
          // If no files found, also check the submission data from onSectionComplete
          if (uploadedFiles.length === 0) {
            // Check for files in the submission format
            const submissionData = Object.entries(userInputs).find(([key, value]) => {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return Array.isArray(value[fileVariable.section.id]) || 
                       Array.isArray(value.files)
              }
              return false
            })
            
            if (submissionData && submissionData[1]) {
              const data = submissionData[1] as any
              uploadedFiles = data[fileVariable.section.id] || data.files || []
              console.log(`📄 Found files for ${fileVariable.name} in submission data:`, uploadedFiles)
            }
          }
          
          if (uploadedFiles.length > 0) {
            // Get the first file (could handle multiple files later)
            const uploadedFileInfo = uploadedFiles[0]
            if (uploadedFileInfo && uploadedFileInfo.url) {
              try {
                console.log(`⬇️ Downloading file ${uploadedFileInfo.name} from ${uploadedFileInfo.url}`)
                
                // Fetch the file content from Supabase storage
                const fileResponse = await fetch(uploadedFileInfo.url)
                if (fileResponse.ok) {
                  const fileBlob = await fileResponse.blob()
                  const file = new File([fileBlob], uploadedFileInfo.name, { 
                    type: uploadedFileInfo.type 
                  })
                  
                  formData.append(`file_${fileVariable.name}`, file)
                  console.log(`✅ Successfully added file ${uploadedFileInfo.name} (${file.size} bytes) for variable ${fileVariable.name}`)
                } else {
                  console.warn(`⚠️ Failed to fetch file for ${fileVariable.name}: HTTP ${fileResponse.status}`)
                }
              } catch (fileError) {
                console.error(`❌ Error fetching file for ${fileVariable.name}:`, fileError)
              }
            } else {
              console.warn(`⚠️ File info missing URL for ${fileVariable.name}:`, uploadedFileInfo)
            }
          } else {
            console.log(`⚠️ No uploaded files found for variable ${fileVariable.name}`)
            console.log('🔍 Available userInputs keys:', Object.keys(userInputs))
            console.log('🔍 Checked keys:', possibleKeys)
          }
        }
        
        setProcessingStatus('Sending files to AI for analysis...')
        
        response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData
        })
      } else {
        // Call the AI processing API with JSON for text-only variables
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(aiRequest)
        })
      }

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('🤖 AI Response received:', result)

      if (result.success && result.outputs) {
        setProcessingStatus('AI processing complete!')
        console.log('✅ AI processing completed successfully')
        
        // Filter outputs to only include the configured variables
        const requestedOutputs: Record<string, any> = {}
        aiConfig.outputVariables.forEach((outputVar: { name: string }) => {
          if (result.outputs[outputVar.name] !== undefined) {
            requestedOutputs[outputVar.name] = result.outputs[outputVar.name]
          }
        })
        
        console.log('📤 Requested outputs:', requestedOutputs)
        
        // Store only the requested AI results for output sections to use
        storeAITestResults(requestedOutputs)
        
        // Complete the section with AI outputs
        setTimeout(() => {
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true
            onSectionComplete(index, {
              [section.id]: 'processed',
              logic_processed: true,
              ai_outputs: result.outputs,
              ...result.outputs // Also include outputs directly
            })
            setIsProcessing(false)
          }
        }, 1000)
        
      } else {
        throw new Error(result.error || 'AI processing failed')
      }

    } catch (error) {
      console.error('❌ AI Logic processing error:', error)
      setError(error instanceof Error ? error.message : 'AI processing failed')
      setProcessingStatus('Processing error occurred')
      
      // Fallback: complete the section anyway after showing error
      setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true
          onSectionComplete(index, {
            [section.id]: 'processed',
            logic_processed: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          setIsProcessing(false)
        }
      }, 2000)
    } finally {
      isProcessingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg mx-auto space-y-8">
          {/* Processing Display */}
          <div className="text-center space-y-6">
            {error ? (
              <>
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h1 className={cn(
                    "font-bold text-foreground",
                    deviceInfo?.type === 'mobile' ? "text-xl" : "text-2xl"
                  )}>
                    Processing Error
                  </h1>
                  <p className="text-sm text-red-600">{error}</p>
                  <p className="text-xs text-muted-foreground">Continuing to next section...</p>
                </div>
              </>
            ) : isProcessing ? (
              <>
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <Zap className="h-4 w-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className={cn(
                    "font-bold text-foreground",
                    deviceInfo?.type === 'mobile' ? "text-xl" : "text-2xl"
                  )}>
                    {title || 'AI Processing'}
                  </h1>
                  <p className="text-sm text-muted-foreground">{processingStatus}</p>
                  {description && (
                    <p className="text-xs text-muted-foreground mt-4">{description}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h1 className={cn(
                    "font-bold text-foreground",
                    deviceInfo?.type === 'mobile' ? "text-xl" : "text-2xl"
                  )}>
                    Processing Complete
                  </h1>
                  <p className="text-sm text-muted-foreground">Your personalized results are ready!</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders
export const LogicSection = memo(LogicSectionComponent)