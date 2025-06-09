'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { storeAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'

export function LogicSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onSectionComplete,
  userInputs = {}
}: SectionRendererProps) {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState('Analyzing your responses...')

  useEffect(() => {
    // Clear any existing test data from campaign builder before processing real data
    clearAITestResults()
    processAILogic()
  }, [])

  const processAILogic = async () => {
    try {
      console.log('🧠 AI Logic Section - Processing for section:', section.id)
      
      // Cast config to access AI-specific properties
      const aiConfig = config as any
      
      // Check if this is an AI logic section with proper configuration
      if (!aiConfig.prompt || !aiConfig.outputVariables) {
        console.log('⚠️ No AI configuration found, using fallback processing')
        setProcessingStatus('Processing...')
        setTimeout(() => {
          onSectionComplete(index, {
            [section.id]: 'processed',
            logic_processed: true
          })
        }, 1500)
        return
      }

      console.log('🤖 AI Config detected - Prompt length:', aiConfig.prompt?.length, 'Output vars:', aiConfig.outputVariables?.length)
      
      setProcessingStatus('Preparing AI processing...')
      
      // Prepare variables from user inputs
      const variables: Record<string, any> = {}
      
      // Extract all user responses 
      Object.entries(userInputs).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle nested objects (section responses)
          Object.entries(value as Record<string, any>).forEach(([subKey, subValue]) => {
            if (subKey !== 'metadata' && subValue !== undefined && subValue !== null) {
              variables[subKey] = subValue
              // Also try to extract the section ID as a variable name
              variables[key] = subValue
            }
          })
        } else if (value !== undefined && value !== null) {
          variables[key] = value
        }
      })

      console.log('🔄 Variables prepared for AI:', variables)
      
      setProcessingStatus('Sending to AI...')

      // Prepare the AI request
      const aiRequest = {
        prompt: aiConfig.prompt,
        variables: variables,
        outputVariables: aiConfig.outputVariables.map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.description
        }))
      }

      console.log('📤 AI Request:', aiRequest)

      // Call the AI processing API
      const response = await fetch('/api/ai-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequest)
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📥 AI Response:', result)

      if (result.success && result.outputs) {
        setProcessingStatus('AI processing complete!')
        console.log('✅ AI outputs generated:', result.outputs)
        
        // Filter outputs to only include the configured variables
        const requestedOutputs: Record<string, any> = {}
        aiConfig.outputVariables.forEach((outputVar: any) => {
          if (result.outputs[outputVar.name] !== undefined) {
            requestedOutputs[outputVar.name] = result.outputs[outputVar.name]
          }
        })
        
        console.log('🎯 Filtered outputs (only requested variables):', requestedOutputs)
        console.log('🗑️ Excluded extra AI outputs:', Object.keys(result.outputs).filter(key => !requestedOutputs.hasOwnProperty(key)))
        
        // Store only the requested AI results for output sections to use
        storeAITestResults(requestedOutputs)
        
        // Complete the section with AI outputs
        setTimeout(() => {
          onSectionComplete(index, {
            [section.id]: 'processed',
            logic_processed: true,
            ai_outputs: result.outputs,
            ...result.outputs // Also include outputs directly
          })
          setIsProcessing(false)
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
        onSectionComplete(index, {
          [section.id]: 'processed',
          logic_processed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        setIsProcessing(false)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            {error ? (
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            ) : (
              <Zap className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
            )}
            
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {error ? 'Processing Error' : title || 'Processing...'}
            </h1>
            
            {description && !error && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {description}
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm max-w-md mx-auto">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center space-x-2">
            {isProcessing && !error && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
            <span className={cn(
              "text-sm",
              error ? "text-red-500" : "text-muted-foreground"
            )}>
              {processingStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 