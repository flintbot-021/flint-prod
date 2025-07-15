'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, X, ExternalLink, Download, Link as LinkIcon } from 'lucide-react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { VariableSuggestionDropdown } from '@/components/ui/variable-suggestion-dropdown'
import { VariableInterpolatedContent } from '@/components/ui/variable-interpolated-content'
import { UnsplashImageSelector } from '@/components/ui/unsplash-image-selector'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
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
  // Button settings
  showButton?: boolean
  buttonText?: string
  buttonType?: 'link' | 'download'
  buttonUrl?: string
  buttonFile?: {
    id: string
    name: string
    url: string
    size: number
  }
}

interface SimpleVariable {
  name: string
  type: 'input' | 'output' | 'capture'
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
  
  console.log('🔍 getSimpleVariables - Processing sections:', precedingSections.map(s => ({ 
    id: s.id, 
    type: s.type, 
    title: s.title,
    order: s.order 
  })))
  
  precedingSections.forEach(section => {
    console.log(`🔍 Processing section ${section.id} (type: ${section.type}, title: ${section.title})`)
    
    // Extract from capture sections FIRST (before general question processing)
    if (section.type.includes('capture')) {
      console.log('✅ Matched capture section logic')
      const captureSettings = section.settings as any
      const enabledFields = captureSettings?.enabledFields || { name: true, email: true, phone: false }
      const fieldLabels = captureSettings?.fieldLabels || { name: 'Full Name', email: 'Email Address', phone: 'Phone Number' }
      
      console.log('📋 Capture settings:', { enabledFields, fieldLabels })
      
      if (enabledFields.name) {
        variables.push({
          name: 'name',
          type: 'capture',
          description: fieldLabels.name || 'Full Name',
          sampleValue: 'Joe Bloggs'
        })
        console.log('✅ Added name variable')
      }
      
      if (enabledFields.email) {
        variables.push({
          name: 'email',
          type: 'capture',
          description: fieldLabels.email || 'Email Address',
          sampleValue: 'joe@email.com'
        })
        console.log('✅ Added email variable')
      }
      
      if (enabledFields.phone) {
        variables.push({
          name: 'phone',
          type: 'capture',
          description: fieldLabels.phone || 'Phone Number',
          sampleValue: '+12 345 6789'
        })
        console.log('✅ Added phone variable')
      }
    }
    // Extract from question sections (but exclude capture sections)
    else if (isQuestionSection(section.type) && section.title && !section.type.includes('capture')) {
      console.log('✅ Matched question section logic')
      const settings = section.settings as any
      const variableName = settings?.variableName || titleToVariableName(section.title)
      
      variables.push({
        name: variableName,
        type: 'input',
        description: section.title || 'User input',
        sampleValue: settings?.placeholder || 'Sample answer'
      })
      console.log(`✅ Added question variable: ${variableName}`)
    }
    // Extract from AI logic sections
    else if (section.type === 'logic-ai') {
      console.log('✅ Matched AI logic section')
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
            console.log(`✅ Added AI variable: ${variable.name}`)
          }
        })
      }
    } else {
      console.log(`⚠️ No matching logic for section type: ${section.type}`)
    }
  })
  
  console.log('🎯 Final extracted variables:', variables)
  return variables
}

// Generate sample values - Use AI test results if available, fallback to defaults
function getSampleValue(variableName: string): string {
  // First, check for hardcoded capture section values
  switch (variableName.toLowerCase()) {
    case 'name':
      return 'Joe Bloggs'
    case 'email':
      return 'joe@email.com'
    case 'phone':
      return '+12 345 6789'
  }
  
  // Then, try to get real AI test result
  const aiTestValue = getAITestResult(variableName)
  console.log(`🔍 getSampleValue for "${variableName}":`, { 
    aiTestValue, 
    aiTestValueType: typeof aiTestValue,
    willUseAIValue: aiTestValue !== null 
  })
  
  if (aiTestValue !== null) {
    const stringValue = String(aiTestValue)
    console.log(`✅ Using AI test value for "${variableName}":`, stringValue)
    return stringValue
  }

  // Fallback to default sample values for AI outputs
  let defaultValue: string
  switch (variableName.toLowerCase()) {
    case 'recommendation':
    case 'advice':
      defaultValue = 'Based on your answers, we recommend...'
      break
    case 'score':
    case 'rating':
      defaultValue = '85'
      break
    case 'category':
    case 'type':
      defaultValue = 'Intermediate'
      break
    case 'plan':
    case 'strategy':
      defaultValue = 'Your personalized plan...'
      break
    default:
      defaultValue = `Generated ${variableName}`
  }
  
  console.log(`⚠️ Using default value for "${variableName}":`, defaultValue)
  return defaultValue
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
  
  // Always ensure capture section values are available with hardcoded samples
  // (These will be overridden by AI test results if they exist)
  if (!context.name) context.name = 'Joe Bloggs'
  if (!context.email) context.email = 'joe@email.com'
  if (!context.phone) context.phone = '+12 345 6789'
  
  // Add defaults if no variables
  if (variables.length === 0) {
    context.name = 'Joe Bloggs'
    context.email = 'joe@email.com'
    context.phone = '+12 345 6789'
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
  const [isUploadingButtonFile, setIsUploadingButtonFile] = useState(false)
  
  // Local state for tracking external content changes
  const [localContent, setLocalContent] = useState('')
  const [localTitle, setLocalTitle] = useState('')
  const [localSubtitle, setLocalSubtitle] = useState('')
  const [localButtonText, setLocalButtonText] = useState('')
  
  // Get current settings with defaults
  const settings = section.settings as OutputSettings || {}
  const {
    title = 'Headline goes here',
    subtitle = 'Subheading',
    content = 'Paragraph',
    image = '',
    textAlignment = 'center',
    showButton = false,
    buttonText = 'Download Now',
    buttonType = 'link',
    buttonUrl = '',
    buttonFile
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
  
  // Sync local button text state with external changes
  useEffect(() => {
    setLocalButtonText(buttonText)
  }, [buttonText])

  // Initialize local state on mount
  useEffect(() => {
    setLocalTitle(title)
    setLocalSubtitle(subtitle)
    setLocalButtonText(buttonText)
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
      if (newSettings.buttonText !== undefined) setLocalButtonText(newSettings.buttonText)
      
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
      if (newSettings.buttonText !== undefined) setLocalButtonText(buttonText)
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

  // Handle button file upload
  const handleButtonFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    const file = files[0]
    
    // Allow various file types for downloads
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please select a supported file type (PDF, Word, Excel, CSV, Text, or ZIP)')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for downloads
      alert('File size must be less than 50MB')
      return
    }

    setIsUploadingButtonFile(true)
    
    try {
      // TODO: Get actual campaign ID from context
      const campaignId = 'demo-campaign'
      
      const uploadedFiles = await uploadFiles(
        [file],
        campaignId,
        'output-button-files'
      )
      
      if (uploadedFiles.length > 0) {
        const uploadedFile = uploadedFiles[0]
        await updateSettings({ 
          buttonFile: {
            id: uploadedFile.id,
            name: file.name,
            url: uploadedFile.url,
            size: file.size
          }
        })
      }
    } catch (error) {
      console.error('File upload failed:', error)
      alert('File upload failed. Please try again.')
    } finally {
      setIsUploadingButtonFile(false)
    }
  }, [])

  // Handle button settings
  const handleButtonSettingChange = async (setting: keyof OutputSettings, value: any) => {
    await updateSettings({ [setting]: value })
  }

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
                  {(() => {
                    console.log('🎯 About to render VariableInterpolatedContent for TITLE with:', {
                      content: localTitle || title,
                      contextVariableCount: Object.keys(variableContext.variables).length,
                      contextVariables: variableContext.variables
                    })
                    return (
                      <VariableInterpolatedContent
                        content={localTitle || title}
                        context={variableContext}
                        showPreview={true}
                        enableRealTimeProcessing={true}
                      />
                    )
                  })()}
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

              {/* Action Button */}
              {showButton && (
                <div className="pt-8">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                    onClick={() => {
                      if (buttonType === 'link' && buttonUrl) {
                        window.open(buttonUrl, '_blank')
                      } else if (buttonType === 'download' && buttonFile) {
                        // Create download link
                        const link = document.createElement('a')
                        link.href = buttonFile.url
                        link.download = buttonFile.name
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }
                    }}
                  >
                    {buttonType === 'link' ? (
                      <ExternalLink className="h-5 w-5 mr-2" />
                    ) : (
                      <Download className="h-5 w-5 mr-2" />
                    )}
                    {buttonText}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ResultsGate>
    )
  }

  // Build Mode - Identical to BasicSection but with @ variable support and button configuration
  return (
    <div className={cn('py-16 space-y-6 max-w-2xl mx-auto', className)}>
      
      {/* Image Selector with Unsplash */}
      <UnsplashImageSelector
        onImageSelect={(imageUrl) => updateSettings({ image: imageUrl })}
        onUpload={handleImageUpload}
        currentImage={image}
        isUploading={isUploading}
        placeholder="Search for section images..."
      />

      {/* Title - With variable dropdown support */}
      <div>
        <VariableSuggestionDropdown
          value={localTitle}
          onChange={setLocalTitle}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          autoSave={true}
          placeholder="Headline goes here"
          className="w-full"
          inputClassName="!text-3xl !font-bold !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto !min-h-[3rem] !leading-tight placeholder:text-gray-600"
          variables={availableVariables}
          multiline={false}
        />
      </div>

      {/* Subtitle - With variable dropdown support */}
      <div className="pt-4">
        <VariableSuggestionDropdown
          value={localSubtitle}
          onChange={setLocalSubtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          autoSave={true}
          placeholder="Subheading"
          className="w-full"
          inputClassName="!text-xl !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto !min-h-[2rem] !leading-tight placeholder:text-gray-600"
          variables={availableVariables}
          multiline={false}
        />
      </div>

      {/* Rich Text Content - With @ variable dropdown support */}
      <div className="pt-6">
        <VariableSuggestionDropdown
          value={localContent}
          onChange={setLocalContent}
          onSave={(newContent) => updateSettings({ content: newContent })}
          autoSave={true}
          placeholder="Paragraph"
          className="w-full"
          inputClassName="!text-lg !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto !leading-relaxed placeholder:text-gray-600 resize-none"
          variables={availableVariables}
          multiline={true}
        />
      </div>

      {/* Button Configuration */}
      <div className="space-y-6 pt-8 border-t border-border">
        <h3 className="text-sm font-medium text-foreground">Action Button</h3>
        
        {/* Enable Button Toggle */}
        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
          <div className="flex items-center space-x-3">
            <LinkIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Show Action Button</span>
          </div>
          <Switch
            checked={showButton}
            onCheckedChange={(checked) => handleButtonSettingChange('showButton', checked)}
            className="scale-75"
          />
        </div>

        {/* Button Configuration (only show if enabled) */}
        {showButton && (
          <div className="space-y-4">
            {/* Button Text */}
            <div className="space-y-2">
              <Label htmlFor="button-text" className="text-sm font-medium text-foreground">
                Button Text
              </Label>
              <Input
                id="button-text"
                value={localButtonText}
                onChange={(e) => setLocalButtonText(e.target.value)}
                onBlur={() => handleButtonSettingChange('buttonText', localButtonText)}
                placeholder="Download Now"
                className="w-full"
              />
            </div>

            {/* Button Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Button Action</Label>
              
              <div className="space-y-2">
                {/* Link Option */}
                <div 
                  className={cn(
                    "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                    buttonType === 'link' 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-border hover:bg-accent"
                  )}
                  onClick={() => handleButtonSettingChange('buttonType', 'link')}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Link to URL</div>
                      <div className="text-xs text-muted-foreground">Open a website or page in new tab</div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 rounded-full",
                    buttonType === 'link' 
                      ? "border-blue-500 bg-blue-500" 
                      : "border-muted-foreground"
                  )}>
                    {buttonType === 'link' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>

                {/* Download Option */}
                <div 
                  className={cn(
                    "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                    buttonType === 'download' 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-border hover:bg-accent"
                  )}
                  onClick={() => handleButtonSettingChange('buttonType', 'download')}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Download className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Download File</div>
                      <div className="text-xs text-muted-foreground">Let users download a file (PDF, document, etc.)</div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 border-2 rounded-full",
                    buttonType === 'download' 
                      ? "border-blue-500 bg-blue-500" 
                      : "border-muted-foreground"
                  )}>
                    {buttonType === 'download' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* URL Input (for link type) */}
            {buttonType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="button-url" className="text-sm font-medium text-foreground">
                  Destination URL
                </Label>
                <Input
                  id="button-url"
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => handleButtonSettingChange('buttonUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL to open when the button is clicked
                </p>
              </div>
            )}

            {/* File Upload (for download type) */}
            {buttonType === 'download' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Download File
                </Label>
                
                {!buttonFile ? (
                  <div>
                    <input
                      type="file"
                      id="button-file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                      onChange={(e) => e.target.files && handleButtonFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('button-file-upload')?.click()}
                      disabled={isUploadingButtonFile}
                      className="w-full"
                    >
                      {isUploadingButtonFile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{buttonFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(buttonFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleButtonSettingChange('buttonFile', undefined)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, Word, Excel, CSV, Text, ZIP (max 50MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OutputSection 