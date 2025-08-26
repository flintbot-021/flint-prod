'use client'

import React, { useEffect, useState, useRef, memo } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getKnowledgeBaseForAI } from '@/lib/data-access/knowledge-base'
import { cn } from '@/lib/utils'
import { getCampaignTheme, getCampaignTextColor } from '../utils'
import { storeAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'
import { buildVariablesFromInputs, extractInputVariablesWithTypes, isFileVariable } from '@/lib/utils/section-variables'

// Custom hook for cycling loading messages
const useCyclingLoadingMessage = (messages: string[], isLoading: boolean, interval: number = 3000) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isLoading && messages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
      }, interval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setCurrentMessageIndex(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLoading, messages.length, interval])

  return messages[currentMessageIndex] || messages[0]
}

// Engaging loading messages for the public-facing campaign
const AI_PROCESSING_MESSAGES = [
  "Analyzing your inputs...",
  "Generating personalized results...",
  "Processing your unique profile...",
  "Crafting tailored recommendations...",
  "Evaluating your responses...",
  "Creating custom insights...",
  "Personalizing your experience...",
  "Optimizing your results...",
  "Finalizing your analysis...",
  "Preparing your insights..."
]

function LogicSectionComponent({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  campaignId,
  onSectionComplete,
  userInputs = {},
  sections = [],
  campaign
}: SectionRendererProps) {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState('Preparing analysis...')
  
  // Use cycling loading messages for better UX
  const cyclingMessage = useCyclingLoadingMessage(AI_PROCESSING_MESSAGES, isProcessing)
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
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
    if (campaign?.id) {
      clearAITestResults(campaign.id)
    }
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
        setProcessingStatus('Getting ready...')
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

      // processingStatus is now handled by cycling messages
      
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
          hasOptions: !!(section as any).options,
          optionsCount: (section as any).options?.length || 0,
          options: (section as any).options?.map((opt: any) => ({ value: opt.value, label: opt.label })) || []
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
      
      // Detect URL variables manually since extractInputVariablesWithTypes doesn't support URL type
      const urlVariables = variablesWithTypes
        .filter(v => v.type === 'text') // URL variables are detected as text variables
        .filter(v => {
          // Check if this is a URL input based on section configuration
          const config = v.section.configuration as any
          return config?.isUrlInput === true
        })
        .map(v => ({ ...v, type: 'url' as const })) // Convert type to 'url'
      
      const hasFileVariables = fileVariables.length > 0
      
      console.log('📁 File variables detected:', fileVariables.map(v => ({ 
        name: v.name, 
        title: v.title,
        sectionId: v.section.id,
        sectionType: v.section.type,
        isFileVariable: v.type === 'file'
      })))
      console.log('🔗 URL variables detected:', urlVariables.map(v => ({ 
        name: v.name, 
        title: v.title,
        sectionId: v.section.id,
        sectionType: v.section.type,
        isUrlVariable: v.type === 'url'
      })))
      console.log('📁 Total sections before logic:', sections.length)
      console.log('📁 All sections details:', sections.map(s => ({ 
        id: s.id, 
        title: s.title, 
        type: s.type,
        hasConfig: !!s.configuration,
        isFileVariable: s.type === 'upload_question' || isFileVariable(s as any)
      })))

      // Main processing phase uses cycling messages

      // Prepare knowledge base context and files if enabled
      let knowledgeBaseContext = ''
      let knowledgeBaseFiles: Array<{ url: string; type: string; name: string }> = []
      if (aiConfig.knowledgeBase?.enabled) {
        try {
          // Fetch knowledge base data for this campaign - use campaignId prop
          const knowledgeBaseData = await getKnowledgeBaseForAI(campaignId || section.id)
          knowledgeBaseContext = knowledgeBaseData.textContent
          knowledgeBaseFiles = knowledgeBaseData.files
          console.log('📚 Campaign renderer: Knowledge base data fetched:', { 
            textLength: knowledgeBaseContext.length, 
            filesCount: knowledgeBaseFiles.length 
          })
        } catch (error) {
          console.error('Error fetching knowledge base context:', error)
        }
      }

      // Prepare URL browsing data if enabled
      console.log('🔍 Browse URLs Debug:', {
        browseUrlsEnabled: aiConfig.browseUrls?.enabled,
        urlVariablesLength: urlVariables.length,
        urlVariables: urlVariables.map(v => ({ name: v.name, type: v.type })),
        variables: Object.keys(variables)
      })
      
      const urlBrowsingData = aiConfig.browseUrls?.enabled && urlVariables.length > 0 ? {
        enabled: true,
        urlVariables: urlVariables.map(variable => {
          let url = variables[variable.name] || ''
          // Add https:// if no protocol is specified
          if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`
          }
          return {
            name: variable.name,
            url: url
          }
        }).filter(uv => uv.url.trim() !== '') // Only include URLs that have values
      } : { enabled: false }
      
      console.log('🔍 Final URL browsing data:', urlBrowsingData)

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
        knowledgeBaseContext,
        knowledgeBaseFiles,
        browseUrls: urlBrowsingData,
        // Add lead/campaign info for file processing
        leadId: userInputs.leadId || 'preview-lead',
        campaignId: userInputs.campaignId || 'preview-campaign'
      }

      console.log('🤖 AI Request being sent:', aiRequest)

      // Use the appropriate API endpoint - files are now sent directly to OpenAI
      const apiEndpoint = hasFileVariables ? '/api/ai-processing-with-files' : '/api/ai-processing'
      
      let response: Response
      
      if (hasFileVariables) {
        // For file variables, we send files directly to OpenAI via our API
        // File processing phase uses cycling messages
        
        const formData = new FormData()
        formData.append('prompt', aiRequest.prompt)
        formData.append('variables', JSON.stringify(aiRequest.variables))
        formData.append('outputVariables', JSON.stringify(aiRequest.outputVariables))
        formData.append('hasFileVariables', 'true')
        formData.append('fileVariableNames', JSON.stringify(aiRequest.fileVariableNames))
        
        // Add knowledge base context and files if available
        if (knowledgeBaseContext) {
          formData.append('knowledgeBaseContext', knowledgeBaseContext)
        }
        
        // Add knowledge base files for AI vision processing
        if (knowledgeBaseFiles && knowledgeBaseFiles.length > 0) {
          formData.append('knowledgeBaseFiles', JSON.stringify(knowledgeBaseFiles))
        }
        
        // Add URL browsing data if enabled
        formData.append('browseUrls', JSON.stringify(urlBrowsingData))
        
        // Fetch actual files from storage and append them for direct OpenAI processing
        console.log('📁 Fetching files from storage for direct OpenAI processing...')
        
        for (const fileVariable of fileVariables) {
          // Look for uploaded file info in userInputs
          // Files are stored under the section ID and may be in different formats
          let uploadedFiles: any[] = []
          
          console.log(`🔍 Looking for files for variable: ${fileVariable.name}`)
          console.log(`🔍 Section ID: ${fileVariable.section.id}`)
          console.log(`🔍 All userInputs keys:`, Object.keys(userInputs))
          console.log(`🔍 Full userInputs structure:`, JSON.stringify(userInputs, null, 2))
          
          // Check different possible keys where files might be stored
          // PRIORITY ORDER: Most likely to least likely locations
          const possibleKeys = [
            fileVariable.section.id,                    // 🎯 PRIMARY: Direct section ID (where UploadSection stores files)
            fileVariable.name,                          // 🎯 SECONDARY: Variable name (where buildVariablesFromInputs maps them)
            `${fileVariable.section.id}_files`,         // Section ID + _files
            `${fileVariable.section.id}_${fileVariable.name}`, // Combined
            `${fileVariable.section.id}_file_upload`,   // Section ID + file_upload
            'file_upload',                              // Just file_upload
            'files'                                     // Just files
          ]
          
          console.log(`🔍 Checking possible keys:`, possibleKeys)
          
          for (const key of possibleKeys) {
            const value = userInputs[key]
            console.log(`🔍 Checking key "${key}":`, value)
            
            if (Array.isArray(value) && value.length > 0) {
              // Check if these are uploaded file objects (with URL) or raw File objects
              const hasUploadedFileObjects = value.some(item => item && typeof item === 'object' && item.url && item.name)
              const hasRawFileObjects = value.some(item => item instanceof File)
              
              if (hasUploadedFileObjects || hasRawFileObjects) {
                uploadedFiles = value
                console.log(`📄 Found files for ${fileVariable.name} under key "${key}":`, uploadedFiles)
                console.log(`📄 File type: ${hasUploadedFileObjects ? 'uploaded file objects' : 'raw File objects'}`)
                break
              }
            }
          }
          
          // If no files found, also check the submission data from onSectionComplete
          if (uploadedFiles.length === 0) {
            console.log(`🔍 No files found in direct keys, checking nested structures...`)
            
            // Check for files in nested objects
            Object.entries(userInputs).forEach(([key, value]) => {
              console.log(`🔍 Nested check - key: ${key}, type: ${typeof value}`)
              
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                console.log(`🔍 Nested object contents for ${key}:`, value)
                
                // Check if this object has arrays that might be files
                Object.entries(value as any).forEach(([nestedKey, nestedValue]) => {
                  if (Array.isArray(nestedValue) && nestedValue.length > 0) {
                    console.log(`🔍 Found array in ${key}.${nestedKey}:`, nestedValue)
                    if (nestedValue.some(item => item && typeof item === 'object' && item.url && item.name)) {
                      console.log(`📄 Found file-like objects in ${key}.${nestedKey}!`)
                      if (uploadedFiles.length === 0) { // Only use first match
                        uploadedFiles = nestedValue
                      }
                    }
                  }
                })
              }
            })
            
            // Also check the older submission format
            const submissionData = Object.entries(userInputs).find(([key, value]) => {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return Array.isArray((value as any)[fileVariable.section.id]) || 
                       Array.isArray((value as any).files)
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
            const fileItem = uploadedFiles[0]
            
            if (fileItem instanceof File) {
              // Handle raw File objects directly
              console.log(`📁 Using raw File object: ${fileItem.name} (${fileItem.size} bytes)`)
              formData.append(`file_${fileVariable.name}`, fileItem)
              console.log(`✅ Successfully prepared raw file ${fileItem.name} for OpenAI processing`)
              
            } else if (fileItem && fileItem.url) {
              // Handle uploaded file info objects (fetch from storage)
              try {
                console.log(`⬇️ Downloading file ${fileItem.name} from ${fileItem.url}`)
                
                // Fetch the file content from Supabase storage for direct OpenAI upload
                const fileResponse = await fetch(fileItem.url)
                if (fileResponse.ok) {
                  const fileBlob = await fileResponse.blob()
                  const file = new File([fileBlob], fileItem.name, { 
                    type: fileItem.type 
                  })
                  
                  formData.append(`file_${fileVariable.name}`, file)
                  console.log(`✅ Successfully prepared file ${fileItem.name} (${file.size} bytes) for OpenAI processing`)
                } else {
                  console.warn(`⚠️ Failed to fetch file for ${fileVariable.name}: HTTP ${fileResponse.status}`)
                }
              } catch (fileError) {
                console.error(`❌ Error fetching file for ${fileVariable.name}:`, fileError)
              }
            } else {
              console.warn(`⚠️ Unknown file format for ${fileVariable.name}:`, fileItem)
            }
          } else {
            console.log(`⚠️ No uploaded files found for variable ${fileVariable.name}`)
            console.log('🔍 Available userInputs keys:', Object.keys(userInputs))
            console.log('🔍 Checked keys:', possibleKeys)
          }
        }
        
        // Final phase uses cycling messages
        
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
        setProcessingStatus('Analysis complete!')
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
        if (campaign?.id) {
          storeAITestResults(requestedOutputs, campaign.id)
        }
        
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
        throw new Error(result.error || 'Analysis failed')
      }

    } catch (error) {
      console.error('❌ AI Logic processing error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
              // Error state is handled separately in the UI
      
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
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg mx-auto space-y-8">
          {/* Processing Display */}
          <div className="text-center space-y-6">
            {error ? (
              <>
                <div 
                  className="w-24 h-24 mx-auto rounded-3xl backdrop-blur-md border flex items-center justify-center shadow-2xl"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 12px 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <div className="space-y-4">
                  <h1 
                    className={cn(
                      "font-black tracking-tight leading-tight",
                      deviceInfo?.type === 'mobile' ? "text-3xl" : "text-4xl lg:text-5xl"
                    )}
                    style={primaryTextStyle}
                  >
                    Analysis Error
                  </h1>
                  <div className="inline-block px-4 py-2 rounded-xl backdrop-blur-sm border border-red-500/20" 
                       style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <p className="text-base font-medium text-red-600">{error}</p>
                  </div>
                  <p className="text-sm font-medium" style={mutedTextStyle}>Continuing to next section...</p>
                </div>
              </>
            ) : isProcessing ? (
              <>
                <div 
                  className="w-24 h-24 mx-auto rounded-3xl backdrop-blur-md border flex items-center justify-center shadow-2xl"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.buttonColor }} />
                    <Zap className="h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ color: theme.buttonColor }} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 
                    className={cn(
                      "font-black tracking-tight leading-tight",
                      deviceInfo?.type === 'mobile' ? "text-3xl" : "text-4xl lg:text-5xl"
                    )}
                    style={primaryTextStyle}
                  >
                    Analyzing Your Responses
                  </h1>
                  <div className="inline-block px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10" 
                       style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <p className="text-base font-medium" style={mutedTextStyle}>{cyclingMessage}</p>
                  </div>
                  {description && (
                    <p className="text-sm mt-4 font-medium" style={mutedTextStyle}>{description}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div 
                  className="w-24 h-24 mx-auto rounded-3xl backdrop-blur-md border flex items-center justify-center shadow-2xl"
                  style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    boxShadow: '0 12px 40px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <Zap className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-4">
                  <h1 
                    className={cn(
                      "font-black tracking-tight leading-tight",
                      deviceInfo?.type === 'mobile' ? "text-3xl" : "text-4xl lg:text-5xl"
                    )}
                    style={primaryTextStyle}
                  >
                    Analysis Complete
                  </h1>
                  <div className="inline-block px-4 py-2 rounded-xl backdrop-blur-sm border border-green-500/20" 
                       style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                    <p className="text-base font-medium text-green-600">Your personalized results are ready!</p>
                  </div>
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