'use client'

import React, { useEffect, useState, useRef, memo } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { storeAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'

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
      
      // Get the predefined variable names from AI configuration
      const predefinedVariables = Object.keys(aiConfig.testInputs || {})
      
      console.log('🎯 =========================')
      console.log('🎯 AI LOGIC SECTION PROCESSING')
      console.log('🎯 =========================')
      console.log('🔍 AI Config:', {
        prompt: aiConfig.prompt,
        predefinedVariables,
        outputVariables: aiConfig.outputVariables,
        testInputs: aiConfig.testInputs
      })
      
      console.log('📝 Raw userInputs received:', userInputs)
      
      // Log detailed section information for debugging
      console.log('📋 Available sections:')
      sections.forEach((sec, idx) => {
        const config = sec.configuration as any
        console.log(`  [${idx}] Section "${sec.title}" (${sec.type}):`, {
          id: sec.id,
          type: sec.type,
          title: sec.title,
          hasOptions: !!(config?.options),
          optionsCount: config?.options?.length || 0,
          options: config?.options?.map((opt: any) => ({ id: opt.id, text: opt.text })) || []
        })
      })
      
      // Map user responses to predefined AI variables
      const variables: Record<string, any> = {}
      
      console.log('🔄 Processing userInputs to extract variables...')
      
      // Only process question section responses (exclude capture sections)
      Object.entries(userInputs).forEach(([key, value]) => {
        console.log(`\n📊 Processing userInput key: "${key}"`)
        console.log(`   Value:`, value)
        console.log(`   Type: ${typeof value}`)
        
        // Skip capture section data (email, name from leads)
        if (key === 'email' || key === 'name' || key.includes('capture')) {
          console.log(`   ⏭️ Skipping capture data: ${key}`)
          return
        }
        
        // Skip processing capture section nested objects entirely
        const isCaptureSectionId = sections.some(section => 
          section.id === key && section.type === 'capture'
        )
        if (isCaptureSectionId) {
          console.log(`   ⏭️ Skipping capture section object: ${key}`)
          return
        }
        
        // Handle both direct values and nested response objects
        if (typeof value === 'object' && value !== null) {
          console.log(`   🔍 Processing nested object...`)
          // Extract the actual response value from nested objects
          Object.entries(value as Record<string, any>).forEach(([subKey, subValue]) => {
            console.log(`     Sub-key: "${subKey}" = ${subValue} (${typeof subValue})`)
            
            if (subKey !== 'metadata' && subValue !== undefined && subValue !== null) {
              // If this matches a predefined variable name, use it
              if (predefinedVariables.includes(subKey)) {
                console.log(`     ✅ Matched predefined variable "${subKey}" with value: ${subValue}`)
                variables[subKey] = subValue
              } else {
                console.log(`     ❌ "${subKey}" not in predefined variables: [${predefinedVariables.join(', ')}]`)
              }
            }
          })
        } else if (value !== undefined && value !== null) {
          // If this key matches a predefined variable name, use it
          if (predefinedVariables.includes(key)) {
            console.log(`   ✅ Direct match for predefined variable "${key}" with value: ${value}`)
            variables[key] = value
          } else {
            console.log(`   ❌ "${key}" not in predefined variables: [${predefinedVariables.join(', ')}]`)
          }
        }
      })
      
      console.log('\n🔍 Variables found so far:', variables)
      console.log(`🔍 Missing variables: [${predefinedVariables.filter(v => !variables[v]).join(', ')}]`)
      
      // For any missing predefined variables, try to find them by matching section titles
      // This handles the case where variable names match section titles
      predefinedVariables.forEach(variableName => {
        if (!variables[variableName]) {
          console.log(`\n🎯 Looking for missing variable: "${variableName}"`)
          
          // Find section with matching title (ONLY from question sections, not capture)
          const matchingSection = sections.find(s => {
            const cleanTitle = s.title?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
            console.log(`     Comparing "${cleanTitle}" with "${variableName}" (section type: ${s.type})`)
            // Only match question sections, not capture sections
            return cleanTitle === variableName && s.type !== 'capture'
          })
          
          if (matchingSection) {
            console.log(`     ✅ Found matching section: "${matchingSection.title}" (${matchingSection.type})`)
            
            // Get the user's response for this section
            const sectionResponse = userInputs[matchingSection.id]
            console.log(`     Section response:`, sectionResponse)
            
            if (typeof sectionResponse === 'object' && sectionResponse !== null) {
              // Extract the actual response value
              const responseEntries = Object.entries(sectionResponse as Record<string, any>)
              console.log(`     Response entries:`, responseEntries)
              
              const responseValue = Object.values(sectionResponse as Record<string, any>).find(
                v => v !== undefined && v !== null && v !== 'metadata'
              )
              
              if (responseValue) {
                console.log(`     Found response value: ${responseValue} (${typeof responseValue})`)
                
                // Convert choice IDs to actual choice text if needed
                if (typeof responseValue === 'string' && responseValue.startsWith('option-')) {
                  console.log(`     🔄 Converting choice ID to text...`)
                  const config = matchingSection.configuration as any
                  if (config?.options && Array.isArray(config.options)) {
                    console.log(`     Available options:`, config.options)
                    const choice = config.options.find((opt: any) => opt.id === responseValue)
                    if (choice?.text) {
                      console.log(`     ✅ Converted "${responseValue}" to "${choice.text}"`)
                      variables[variableName] = choice.text
                    } else {
                      console.log(`     ❌ Choice not found for ID: ${responseValue}`)
                      variables[variableName] = responseValue
                    }
                  } else {
                    console.log(`     ❌ No options configuration found`)
                    variables[variableName] = responseValue
                  }
                } else {
                  console.log(`     ✅ Using direct value: ${responseValue}`)
                  variables[variableName] = responseValue
                }
              } else {
                console.log(`     ❌ No valid response value found`)
              }
            } else if (sectionResponse !== undefined && sectionResponse !== null) {
              console.log(`     ✅ Using direct section response: ${sectionResponse}`)
              variables[variableName] = sectionResponse
            } else {
              console.log(`     ❌ No section response found`)
            }
          } else {
            console.log(`     ❌ No matching section found for variable "${variableName}"`)
          }
        }
      })

      console.log('\n🎯 =========================')
      console.log('🎯 FINAL VARIABLE MAPPING')
      console.log('🎯 =========================')
      console.log('🔍 Final variables for AI:', variables)
      console.log('🔍 Expected variables:', predefinedVariables)
      console.log('🔍 Variables mapped successfully:', Object.keys(variables))
      console.log('🔍 Variables still missing:', predefinedVariables.filter(v => !variables[v]))

      setProcessingStatus('Sending to AI...')

      // Prepare the AI request using the predefined configuration
      const aiRequest = {
        prompt: aiConfig.prompt,
        variables: variables,
        outputVariables: aiConfig.outputVariables.map((v: { id: string; name: string; description: string }) => ({
          id: v.id,
          name: v.name,
          description: v.description
        }))
      }

      console.log('🤖 AI Request being sent:', aiRequest)

      // Call the AI processing API
      const response = await fetch('/api/ai-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiRequest)
      })

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