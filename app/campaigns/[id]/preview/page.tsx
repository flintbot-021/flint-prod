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
  Smartphone
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

// Simulate AI processing with realistic delays and sample outputs
const simulateAIProcessing = async (prompt: string, userInputs: Record<string, any>) => {
  // Simulate processing delay (1-3 seconds)
  const delay = Math.random() * 2000 + 1000
  await new Promise(resolve => setTimeout(resolve, delay))

  // Generate realistic sample outputs based on inputs
  const recommendation = generateRecommendation(userInputs)
  const score = Math.floor(Math.random() * 40) + 60 // 60-100 range
  const insights = generateInsights(userInputs)

  return {
    recommendation,
    score,
    insights,
    processingTime: Math.round(delay),
    prompt: prompt,
    interpolatedPrompt: interpolatePrompt(prompt, userInputs)
  }
}

const generateRecommendation = (inputs: Record<string, any>) => {
  const name = inputs.name || 'User'
  const goal = inputs.goal || 'growth'
  
  const recommendations = {
    growth: `${name}, based on your focus on business growth, I recommend implementing a customer acquisition strategy that leverages digital marketing channels. Focus on building strong brand awareness and customer loyalty programs.`,
    efficiency: `${name}, since you're prioritizing efficiency, consider automating your core business processes and implementing lean methodologies. This will help reduce operational overhead while maintaining quality.`,
    innovation: `${name}, with your interest in innovation, I suggest investing in emerging technologies that align with your industry. Consider establishing partnerships with tech companies and fostering a culture of continuous learning.`
  }
  
  return recommendations[goal as keyof typeof recommendations] || recommendations.growth
}

const generateInsights = (inputs: Record<string, any>) => {
  const insights = []
  
  if (inputs.name) {
    insights.push(`User engagement level: High (provided personal information)`)
  }
  if (inputs.email) {
    insights.push(`Email domain analysis: ${inputs.email.includes('@gmail.com') ? 'Personal' : 'Professional'} email`)
  }
  if (inputs.goal) {
    insights.push(`Primary focus area: ${inputs.goal} - this indicates a ${inputs.goal === 'growth' ? 'scaling' : inputs.goal === 'efficiency' ? 'optimization' : 'transformation'} mindset`)
  }
  
  return insights
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
  
  // Example: Logic sections only appear after certain inputs
  if (section.type === 'logic' && !userInputs.name && !userInputs.email) {
    return false
  }
  
  // Example: Output sections only appear after AI processing
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
  onUpdate
}: {
  section: CampaignSection
  sectionIndex: number
  isActive: boolean
  userInputs: Record<string, any>
  aiOutputs: Record<string, any>
  previewConfig: PreviewModeConfig
  onSectionComplete: (sectionIndex: number, data: any) => void
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<any>(null)

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
      const prompt = settings.prompt || 'Analyze the user inputs and provide recommendations.'
      
      const results = await simulateAIProcessing(prompt, userInputs)
      setProcessingResults(results)
      
      // Complete the section with AI outputs
      onSectionComplete(sectionIndex, {
        aiProcessing: true,
        ...results
      })
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
      case 'text_question':
        return (
          <div className="bg-background rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {(settings as any).title || 'Capture Section'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {(settings as any).content || 'This is a capture section for collecting user information.'}
            </p>
            <div className="space-y-4">
              {/* Handle text_question type */}
              {section.type === 'text_question' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {(settings as any).question || (settings as any).content || 'Your answer'}
                    {(settings as any).required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={(settings as any).inputType || 'text'}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={(settings as any).placeholder || 'Type your answer here...'}
                    maxLength={(settings as any).maxLength || 500}
                    onChange={(e) => {
                      if (previewConfig.enableAITesting) {
                        const newInputs = { ...userInputs, [section.id]: e.target.value }
                        onSectionComplete(sectionIndex, newInputs)
                      }
                    }}
                  />
                </div>
              ) : (
                // Handle capture/fields type
                ((settings as any).fields || [
                  { id: 'name', type: 'text', label: 'Full Name', required: true },
                  { id: 'email', type: 'email', label: 'Email Address', required: true }
                ]).map((field: any, index: number) => (
                <div key={field.id || index}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type || 'text'}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    defaultValue={userInputs[field.id] || ''}
                      onChange={(e) => {
                        // In testing mode, immediately update inputs
                        if (previewConfig.enableAITesting) {
                          const newInputs = { ...userInputs, [field.id]: e.target.value }
                          onSectionComplete(sectionIndex, newInputs)
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            <div className="mt-6">
              <Button 
                onClick={() => {
                  const formData = new FormData(document.querySelector('form') as HTMLFormElement)
                  const data: Record<string, any> = {}
                  formData.forEach((value, key) => {
                    data[key] = value
                  })
                  onSectionComplete(sectionIndex, data)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </Button>
            </div>
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="mt-4 p-3 bg-muted rounded border-l-4 border-blue-500">
                <p className="text-xs font-medium text-foreground">Debug: Capture Section</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Collected: {Object.keys(userInputs).join(', ') || 'None'}
                </p>
              </div>
            )}
          </div>
        )
      
      case 'choice':
      case 'multiple_choice':
        return (
          <div className="bg-background rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {(settings as any).title || (settings as any).question || 'Make Your Choice'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {(settings as any).content || 'Please select from the following options.'}
            </p>
            <div className="space-y-3">
              {((settings as any).options || (settings as any).choices || [
                { id: 'option-1', text: 'Option 1', value: 'option1' },
                { id: 'option-2', text: 'Option 2', value: 'option2' },
                { id: 'option-3', text: 'Option 3', value: 'option3' }
              ]).map((choice: any, index: number) => (
                <div
                  key={choice.id || index}
                  className="p-4 border border-border rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => onSectionComplete(sectionIndex, { choice: choice.text || choice.value, [choice.id || `option-${index}`]: choice.text || choice.value })}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 border border-input rounded mr-3"></div>
                    <span className="text-foreground">{choice.text}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="mt-4 p-3 bg-muted rounded border-l-4 border-green-500">
                <p className="text-xs font-medium text-foreground">Debug: Choice Section</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available choices: {((settings as any).choices || []).length}
                </p>
              </div>
            )}
          </div>
        )
      
      case 'logic':
        return (
          <div className="bg-background rounded-lg shadow-sm p-8 text-center">
            <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {(settings as any).title || 'AI Processing'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {(settings as any).content || 'Our AI is analyzing your responses...'}
            </p>
            
            {/* Show processing state */}
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            ) : processingResults ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg text-left">
                  <h4 className="font-medium text-green-800 mb-2">✅ Processing Complete</h4>
                  <p className="text-sm text-green-700">{processingResults.recommendation}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-green-600">
                    <span>Score: {processingResults.score}/100</span>
                    <span>Time: {processingResults.processingTime}ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <Button 
                  onClick={handleAIProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={Object.keys(userInputs).length === 0}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {previewConfig.enableAITesting ? 'Test AI Processing' : 'Start Processing'}
                </Button>
                
                {Object.keys(userInputs).length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Complete previous sections to enable AI processing
                  </p>
                )}
              </div>
            )}
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="p-3 bg-muted rounded border-l-4 border-purple-500 text-left">
                <p className="text-xs font-medium text-foreground">Debug: AI Logic Section</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <p>Prompt: {(settings as any).prompt || 'No prompt defined'}</p>
                  <p>Available inputs: {Object.keys(userInputs).join(', ') || 'None'}</p>
                  {processingResults && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Processing Results</summary>
                      <pre className="mt-1 text-xs bg-accent p-2 rounded overflow-auto">
                        {JSON.stringify(processingResults, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      
      case 'output-results':
      case 'output-download':
      case 'output-redirect':
        return (
          <div>
            <OutputSection
              {...baseProps}
            />
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="mt-4 p-3 bg-muted rounded border-l-4 border-orange-500">
                <p className="text-xs font-medium text-foreground">Debug: Output Section</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <p>Type: {section.type}</p>
                  <p>Available variables: {Object.keys({...userInputs, ...aiOutputs}).join(', ') || 'None'}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Variable Context</summary>
                    <pre className="mt-1 text-xs bg-accent p-2 rounded overflow-auto">
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
          <div className="text-center py-12">
            <IconComponent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {typeLabel} Section
            </h3>
            <p className="text-muted-foreground">
              This section type is not yet implemented in preview mode.
            </p>
            
            {/* Debug Info */}
            {previewConfig.showDebugInfo && (
              <div className="mt-4 p-3 bg-muted rounded border-l-4 border-gray-500 text-left max-w-md mx-auto">
                <p className="text-xs font-medium text-foreground">Debug: Unknown Section Type</p>
                <p className="text-xs text-muted-foreground mt-1">Type: {section.type}</p>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300",
        isActive ? "opacity-100" : "opacity-50 pointer-events-none"
      )}
    >
      {/* Section Header */}
      <div className="bg-background border-b py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="h-5 w-5 text-blue-600" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {typeLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">Section {sectionIndex + 1}</span>
            
            {/* Testing Mode Indicators */}
            {previewConfig.enableAITesting && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <TestTube className="h-3 w-3 mr-1" />
                Testing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isActive ? "default" : "secondary"} 
              className="text-xs"
            >
              {isActive ? 'Active' : 'Preview'}
            </Badge>
            
            {previewConfig.showDebugInfo && (
              <Badge variant="outline" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Debug
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="py-8 px-6 bg-muted min-h-[calc(100vh-80px)]">
        {renderSectionContent()}
      </div>
    </div>
  )
}

// =============================================================================
// PREVIEW NAVIGATION
// =============================================================================

function PreviewNavigation({
  currentSection,
  totalSections,
  onPrevious,
  onNext,
  sections,
  completedSections,
  previewConfig,
  onConfigChange
}: {
  currentSection: number
  totalSections: number
  onPrevious: () => void
  onNext: () => void
  sections: CampaignSection[]
  completedSections: Set<number>
  previewConfig: PreviewModeConfig
  onConfigChange: (config: Partial<PreviewModeConfig>) => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentSection <= 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-4">
            {/* Preview Mode Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onConfigChange({ enableAITesting: !previewConfig.enableAITesting })}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors",
                  previewConfig.enableAITesting 
                    ? "bg-purple-100 text-purple-700 border-purple-200" 
                    : "bg-accent text-muted-foreground border-border hover:bg-gray-200"
                )}
              >
                <TestTube className="h-3 w-3 mr-1 inline" />
                AI Testing
              </button>
              
              <button
                onClick={() => onConfigChange({ showDebugInfo: !previewConfig.showDebugInfo })}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors",
                  previewConfig.showDebugInfo 
                    ? "bg-gray-800 text-white border-gray-700" 
                    : "bg-accent text-muted-foreground border-border hover:bg-gray-200"
                )}
              >
                <Settings className="h-3 w-3 mr-1 inline" />
                Debug
              </button>
              
              <button
                onClick={() => onConfigChange({ bypassDisplayRules: !previewConfig.bypassDisplayRules })}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors",
                  previewConfig.bypassDisplayRules 
                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                    : "bg-accent text-muted-foreground border-border hover:bg-gray-200"
                )}
              >
                <Eye className="h-3 w-3 mr-1 inline" />
                All Sections
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {currentSection + 1} of {totalSections}
              </span>
              
              {/* Progress Dots */}
              <div className="flex space-x-1">
                {sections.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentSection
                        ? "bg-blue-600"
                        : completedSections.has(index)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentSection >= totalSections - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
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
      }

      return newState
    })

    // Auto-advance to next section in sequence mode
    if (previewConfig.mode === 'sequence' && sectionIndex < sections.length - 1) {
      const delay = previewConfig.simulateRealTiming ? 1500 : 1000
      setTimeout(() => {
        handleNext()
      }, delay)
    }
  }

  const handleSectionUpdate = async (updates: Partial<CampaignSection>) => {
    // In preview mode, we don't actually update the sections
    // This is just to satisfy the component interface
    console.log('Section update in preview mode:', updates)
  }

  const handlePrevious = () => {
    setPreviewState(prev => ({
      ...prev,
      currentSection: Math.max(0, prev.currentSection - 1)
    }))
  }

  const handleNext = () => {
    setPreviewState(prev => ({
      ...prev,
      currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
    }))
  }

  const handleConfigChange = (configUpdates: Partial<PreviewModeConfig>) => {
    setPreviewConfig(prev => {
      const newConfig = { ...prev, ...configUpdates }
      
      // If bypass display rules changes, reload sections
      if ('bypassDisplayRules' in configUpdates) {
        // Trigger section reload with new rules
        setTimeout(() => loadCampaign(), 100)
      }
      
      return newConfig
    })
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
          {sections.map((section, index) => (
            <SectionRenderer
              key={section.id}
              section={section}
              sectionIndex={index}
              isActive={index === previewState.currentSection}
              userInputs={previewState.userInputs}
              aiOutputs={previewState.aiOutputs}
              previewConfig={previewConfig}
              onSectionComplete={handleSectionComplete}
              onUpdate={handleSectionUpdate}
            />
          ))}
        </div>
      )}

      {/* Preview Navigation */}
      <PreviewNavigation
        currentSection={previewState.currentSection}
        totalSections={sections.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        sections={sections}
        completedSections={previewState.completedSections}
        previewConfig={previewConfig}
        onConfigChange={handleConfigChange}
      />
    </div>
  )
} 