'use client'

import React from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Target, Download, ExternalLink, FileText } from 'lucide-react'
import { useInlineEdit } from '@/hooks/use-inline-edit'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { ResultsGate } from '../results-gate'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface OutputSettings {
  title: string
  content: string
  showScore?: boolean
  fileUrl?: string
  fileName?: string
  url?: string
  delay?: number
  message?: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface OutputSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function OutputSection({
  section,
  isPreview = false,
  onUpdate,
  className
}: OutputSectionProps) {
  const settings = (section.settings as unknown) as OutputSettings

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

  const contentEdit = useInlineEdit(settings.content || 'Based on your answers...', {
    onSave: async (value: string) => {
      await onUpdate({
        settings: { ...settings, content: value }
      })
    }
  })

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  const renderOutputContent = () => {
    switch (section.type) {
      case 'output-results':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{settings.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: settings.content }} />
              </div>
              {settings.showScore && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Score: 85/100</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'output-download':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold">{settings.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{settings.content}</p>
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
                {settings.fileName || 'Download Resource'}
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
                <h3 className="font-medium text-gray-900">{settings.message || 'Redirecting...'}</h3>
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
                <h3 className="font-medium text-gray-900">{settings.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{settings.content}</p>
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
            <InlineEditableText
              value={titleEdit.value}
              onSave={titleEdit.save}
              placeholder="Enter section title..."
              className="text-lg font-semibold"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Content</Label>
            <InlineEditableText
              value={contentEdit.value}
              onSave={contentEdit.save}
              placeholder="Enter section content..."
              className="text-gray-600"
              multiline={true}
            />
          </div>
        </div>
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
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Preview (Gated)</Label>
        <div className="scale-90 origin-top-left">
          <OutputSection
            section={section}
            isPreview={true}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default OutputSection 