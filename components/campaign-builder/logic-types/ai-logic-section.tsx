'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Brain, Play, Check, Lock, ChevronDown, ChevronUp, Sparkles, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { PromptGenerationRequest, PromptGenerationResponse } from '@/lib/services/prompt-generation'
import { storeAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractInputVariablesWithTypes, isFileVariable } from '@/lib/utils/section-variables'

interface OutputVariable {
  id: string
  name: string
  description: string
}

interface AILogicSectionProps {
  settings: {
    prompt: string
    outputVariables: OutputVariable[]
    testInputs?: Record<string, any>
    testFiles?: Record<string, File>
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
// Enhanced to handle both text and file variables
function extractInputVariables(sections: CampaignSection[], currentOrder: number): string[] {
  return sections
    .filter(s => s.order < currentOrder && isQuestionSection(s.type) && s.title)
    .map(s => titleToVariableName(s.title))
}

// Extract input variables with type information for AI processing
function extractInputVariablesWithTypesFromBuilder(sections: CampaignSection[], currentOrder: number): Array<{
  name: string
  title: string
  type: 'text' | 'file'
  section: CampaignSection
}> {
  return sections
    .filter(s => s.order < currentOrder && isQuestionSection(s.type) && s.title)
    .map(section => ({
      name: titleToVariableName(section.title),
      title: section.title,
      type: isFileVariableFromBuilder(section) ? 'file' : 'text',
      section
    }))
}

// Check if a campaign builder section is a file variable
function isFileVariableFromBuilder(section: CampaignSection): boolean {
  if (section.type === 'question-upload') {
    return true
  }
  // For text questions, check settings for upload configuration
  if (section.type === 'question-text') {
    const settings = section.settings as any
    return !!(
      settings.maxFiles ||
      settings.allowImages ||
      settings.allowDocuments ||
      settings.allowVideo ||
      settings.allowAudio ||
      settings.maxFileSize
    )
  }
  return false
}

export function AILogicSection({
  settings,
  isPreview = false,
  onChange,
  availableVariables = [],
  className,
  allSections = [],
  section
}: AILogicSectionProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false)
  
  // Extract actual variables from campaign sections with type information
  const extractedVariablesWithTypes = useMemo(() => {
    if (allSections.length > 0 && section?.order !== undefined) {
      return extractInputVariablesWithTypesFromBuilder(allSections, section.order)
    }
    return []
  }, [allSections, section?.order])
  
  // Extract just the variable names for backward compatibility
  const extractedVariables = useMemo(() => {
    return extractedVariablesWithTypes.map(v => v.name)
  }, [extractedVariablesWithTypes])
  
  // Use extracted variables or fallback to provided ones
  const currentAvailableVariables = extractedVariables.length > 0 ? extractedVariables : availableVariables
  
  // Separate text and file variables
  const textVariables = useMemo(() => {
    return extractedVariablesWithTypes.filter(v => v.type === 'text')
  }, [extractedVariablesWithTypes])
  
  const fileVariables = useMemo(() => {
    return extractedVariablesWithTypes.filter(v => v.type === 'file')
  }, [extractedVariablesWithTypes])

  // Collapsible state
  const [expandedSections, setExpandedSections] = useState({
    step1: true,  // Start with first section open
    step2: false,
    step3: false,
    step4: false
  })

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])



  // Generate prompt manually (triggered by "Suggest my prompt" button)
  const generatePrompt = useCallback(async () => {
    if (!allSections.length || !section?.order) {
      console.error('Cannot generate prompt: missing sections or section order')
      return
    }

    setIsGeneratingPrompt(true)

    try {
      const request: PromptGenerationRequest = {
        sections: allSections,
        currentSectionOrder: section.order,
        existingPrompt: settings.prompt,
        outputVariables: settings.outputVariables.map(v => ({
          name: v.name,
          description: v.description
        }))
      }

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: PromptGenerationResponse = await response.json()

      if (result.success) {
        handleSettingChange('prompt', result.suggestedPrompt)
        console.log('✅ Prompt generated successfully')
      }

    } catch (error) {
      console.error('Error generating prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }, [allSections, section?.order, settings.prompt, settings.outputVariables, handleSettingChange])

  // Generate outputs manually (triggered by "Suggest my outputs" button)
  const generateOutputs = useCallback(async () => {
    if (!allSections.length || !section?.order || !settings.prompt?.trim()) {
      console.error('Cannot generate outputs: missing sections, section order, or prompt')
      return
    }

    setIsGeneratingOutputs(true)

    try {
      const request: PromptGenerationRequest = {
        sections: allSections,
        currentSectionOrder: section.order,
        existingPrompt: settings.prompt, // Use current prompt for context
        outputVariables: settings.outputVariables.map(v => ({
          name: v.name,
          description: v.description
        }))
      }

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: PromptGenerationResponse = await response.json()

      if (result.success && result.suggestedOutputVariables?.length > 0) {
        // Take max 2 outputs and add an empty one for user input
        const maxOutputs = result.suggestedOutputVariables.slice(0, 2)
        const newOutputVariables = [
          ...maxOutputs.map((suggested, index) => ({
            id: (Date.now() + index).toString(),
            name: suggested.name,
            description: suggested.description
          })),
          // Add empty one for user input
          {
            id: (Date.now() + 999).toString(),
            name: '',
            description: ''
          }
        ]
        
        handleSettingChange('outputVariables', newOutputVariables)
        console.log('✅ Output variables generated successfully')
        
        // Focus the last (empty) input after a brief delay
        setTimeout(() => {
          const lastInput = document.querySelector('[data-output-variable-name]:last-of-type input')
          if (lastInput instanceof HTMLInputElement) {
            lastInput.focus()
          }
        }, 100)
      }

    } catch (error) {
      console.error('Error generating outputs:', error)
    } finally {
      setIsGeneratingOutputs(false)
    }
  }, [allSections, section?.order, settings.prompt, settings.outputVariables, handleSettingChange])

  // Step completion logic
  const step1Complete = useMemo(() => {
    // Check if we have variables and all required inputs are provided
    if (extractedVariablesWithTypes.length === 0) return false
    
    // For text variables, require test inputs
    const missingTextInputs = textVariables.filter(variable => 
      !(settings.testInputs || {})[variable.name] || (settings.testInputs || {})[variable.name]?.trim() === ''
    )
    
    // For file variables, require test files
    const missingTestFiles = fileVariables.filter(variable => 
      !(settings.testFiles || {})[variable.name]
    )
    
    return missingTextInputs.length === 0 && missingTestFiles.length === 0
  }, [extractedVariablesWithTypes, textVariables, fileVariables, settings.testInputs, settings.testFiles])

  const step2Complete = useMemo(() => {
    return settings.prompt && settings.prompt.trim() !== ''
  }, [settings.prompt])



  const step3Complete = useMemo(() => {
    return settings.outputVariables.length > 0 && 
           settings.outputVariables.every(v => v.name.trim() !== '' && v.description.trim() !== '')
  }, [settings.outputVariables])

  const addOutputVariable = useCallback(() => {
    const newVariable: OutputVariable = {
      id: Date.now().toString(),
      name: '',
      description: ''
    }
    handleSettingChange('outputVariables', [...settings.outputVariables, newVariable])
  }, [settings.outputVariables, handleSettingChange])

  const updateOutputVariable = useCallback((id: string, field: string, value: string) => {
    const updatedVariables = settings.outputVariables.map(variable =>
      variable.id === id ? { ...variable, [field]: value } : variable
    )
    handleSettingChange('outputVariables', updatedVariables)
  }, [settings.outputVariables, handleSettingChange])

  const removeOutputVariable = useCallback((id: string) => {
    const filteredVariables = settings.outputVariables.filter(variable => variable.id !== id)
    handleSettingChange('outputVariables', filteredVariables)
  }, [settings.outputVariables, handleSettingChange])

  const insertVariable = useCallback((variable: string) => {
    const currentValue = settings.prompt || ''
    const newValue = currentValue + `@${variable}`
    handleSettingChange('prompt', newValue)
  }, [settings.prompt, handleSettingChange])

  const updateTestInput = useCallback((variableName: string, value: string) => {
    const newTestInputs = { ...(settings.testInputs || {}), [variableName]: value }
    handleSettingChange('testInputs', newTestInputs)
  }, [settings.testInputs, handleSettingChange])

  const updateTestFile = useCallback((variableName: string, file: File | null) => {
    const newTestFiles = { ...(settings.testFiles || {}) }
    if (file) {
      newTestFiles[variableName] = file
    } else {
      delete newTestFiles[variableName]
    }
    handleSettingChange('testFiles', newTestFiles)
  }, [settings.testFiles, handleSettingChange])

  // Generate live preview of prompt with variables substituted
  const previewPrompt = useMemo(() => {
    let preview = settings.prompt || ''
    if (settings.testInputs) {
      Object.entries(settings.testInputs).forEach(([variable, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          const regex = new RegExp(`@${variable}\\b`, 'g')
          preview = preview.replace(regex, `**${value}**`)
        }
      })
    }
    return preview
  }, [settings.prompt, settings.testInputs])

  const runTest = async () => {
    setIsTestRunning(true)
    try {
      // Validate required fields
      if (!settings.prompt?.trim()) {
        setTestResult('Please write an AI prompt in Step 2 before testing.')
        return
      }
      
      if (settings.outputVariables.length === 0) {
        setTestResult('Please define at least one output variable in Step 3 before testing.')
        return
      }

      // Check if all text inputs are provided
      const missingTextInputs = textVariables.filter(variable => 
        !(settings.testInputs || {})[variable.name] || (settings.testInputs || {})[variable.name]?.trim() === ''
      )
      
      if (missingTextInputs.length > 0) {
        setTestResult(`Please provide example answers for: ${missingTextInputs.map(v => '@' + v.name).join(', ')}`)
        return
      }

      // Check if all file variables have test files uploaded
      const missingTestFiles = fileVariables.filter(variable => 
        !(settings.testFiles || {})[variable.name]
      )
      
      if (missingTestFiles.length > 0) {
        setTestResult(`Please upload test files for: ${missingTestFiles.map(v => '@' + v.name).join(', ')}`)
        return
      }

      // Prepare the AI test request
      const testVariables = { ...(settings.testInputs || {}) }
      
      // If we have file variables with actual uploaded files, use the file-aware API
      const hasUploadedFiles = fileVariables.length > 0 && fileVariables.every(v => (settings.testFiles || {})[v.name])
      
      if (hasUploadedFiles) {
        // Use the file-aware API endpoint
        const formData = new FormData()
        formData.append('prompt', settings.prompt)
        formData.append('variables', JSON.stringify(testVariables))
        formData.append('outputVariables', JSON.stringify(settings.outputVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description
        }))))
        formData.append('hasFileVariables', 'true')
        formData.append('fileVariableNames', JSON.stringify(fileVariables.map(v => v.name)))
        
        // Add the actual uploaded files
        fileVariables.forEach(variable => {
          const file = (settings.testFiles || {})[variable.name]
          if (file) {
            formData.append(`file_${variable.name}`, file)
          }
        })

        const response = await fetch('/api/ai-processing-with-files', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Format the AI outputs for display
          if (result.outputs && Object.keys(result.outputs).length > 0) {
            const formattedResponse = Object.entries(result.outputs)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n\n')
            
            setTestResult(`✅ AI Test Results (with real file content):\n\n${formattedResponse}`)
            
            // Store both input test data AND AI outputs in localStorage for preview mode
            const allTestData = {
              ...(settings.testInputs || {}),  // User input data from Step 1
              ...result.outputs        // AI-generated outputs from Step 4
            }
            storeAITestResults(allTestData)
          } else {
            setTestResult('⚠️ AI processed successfully but returned no structured outputs.')
          }
        } else {
          setTestResult(`❌ AI Test Failed: ${result.error || 'Unknown error occurred'}`)
        }
        
        return
      }
      
      // For text-only variables, add placeholder content for file variables (if any)
      fileVariables.forEach(variable => {
        testVariables[variable.name] = `[EXAMPLE FILE CONTENT for ${variable.title}]\n\nThis is placeholder content that represents what would be extracted from an uploaded file. In the actual campaign, the real file content will be analyzed by the AI.`
      })
      
      const testRequest = {
        prompt: settings.prompt,
        variables: testVariables,
        outputVariables: settings.outputVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description
        })),
        hasFileVariables: fileVariables.length > 0,
        fileVariableNames: fileVariables.map(v => v.name)
      }

      // Call the AI processing API
      const response = await fetch('/api/ai-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        // Format the AI outputs for display
        if (result.outputs && Object.keys(result.outputs).length > 0) {
          const formattedResponse = Object.entries(result.outputs)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n\n')
          
          setTestResult(`✅ AI Test Results:\n\n${formattedResponse}`)
          
          // Store both input test data AND AI outputs in localStorage for preview mode
          const allTestData = {
            ...(settings.testInputs || {}),  // User input data from Step 1
            ...result.outputs        // AI-generated outputs from Step 4
          }
          storeAITestResults(allTestData)
        } else {
          setTestResult('⚠️ AI processed successfully but returned no structured outputs.')
        }
      } else {
        setTestResult(`❌ AI Test Failed: ${result.error || 'Unknown error occurred'}`)
      }

    } catch (error) {
      console.error('Test error:', error)
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Failed to test AI logic. Please check your settings and try again.'}`)
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
                {extractedVariablesWithTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-900 rounded-lg">
                    <p className="font-medium">No input variables available</p>
                    <p className="text-sm">Add question sections first to create variables for AI processing</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-300 mb-4">
                      Enter example answers for each question. These help you design your AI prompt.
                    </p>
                    
                    {/* Text Variables */}
                    {textVariables.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-200">Text Inputs</h4>
                        {textVariables.map((variable) => (
                          <div key={variable.name} className="flex items-center space-x-4">
                            <Label className="text-sm font-medium text-gray-300 w-32 flex-shrink-0">
                              @{variable.name}:
                            </Label>
                            <Input
                              value={(settings.testInputs || {})[variable.name] || ''}
                              onChange={(e) => updateTestInput(variable.name, e.target.value)}
                              placeholder={`Example answer for ${variable.title}`}
                              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* File Variables */}
                    {fileVariables.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Test File Uploads</span>
                        </h4>
                        <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                          <p className="text-sm text-gray-300 mb-3">
                            Upload test files to see how your AI will process them:
                          </p>
                          {fileVariables.map((variable) => (
                            <div key={variable.name} className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="border-purple-500 text-purple-300">
                                  @{variable.name}
                                </Badge>
                                <span className="text-sm text-gray-400">{variable.title}</span>
                              </div>
                              <div className="ml-4">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    updateTestFile(variable.name, file)
                                  }}
                                  className="block w-full text-sm text-gray-300 
                                           file:mr-4 file:py-2 file:px-4
                                           file:rounded-md file:border-0
                                           file:text-sm file:font-medium
                                           file:bg-purple-600 file:text-white
                                           hover:file:bg-purple-700
                                           file:cursor-pointer"
                                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                />
                                {(settings.testFiles || {})[variable.name] && (
                                  <p className="text-xs text-green-400 mt-1 flex items-center space-x-1">
                                    <Check className="w-3 h-3" />
                                    <span>✓ {(settings.testFiles || {})[variable.name]?.name}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 mt-3">
                            💡 These test files will be analyzed during AI testing to show you exactly how your prompts work with real content.
                          </p>
                        </div>
                      </div>
                    )}
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300 mb-2 block">
                        AI Prompt
                      </Label>
                      {currentAvailableVariables.length > 0 && (
                                              <Button
                        onClick={generatePrompt}
                        disabled={isGeneratingPrompt}
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-300 hover:bg-purple-900 hover:border-purple-400"
                      >
                        {isGeneratingPrompt ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-purple-300 border-t-transparent rounded-full" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Suggest my prompt
                          </>
                        )}
                      </Button>
                      )}
                    </div>

                    <div>
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
                    <div className="flex items-center space-x-2">
                      {currentAvailableVariables.length > 0 && (
                                              <Button
                        onClick={generateOutputs}
                        disabled={isGeneratingOutputs || !settings.prompt?.trim()}
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-300 hover:bg-purple-900 hover:border-purple-400"
                      >
                        {isGeneratingOutputs ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-purple-300 border-t-transparent rounded-full" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Suggest my outputs
                          </>
                        )}
                      </Button>
                      )}
                      <Button onClick={addOutputVariable} size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Output
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {settings.outputVariables.map((variable) => (
                      <Card key={variable.id} className="p-4 bg-gray-900 border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div data-output-variable-name>
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
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-300 mb-3 block">
                        AI Response
                      </Label>
                      
                      {/* Parse test result and display in @variable format */}
                      {(() => {
                        try {
                          const outputs = testResult.split('\n\n').reduce((acc, line) => {
                            const [key, ...valueParts] = line.split(': ')
                            if (key && valueParts.length > 0) {
                              acc[key.trim()] = valueParts.join(': ').trim()
                            }
                            return acc
                          }, {} as Record<string, string>)
                          
                          return (
                            <div className="space-y-4">
                              {Object.entries(outputs).map(([variable, value]) => (
                                <div key={variable} className="flex items-start space-x-4">
                                  <Label className="text-sm font-medium text-gray-300 w-32 flex-shrink-0 pt-2">
                                    @{variable}:
                                  </Label>
                                  <div className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-3 text-white text-sm">
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        } catch (error) {
                          // Fallback to original textarea if parsing fails
                          return (
                            <Textarea
                              value={testResult}
                              readOnly
                              className="min-h-[120px] bg-gray-900 border-gray-600 text-gray-300 font-mono"
                              rows={6}
                            />
                          )
                        }
                      })()}
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
          <li>• <strong>Step 1:</strong> Add example answers and upload test files to see how your AI will work</li>
          <li>• <strong>Step 2:</strong> Write a prompt using @variables to reference user inputs and file content</li>
          <li>• <strong>Step 3:</strong> Define what outputs the AI should generate</li>
          <li>• <strong>Step 4:</strong> Test to see the AI response with your examples and real uploaded files</li>
          <li>• <strong>Final:</strong> Use output variables like @recommendation in your results section</li>
        </ul>
        {fileVariables.length > 0 && (
          <div className="mt-4 p-3 bg-purple-900/50 border border-purple-700 rounded-lg">
            <p className="text-sm text-purple-200 font-medium mb-2">📄 Direct File Processing</p>
            <p className="text-xs text-purple-300">
              Your AI can analyze uploaded files directly! Use @{fileVariables.map(v => v.name).join(', @')} in your prompt to reference file content. Files are sent directly to OpenAI which can read PDFs, documents, and images without any preprocessing required.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
} 