'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Info,
  Copy,
  RefreshCw
} from 'lucide-react'
import type { OutputDefinition } from '@/lib/types/logic-section'
import type { VariableStore } from '@/lib/stores/variable-store'
import type { 
  AIProcessingEngine, 
  PromptTestRequest, 
  PromptTestResponse 
} from '@/lib/services/ai-processing-engine'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PromptTesterProps {
  prompt: string
  outputDefinitions: OutputDefinition[]
  variableStore: VariableStore
  aiEngine: AIProcessingEngine
  className?: string
  onTestComplete?: (response: PromptTestResponse) => void
  onPromptChange?: (prompt: string) => void
  disabled?: boolean
  showVariablePreview?: boolean
}

interface TestResult {
  response: PromptTestResponse
  timestamp: string
  processedPrompt: string
}

interface VariablePreviewProps {
  variables: Record<string, any>
  isVisible: boolean
  onToggle: () => void
}

// =============================================================================
// VARIABLE PREVIEW COMPONENT
// =============================================================================

function VariablePreview({ variables, isVisible, onToggle }: VariablePreviewProps) {
  const variableCount = Object.keys(variables).length

  if (variableCount === 0) {
    return (
      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-4 w-4 mr-2 text-blue-600" />
        <span className="text-sm text-blue-800">
          No variables available. Add questions or logic sections to create variables.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Variable Values</Label>
          <Badge variant="outline" className="text-xs">
            {variableCount} variables
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 px-2"
        >
          {isVisible ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show
            </>
          )}
        </Button>
      </div>

      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
          {Object.entries(variables).map(([name, value]) => (
            <div key={name} className="space-y-1">
              <Label className="text-xs font-mono text-gray-600">@{name}</Label>
              <div className="text-xs bg-white p-2 rounded border font-mono">
                {value !== null && value !== undefined 
                  ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))
                  : <span className="text-gray-400 italic">No value</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TEST RESULT COMPONENT
// =============================================================================

function TestResultDisplay({ result }: { result: TestResult }) {
  const [showRawResponse, setShowRawResponse] = useState(false)
  const { response } = result

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {response.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">
            {response.success ? 'Test Successful' : 'Test Failed'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{response.processingTime}ms</span>
          </div>
          {response.tokensUsed && (
            <div className="flex items-center space-x-1">
              <span>{response.tokensUsed} tokens</span>
            </div>
          )}
          {response.cost && (
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>${response.cost.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {!response.success && response.error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          <span className="text-sm text-red-800">{response.error}</span>
        </div>
      )}

      {/* Outputs Display */}
      {response.success && response.outputs && Object.keys(response.outputs).length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Extracted Outputs</Label>
          <div className="space-y-2">
            {Object.entries(response.outputs).map(([name, value]) => (
              <div key={name} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-mono text-green-800">@{name}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(String(value))}
                    className="h-6 px-2 text-green-700 hover:text-green-900"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm font-mono bg-white p-2 rounded border">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Response */}
      {response.success && response.response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AI Response</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="h-8 px-2"
            >
              {showRawResponse ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </Button>
          </div>

          {showRawResponse && (
            <div className="p-3 bg-gray-50 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Raw Response</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(response.response?.rawResponse || '')}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                {response.response.rawResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PromptTester({
  prompt,
  outputDefinitions,
  variableStore,
  aiEngine,
  className,
  onTestComplete,
  onPromptChange,
  disabled = false,
  showVariablePreview = true
}: PromptTesterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showVariables, setShowVariables] = useState(false)
  const [localPrompt, setLocalPrompt] = useState(prompt)

  // Get available variables from store
  const variables = useMemo(() => {
    return variableStore.getAllPreviewValues()
  }, [variableStore])

  // Generate processed prompt preview
  const processedPrompt = useMemo(() => {
    let processed = localPrompt
    Object.entries(variables).forEach(([name, value]) => {
      const regex = new RegExp(`@${name}\\b`, 'g')
      const stringValue = value !== null && value !== undefined 
        ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
        : '[not provided]'
      processed = processed.replace(regex, stringValue)
    })
    return processed
  }, [localPrompt, variables])

  // Handle prompt testing
  const handleTest = useCallback(async () => {
    if (!localPrompt.trim() || isLoading) return

    setIsLoading(true)
    
    try {
      const request: PromptTestRequest = {
        prompt: localPrompt,
        variables,
        outputDefinitions
      }

      const response = await aiEngine.processPrompt(request)
      
      const result: TestResult = {
        response,
        timestamp: new Date().toISOString(),
        processedPrompt
      }

      setTestResult(result)
      onTestComplete?.(response)
    } catch (error) {
      const errorResponse: PromptTestResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: 0
      }
      
      const result: TestResult = {
        response: errorResponse,
        timestamp: new Date().toISOString(),
        processedPrompt
      }

      setTestResult(result)
      onTestComplete?.(errorResponse)
    } finally {
      setIsLoading(false)
    }
  }, [localPrompt, variables, outputDefinitions, aiEngine, processedPrompt, onTestComplete, isLoading])

  // Handle prompt change
  const handlePromptChange = useCallback((value: string) => {
    setLocalPrompt(value)
    onPromptChange?.(value)
  }, [onPromptChange])

  // Clear test results
  const handleClear = useCallback(() => {
    setTestResult(null)
  }, [])

  const hasVariables = Object.keys(variables).length > 0
  const canTest = localPrompt.trim().length > 0 && !isLoading && !disabled

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Prompt Tester</CardTitle>
        <p className="text-sm text-gray-600">
          Test your AI prompt with real variable values and validate outputs
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Prompt Input */}
        <div className="space-y-3">
          <Label htmlFor="prompt-input" className="text-sm font-medium">
            Prompt Template
          </Label>
          <Textarea
            id="prompt-input"
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Enter your prompt template with @variable mentions..."
            className="min-h-[120px] font-mono text-sm"
            disabled={disabled}
          />
          <div className="text-xs text-gray-500">
            Use @variableName to reference variables from previous sections
          </div>
        </div>

        {/* Variable Preview */}
        {showVariablePreview && (
          <VariablePreview
            variables={variables}
            isVisible={showVariables}
            onToggle={() => setShowVariables(!showVariables)}
          />
        )}

        {/* Processed Prompt Preview */}
        {hasVariables && localPrompt.includes('@') && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Processed Prompt Preview</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {processedPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Output Definitions Summary */}
        {outputDefinitions.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Expected Outputs</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {outputDefinitions.map((def) => (
                <div key={def.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                  <Badge variant="outline" className="text-xs">
                    {def.dataType}
                  </Badge>
                  <span className="text-sm font-mono">@{def.name}</span>
                  {def.required && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                      required
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 my-6"></div>

        {/* Test Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTest}
              disabled={!canTest}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test Prompt
                </>
              )}
            </Button>

            {testResult && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {!hasVariables && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex-1 ml-4">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                No variables available for testing. Add questions or logic sections first.
              </span>
            </div>
          )}
        </div>

        {/* Test Results */}
        {testResult && (
          <>
            <div className="border-t border-gray-200 my-6"></div>
            <TestResultDisplay result={testResult} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PromptTester 