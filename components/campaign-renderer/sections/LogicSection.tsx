'use client'

import React, { useEffect, useState, useRef, memo } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { storeAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'
import { buildVariablesFromInputs } from '@/lib/utils/section-variables'

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
        console.log(`  Input for ${sectionId}:`, response)
      })
      
      // Super simple: build variables from section titles and user responses
      const variables = buildVariablesFromInputs(sections, userInputs)
      
      console.log('✅ Simple variable mapping:', variables)
      console.log('✅ Variables found:', Object.keys(variables))

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