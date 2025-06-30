'use client'

import { useState } from 'react'
import { createAIProcessingEngine, type AITestRequest, type AITestResponse } from '@/lib/services/ai-processing-engine'

interface OutputVariable {
  id: string
  name: string
  description: string
}

interface UseAILogicTestOptions {
  apiKey?: string
  useMockData?: boolean
}

export function useAILogicTest(options: UseAILogicTestOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAILogic = async (
    prompt: string,
    outputVariables: OutputVariable[],
    testInputs: Record<string, string>,
    knowledgeBaseContext?: string
  ): Promise<{ success: boolean; result: string; outputs?: Record<string, any> }> => {
    setIsLoading(true)
    setError(null)

    try {
      // If no API key provided or mock data requested, use mock response
      if (!options.apiKey || options.useMockData) {
        return await generateMockResponse(outputVariables)
      }

      // Use real OpenAI API
      const engine = createAIProcessingEngine(options.apiKey)
      
      const request: AITestRequest = {
        prompt,
        variables: testInputs,
        outputVariables,
        knowledgeBaseContext
      }

      const response = await engine.processPrompt(request)

      if (response.success && response.outputs) {
        const formattedResult = Object.entries(response.outputs)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n\n')

        return {
          success: true,
          result: formattedResult,
          outputs: response.outputs
        }
      } else {
        throw new Error(response.error || 'Failed to process AI request')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      return {
        success: false,
        result: `Error: ${errorMessage}`
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockResponse = async (outputVariables: OutputVariable[]) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (outputVariables.length === 0) {
      return {
        success: false,
        result: 'Please define at least one output variable to test the AI logic.'
      }
    }

    // Create realistic mock outputs based on variable names and descriptions
    const mockOutputs = outputVariables.reduce((acc, variable) => {
      const name = variable.name.toLowerCase()
      const description = variable.description.toLowerCase()

      if (name.includes('recommendation') || description.includes('recommend')) {
        acc[variable.name] = `Based on your inputs, here's a personalized recommendation tailored to your specific needs and goals.`
      } else if (name.includes('score') || description.includes('score')) {
        acc[variable.name] = Math.floor(Math.random() * 100)
      } else if (name.includes('time') || description.includes('time')) {
        acc[variable.name] = '45 minutes'
      } else if (name.includes('plan') || description.includes('plan')) {
        acc[variable.name] = 'A customized plan based on your responses and objectives'
      } else if (name.includes('advice') || description.includes('advice')) {
        acc[variable.name] = 'Here is some helpful advice based on your situation'
      } else if (name.includes('result') || description.includes('result')) {
        acc[variable.name] = 'Your personalized result based on the analysis'
      } else {
        acc[variable.name] = `Sample output for ${variable.description || variable.name}`
      }
      return acc
    }, {} as Record<string, any>)

    const formattedResult = Object.entries(mockOutputs)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n')

    return {
      success: true,
      result: formattedResult,
      outputs: mockOutputs
    }
  }

  return {
    testAILogic,
    isLoading,
    error,
    clearError: () => setError(null)
  }
} 