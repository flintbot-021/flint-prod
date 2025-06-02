'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Plus, X, Brain, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutputVariable {
  id: string
  name: string
  description: string
}

interface TestInput {
  variableName: string
  value: string
}

interface AILogicSectionProps {
  settings: {
    prompt: string
    systemInstructions: string
    outputVariables: OutputVariable[]
    model: string
    temperature: number
    maxTokens: number
    testInputs: Record<string, string>
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  availableVariables?: string[]
  className?: string
}

export function AILogicSection({
  settings,
  isPreview = false,
  isEditing = false,
  onChange,
  availableVariables = [],
  className
}: AILogicSectionProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isTestRunning, setIsTestRunning] = useState(false)

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])

  const addOutputVariable = () => {
    const newVariable: OutputVariable = {
      id: Date.now().toString(),
      name: '',
      description: ''
    }
    handleSettingChange('outputVariables', [...settings.outputVariables, newVariable])
  }

  const updateOutputVariable = (id: string, field: string, value: string) => {
    const updatedVariables = settings.outputVariables.map(variable =>
      variable.id === id ? { ...variable, [field]: value } : variable
    )
    handleSettingChange('outputVariables', updatedVariables)
  }

  const removeOutputVariable = (id: string) => {
    const filteredVariables = settings.outputVariables.filter(variable => variable.id !== id)
    handleSettingChange('outputVariables', filteredVariables)
  }

  const insertVariable = (variable: string, targetField: 'prompt' | 'systemInstructions') => {
    const currentValue = settings[targetField]
    const newValue = currentValue + `@${variable}`
    handleSettingChange(targetField, newValue)
  }

  const updateTestInput = (variableName: string, value: string) => {
    const newTestInputs = { ...settings.testInputs, [variableName]: value }
    handleSettingChange('testInputs', newTestInputs)
  }

  const runTest = async () => {
    setIsTestRunning(true)
    try {
      // In a real implementation, this would call the OpenAI API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResponse = settings.outputVariables.map(variable => 
        `${variable.name}: Sample generated value for ${variable.description}`
      ).join('\n')
      
      setTestResult(mockResponse)
    } catch (error) {
      setTestResult('Error: Failed to generate response')
    } finally {
      setIsTestRunning(false)
    }
  }

  if (isPreview) {
    // AI Logic section is never shown to end users
    return null
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Brain className="h-6 w-6 text-orange-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Logic Configuration</h3>
          <p className="text-sm text-gray-600">This section is hidden from end users and processes their inputs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Prompt Builder */}
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              System Instructions (Optional)
            </Label>
            <Textarea
              value={settings.systemInstructions}
              onChange={(e) => handleSettingChange('systemInstructions', e.target.value)}
              placeholder="You are an expert in..."
              className="min-h-[100px]"
              rows={4}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-700">
                Main Prompt
              </Label>
              <Badge variant="secondary" className="text-xs">
                Use @variableName to insert variables
              </Badge>
            </div>
            <Textarea
              value={settings.prompt}
              onChange={(e) => handleSettingChange('prompt', e.target.value)}
              placeholder="You are an expert... Based on @name who trains @frequency times per week..."
              className="min-h-[150px]"
              rows={6}
            />
          </div>

          {/* Available Variables */}
          {availableVariables.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Available Variables
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => insertVariable(variable, 'prompt')}
                  >
                    @{variable}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click a variable to insert it into your prompt
              </p>
            </div>
          )}

          {/* Model Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Model Settings</h4>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Model
              </Label>
              <Select
                value={settings.model}
                onValueChange={(value) => handleSettingChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Temperature: {settings.temperature}
              </Label>
              <Slider
                value={[settings.temperature]}
                onValueChange={(value) => handleSettingChange('temperature', value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Max Tokens
              </Label>
              <Input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                min={1}
                max={4000}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Output Variables */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium text-gray-700">
                Output Variables
              </Label>
              <Button onClick={addOutputVariable} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>
            </div>

            <div className="space-y-3">
              {settings.outputVariables.map((variable) => (
                <Card key={variable.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={variable.name}
                        onChange={(e) => updateOutputVariable(variable.id, 'name', e.target.value)}
                        placeholder="Variable name (e.g., time, speed)"
                        className="flex-1 mr-2"
                      />
                      <Button
                        onClick={() => removeOutputVariable(variable.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={variable.description}
                      onChange={(e) => updateOutputVariable(variable.id, 'description', e.target.value)}
                      placeholder="Description (e.g., Estimated race time)"
                    />
                  </div>
                </Card>
              ))}

              {settings.outputVariables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No output variables defined</p>
                  <p className="text-sm">Add variables that the AI should return</p>
                </div>
              )}
            </div>
          </div>

          {/* Test Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Test AI Logic</h4>
            
            {/* Test Inputs */}
            {availableVariables.length > 0 && (
              <div className="space-y-3 mb-4">
                <Label className="text-sm font-medium text-gray-700">
                  Test Input Values
                </Label>
                {availableVariables.map((variable) => (
                  <div key={variable} className="flex items-center space-x-2">
                    <Label className="text-sm text-gray-600 w-20">@{variable}:</Label>
                    <Input
                      value={settings.testInputs[variable] || ''}
                      onChange={(e) => updateTestInput(variable, e.target.value)}
                      placeholder={`Test value for ${variable}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={runTest}
              disabled={isTestRunning || !settings.prompt}
              className="w-full mb-4"
            >
              {isTestRunning ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Test AI Logic
                </>
              )}
            </Button>

            {/* Test Result */}
            {testResult && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Test Result
                </Label>
                <Textarea
                  value={testResult}
                  readOnly
                  className="min-h-[100px] bg-gray-50"
                  rows={4}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h4 className="font-medium text-blue-900">How AI Logic Works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use @variableName to reference user inputs from previous sections</li>
            <li>• Define output variables that the AI should generate</li>
            <li>• Test your logic with sample inputs before publishing</li>
            <li>• Output variables can be used in later sections with @variableName</li>
          </ul>
        </div>
      </Card>
    </div>
  )
} 