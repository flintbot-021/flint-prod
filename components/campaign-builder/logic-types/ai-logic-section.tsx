'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Brain, Play, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignSection } from '@/lib/types/campaign-builder'

interface OutputVariable {
  id: string
  name: string
  description: string
}

interface AILogicSectionProps {
  settings: {
    prompt: string
    outputVariables: OutputVariable[]
    testInputs: Record<string, string>
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  availableVariables?: string[]
  className?: string
  allSections?: CampaignSection[]
  section?: CampaignSection
}

// Extract input variables from question sections that come before this AI logic section
function extractInputVariables(sections: CampaignSection[], currentOrder: number): string[] {
  const precedingSections = sections.filter(s => s.order < currentOrder)
  const variables: string[] = []
  
  precedingSections.forEach(section => {
    // Extract from question sections
    if (section.type.includes('question-') || section.type.includes('capture')) {
      const settings = section.settings as any
      const variableName = settings?.variableName || 
                          (typeof section.title === 'string' ? section.title.toLowerCase().replace(/\s+/g, '_') : '') || 
                          `question_${section.order}`
      
      if (variableName && !variables.includes(variableName)) {
        variables.push(variableName)
      }
    }
  })
  
  return variables
}

export function AILogicSection({
  settings,
  isPreview = false,
  isEditing = false,
  onChange,
  availableVariables = [],
  className,
  allSections = [],
  section
}: AILogicSectionProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isTestRunning, setIsTestRunning] = useState(false)
  
  // Extract actual variables from campaign sections
  const extractedVariables = useMemo(() => {
    if (allSections.length > 0 && section?.order !== undefined) {
      return extractInputVariables(allSections, section.order)
    }
    return availableVariables
  }, [allSections, section?.order, availableVariables])
  
  // Use extracted variables or fallback to provided ones
  const currentAvailableVariables = extractedVariables.length > 0 ? extractedVariables : availableVariables
  
  // Collapsible state
  const [expandedSections, setExpandedSections] = useState({
    step1: true,  // Start with first section open
    step2: false,
    step3: false,
    step4: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])

  // Step completion logic
  const step1Complete = useMemo(() => {
    return currentAvailableVariables.length > 0 && currentAvailableVariables.every(variable => 
      settings.testInputs[variable] && settings.testInputs[variable].trim() !== ''
    )
  }, [currentAvailableVariables, settings.testInputs])

  const step2Complete = useMemo(() => {
    return settings.prompt && settings.prompt.trim() !== ''
  }, [settings.prompt])

  const step3Complete = useMemo(() => {
    return settings.outputVariables.length > 0 && 
           settings.outputVariables.every(v => v.name.trim() !== '' && v.description.trim() !== '')
  }, [settings.outputVariables])

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

  const insertVariable = (variable: string) => {
    const currentValue = settings.prompt || ''
    const newValue = currentValue + `@${variable}`
    handleSettingChange('prompt', newValue)
  }

  const updateTestInput = (variableName: string, value: string) => {
    const newTestInputs = { ...settings.testInputs, [variableName]: value }
    handleSettingChange('testInputs', newTestInputs)
  }

  // Generate live preview of prompt with variables substituted
  const previewPrompt = useMemo(() => {
    let preview = settings.prompt || ''
    Object.entries(settings.testInputs).forEach(([variable, value]) => {
      if (value.trim()) {
        const regex = new RegExp(`@${variable}\\b`, 'g')
        preview = preview.replace(regex, `**${value}**`)
      }
    })
    return preview
  }, [settings.prompt, settings.testInputs])

  const runTest = async () => {
    setIsTestRunning(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (settings.outputVariables.length === 0) {
        setTestResult('Please define at least one output variable to test the AI logic.')
        return
      }
      
      const mockOutputs = settings.outputVariables.reduce((acc, variable) => {
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
      
      const formattedResponse = Object.entries(mockOutputs)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n\n')
      
      setTestResult(formattedResponse)
    } catch (error) {
      setTestResult('Error: Failed to generate response. Please check your prompt and try again.')
    } finally {
      setIsTestRunning(false)
    }
  }

  if (isPreview) {
    return null
  }

  return (
    <div className={cn('py-16 px-6 max-w-4xl mx-auto space-y-12 text-white', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Brain className="h-8 w-8 text-orange-600" />
          <h2 className="text-3xl font-bold text-white">AI Logic Setup</h2>
        </div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Set up AI to process user responses and create personalized outputs. Follow these simple steps.
        </p>
      </div>

      <div className="relative">
        {/* Step 1: Example Inputs */}
        <div className="relative">
          <Card className="bg-gray-800 border-gray-700 p-8">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('step1')}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  step1Complete ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                )}>
                  {step1Complete ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Add Example Answers</h3>
                  <p className="text-gray-300">Provide sample answers to help design your AI prompt</p>
                </div>
              </div>
              {expandedSections.step1 ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.step1 && (
              <div className="mt-6">
                {currentAvailableVariables.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-900 rounded-lg">
                    <p className="font-medium">No input variables available</p>
                    <p className="text-sm">Add question sections first to create variables for AI processing</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300 mb-4">
                      Enter example answers for each question. These help you design your AI prompt.
                    </p>
                    {currentAvailableVariables.map((variable) => (
                      <div key={variable} className="flex items-center space-x-4">
                        <Label className="text-sm font-medium text-gray-300 w-32 flex-shrink-0">
                          @{variable}:
                        </Label>
                        <Input
                          value={settings.testInputs[variable] || ''}
                          onChange={(e) => updateTestInput(variable, e.target.value)}
                          placeholder={`Example answer for ${variable}`}
                          className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Dotted connector line */}
          <div className="flex justify-center py-4">
            <div className="w-px h-8 border-l-2 border-dotted border-gray-600"></div>
          </div>
        </div>

        {/* Step 2: Define Prompt */}
        <div className="relative">
          <Card className={cn('bg-gray-800 border-gray-700 p-8', !step1Complete && 'opacity-50 pointer-events-none')}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('step2')}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  !step1Complete ? 'bg-gray-400 text-white' :
                  step2Complete ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                )}>
                  {!step1Complete ? <Lock className="w-4 h-4" /> :
                   step2Complete ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Write Your AI Prompt</h3>
                  <p className="text-gray-300">Tell the AI what to do with the user's answers</p>
                </div>
              </div>
              {expandedSections.step2 ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.step2 && (
              <div className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Prompt Editor */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-2 block">
                        AI Prompt
                      </Label>
                      <Textarea
                        value={settings.prompt || ''}
                        onChange={(e) => handleSettingChange('prompt', e.target.value)}
                        placeholder="You are an expert fitness coach. Based on @name who trains @frequency times per week and wants to run a @distance race, provide personalized training advice..."
                        className="min-h-[200px] text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        rows={8}
                      />
                    </div>

                    {/* Available Variables */}
                    {currentAvailableVariables.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-300 mb-2 block">
                          Click to Insert Variables
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {currentAvailableVariables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-900 hover:border-blue-500 transition-colors border-gray-600 text-gray-300"
                              onClick={() => insertVariable(variable)}
                            >
                              @{variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Live Preview */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-300 mb-2 block">
                      Live Preview
                    </Label>
                    <div className="bg-gray-900 p-4 rounded-lg min-h-[200px] text-sm">
                      {previewPrompt ? (
                        <div 
                          className="whitespace-pre-wrap text-gray-300"
                          dangerouslySetInnerHTML={{
                            __html: previewPrompt
                              .replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-600 px-1 rounded font-medium text-yellow-100">$1</span>')
                          }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">Your prompt will appear here with example values highlighted...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Dotted connector line */}
          <div className="flex justify-center py-4">
            <div className="w-px h-8 border-l-2 border-dotted border-gray-600"></div>
          </div>
        </div>

        {/* Step 3: Define Outputs */}
        <div className="relative">
          <Card className={cn('bg-gray-800 border-gray-700 p-8', (!step1Complete || !step2Complete) && 'opacity-50 pointer-events-none')}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('step3')}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  (!step1Complete || !step2Complete) ? 'bg-gray-400 text-white' :
                  step3Complete ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                )}>
                  {(!step1Complete || !step2Complete) ? <Lock className="w-4 h-4" /> :
                   step3Complete ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Define AI Outputs</h3>
                  <p className="text-gray-300">Specify what the AI should return</p>
                </div>
              </div>
              {expandedSections.step3 ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.step3 && (
              <div className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">
                      Define variables that the AI will generate, like @recommendation or @score
                    </p>
                    <Button onClick={addOutputVariable} size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Output
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {settings.outputVariables.map((variable) => (
                      <Card key={variable.id} className="p-4 bg-gray-900 border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-400 mb-1 block">Variable Name</Label>
                            <Input
                              value={variable.name}
                              onChange={(e) => updateOutputVariable(variable.id, 'name', e.target.value)}
                              placeholder="recommendation"
                              className="text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <Label className="text-xs text-gray-400 mb-1 block">Description</Label>
                              <Input
                                value={variable.description}
                                onChange={(e) => updateOutputVariable(variable.id, 'description', e.target.value)}
                                placeholder="Personalized training recommendation"
                                className="text-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              />
                            </div>
                            <Button
                              onClick={() => removeOutputVariable(variable.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {settings.outputVariables.length === 0 && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No output variables defined</p>
                        <p className="text-sm">Add variables that the AI should generate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Dotted connector line */}
          <div className="flex justify-center py-4">
            <div className="w-px h-8 border-l-2 border-dotted border-gray-600"></div>
          </div>
        </div>

        {/* Step 4: Test */}
        <div className="relative">
          <Card className={cn('bg-gray-800 border-gray-700 p-8', (!step1Complete || !step2Complete || !step3Complete) && 'opacity-50 pointer-events-none')}>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('step4')}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  (!step1Complete || !step2Complete || !step3Complete) ? 'bg-gray-400 text-white' : 'bg-orange-600 text-white'
                )}>
                  {(!step1Complete || !step2Complete || !step3Complete) ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Test Your AI Logic</h3>
                  <p className="text-gray-300">See how your AI will respond to the example inputs</p>
                </div>
              </div>
              {expandedSections.step4 ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.step4 && (
              <div className="mt-6">
                <div className="space-y-6">
                  <Button
                    onClick={runTest}
                    disabled={isTestRunning || !step1Complete || !step2Complete || !step3Complete}
                    className="w-full h-12 text-base bg-orange-600 hover:bg-orange-700 text-white"
                    size="lg"
                  >
                    {isTestRunning ? (
                      <>
                        <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                        Testing AI Logic...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Test AI Logic
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <div>
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">
                        AI Response
                      </Label>
                      <Textarea
                        value={testResult}
                        readOnly
                        className="min-h-[120px] bg-gray-900 border-gray-600 text-gray-300 font-mono"
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Help Text */}
      <Card className="p-6 bg-blue-900 border-blue-700">
        <h4 className="font-medium text-blue-100 mb-3">How This Works</h4>
        <ul className="text-sm text-blue-200 space-y-2">
          <li>• <strong>Step 1:</strong> Add example answers to see how your AI will work</li>
          <li>• <strong>Step 2:</strong> Write a prompt using @variables to reference user inputs</li>
          <li>• <strong>Step 3:</strong> Define what outputs the AI should generate</li>
          <li>• <strong>Step 4:</strong> Test to see the AI response with your examples</li>
          <li>• <strong>Final:</strong> Use output variables like @recommendation in your results section</li>
        </ul>
      </Card>
    </div>
  )
} 