'use client'

import React, { useState, useMemo } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Target, Download, ExternalLink, FileText, Settings, Eye, Code } from 'lucide-react'
import { useInlineEdit } from '@/hooks/use-inline-edit'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { ResultsGate } from '../results-gate'
import { VariableInterpolatedContent } from '@/components/ui/variable-interpolated-content'
import { useVariableAccess } from '@/hooks/use-variable-access'
import type { 
  OutputSectionSettings, 
  VariableInterpolationContext 
} from '@/lib/types/output-section'
import { InlineContentEditor } from '@/components/ui/inline-content-editor'
import { ImageUpload, ImageInfo } from '@/components/ui/image-upload'
import { ResponsivePreview } from '@/components/ui/responsive-preview'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface OutputSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OutputSection({
  section,
  isPreview = false,
  onUpdate,
  className
}: OutputSectionProps) {
  const settings = (section.settings as unknown) as OutputSectionSettings
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Get available variables from the campaign
  const variableAccess = useVariableAccess([], 0) // Empty sections array and 0 order for now
  const availableVariables = variableAccess.availableVariables || []
  
  // Create sample values for preview (this would come from actual campaign data in production)
  const sampleValues = useMemo(() => {
    const values: Record<string, any> = {}
    availableVariables.forEach(variable => {
      // Create sample values based on variable type
      if (variable.type === 'text') {
        values[variable.name] = `Sample ${variable.name}`
      } else if (variable.type === 'number') {
        values[variable.name] = 42
      } else if (variable.type === 'boolean') {
        values[variable.name] = true
      } else if (variable.type === 'array') {
        values[variable.name] = ['Option 1', 'Option 2']
      } else if (variable.type === 'object') {
        values[variable.name] = { sample: 'data' }
      } else {
        values[variable.name] = `Sample ${variable.name}`
      }
    })
    
    // Add some common sample variables for demo
    values.name = 'John Doe'
    values.email = 'john@example.com'
    values.score = 85
    values.recommendation = 'You are doing great! Keep up the excellent work.'
    
    return values
  }, [availableVariables])

  // Create variable interpolation context
  const variableContext = useMemo((): VariableInterpolationContext => ({
    variables: sampleValues,
    availableVariables,
    formatters: {},
    conditionalRules: settings.conditionalContent || []
  }), [sampleValues, availableVariables, settings.conditionalContent])

  // =============================================================================
  // INLINE EDITING HOOKS
  // =============================================================================

  const titleEdit = useInlineEdit(settings.title || 'Your Results', {
    onSave: async (value: string) => {
      await onUpdate({
        settings: { ...settings, title: value }
      })
    }
  })

  // Replace the basic contentEdit with enhanced inline editing
  const handleContentChange = async (value: string) => {
    await onUpdate({
      settings: { ...settings, content: value }
    })
  }

  // Add image upload handler
  const handleImageChange = async (image: ImageInfo | null) => {
    await onUpdate({
      settings: { 
        ...settings, 
        headerImage: image,
        enableVariableInterpolation: settings.enableVariableInterpolation !== false
      }
    })
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleEnableInterpolation = async (enabled: boolean) => {
    await onUpdate({
      settings: { 
        ...settings, 
        enableVariableInterpolation: enabled 
      }
    })
  }

  const handleSettingsUpdate = async (newSettings: Partial<OutputSectionSettings>) => {
    await onUpdate({
      settings: { ...settings, ...newSettings }
    })
  }

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderOutputContent = () => {
    const enableInterpolation = settings.enableVariableInterpolation !== false

    switch (section.type) {
      case 'output-results':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            {/* Header Image */}
            {(settings as any).headerImage && (
              <div className="relative">
                <img
                  src={(settings as any).headerImage.url}
                  alt={(settings as any).headerImage.alt || 'Header image'}
                  className={cn(
                    "w-full object-cover rounded-t-lg",
                    (settings as any).headerImage.sizing === 'small' && "h-32",
                    (settings as any).headerImage.sizing === 'medium' && "h-48",
                    (settings as any).headerImage.sizing === 'large' && "h-64",
                    !(settings as any).headerImage.sizing && "h-48"
                  )}
                />
                {(settings as any).headerImage.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    {(settings as any).headerImage.caption}
                  </div>
                )}
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {enableInterpolation ? (
                  <VariableInterpolatedContent
                    content={settings.title}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                ) : (
                  settings.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {enableInterpolation ? (
                  <VariableInterpolatedContent
                    content={settings.content}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                    highlightVariables={isPreview}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: settings.content }} />
                )}
              </div>
              {settings.showScore && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">
                    {enableInterpolation ? (
                      <VariableInterpolatedContent
                        content="Score: @score/100"
                        context={variableContext}
                        showPreview={true}
                        enableRealTimeProcessing={true}
                      />
                    ) : (
                      'Score: 85/100'
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'output-download':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">
                {enableInterpolation ? (
                  <VariableInterpolatedContent
                    content={settings.title}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                ) : (
                  settings.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-gray-600">
                {enableInterpolation ? (
                  <VariableInterpolatedContent
                    content={settings.content}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                ) : (
                  settings.content
                )}
              </div>
              <Button 
                className="w-full"
                onClick={() => {
                  if (settings.fileUrl) {
                    window.open(settings.fileUrl, '_blank')
                  }
                }}
                disabled={!settings.fileUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                {enableInterpolation ? (
                  <VariableInterpolatedContent
                    content={settings.fileName || 'Download @name Report'}
                    context={variableContext}
                    showPreview={true}
                    enableRealTimeProcessing={true}
                  />
                ) : (
                  settings.fileName || 'Download Resource'
                )}
              </Button>
            </CardContent>
          </Card>
        )

      case 'output-redirect':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="text-center space-y-4 pt-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {enableInterpolation ? (
                    <VariableInterpolatedContent
                      content={settings.message || 'Redirecting @name...'}
                      context={variableContext}
                      showPreview={true}
                      enableRealTimeProcessing={true}
                    />
                  ) : (
                    settings.message || 'Redirecting...'
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  You will be redirected in {settings.delay || 0} seconds
                </p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="text-center space-y-4 pt-6">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {enableInterpolation ? (
                    <VariableInterpolatedContent
                      content={settings.title}
                      context={variableContext}
                      showPreview={true}
                      enableRealTimeProcessing={true}
                    />
                  ) : (
                    settings.title
                  )}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  {enableInterpolation ? (
                    <VariableInterpolatedContent
                      content={settings.content}
                      context={variableContext}
                      showPreview={true}
                      enableRealTimeProcessing={true}
                    />
                  ) : (
                    settings.content
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isPreview) {
    return (
      <ResultsGate className={className}>
        <div className="py-8">
          {renderOutputContent()}
        </div>
      </ResultsGate>
    )
  }

  // Edit Mode
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {section.type === 'output-results' ? 'Results Page' : 
             section.type === 'output-download' ? 'Download Link' :
             section.type === 'output-redirect' ? 'Redirect' : 'Output'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Title</Label>
            <InlineContentEditor
              content={settings.title || 'Your Results'}
              onChange={async (value) => {
                await onUpdate({
                  settings: { ...settings, title: value }
                })
              }}
              placeholder="Enter section title..."
              enableRichText={false}
              enableImages={false}
              enableVariables={settings.enableVariableInterpolation !== false}
              variableContext={variableContext}
              className="mt-1"
            />
            {settings.enableVariableInterpolation && (
              <div className="text-xs text-gray-500 mt-1">
                Use @variableName to insert dynamic content. Examples: @name, @score, @recommendation
              </div>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Content</Label>
            <InlineContentEditor
              content={settings.content || 'Based on your answers...'}
              onChange={handleContentChange}
              placeholder="Enter section content..."
              enableRichText={true}
              enableImages={true}
              enableVariables={settings.enableVariableInterpolation !== false}
              variableContext={variableContext}
              showWordCount={true}
              allowFullscreen={true}
              className="mt-1"
            />
            {settings.enableVariableInterpolation && (
              <div className="text-xs text-gray-500 mt-1">
                Supports variable interpolation, conditional content, and formatting. Use `{'{'}if @variable{'}'}content{'{/if}'}` for conditions.
              </div>
            )}
          </div>

          {/* Header Image Upload for Results Type */}
          {section.type === 'output-results' && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Header Image (optional)</Label>
              <ImageUpload
                value={(settings as any).headerImage || null}
                onChange={handleImageChange}
                placeholder="Add a header image to your results page"
                enableSizing={true}
                enablePositioning={false} // Header images are always full width
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Variable Interpolation Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">Variable Interpolation</Label>
        
        <div className="flex items-center space-x-3">
          <Switch
            checked={settings.enableVariableInterpolation !== false}
            onCheckedChange={handleEnableInterpolation}
            id="enable-interpolation"
          />
          <Label htmlFor="enable-interpolation" className="text-sm text-gray-600">
            Enable dynamic content with variables
          </Label>
        </div>

        {settings.enableVariableInterpolation !== false && (
          <div className="space-y-3 pl-6 border-l-2 border-emerald-200">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Code className="h-4 w-4 mr-1" />
                Debug Info
              </Button>
            </div>

            {availableVariables.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">Available Variables:</div>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.slice(0, 10).map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      @{variable.name}
                    </Badge>
                  ))}
                  {availableVariables.length > 10 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{availableVariables.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Type-specific Settings */}
      {section.type === 'output-download' && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Download Settings</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">File URL</Label>
              <Input
                value={settings.fileUrl || ''}
                onChange={(e) => onUpdate({
                  settings: { ...settings, fileUrl: e.target.value }
                })}
                placeholder="https://example.com/file.pdf"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">File Name</Label>
              <Input
                value={settings.fileName || ''}
                onChange={(e) => onUpdate({
                  settings: { ...settings, fileName: e.target.value }
                })}
                placeholder="resource.pdf"
              />
            </div>
          </div>
        </div>
      )}

      {section.type === 'output-redirect' && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Redirect Settings</Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Redirect URL</Label>
              <Input
                value={settings.url || ''}
                onChange={(e) => onUpdate({
                  settings: { ...settings, url: e.target.value }
                })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Delay (seconds)</Label>
              <Input
                type="number"
                value={settings.delay || 0}
                onChange={(e) => onUpdate({
                  settings: { ...settings, delay: parseInt(e.target.value) || 0 }
                })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Responsive Preview</Label>
        <ResponsivePreview
          enableDeviceToggle={true}
          enableOrientationToggle={true}
          showDeviceFrame={true}
          defaultDevice="desktop"
          className="scale-90 origin-top-left"
        >
          <div className="p-4">
            <OutputSection
              section={section}
              isPreview={true}
              onUpdate={onUpdate}
            />
          </div>
        </ResponsivePreview>
      </div>
    </div>
  )
}

export default OutputSection 