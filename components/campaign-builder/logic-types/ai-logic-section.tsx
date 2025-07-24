'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, X, Brain, Play, Check, Lock, ChevronDown, ChevronUp, Sparkles, Upload, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { PromptGenerationRequest, PromptGenerationResponse } from '@/lib/services/prompt-generation'
import { storeAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractInputVariablesWithTypes, isFileVariable } from '@/lib/utils/section-variables'
import { KnowledgeBaseModal } from '@/components/ui/knowledge-base-modal'
import { KnowledgeBaseSettings } from '@/lib/types/knowledge-base'
import { getKnowledgeBaseEntries, getKnowledgeBaseForAI } from '@/lib/data-access/knowledge-base'

// Custom hook for cycling loading messages
const useCyclingLoadingMessage = (messages: string[], isLoading: boolean, interval: number = 2000) => {
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

// Loading message arrays for different states
const AI_PROCESSING_MESSAGES = [
  "Analyzing your inputs...",
  "Generating personalized results...",
  "Processing your unique profile...",
  "Crafting tailored recommendations...",
  "Evaluating your responses...",
  "Creating custom insights...",
  "Personalizing your experience...",
  "Optimizing your results..."
]

const PROMPT_GENERATION_MESSAGES = [
  "Crafting your AI prompt...",
  "Analyzing your campaign structure...",
  "Optimizing prompt effectiveness...",
  "Tailoring AI instructions..."
]

const OUTPUT_GENERATION_MESSAGES = [
  "Generating output variables...",
  "Creating result structure...",
  "Designing personalization fields...",
  "Optimizing output format..."
]

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
    knowledgeBase?: KnowledgeBaseSettings
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  availableVariables?: string[]
  className?: string
  allSections?: CampaignSection[]
  section?: CampaignSection
  campaignId?: string
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
  const variables: Array<{
    name: string
    title: string
    type: 'text' | 'file'
    section: CampaignSection
  }> = []
  
  sections
    .filter(s => isQuestionSection(s.type) && !s.type.includes('capture') && s.title)
    .forEach(section => {
      if (section.type === 'question-slider-multiple') {
        // Handle multiple sliders - each slider becomes a variable
        // Don't create a variable for the parent section, only for individual sliders
        const settings = section.settings as any
        if (settings.sliders && Array.isArray(settings.sliders)) {
          settings.sliders.forEach((slider: any) => {
            if (slider.variableName && slider.label) {
              variables.push({
                name: slider.variableName,
                title: slider.label,
                type: 'text' as const,
                section
              })
            }
          })
        }
      } else if (section.title) {
        // Handle single-input sections (existing logic)
        variables.push({
      name: titleToVariableName(section.title),
      title: section.title,
      type: isFileVariableFromBuilder(section) ? 'file' : 'text',
      section
        })
      }
    })
    
  return variables
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
  section,
  campaignId
}: AILogicSectionProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false)
  
  // Use cycling loading messages for better UX
  const testLoadingMessage = useCyclingLoadingMessage(AI_PROCESSING_MESSAGES, isTestRunning)
  const promptLoadingMessage = useCyclingLoadingMessage(PROMPT_GENERATION_MESSAGES, isGeneratingPrompt)
  const outputLoadingMessage = useCyclingLoadingMessage(OUTPUT_GENERATION_MESSAGES, isGeneratingOutputs)
  
  // Local state for immediate UI updates (before onBlur persistence)
  const [localTestInputs, setLocalTestInputs] = useState<Record<string, string>>({})
  const [promptValue, setPromptValue] = useState(settings.prompt || '')
  const [localOutputVariables, setLocalOutputVariables] = useState<OutputVariable[]>(settings.outputVariables || [])
  
  // Validation state for output variables
  const [touchedOutputs, setTouchedOutputs] = useState<Record<string, { name: boolean; description: boolean }>>({})
  const [outputErrors, setOutputErrors] = useState<Record<string, { name?: string; description?: string }>>({})
  
  // Knowledge base state
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(settings.knowledgeBase?.enabled || false)
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false)
  
  // Update local state when settings change externally
  useEffect(() => {
    setPromptValue(settings.prompt || '')
  }, [settings.prompt])
  

  
  useEffect(() => {
    setLocalOutputVariables(settings.outputVariables || [])
  }, [settings.outputVariables])
  
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
  const currentAvailableVariables = useMemo(() => {
    return extractedVariables.length > 0 ? extractedVariables : availableVariables
  }, [extractedVariables, availableVariables])
  
  // Separate text and file variables
  const textVariables = useMemo(() => {
    return extractedVariablesWithTypes.filter(v => v.type === 'text')
  }, [extractedVariablesWithTypes])
  
  const fileVariables = useMemo(() => {
    return extractedVariablesWithTypes.filter(v => v.type === 'file')
  }, [extractedVariablesWithTypes])

  // Compute the longest variable name for label alignment
  const maxLabelLength = useMemo(() => {
    if (textVariables.length === 0) return 0;
    return Math.max(...textVariables.map(v => v.name.length));
  }, [textVariables]);
  // Use ch units for monospace alignment, add 2ch for the @ and colon
  const labelWidthCh = maxLabelLength + 2;

  // Collapsible state
  const [expandedSections, setExpandedSections] = useState({
    step1: true,  // Start with first section open
    step2: false,
    step3: false,
    step4: false
  })

  const toggleSection = useCallback((sectionKey: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }, [])

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])

  const handlePromptChange = useCallback((value: string) => {
    // Update local state immediately for responsive typing
    setPromptValue(value)
  }, [])
  
  const handlePromptBlur = useCallback(() => {
    // Save to settings only when user clicks away
    handleSettingChange('prompt', promptValue)
  }, [promptValue, handleSettingChange])



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
        outputVariables: (settings.outputVariables || []).map(v => ({
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
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      // Show user-friendly error message
      alert(`Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      // Get existing outputs that have both name and description filled (to use as examples)
      const existingValidOutputs = (settings.outputVariables || []).filter(v => 
        v.name.trim() && v.description.trim()
      )



      // Add variety to the prompt to ensure different suggestions each time
      const variations = [
        "Focus on actionable insights and recommendations",
        "Emphasize emotional and motivational aspects", 
        "Prioritize practical tools and resources",
        "Consider behavioral and psychological factors",
        "Think about long-term outcomes and progress tracking",
        "Focus on immediate next steps and quick wins",
        "Consider personalization and customization aspects",
        "Think about community and social elements"
      ]
      
      const randomVariation = variations[Math.floor(Math.random() * variations.length)]
      const randomSeed = Math.random().toString(36).substring(7)
      
      const request: PromptGenerationRequest = {
        sections: allSections,
        currentSectionOrder: section.order,
        existingPrompt: settings.prompt + `\n\n[Generate 2 additional unique output variables that complement the existing ones. ${randomVariation}. Seed: ${randomSeed}]`,
        outputVariables: existingValidOutputs.map(v => ({
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
        // Since AI now only returns new outputs, we can use all of them
        const newSuggestedOutputs = result.suggestedOutputVariables.map((suggested, index) => ({
          id: (Date.now() + index).toString(),
          name: suggested.name,
          description: suggested.description
        }))
        
        // Keep existing outputs and add new suggested ones
        const updatedOutputVariables = [...(settings.outputVariables || []), ...newSuggestedOutputs]
        
        // Update both local state and settings
        setLocalOutputVariables(updatedOutputVariables)
        handleSettingChange('outputVariables', updatedOutputVariables)
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
    
    // For text variables, require test inputs (check both saved and local values)
    const missingTextInputs = textVariables.filter(variable => {
      const savedValue = (settings.testInputs || {})[variable.name]
      const localValue = localTestInputs[variable.name]
      
      // Handle different input types
      const isSliderVariable = variable.section.type === 'question-slider' || 
                              variable.section.type === 'question-slider-multiple' ||
                              variable.section.type === 'slider'
      
      if (isSliderVariable) {
        // For sliders, check if user has actually set a value (not just using the minimum default)
        const hasUserSetValue = savedValue !== undefined || localValue !== undefined
        return !hasUserSetValue
      } else {
        // For text inputs, check for non-empty strings
        const hasValue = (savedValue && String(savedValue).trim()) || (localValue && String(localValue).trim())
        return !hasValue
      }
    })
    
    // For file variables, require test files
    const missingTestFiles = fileVariables.filter(variable => 
      !(settings.testFiles || {})[variable.name]
    )
    
    return missingTextInputs.length === 0 && missingTestFiles.length === 0
  }, [extractedVariablesWithTypes, textVariables, fileVariables, settings.testInputs, settings.testFiles, localTestInputs])

  const step2Complete = useMemo(() => {
    return settings.prompt && settings.prompt.trim() !== ''
  }, [settings.prompt])



  const step3Complete = useMemo(() => {
    // Filter out outputs where both name and description are empty (treat as non-existent)
    const validOutputVariables = localOutputVariables.filter(v => v.name.trim() || v.description.trim())
    // Must have at least one valid output, and all valid outputs must be complete
    return validOutputVariables.length > 0 && 
           validOutputVariables.every(v => v.name.trim() !== '' && v.description.trim() !== '')
  }, [localOutputVariables])

  const addOutputVariable = useCallback(() => {
    const newVariable: OutputVariable = {
      id: Date.now().toString(),
      name: '',
      description: ''
    }
    const newOutputVariables = [...localOutputVariables, newVariable]
    setLocalOutputVariables(newOutputVariables)
    handleSettingChange('outputVariables', newOutputVariables)
  }, [localOutputVariables, handleSettingChange])

  const updateOutputVariableLocal = useCallback((id: string, field: string, value: string) => {
    // Update local state immediately for responsive typing
    setLocalOutputVariables(prev => 
      prev.map(variable =>
        variable.id === id ? { ...variable, [field]: value } : variable
      )
    )
  }, [])
  
  const validateOutputVariable = useCallback((id: string, field: 'name' | 'description', value: string) => {
    const errors: { name?: string; description?: string } = {}
    const variable = localOutputVariables.find(v => v.id === id)
    
    if (!variable) return errors
    
    // Only validate description if name has content (user has committed to this output)
    if (field === 'description' && variable.name.trim() && !value.trim()) {
      errors.description = 'Description is required'
    }
    
    // Only validate name if description has content (user started working on it)
    if (field === 'name' && variable.description.trim() && !value.trim()) {
      errors.name = 'Name is required'
    }
    
    return errors
  }, [localOutputVariables])

  const handleOutputVariableBlur = useCallback((id: string, field: 'name' | 'description') => {
    const variable = localOutputVariables.find(v => v.id === id)
    if (!variable) return
    
    // Mark the current field as touched
    setTouchedOutputs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: true }
    }))
    
    // When name is filled and user focuses away, also mark description as needing validation
    if (field === 'name' && variable.name.trim() && !variable.description.trim()) {
      setTouchedOutputs(prev => ({
        ...prev,
        [id]: { ...prev[id], name: true, description: true }
      }))
    }
    
    // When description is filled and user focuses away, also mark name as needing validation  
    if (field === 'description' && variable.description.trim() && !variable.name.trim()) {
      setTouchedOutputs(prev => ({
        ...prev,
        [id]: { ...prev[id], name: true, description: true }
      }))
    }
    
    // Validate both fields (since they're interdependent)
    const nameErrors = validateOutputVariable(id, 'name', variable.name)
    const descriptionErrors = validateOutputVariable(id, 'description', variable.description)
    const allErrors = { ...nameErrors, ...descriptionErrors }
    
    setOutputErrors(prev => ({
      ...prev,
      [id]: allErrors
    }))
    
    // Save to settings only when user clicks away from any output variable input
    handleSettingChange('outputVariables', localOutputVariables)
  }, [localOutputVariables, handleSettingChange, validateOutputVariable])

  const removeOutputVariable = useCallback((id: string) => {
    const filteredVariables = localOutputVariables.filter(variable => variable.id !== id)
    setLocalOutputVariables(filteredVariables)
    handleSettingChange('outputVariables', filteredVariables)
  }, [localOutputVariables, handleSettingChange])

  const insertVariable = useCallback((variable: string) => {
    const currentValue = promptValue || ''
    const newValue = currentValue + `@${variable}`
    handlePromptChange(newValue)
  }, [promptValue, handlePromptChange])

  // Knowledge base handlers
  const handleKnowledgeBaseToggle = useCallback((enabled: boolean) => {
    setKnowledgeBaseEnabled(enabled)
    const knowledgeBaseSettings: KnowledgeBaseSettings = {
      enabled,
      entries: [] // No longer needed since we use all entries when enabled
    }
    handleSettingChange('knowledgeBase', knowledgeBaseSettings)
  }, [handleSettingChange])

  // Fetch knowledge base context and files for AI processing
  const fetchKnowledgeBaseForAI = useCallback(async (): Promise<{
    textContent: string
    files: Array<{ url: string; type: string; name: string }>
  }> => {
    console.log('🔍 fetchKnowledgeBaseForAI called:', {
      knowledgeBaseEnabled,
      campaignId
    })
    
    if (!knowledgeBaseEnabled || !campaignId) {
      console.log('📚 Knowledge base context skipped - toggle off or no campaign ID')
      return { textContent: '', files: [] }
    }

    try {
      console.log('📚 Fetching knowledge base for AI processing:', campaignId)
      const result = await getKnowledgeBaseForAI(campaignId)
      console.log('📚 Knowledge base AI result:', result)
      
      return result
    } catch (error) {
      console.error('Error fetching knowledge base for AI:', error)
      return { textContent: '', files: [] }
    }
  }, [knowledgeBaseEnabled, campaignId])

  // Simple test input updates
  const updateTestInput = useCallback((variableName: string, value: string) => {
    // Update local state immediately for responsive UI
    setLocalTestInputs(prev => ({ ...prev, [variableName]: value }))
  }, [])

  const saveTestInput = useCallback((variableName: string, value: string) => {
    // Save to settings on blur
    const newTestInputs = { ...(settings.testInputs || {}), [variableName]: value }
    handleSettingChange('testInputs', newTestInputs)
    
    // Also update the stored test results so dropdown shows updated sample data immediately
    storeAITestResults(newTestInputs)
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
    const currentPrompt = promptValue || ''
    let preview = currentPrompt
    const currentInputs = { ...settings.testInputs, ...localTestInputs }
    
    Object.entries(currentInputs).forEach(([variable, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        const regex = new RegExp(`@${variable}\\b`, 'g')
        preview = preview.replace(regex, `**${value}**`)
      }
    })
    return preview
  }, [promptValue, settings.testInputs, localTestInputs])

  const runTest = async () => {
    setIsTestRunning(true)
    try {
      // Validate required fields
      if (!settings.prompt?.trim()) {
        setTestResult('Please write an AI prompt in Step 2 before testing.')
        return
      }
      
      // Filter out empty outputs (where both name and description are empty)
      const validOutputVariables = localOutputVariables.filter(v => v.name.trim() || v.description.trim())
      
      if (validOutputVariables.length === 0) {
        setTestResult('Please define at least one output variable in Step 3 before testing.')
        return
      }

      // Check if all text inputs are provided (check both saved and local values)
      const missingTextInputs = textVariables.filter(variable => {
        const savedValue = (settings.testInputs || {})[variable.name]
        const localValue = localTestInputs[variable.name]
        const hasValue = (savedValue && savedValue.trim()) || (localValue && localValue.trim())
        return !hasValue
      })
      
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

      // Prepare the AI test request - merge saved and local values
      const testVariables = { ...(settings.testInputs || {}), ...localTestInputs }
      
      // Fetch knowledge base context and files if enabled
      const knowledgeBaseData = await fetchKnowledgeBaseForAI()
      console.log('🧪 Test: Knowledge base data fetched:', knowledgeBaseData)
      const knowledgeBaseContext = knowledgeBaseData.textContent
      
      // If we have file variables with actual uploaded files, use the file-aware API
      const hasUploadedFiles = fileVariables.length > 0 && fileVariables.every(v => (settings.testFiles || {})[v.name])
      
      if (hasUploadedFiles) {
        // Use the file-aware API endpoint
        const formData = new FormData()
        formData.append('prompt', settings.prompt)
        formData.append('variables', JSON.stringify(testVariables))
        formData.append('outputVariables', JSON.stringify(validOutputVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description
        }))))
        formData.append('hasFileVariables', 'true')
        formData.append('fileVariableNames', JSON.stringify(fileVariables.map(v => v.name)))
        
        // Add knowledge base context and files if available
        if (knowledgeBaseContext) {
          formData.append('knowledgeBaseContext', knowledgeBaseContext)
        }
        
        // Add knowledge base files for AI vision processing
        if (knowledgeBaseData.files && knowledgeBaseData.files.length > 0) {
          formData.append('knowledgeBaseFiles', JSON.stringify(knowledgeBaseData.files))
        }
        
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
        outputVariables: validOutputVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description
        })),
        hasFileVariables: fileVariables.length > 0,
        fileVariableNames: fileVariables.map(v => v.name),
        knowledgeBaseContext,
        knowledgeBaseFiles: knowledgeBaseData.files
      }
      
      console.log('🧪 Test: Full request being sent:', testRequest)

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
    <div className={cn('py-16 px-6 max-w-4xl mx-auto space-y-12 text-gray-900', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Brain className="h-8 w-8 text-orange-600" />
          <h2 className="text-3xl font-bold text-gray-900">AI Logic Setup</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Set up AI to process user responses and create personalized outputs. Follow these simple steps.
        </p>
      </div>

      <div className="relative">
        {/* Step 1: Example Inputs */}
        <div className="relative">
          <Card className="bg-white border-gray-200 p-8">
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
                  <h3 className="text-xl font-semibold text-gray-900">Add Example Answers</h3>
                  <p className="text-gray-600">Provide sample answers to help design your AI prompt</p>
                </div>
              </div>
              {expandedSections.step1 ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </div>

            {expandedSections.step1 && (
              <div className="mt-6">
                {extractedVariablesWithTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="font-medium">No input variables available</p>
                    <p className="text-sm">Add question sections first to create variables for AI processing</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600 mb-4">
                      Enter example answers for each question. You will use these sample answers to test your AI prompt to ensure it's working like you expect.
                    </p>
                    
                    {/* Text Variables */}
                    {textVariables.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">Text Inputs</h4>
                        {textVariables.map((variable) => {
                          // Check variable type to render appropriate input
                          const isSliderVariable = variable.section.type === 'question-slider' || 
                                                  variable.section.type === 'question-slider-multiple' ||
                                                  variable.section.type === 'slider'
                          const isMultipleChoiceVariable = variable.section.type === 'question-multiple-choice' ||
                                                          variable.section.type === 'multiple_choice'
                          const isDateTimeVariable = variable.section.type === 'question-date-time' || 
                                                    variable.section.type === 'date_time_question'
                          
                          if (isSliderVariable) {
                            // For slider variables, show a slider input
                            let sliderConfig = null
                            
                            if (variable.section.type === 'question-slider-multiple') {
                              // Find the specific slider config for this variable
                              const settings = variable.section.settings as any
                              sliderConfig = settings.sliders?.find((s: any) => s.variableName === variable.name)
                            } else if (variable.section.type === 'question-slider') {
                              // For single slider, use section settings
                              const settings = variable.section.settings as any
                              sliderConfig = {
                                minValue: settings.minValue || 0,
                                maxValue: settings.maxValue || 10,
                                defaultValue: settings.defaultValue || 5,
                                step: settings.step || 1,
                                minLabel: settings.minLabel || 'Low',
                                maxLabel: settings.maxLabel || 'High'
                              }
                            }
                            
                            // Use local state for immediate slider response
                            // Start at minimum value + 1 to encourage user interaction
                            const hasUserInput = localTestInputs[variable.name] !== undefined || (settings.testInputs || {})[variable.name] !== undefined
                            const localValue = hasUserInput 
                              ? (localTestInputs[variable.name] !== undefined 
                                  ? localTestInputs[variable.name] 
                                  : (settings.testInputs || {})[variable.name])
                              : Math.max(1, (sliderConfig?.minValue || 0) + 1) // Start at minimum + 1, but at least 1
                            
                            const numericValue = Number(localValue)
                            const minVal = sliderConfig?.minValue || 0
                            const maxVal = sliderConfig?.maxValue || 10
                            const progressPercent = ((numericValue - minVal) / (maxVal - minVal)) * 100
                            
                            return (
                              <div key={variable.name} className="flex items-start space-x-4">
                                <Label
                                  className="text-sm font-medium text-gray-700 flex-shrink-0"
                                  style={{ width: `${labelWidthCh}ch`, minWidth: `${labelWidthCh}ch`, maxWidth: `${labelWidthCh}ch` }}
                                >
                                  @{variable.name}:
                                </Label>
                                <div className="flex-1 space-y-2">
                                  <div className="relative group">
                                    <input
                                      type="range"
                                      min={minVal}
                                      max={maxVal}
                                      step={sliderConfig?.step || 1}
                                      value={numericValue}
                                      onChange={(e) => {
                                        updateTestInput(variable.name, e.target.value)
                                        saveTestInput(variable.name, e.target.value)
                                      }}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider focus:outline-none"
                                      style={{
                                        background: hasUserInput 
                                          ? `linear-gradient(to right, #f97316 0%, #f97316 ${progressPercent}%, #e5e7eb ${progressPercent}%, #e5e7eb 100%)`
                                          : `linear-gradient(to right, #d1d5db 0%, #d1d5db ${progressPercent}%, #e5e7eb ${progressPercent}%, #e5e7eb 100%)`
                                      }}
                                    />
                                    {/* Custom thumb styling via CSS */}
                                    <style jsx>{`
                                      .slider::-webkit-slider-thumb {
                                        appearance: none;
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: ${hasUserInput ? '#f97316' : '#d1d5db'};
                                        cursor: pointer;
                                        border: 2px solid white;
                                        box-shadow: 0 2px 4px rgba(0,0,0,${hasUserInput ? '0.2' : '0.1'});
                                        opacity: ${hasUserInput ? '1' : '0.7'};
                                        transition: all 0.15s ease;
                                      }
                                      .slider:hover::-webkit-slider-thumb {
                                        transform: scale(1.1);
                                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                                        opacity: 1;
                                      }
                                      .slider::-moz-range-thumb {
                                        width: 20px;
                                        height: 20px;
                                        border-radius: 50%;
                                        background: ${hasUserInput ? '#f97316' : '#d1d5db'};
                                        cursor: pointer;
                                        border: 2px solid white;
                                        box-shadow: 0 2px 4px rgba(0,0,0,${hasUserInput ? '0.2' : '0.1'});
                                        opacity: ${hasUserInput ? '1' : '0.7'};
                                        transition: all 0.15s ease;
                                      }
                                      .slider:hover::-moz-range-thumb {
                                        transform: scale(1.1);
                                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                                        opacity: 1;
                                      }
                                    `}</style>
                                  </div>
                                  <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="font-medium">{sliderConfig?.minLabel || 'Low'}</span>
                                    <div className="flex items-center space-x-1">
                                      {!hasUserInput ? (
                                        <span className="text-xs text-gray-400 font-medium">
                                          please slide
                                        </span>
                                      ) : (
                                        <>
                                          <span className="text-xs font-bold text-orange-600 font-mono">
                                            {numericValue}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            / {maxVal}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <span className="font-medium">{sliderConfig?.maxLabel || 'High'}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          } else if (isMultipleChoiceVariable) {
                            // For multiple choice variables, show radio buttons
                            const settings = variable.section.settings as any
                            const options = settings.options || []
                            const currentValue = localTestInputs[variable.name] !== undefined 
                              ? localTestInputs[variable.name] 
                              : (settings.testInputs || {})[variable.name] || ''
                            
                            return (
                              <div key={variable.name} className="flex items-start space-x-4">
                                <Label
                                  className="text-sm font-medium text-gray-700 flex-shrink-0"
                                  style={{ width: `${labelWidthCh}ch`, minWidth: `${labelWidthCh}ch`, maxWidth: `${labelWidthCh}ch` }}
                                >
                                  @{variable.name}:
                                </Label>
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  {options.map((option: any, index: number) => {
                                    // Handle different option formats
                                    let optionValue = ''
                                    let optionDisplay = ''
                                    
                                    if (typeof option === 'string') {
                                      // Simple string option
                                      optionValue = option
                                      optionDisplay = option
                                    } else if (option && typeof option === 'object') {
                                      // Object option with text property
                                      optionValue = option.text || option.value || option.id || `Option ${index + 1}`
                                      optionDisplay = optionValue
                                    } else {
                                      // Fallback
                                      optionValue = `Option ${index + 1}`
                                      optionDisplay = optionValue
                                    }
                                    
                                    const isSelected = currentValue === optionValue
                                    return (
                                      <button
                                        key={option.id || index}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          console.log('Clicked option:', optionValue, 'for variable:', variable.name)
                                          updateTestInput(variable.name, optionValue)
                                          saveTestInput(variable.name, optionValue)
                                        }}
                                        className={`text-left px-3 py-2 rounded-md border transition-all duration-200 text-sm focus:outline-none flex items-center justify-between ${
                                          isSelected 
                                            ? 'bg-orange-50 border-orange-300 text-orange-900' 
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                      >
                                        <span>{optionDisplay}</span>
                                        {isSelected ? (
                                          <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                        ) : (
                                          <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0"></div>
                                        )}
                                      </button>
                                    )
                                  })}
                                  {options.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No options configured for this question</p>
                                  )}
                                </div>
                              </div>
                            )
                          } else if (isDateTimeVariable) {
                            // For date-time variables, show date and time inputs
                            const settings = variable.section.settings as any
                            const includeDate = settings.includeDate !== false // default true
                            const includeTime = settings.includeTime === true
                            
                            const currentValue = localTestInputs[variable.name] !== undefined 
                              ? localTestInputs[variable.name] 
                              : (settings.testInputs || {})[variable.name] || ''
                            
                            // Parse existing value if it exists
                            let dateValue = ''
                            let timeValue = ''
                            if (currentValue) {
                              try {
                                const date = new Date(currentValue)
                                if (!isNaN(date.getTime())) {
                                  dateValue = date.toISOString().split('T')[0]
                                  timeValue = date.toISOString().split('T')[1]?.slice(0, 5) || ''
                                }
                              } catch (e) {
                                // If parsing fails, treat as separate date/time strings
                                if (currentValue.includes(' ')) {
                                  const [datePart, timePart] = currentValue.split(' ')
                                  dateValue = datePart || ''
                                  timeValue = timePart || ''
                                } else {
                                  dateValue = currentValue
                                }
                              }
                            }
                            
                            const handleDateTimeChange = (type: 'date' | 'time', value: string) => {
                              let newValue = ''
                              if (includeDate && includeTime) {
                                const newDate = type === 'date' ? value : dateValue
                                const newTime = type === 'time' ? value : timeValue
                                if (newDate && newTime) {
                                  newValue = `${newDate} ${newTime}`
                                } else if (newDate) {
                                  newValue = newDate
                                } else if (newTime) {
                                  newValue = newTime
                                }
                              } else if (includeDate) {
                                newValue = value
                              } else if (includeTime) {
                                newValue = value
                              }
                              updateTestInput(variable.name, newValue)
                              saveTestInput(variable.name, newValue)
                            }
                            
                            return (
                              <div key={variable.name} className="flex items-start space-x-4">
                                <Label
                                  className="text-sm font-medium text-gray-700 flex-shrink-0"
                                  style={{ width: `${labelWidthCh}ch`, minWidth: `${labelWidthCh}ch`, maxWidth: `${labelWidthCh}ch` }}
                                >
                                  @{variable.name}:
                                </Label>
                                <div className="flex-1 flex space-x-4">
                                  {includeDate && (
                                    <div className="flex-1">
                                      <Input
                                        type="date"
                                        value={dateValue}
                                        onChange={(e) => handleDateTimeChange('date', e.target.value)}
                                        className="bg-white border-gray-300 text-gray-900"
                                      />
                                    </div>
                                  )}
                                  {includeTime && (
                                    <div className="flex-1">
                                      <Input
                                        type="time"
                                        value={timeValue}
                                        onChange={(e) => handleDateTimeChange('time', e.target.value)}
                                        className="bg-white border-gray-300 text-gray-900"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          // For regular text variables, show text input
                          return (
                            <div key={variable.name} className="flex items-center space-x-4">
                              <Label
                                className="text-sm font-medium text-gray-700 flex-shrink-0"
                                style={{ width: `${labelWidthCh}ch`, minWidth: `${labelWidthCh}ch`, maxWidth: `${labelWidthCh}ch` }}
                              >
                                @{variable.name}:
                              </Label>
                              <Input
                                value={localTestInputs[variable.name] !== undefined
                                  ? localTestInputs[variable.name]
                                  : (settings.testInputs || {})[variable.name] || ''}
                                onChange={(e) => updateTestInput(variable.name, e.target.value)}
                                onBlur={(e) => saveTestInput(variable.name, e.target.value)}
                                placeholder={`Example answer for ${variable.title}`}
                                className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 max-w-[200px]"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* File Variables */}
                    {fileVariables.length > 0 && (
                      <div className="space-y-4">
                        {fileVariables.map((variable) => (
                          <div key={variable.name} className="flex items-start space-x-4">
                            <Label className="text-sm font-medium text-gray-700 min-w-fit max-w-48 flex-shrink-0">
                              @{variable.name}:
                            </Label>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    updateTestFile(variable.name, file)
                                  }}
                                  className="block w-full text-sm text-gray-600 
                                           file:mr-4 file:py-2 file:px-4
                                           file:rounded-md file:border-0
                                           file:text-sm file:font-medium
                                           file:bg-orange-600 file:text-white
                                           hover:file:bg-orange-700
                                           file:cursor-pointer"
                                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                />
                                {(settings.testFiles || {})[variable.name] && (
                                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Dotted connector line */}
          <div className="flex justify-center py-4">
            <div className="w-px h-8 border-l-2 border-dotted border-gray-300"></div>
          </div>
        </div>

        {/* Step 2: Define Prompt */}
        <div className="relative">
          <Card className={cn('bg-white border-gray-200 p-8', !step1Complete && 'opacity-50 pointer-events-none')}>
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
                  <h3 className="text-xl font-semibold text-gray-900">Write Your AI Prompt</h3>
                  <p className="text-gray-600">Tell the AI what to do with the user's answers</p>
                </div>
              </div>
              {expandedSections.step2 ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </div>

            {expandedSections.step2 && (
              <div className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Prompt Editor */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        AI Prompt
                      </Label>
                      {currentAvailableVariables.length > 0 && (
                                              <Button
                        onClick={generatePrompt}
                        disabled={isGeneratingPrompt}
                        variant="outline"
                        className="border-purple-500 text-purple-700 hover:bg-purple-50 hover:border-purple-600 text-xs px-2 py-1 h-6"
                      >
                        {isGeneratingPrompt ? (
                          <>
                            <div className="animate-spin h-3 w-3 mr-1 border border-purple-700 border-t-transparent rounded-full" />
                            {promptLoadingMessage}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Suggest my prompt
                          </>
                        )}
                      </Button>
                      )}
                    </div>

                    {/* Combined Prompt Input with Variables */}
                    <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
                      <Textarea
                        value={promptValue}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        onBlur={handlePromptBlur}
                        placeholder="You are an expert fitness coach. Based on @name who trains @frequency times per week and wants to run a @distance race, provide personalized training advice..."
                        className="min-h-[200px] text-sm bg-transparent border-0 text-gray-900 placeholder-gray-500 resize-none focus:ring-0"
                        rows={8}
                      />
                      
                      {/* Divider and Variables Section */}
                      {currentAvailableVariables.length > 0 && (
                        <>
                          <div className="border-t border-gray-300"></div>
                          <div className="p-3 bg-gray-50">
                            <Label className="text-xs font-medium text-gray-600 mb-2 block">
                              Click to Insert Variables
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {currentAvailableVariables.map((variable) => (
                                <Badge
                                  key={variable}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors border-gray-300 text-gray-700 text-xs"
                                  onClick={() => insertVariable(variable)}
                                >
                                  @{variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Knowledge Base Toggle */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={knowledgeBaseEnabled}
                            onCheckedChange={handleKnowledgeBaseToggle}
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <div>
                            <Label className="text-sm font-medium text-gray-900">
                              Include Knowledge Base
                            </Label>
                            <p className="text-xs text-gray-600">
                              Please reference the following{' '}
                              <button
                                onClick={() => setShowKnowledgeBaseModal(true)}
                                className="text-blue-600 underline hover:text-blue-700 font-medium"
                              >
                                knowledge base
                              </button>
                              {' '}when generating content
                            </p>
                          </div>
                        </div>
                        {knowledgeBaseEnabled && (
                          <Badge variant="secondary" className="text-xs">
                            enabled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="space-y-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Live Preview
                    </Label>
                    <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg min-h-[200px] text-sm">
                      {previewPrompt ? (
                        <div 
                          className="whitespace-pre-wrap text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: previewPrompt
                              .replace(/\*\*(.*?)\*\*/g, '<span class="bg-yellow-200 px-1 rounded font-medium text-yellow-800">$1</span>')
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
            <div className="w-px h-8 border-l-2 border-dotted border-gray-300"></div>
          </div>
        </div>

        {/* Step 3: Define Outputs */}
        <div className="relative">
          <Card className={cn('bg-white border-gray-200 p-8', (!step1Complete || !step2Complete) && 'opacity-50 pointer-events-none')}>
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
                  <h3 className="text-xl font-semibold text-gray-900">Define AI Outputs</h3>
                  <p className="text-gray-600">Specify what the AI should return</p>
                </div>
              </div>
              {expandedSections.step3 ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </div>

            {expandedSections.step3 && (
              <div className="mt-6">
                <div className="space-y-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">
                      Define variables that the AI will generate, like @recommendation or @score
                    </p>
                  </div>

                  <div className="space-y-4">
                    {localOutputVariables.map((variable) => (
                      <Card key={variable.id} className="p-4 bg-gray-50 border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div data-output-variable-name>
                            <Label className="text-xs text-gray-600 mb-1 block">Variable Name</Label>
                            <Input
                              value={variable.name}
                              onChange={(e) => updateOutputVariableLocal(variable.id, 'name', e.target.value)}
                              onBlur={() => handleOutputVariableBlur(variable.id, 'name')}
                              placeholder="eg. training_plan"
                              className={cn(
                                "text-sm bg-white text-gray-900 placeholder:text-gray-300 placeholder:opacity-50",
                                touchedOutputs[variable.id]?.name && outputErrors[variable.id]?.name
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-gray-300"
                              )}
                            />
                            {touchedOutputs[variable.id]?.name && outputErrors[variable.id]?.name && (
                              <p className="text-xs text-red-600 mt-1">{outputErrors[variable.id]?.name}</p>
                            )}
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <Label className="text-xs text-gray-600 mb-1 block">Description</Label>
                              <Input
                                value={variable.description}
                                onChange={(e) => updateOutputVariableLocal(variable.id, 'description', e.target.value)}
                                onBlur={() => handleOutputVariableBlur(variable.id, 'description')}
                                placeholder="eg. A personalised training plan based on their distance etc."
                                className={cn(
                                  "text-sm bg-white text-gray-900 placeholder:text-gray-300 placeholder:opacity-80",
                                  touchedOutputs[variable.id]?.description && outputErrors[variable.id]?.description
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : "border-gray-300"
                                )}
                              />
                              {touchedOutputs[variable.id]?.description && outputErrors[variable.id]?.description && (
                                <p className="text-xs text-red-600 mt-1">{outputErrors[variable.id]?.description}</p>
                              )}
                            </div>
                            <Button
                              onClick={() => removeOutputVariable(variable.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {localOutputVariables.length === 0 && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No output variables defined</p>
                        <p className="text-sm">Add variables that the AI should generate</p>
                      </div>
                    )}
                    
                    {/* Action buttons at the bottom */}
                    <div className="flex justify-center items-center space-x-3 pt-4">
                      <Button onClick={addOutputVariable} size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Output
                      </Button>
                      {currentAvailableVariables.length > 0 && (
                        <Button
                          onClick={generateOutputs}
                          disabled={isGeneratingOutputs || !settings.prompt?.trim()}
                          size="sm"
                          variant="outline"
                          className="border-purple-500 text-purple-700 hover:bg-purple-50 hover:border-purple-600"
                        >
                          {isGeneratingOutputs ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-purple-700 border-t-transparent rounded-full" />
                              {outputLoadingMessage}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Suggest my outputs
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Dotted connector line */}
          <div className="flex justify-center py-4">
            <div className="w-px h-8 border-l-2 border-dotted border-gray-300"></div>
          </div>
        </div>

        {/* Step 4: Test */}
        <div className="relative">
          <Card className={cn('bg-white border-gray-200 p-8', (!step1Complete || !step2Complete || !step3Complete) && 'opacity-50 pointer-events-none')}>
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
                  <h3 className="text-xl font-semibold text-gray-900">Test Your AI Logic</h3>
                  <p className="text-gray-600">See how your AI will respond to the example inputs</p>
                </div>
              </div>
              {expandedSections.step4 ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
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
                        {testLoadingMessage}
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
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
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
                                  <Label className="text-sm font-medium text-gray-700 min-w-fit max-w-48 flex-shrink-0 pt-2">
                                    @{variable}:
                                  </Label>
                                  <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-900 text-sm">
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
                              className="min-h-[120px] bg-gray-50 border-gray-300 text-gray-700 font-mono"
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

      {/* Knowledge Base Modal */}
      {campaignId && (
        <KnowledgeBaseModal
          isOpen={showKnowledgeBaseModal}
          onClose={() => setShowKnowledgeBaseModal(false)}
          campaignId={campaignId}
        />
      )}
    </div>
  )
} 