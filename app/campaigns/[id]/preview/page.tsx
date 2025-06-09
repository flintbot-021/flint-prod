'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Campaign } from '@/lib/types/database'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { getCampaignById, getCampaignSections } from '@/lib/data-access'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Play,
  Target,
  MessageSquare,
  Brain,
  FileText,
  Eye,
  Settings,
  TestTube,
  Zap,
  Monitor,
  Tablet,
  Smartphone,
  ArrowRight
} from 'lucide-react'

// Import section components
import { OutputSection } from '@/components/campaign-builder/content-types/output-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PreviewPageProps {}

interface PreviewState {
  currentSection: number
  userInputs: Record<string, any>
  aiOutputs: Record<string, any>
  completedSections: Set<number>
  testMode: boolean
  aiProcessingResults: Record<string, any>
}

interface PreviewModeConfig {
  mode: 'sequence' | 'realtime' | 'testing'
  bypassDisplayRules: boolean
  enableAITesting: boolean
  simulateRealTiming: boolean
  showDebugInfo: boolean
}

// =============================================================================
// DEVICE CONFIGURATIONS
// =============================================================================

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface DeviceConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  width: number
  height: number
  maxWidth?: string
  description: string
}

const DEVICE_CONFIGS: Record<PreviewDevice, DeviceConfig> = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    maxWidth: '100%',
    description: 'Full desktop experience'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    maxWidth: '768px',
    description: 'iPad and tablet devices'
  },
  mobile: {
    name: 'Mobile',
    icon: Smartphone,
    width: 375,
    height: 667,
    maxWidth: '375px',
    description: 'iPhone and mobile devices'
  }
}

// =============================================================================
// AI LOGIC TESTING UTILITIES
// =============================================================================

// Real AI processing using the same API as the campaign builder
const processAIPrompt = async (prompt: string, userInputs: Record<string, any>, sections: CampaignSection[]) => {
  const startTime = Date.now()
  
  console.log('🤖 DATA CAPTURED:', userInputs)

  try {
    // Extract output variables from AI logic section settings - same as campaign builder
    const aiLogicSection = sections.find(s => s.type === 'logic')
    const aiSettings = aiLogicSection?.settings as any
    const outputVariables = aiSettings?.outputVariables || []
    
    // Prepare the AI test request in the same format as the campaign builder
    const testRequest = {
      prompt: prompt,
      variables: userInputs,
      outputVariables: outputVariables // Use ONLY the user-defined output variables
    }

    console.log('🤖 SENT TO AI:', { prompt: prompt, variables: userInputs, expectedOutputs: outputVariables.map((v: any) => v.name) })

    // Call the real AI processing API
    const response = await fetch('/api/ai-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const processingTime = Date.now() - startTime

    if (result.success && result.outputs) {
      console.log('🤖 AI RETURNED:', result.outputs)
      return {
        ...result.outputs,
        score: Math.floor(Math.random() * 40) + 60, // Random score for preview
        processingTime,
        prompt: prompt,
        rawResponse: result.rawResponse
      }
    } else {
      throw new Error(result.error || 'AI processing failed')
    }

  } catch (error) {
    console.error('🤖 AI ERROR:', error)
    
    // Fallback to basic response if AI fails
    const processingTime = Date.now() - startTime
    const fallbackResponse = generateAIResponse(prompt, userInputs)
    
    return {
      ...fallbackResponse,
      score: Math.floor(Math.random() * 40) + 60,
      processingTime,
      prompt: prompt,
      error: error instanceof Error ? error.message : 'AI processing failed'
    }
  }
}

const generateAIResponse = (interpolatedPrompt: string, inputs: Record<string, any>) => {
  const name = inputs.name || 'User'
  
  // Generate dynamic response based on prompt content
  if (interpolatedPrompt.toLowerCase().includes('bread') || interpolatedPrompt.toLowerCase().includes('baking')) {
    return {
      recommendation: `${name}, based on your responses, here's your personalized bread-making guide!`,
      target_time: '45 minutes',
      speed: 'Medium pace',
      difficulty: 'Beginner-friendly',
      tips: [
        'Start with simple recipes like basic white bread',
        'Room temperature ingredients mix better',
        'Don\'t rush the rising process'
      ]
    }
  }
  
  if (interpolatedPrompt.toLowerCase().includes('fitness') || interpolatedPrompt.toLowerCase().includes('workout')) {
    return {
      recommendation: `${name}, here's your personalized fitness plan!`,
      target_time: '30 minutes',
      speed: 'Progressive',
      difficulty: 'Intermediate',
      tips: [
        'Start with compound movements',
        'Focus on proper form over weight',
        'Track your progress weekly'
      ]
    }
  }
  
  // Default response for any other prompts
  return {
    recommendation: `${name}, based on your responses, here are your personalized recommendations.`,
    target_time: '25 minutes',
    speed: 'Your pace',
    difficulty: 'Customized for you',
    tips: [
      'Take your time to understand each step',
      'Practice makes perfect',
      'Ask questions when needed'
    ]
  }
}

const interpolatePrompt = (prompt: string, inputs: Record<string, any>) => {
  let interpolated = prompt
  Object.entries(inputs).forEach(([key, value]) => {
    interpolated = interpolated.replace(new RegExp(`@${key}`, 'g'), String(value))
  })
  return interpolated
}

// =============================================================================
// SECTION VISIBILITY LOGIC
// =============================================================================

const shouldShowSection = (
  section: CampaignSection, 
  previewConfig: PreviewModeConfig, 
  userInputs: Record<string, any>,
  completedSections: Set<number>
): boolean => {
  // In bypass mode, show all sections
  if (previewConfig.bypassDisplayRules) {
    return true
  }

  // Check basic visibility
  if (!section.isVisible) {
    return false
  }

  // Check conditional display rules (this would be expanded with actual business logic)
  const settings = section.settings as any
  
  // Logic sections should always be visible if they exist - they'll handle their own state
  // Output sections only appear after some user input exists
  if (section.type.startsWith('output-') && Object.keys(userInputs).length === 0) {
    return false
  }
  
  return true
}

// =============================================================================
// SECTION RENDERER
// =============================================================================

function SectionRenderer({
  section,
  sectionIndex,
  isActive,
  userInputs,
  aiOutputs,
  previewConfig,
  onSectionComplete,
  onUpdate,
  onNext,
  onPrevious,
  currentSectionIndex,
  totalSections,
  sections
}: {
  section: CampaignSection
  sectionIndex: number
  isActive: boolean
  userInputs: Record<string, any>
  aiOutputs: Record<string, any>
  previewConfig: PreviewModeConfig
  onSectionComplete: (sectionIndex: number, data: any) => void
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  onNext: () => void
  onPrevious: () => void
  currentSectionIndex: number
  totalSections: number
  sections: CampaignSection[]
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<any>(null)
  const [textInput, setTextInput] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)

  // Reset inputs when section changes
  useEffect(() => {
    setTextInput('')
    setSelectedChoice(null)
  }, [section.id])

  // Auto-start AI processing for logic sections when they become active and have user inputs
  useEffect(() => {
    if (
      isActive && 
      section.type === 'logic' && 
      !isProcessing && 
      !processingResults &&
      Object.keys(userInputs).length > 0 &&
      (userInputs.name || userInputs.email) // Has capture data
    ) {
      // Automatically start AI processing
      handleAIProcessing()
    }
  }, [isActive, section.type, userInputs, isProcessing, processingResults])

  // Validation logic
  const isRequired = (section.settings as any)?.required
  const isValidTextInput = !isRequired || (isRequired && textInput.trim().length > 0)
  const isValidChoice = !isRequired || (isRequired && selectedChoice !== null)
  
  const canProceed = () => {
    switch (section.type) {
      case 'capture':
        return textInput.trim().length > 0 && selectedChoice !== null && selectedChoice.trim().length > 0
      case 'text_question':
        return isValidTextInput
      case 'multiple_choice':
        return isValidChoice
      default:
        return true // Other sections don't have validation requirements
    }
  }

  const handleNextClick = () => {
    if (!canProceed()) return
    
    const data: Record<string, any> = {}
    
    if (section.type === 'text_question' && textInput.trim()) {
      data.textResponse = textInput.trim()
    } else if (section.type === 'multiple_choice' && selectedChoice) {
      data.choice = selectedChoice
    }
    
    onSectionComplete(sectionIndex, data)
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'capture':
      case 'text_question':
        return Target
      case 'choice':
      case 'multiple_choice':
        return MessageSquare
      case 'logic':
        return Brain
      case 'output':
      case 'output-results':
      case 'output-download':
      case 'output-redirect':
        return FileText
      default:
        return Target
    }
  }

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'capture':
      case 'text_question':
        return 'Text Question'
      case 'choice':
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'logic':
        return 'AI Logic'
      case 'output':
      case 'output-results':
        return 'Results'
      case 'output-download':
        return 'Download'
      case 'output-redirect':
        return 'Redirect'
      default:
        return 'Section'
    }
  }

  const IconComponent = getSectionIcon(section.type)
  const typeLabel = getSectionTypeLabel(section.type)

  const handleAIProcessing = async () => {
    if (section.type !== 'logic') return

    setIsProcessing(true)
    try {
      const settings = section.settings as any
      const prompt = settings.prompt || settings.aiPrompt || 'Analyze the user inputs and provide recommendations.'
      
      console.log('🧠 AI PROCESSING: Raw prompt from settings:', prompt)
      console.log('🧠 AI PROCESSING: Input userInputs:', userInputs)
      
      const results = await processAIPrompt(prompt, userInputs, sections)
      console.log('🧠 AI PROCESSING: AI Results:', results)
      setProcessingResults(results)
      
      // Store AI outputs and auto-complete to advance to output section
      onSectionComplete(sectionIndex, {
        aiProcessing: true,
        ...results
      })
      
      // Immediately advance to output section after processing
      onNext()
      console.log('🧠 AI PROCESSING: Completed section with:', { aiProcessing: true, ...results })
    } catch (error) {
      console.error('AI Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderSectionContent = () => {
    const baseProps = {
      section,
      isPreview: true,
      onUpdate,
      className: "max-w-4xl mx-auto"
    }

    const settings = section.settings || {}

    switch (section.type) {
      case 'capture':
        return (
          <div className="min-h-screen bg-white flex flex-col relative">
            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-6 pb-20">
              <div className="w-full max-w-2xl mx-auto space-y-6">
                {/* Main Heading */}
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {((section.settings as any)?.content) || 'Get Your Personalized Results'}
                  </h1>
                </div>

                {/* Optional Subheading */}
                <div className="text-center">
                  <p className="text-xl text-gray-600">
                    {((section.settings as any)?.subheading) || 'Enter your information to unlock AI-powered personalized insights.'}
                  </p>
                </div>

                {/* Preview of what happens next */}
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <Brain className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">What happens next:</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        <span>AI analyzes your responses</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span>Personalized insights generated</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        <span>Custom results delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={selectedChoice || ''}
                      onChange={(e) => setSelectedChoice(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Trust signals */}
                <div className="mt-8 text-center">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-600 mr-1" />
                      <span>Secure & Private</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-blue-600 mr-1" />
                      <span>AI-Powered</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-purple-600 mr-1" />
                      <span>Instant Results</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onPrevious}
                    disabled={currentSectionIndex <= 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    <span>* Required</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (textInput && selectedChoice) {
                                  console.log('🔵 CAPTURE: Completing with data:', { name: textInput, email: selectedChoice })
            onSectionComplete(sectionIndex, {
              name: textInput,
              email: selectedChoice
            })
                    }
                  }}
                  disabled={!textInput || !selectedChoice}
                  className={cn(
                    "px-6 py-2 rounded-lg font-medium transition-colors",
                    textInput && selectedChoice
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  🚀 Generate My Results
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'text_question':
        return (
          <div className="min-h-screen bg-white flex flex-col relative">
            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-6 pb-20">
              <div className="w-full max-w-2xl mx-auto space-y-6">
                {/* Main Question Text */}
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {((section.settings as any)?.content) || 'Your question text here...'}
                  </h1>
                </div>

                {/* Optional Subheading */}
                {(section.settings as any)?.subheading && (
                  <div className="text-center">
                    <p className="text-xl text-gray-600">
                      {(section.settings as any).subheading}
                    </p>
                  </div>
                )}

                {/* Label */}
                {(section.settings as any)?.label && (
                  <div className="pt-6">
                    <label className="text-sm font-medium text-gray-700 block">
                      {(section.settings as any).label}
                    </label>
                  </div>
                )}

                {/* Input Field */}
                <div>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={(section.settings as any)?.placeholder || 'Type your answer here...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onPrevious}
                    disabled={currentSectionIndex <= 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    {(section.settings as any)?.required && <span>* Required</span>}
                  </div>
                </div>
                <button
                  onClick={handleNextClick}
                  disabled={!canProceed()}
                  className={cn(
                    "px-6 py-2 rounded-lg font-medium transition-colors",
                    canProceed()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {(section.settings as any)?.buttonLabel || 'Next'}
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'multiple_choice':
        return (
          <div className="min-h-screen bg-white flex flex-col relative">
            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-6 pb-20">
              <div className="w-full max-w-2xl mx-auto space-y-6">
                {/* Main Question Text */}
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {((section.settings as any)?.content) || 'Make Your Choice'}
                  </h1>
                </div>

                {/* Optional Subheading */}
                {(section.settings as any)?.subheading && (
                  <div className="text-center">
                    <p className="text-xl text-gray-600">
                      {(section.settings as any).subheading}
                    </p>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3 pt-6">
                  {(((section.settings as any)?.options) || [
                    { id: 'option-1', text: 'Option 1' },
                    { id: 'option-2', text: 'Option 2' },
                    { id: 'option-3', text: 'Option 3' }
                  ]).map((option: any, index: number) => {
                    const optionId = option.id || `option-${index}`
                    const isSelected = selectedChoice === option.text
                    return (
                      <button
                        key={optionId}
                        onClick={() => setSelectedChoice(option.text)}
                        className={cn(
                          "w-full p-4 text-left border rounded-lg transition-colors",
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            "w-4 h-4 border rounded-full mr-3 flex items-center justify-center",
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-400"
                          )}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className="text-lg text-gray-900">{option.text}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onPrevious}
                    disabled={currentSectionIndex <= 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    {(section.settings as any)?.required && <span>* Required</span>}
                  </div>
                </div>
                <button
                  onClick={handleNextClick}
                  disabled={!canProceed()}
                  className={cn(
                    "px-6 py-2 rounded-lg font-medium transition-colors",
                    canProceed()
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'logic':
        // Logic section processes in background and auto-advances - no UI needed
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900">
                Generating Your Results...
              </h2>
              <p className="text-gray-600">
                Please wait while we personalize your experience
              </p>
            </div>
          </div>
        )
      
      case 'output':
      case 'output-results':
      case 'output-download':
      case 'output-redirect':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
            <div className="max-w-4xl mx-auto space-y-12 px-6 py-16">
              {/* Title */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {/* Interpolate variables in title */}
                  {((settings as any).title || 'Your Results').replace(/@(\w+)/g, (match: string, varName: string) => {
                    return userInputs[varName] || aiOutputs[varName] || `[${varName}]`
                  })}
                </h1>
                
                {(settings as any).subtitle && (
                  <div className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                    {/* Interpolate variables in subtitle */}
                    {((settings as any).subtitle).replace(/@(\w+)/g, (match: string, varName: string) => {
                      // Completely dynamic - use only available data
                      if (aiOutputs[varName] !== undefined) {
                        return String(aiOutputs[varName])
                      }
                      if (userInputs[varName] !== undefined) {
                        return String(userInputs[varName])
                      }
                      return `@${varName}` // Keep placeholder if not found
                    })}
                  </div>
                )}
              </div>

              {/* Content with Variable Interpolation */}
              {(settings as any).content && (
                <div className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed text-center">
                  {/* Enhanced variable interpolation for preview */}
                  {((settings as any).content as string).replace(/@(\w+)/g, (match, varName) => {
                    // Completely dynamic - use only available data, no hardcoded fallbacks
                    if (aiOutputs[varName] !== undefined) {
                      return String(aiOutputs[varName])
                    }
                    if (userInputs[varName] !== undefined) {
                      return String(userInputs[varName])
                    }
                    // No fallbacks - keep placeholder if variable not found
                    return `@${varName}`
                  }).replace(/\[(\w+)\]/g, (match, varName) => {
                    // Completely dynamic - use only available data, no hardcoded fallbacks
                    if (aiOutputs[varName] !== undefined) {
                      return String(aiOutputs[varName])
                    }
                    if (userInputs[varName] !== undefined) {
                      return String(userInputs[varName])
                    }
                    // No fallbacks - keep placeholder if variable not found
                    return `[${varName}]`
                  })}
                </div>
              )}



              {/* Navigation Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    // In preview, just show completion
                    alert('Campaign completed! In the live version, this would redirect or show download options.')
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Complete Campaign
                </button>
              </div>
            </div>
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 rounded border border-white/20">
                <p className="text-xs font-medium text-white">Debug: Output Section</p>
                <div className="text-xs text-gray-300 mt-1 space-y-1">
                  <p>Type: {section.type}</p>
                  <p>Available variables: {Object.keys({...userInputs, ...aiOutputs}).join(', ') || 'None'}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Variable Context</summary>
                    <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-auto">
                      {JSON.stringify({...userInputs, ...aiOutputs}, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="h-16 w-16 text-gray-400 mx-auto mb-4 flex items-center justify-center text-4xl">
                ❓
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Unknown Section Type
              </h2>
              <p className="text-xl text-gray-600">
                Section type "{section.type}" is not yet supported in preview mode.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {renderSectionContent()}
    </div>
  )
}



// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CampaignPreviewPage({}: PreviewPageProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const campaignId = params?.id as string
  
  // Parse URL parameters
  const initialSection = parseInt(searchParams?.get('section') || '0')
  const previewMode = searchParams?.get('mode') || 'sequence'
  const deviceType = (searchParams?.get('device') || 'desktop') as PreviewDevice
  const bypassDisplayRules = searchParams?.get('bypass') === 'true'

  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<CampaignSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDevice, setCurrentDevice] = useState<PreviewDevice>(deviceType)
  
  const [previewState, setPreviewState] = useState<PreviewState>({
    currentSection: initialSection,
    userInputs: {},
    aiOutputs: {},
    completedSections: new Set(),
    testMode: previewMode === 'testing',
    aiProcessingResults: {}
  })

  const [previewConfig, setPreviewConfig] = useState<PreviewModeConfig>({
    mode: previewMode as PreviewModeConfig['mode'],
    bypassDisplayRules,
    enableAITesting: previewMode === 'testing',
    simulateRealTiming: false,
    showDebugInfo: false
  })

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  useEffect(() => {
    // Update current section when URL param changes
    setPreviewState(prev => ({
      ...prev,
      currentSection: initialSection
    }))
  }, [initialSection])

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getCampaignById(campaignId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load campaign')
      }

      if (!result.data) {
        throw new Error('Campaign not found')
      }

      setCampaign(result.data)
      
      // Load actual campaign sections from database
      const sectionsResult = await getCampaignSections(campaignId)
      
      if (!sectionsResult.success) {
        throw new Error(sectionsResult.error || 'Failed to load campaign sections')
      }

      const sectionsData = sectionsResult.data || []
      
      // Convert SectionWithOptions to CampaignSection format
      const campaignSections: CampaignSection[] = sectionsData.map((section, index) => ({
        id: section.id,
        type: section.type,
        title: section.title || 'Untitled Section',
        order: section.order_index || index,
        isVisible: true, // Default to visible
        createdAt: section.created_at,
        updatedAt: section.updated_at,
        settings: (section.configuration || {}) as unknown as Record<string, unknown>
      }))
      
      // Filter sections based on display rules if not bypassing
      const visibleSections = campaignSections.filter(section => 
        shouldShowSection(section, previewConfig, previewState.userInputs, previewState.completedSections)
      )
      
      setSections(previewConfig.bypassDisplayRules ? campaignSections : visibleSections)

    } catch (err) {
      console.error('Error loading campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSectionComplete = (sectionIndex: number, data: any) => {
    console.log('📝 SECTION COMPLETE:', { sectionIndex, data })
    setPreviewState(prev => {
      const newState = {
        ...prev,
        userInputs: { ...prev.userInputs, ...data },
        completedSections: new Set([...prev.completedSections, sectionIndex])
      }

      // Store AI outputs separately
      if (data.aiProcessing) {
        newState.aiOutputs = { ...prev.aiOutputs, ...data }
        newState.aiProcessingResults = { ...prev.aiProcessingResults, [sectionIndex]: data }
        console.log('🔄 STORING AI OUTPUTS:', newState.aiOutputs)
      }

      console.log('📊 NEW PREVIEW STATE:', {
        userInputs: newState.userInputs,
        aiOutputs: newState.aiOutputs,
        completedSections: Array.from(newState.completedSections)
      })
      return newState
    })

    // Auto-advance to next section in sequence mode, but NOT for logic sections
    // Logic sections should show results and let user manually proceed
    const currentSection = sections[sectionIndex]
    const shouldAutoAdvance = previewConfig.mode === 'sequence' && 
                             sectionIndex < sections.length - 1 && 
                             currentSection?.type !== 'logic'
    
    if (shouldAutoAdvance) {
      handleNext()
    }
  }

  const handleSectionUpdate = async (updates: Partial<CampaignSection>) => {
    // In preview mode, we don't actually update the sections
    // This is just to satisfy the component interface
    console.log('Section update in preview mode:', updates)
  }

  const handleNext = () => {
    setPreviewState(prev => ({
      ...prev,
      currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
    }))
  }

  const handlePrevious = () => {
    setPreviewState(prev => ({
      ...prev,
      currentSection: Math.max(0, prev.currentSection - 1)
    }))
  }

  // =============================================================================
  // DEVICE HANDLERS
  // =============================================================================

  const handleDeviceChange = (device: PreviewDevice) => {
    setCurrentDevice(device)
    // Update URL to reflect device change
    const url = new URL(window.location.href)
    url.searchParams.set('device', device)
    window.history.replaceState({}, '', url.toString())
  }

  // =============================================================================
  // RENDER DEVICE-SPECIFIC CONTENT
  // =============================================================================

  const renderDeviceFrame = (content: React.ReactNode) => {
    const config = DEVICE_CONFIGS[currentDevice]

    if (currentDevice === 'desktop') {
      return (
        <div className="w-full h-full">
          {content}
        </div>
      )
    }

    // Mobile/Tablet frame with device appearance
    const frameStyles = {
      width: `${config.width}px`,
      height: `${config.height}px`,
      maxWidth: config.maxWidth || '100%'
    }

    return (
      <div className="flex items-center justify-center p-4 h-full">
        <div
          className={cn(
            "relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl",
            currentDevice === 'mobile' && "rounded-[2.5rem]",
            currentDevice === 'tablet' && "rounded-[1.5rem]"
          )}
          style={frameStyles}
        >
          {/* Device Screen */}
          <div className={cn(
            "bg-background rounded-[1.5rem] w-full h-full overflow-hidden relative",
            currentDevice === 'mobile' && "rounded-[2rem]",
            currentDevice === 'tablet' && "rounded-[1rem]"
          )}>
            {/* Status Bar (Mobile only) */}
            {currentDevice === 'mobile' && (
              <div className="h-6 bg-muted flex items-center justify-between px-4 text-xs">
                <span className="font-medium">9:41</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                  <div className="w-6 h-2 bg-green-500 rounded-sm"></div>
                </div>
              </div>
            )}
            
            {/* Content Area */}
            <div className={cn(
              "w-full h-full overflow-hidden relative",
              currentDevice === 'mobile' && "h-[calc(100%-1.5rem)]"
            )}>
              {content}
            </div>
          </div>
          
          {/* Home Button (Mobile only) */}
          {currentDevice === 'mobile' && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
          )}
        </div>
      </div>
    )
  }

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Loading Preview</h3>
          <p className="text-muted-foreground">Preparing your campaign preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Preview Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadCampaign} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!campaign || sections.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Content</h3>
          <p className="text-muted-foreground">This campaign doesn't have any sections to preview.</p>
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-muted">
      {/* Device-specific styling */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-optimized {
            font-size: 14px;
          }
        }
      `}</style>

      {/* Preview Mode Indicator */}
      <div className="bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">
              Preview Mode - {campaign.name}
            </span>
            
            {/* Mode Indicators */}
            <div className="flex items-center space-x-2">
              {previewConfig.bypassDisplayRules && (
                <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                  All Sections
                </Badge>
              )}
              
              {previewConfig.enableAITesting && (
                <Badge variant="secondary" className="bg-purple-500 text-white text-xs">
                  <TestTube className="h-3 w-3 mr-1" />
                  AI Testing
                </Badge>
              )}
              
              {previewConfig.showDebugInfo && (
                <Badge variant="secondary" className="bg-gray-500 text-white text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Debug
                </Badge>
              )}
            </div>
          </div>

          {/* Device Toggle Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-blue-100 mr-2">Device:</span>
            <div className="flex border border-blue-400 rounded-lg overflow-hidden">
              {Object.entries(DEVICE_CONFIGS).map(([key, deviceConfig]) => {
                const IconComponent = deviceConfig.icon
                return (
                  <Button
                    key={key}
                    variant={currentDevice === key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleDeviceChange(key as PreviewDevice)}
                    className={cn(
                      "h-8 px-3 rounded-none border-0 text-white hover:text-gray-900",
                      currentDevice === key 
                        ? "bg-white text-blue-600" 
                        : "hover:bg-blue-500"
                    )}
                    title={deviceConfig.description}
                  >
                    <IconComponent className="h-3 w-3" />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section Content */}
      {renderDeviceFrame(
        <div className="min-h-full bg-background">
          {/* Show only the current section */}
          {sections.length > 0 && previewState.currentSection < sections.length && (
            <SectionRenderer
              section={sections[previewState.currentSection]}
              sectionIndex={previewState.currentSection}
              isActive={true}
              userInputs={previewState.userInputs}
              aiOutputs={previewState.aiOutputs}
              previewConfig={previewConfig}
              onSectionComplete={handleSectionComplete}
              onUpdate={handleSectionUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              currentSectionIndex={previewState.currentSection}
              totalSections={sections.length}
              sections={sections}
            />
          )}
        </div>
      )}


    </div>
  )
} 