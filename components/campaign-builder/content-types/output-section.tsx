'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, X, Hash } from 'lucide-react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { VariableInterpolatedContent } from '@/components/ui/variable-interpolated-content'
import { uploadFiles } from '@/lib/supabase/storage'
import { ResultsGate } from '../results-gate'
import type { VariableInterpolationContext } from '@/lib/types/output-section'
import { Badge } from '@/components/ui/badge'
import { getAITestResults, hasAITestResults, getAITestResult } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface OutputSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  allSections?: CampaignSection[]
}

interface OutputSettings {
  title?: string
  subtitle?: string
  content?: string
  image?: string
  textAlignment?: 'left' | 'center' | 'right'
}

interface SimpleVariable {
  name: string
  type: 'input' | 'output'
  description: string
  sampleValue: string
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Simple variable extraction
function getSimpleVariables(sections: CampaignSection[], currentOrder: number): SimpleVariable[] {
  const variables: SimpleVariable[] = []
  const precedingSections = sections.filter(s => s.order < currentOrder)
  
  precedingSections.forEach(section => {
    // Extract from question sections
    if (isQuestionSection(section.type) && section.title) {
      const settings = section.settings as any
      const variableName = settings?.variableName || titleToVariableName(section.title)
      
      variables.push({
        name: variableName,
        type: 'input',
        description: section.title || 'User input',
        sampleValue: settings?.placeholder || 'Sample answer'
      })
    }
    
    // Extract from AI logic sections
    if (section.type === 'logic-ai') {
      const aiSettings = section.settings as any
      if (aiSettings?.outputVariables && Array.isArray(aiSettings.outputVariables)) {
        aiSettings.outputVariables.forEach((variable: any) => {
          if (variable.name) {
            variables.push({
              name: variable.name,
              type: 'output',
              description: variable.description || 'AI generated output',
              sampleValue: getSampleValue(variable.name)
            })
          }
        })
      }
    }
  })
  
  return variables
}

// Generate sample values - Use AI test results if available, fallback to defaults
function getSampleValue(variableName: string): string {
  // First, try to get real AI test result
  const aiTestValue = getAITestResult(variableName)
  if (aiTestValue !== null) {
    return String(aiTestValue)
  }

  // Fallback to default sample values
  switch (variableName.toLowerCase()) {
    case 'recommendation':
    case 'advice':
      return 'Based on your answers, we recommend...'
    case 'score':
    case 'rating':
      return '85'
    case 'category':
    case 'type':
      return 'Intermediate'
    case 'plan':
    case 'strategy':
      return 'Your personalized plan...'
    default:
      return `Generated ${variableName}`
  }
}

// Generate sample data context - Enhanced with AI test results
function generateSampleContext(variables: SimpleVariable[]): Record<string, string> {
  const context: Record<string, string> = {}
  
  // Get any stored AI test results
  const aiTestResults = getAITestResults()
  
  variables.forEach(variable => {
    context[variable.name] = variable.sampleValue
  })
  
  // Merge in AI test results (they take priority over defaults)
  Object.assign(context, aiTestResults)
  
  // Add defaults if no variables
  if (variables.length === 0) {
    context.name = 'Alex Johnson'
    context.score = '85'
    context.recommendation = 'Based on your answers, we recommend focusing on strength training.'
    
    // If we have AI test results, add those too
    Object.assign(context, aiTestResults)
  }
  
  return context
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OutputSection({
  section,
  isPreview = false,
  onUpdate,
  className,
  allSections = []
}: OutputSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [aiTestDataTimestamp, setAiTestDataTimestamp] = useState(0)
  
  // Local state for tracking external content changes
  const [localContent, setLocalContent] = useState('')
  const [localTitle, setLocalTitle] = useState('')
  const [localSubtitle, setLocalSubtitle] = useState('')
  
  // Get current settings with defaults
  const settings = section.settings as OutputSettings || {}
  const {
    title = 'Your Results',
    subtitle = 'Based on your answers, here\'s what we found',
    content = 'Hello @name! Your score is @score out of 100.\n\n@recommendation\n\nThanks for taking our quiz!',
    image = '',
    textAlignment = 'center'
  } = settings

  // Sync local state with external settings changes (e.g., from variable updates)
  useEffect(() => {
    setLocalTitle(title)
  }, [title])
  
  useEffect(() => {
    setLocalSubtitle(subtitle)
  }, [subtitle])
  
  useEffect(() => {
    if (settings.content !== undefined) {
      console.log(`🔄 Content-types output section ${section.id} content updated:`, {
        from: localContent,
        to: settings.content
      })
      setLocalContent(settings.content)
    }
  }, [settings.content, section.id])
  
  // Initialize local state on mount
  useEffect(() => {
    setLocalTitle(title)
    setLocalSubtitle(subtitle)
    if (settings.content !== undefined) {
      setLocalContent(settings.content)
    }
  }, [])

  // Extract variables from campaign sections
  const availableVariables = useMemo(() => 
    getSimpleVariables(allSections, section.order || 0), 
    [allSections, section.order]
  )

  // Listen for localStorage changes to refresh AI test data
  useEffect(() => {
    const handleStorageChange = () => {
      setAiTestDataTimestamp(Date.now())
    }

    // Listen for storage events (works for changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('aiTestResultsUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('aiTestResultsUpdated', handleStorageChange)
    }
  }, [])

  // Generate sample data - Include AI test results in dependency array
  const sampleValues = useMemo(() => {
    return generateSampleContext(availableVariables)
  }, [availableVariables, aiTestDataTimestamp]) // Re-compute when AI test results change

  // Create variable interpolation context
  const variableContext: VariableInterpolationContext = {
    variables: sampleValues,
    availableVariables: [], // Will be empty for now to avoid type issues
    formatters: {},
    conditionalRules: []
  }

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<OutputSettings>) => {
    try {
      // Update local state immediately for responsive UI
      if (newSettings.title !== undefined) setLocalTitle(newSettings.title)
      if (newSettings.subtitle !== undefined) setLocalSubtitle(newSettings.subtitle)
      if (newSettings.content !== undefined) setLocalContent(newSettings.content)
      
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update output settings:', error)
      // Revert local state on error
      if (newSettings.title !== undefined) setLocalTitle(title)
      if (newSettings.subtitle !== undefined) setLocalSubtitle(subtitle)
      if (newSettings.content !== undefined) setLocalContent(content)
      throw error
    }
  }

  // Handle image upload (identical to BasicSection)
  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    
    try {
      // TODO: Get actual campaign ID from context
      const campaignId = 'demo-campaign'
      
      const uploadedFiles = await uploadFiles(
        [file],
        campaignId,
        'output-sections'
      )
      
      if (uploadedFiles.length > 0) {
        await updateSettings({ image: uploadedFiles[0].url })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Handle image removal
  const handleImageRemove = useCallback(async () => {
    await updateSettings({ image: '' })
  }, [])

  // Get text alignment class
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }

  if (isPreview) {
    // Preview Mode - What end users see
    return (
      <ResultsGate>
        <div className={cn('py-16 px-6', className)}>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Image */}
            {image && (
              <div className="w-full">
                <img 
                  src={image}
                  alt={title || 'Section image'}
                  className="w-full h-64 md:h-80 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Text Content with Variable Interpolation */}
            <div className={cn('space-y-6', getAlignmentClass(textAlignment))}>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  <VariableInterpolatedContent
                    content={localTitle || title}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                </h1>
                
                {(localSubtitle || subtitle) && (
                  <div className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                    <VariableInterpolatedContent
                      content={localSubtitle || subtitle}
                      context={variableContext}
                      showPreview={true}
                      enableRealTimeProcessing={true}
                    />
                  </div>
                )}
              </div>

              {(localContent || content) && (
                <div className="text-lg text-foreground max-w-4xl mx-auto leading-relaxed">
                  <VariableInterpolatedContent
                    content={localContent || content}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ResultsGate>
    )
  }

  // Build Mode - Identical to BasicSection but with @ variable support
  return (
    <div className={cn('py-16 space-y-6 max-w-2xl mx-auto', className)}>
      
      {/* Image Upload Area (identical to BasicSection) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Section Image</label>
        
        {image ? (
          <div className="relative group">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img 
                src={image}
                alt="Section image"
                className="w-full h-full object-cover"
              />
              
              {/* Remove button */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={handleImageRemove}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
            <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload image'}
              </p>
              <p className="text-xs">PNG, JPG up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Title - Seamless inline editing */}
      <div>
        <InlineEditableText
          value={localTitle}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          autoSave={false}
          placeholder="Your Results"
          className="!text-3xl font-bold text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-3xl font-bold !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="heading"
        />
      </div>

      {/* Subtitle - Seamless inline editing */}
      <div className="pt-4">
        <InlineEditableText
          value={localSubtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          autoSave={false}
          placeholder="Based on your answers, here's what we found"
          className="!text-xl text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-xl !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="body"
        />
      </div>

      {/* Rich Text Content - With @ variable support */}
      <div className="pt-6">
        <InlineEditableText
          value={localContent}
          onSave={(newContent) => updateSettings({ content: newContent })}
          autoSave={false}
          placeholder="Hello @name! Your score is @score out of 100. Use @ to insert variables like @recommendation"
          className="!text-lg text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0 !min-h-32"
          inputClassName="!text-lg !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent !min-h-32"
          showEditIcon={false}
          variant="body"
          multiline={true}
        />
      </div>

      {/* Available Variables Section - Show at bottom */}
      {availableVariables.length > 0 && (
        <div className="pt-8 border-t border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-300">Available Variables</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {availableVariables.map((variable, index) => {
                const hasRealData = getAITestResult(variable.name) !== null
                
                return (
                  <div key={`${variable.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={variable.type === 'input' ? 'secondary' : 'default'}
                          className={cn(
                            'text-xs',
                            variable.type === 'input' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          )}
                        >
                          {variable.type}
                        </Badge>
                        <code className="text-sm font-mono text-orange-400">@{variable.name}</code>
                        {hasRealData && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">
                            ✅ AI Data
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {hasRealData ? 'AI Result:' : 'Sample:'}
                      </p>
                      <p className="text-xs text-gray-300 font-mono max-w-32 truncate">{variable.sampleValue}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">
                Type @ in the content above to insert these variables
              </p>
              {hasAITestResults() && (
                <p className="text-xs text-emerald-400 text-center">
                  ✅ Preview mode will show AI test results for variables marked with "AI Data"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OutputSection 