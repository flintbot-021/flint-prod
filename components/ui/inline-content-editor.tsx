'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Edit3, 
  Eye, 
  Save, 
  X, 
  Image as ImageIcon, 
  Type,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check
} from 'lucide-react'
import { RichContentEditor } from '@/components/ui/rich-content-editor'
import { ImageUpload, ImageInfo } from '@/components/ui/image-upload'
import { VariableInterpolatedContent } from '@/components/ui/variable-interpolated-content'
import type { 
  VariableInterpolationContext,
  InterpolationResult
} from '@/lib/types/output-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface InlineContentEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
  placeholder?: string
  enableRichText?: boolean
  enableImages?: boolean
  enableVariables?: boolean
  variableContext?: VariableInterpolationContext
  autoSave?: boolean
  autoSaveDelay?: number
  maxLength?: number
  showWordCount?: boolean
  allowFullscreen?: boolean
}

interface ContentBlock {
  id: string
  type: 'text' | 'image'
  content: string
  image?: ImageInfo
  order: number
}

interface EditorMode {
  type: 'view' | 'edit' | 'preview'
  fullscreen: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const parseContentBlocks = (content: string): ContentBlock[] => {
  // Simple parser for mixed content (this could be enhanced)
  const blocks: ContentBlock[] = []
  let order = 0
  
  // For now, treat all content as a single text block
  // In a real implementation, you'd parse for embedded images, etc.
  blocks.push({
    id: `block_${Date.now()}`,
    type: 'text',
    content,
    order: order++
  })
  
  return blocks
}

const serializeContentBlocks = (blocks: ContentBlock[]): string => {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map(block => {
      if (block.type === 'image' && block.image) {
        // Return image markdown/HTML format
        return `![${block.image.alt || block.image.name}](${block.image.url})`
      }
      return block.content
    })
    .join('\n\n')
}

// =============================================================================
// CONTENT BLOCK COMPONENTS
// =============================================================================

function EditableTextBlock({ 
  block, 
  onUpdate,
  onRemove,
  variableContext,
  enableRichText = true,
  enableVariables = true
}: {
  block: ContentBlock
  onUpdate: (content: string) => void
  onRemove: () => void
  variableContext?: VariableInterpolationContext
  enableRichText?: boolean
  enableVariables?: boolean
}) {
  return (
    <div className="group relative">
      <RichContentEditor
        content={block.content}
        onChange={onUpdate}
        variableContext={variableContext}
        enablePreview={true}
        enableVariables={enableVariables}
        enableFormatting={enableRichText}
        enableConditionals={enableVariables}
        placeholder="Enter your content..."
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function EditableImageBlock({
  block,
  onUpdate,
  onRemove
}: {
  block: ContentBlock
  onUpdate: (image: ImageInfo | null) => void
  onRemove: () => void
}) {
  return (
    <div className="group relative">
      <ImageUpload
        value={block.image || null}
        onChange={onUpdate}
        enableSizing={true}
        enablePositioning={true}
        showPreview={true}
        placeholder="Add an image to your content"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InlineContentEditor({
  content,
  onChange,
  className,
  placeholder = "Click to edit content...",
  enableRichText = true,
  enableImages = true,
  enableVariables = true,
  variableContext,
  autoSave = false,
  autoSaveDelay = 1000,
  maxLength,
  showWordCount = false,
  allowFullscreen = true
}: InlineContentEditorProps) {
  const [mode, setMode] = useState<EditorMode>({ type: 'view', fullscreen: false })
  const [localContent, setLocalContent] = useState(content)
  const [isDirty, setIsDirty] = useState(false)
  const [interpolationResult, setInterpolationResult] = useState<InterpolationResult | null>(null)

  // Parse content into blocks for editing
  const contentBlocks = useMemo(() => parseContentBlocks(localContent), [localContent])

  // =============================================================================
  // CONTENT MANAGEMENT
  // =============================================================================

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent)
    setIsDirty(newContent !== content)
    
    if (autoSave) {
      // Implement auto-save logic here
      const timeoutId = setTimeout(() => {
        onChange(newContent)
        setIsDirty(false)
      }, autoSaveDelay)
      
      return () => clearTimeout(timeoutId)
    }
  }, [content, onChange, autoSave, autoSaveDelay])

  const handleSave = useCallback(() => {
    onChange(localContent)
    setIsDirty(false)
    setMode(prev => ({ ...prev, type: 'view' }))
  }, [localContent, onChange])

  const handleCancel = useCallback(() => {
    setLocalContent(content)
    setIsDirty(false)
    setMode(prev => ({ ...prev, type: 'view' }))
  }, [content])

  const handleAddBlock = useCallback((type: 'text' | 'image') => {
    const newBlock: ContentBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      type,
      content: type === 'text' ? '' : '',
      order: contentBlocks.length,
      ...(type === 'image' && { image: undefined })
    }
    
    // For now, just append to content as text
    if (type === 'text') {
      handleContentChange(localContent + '\n\n<!-- New text block -->')
    } else {
      handleContentChange(localContent + '\n\n<!-- Image placeholder -->')
    }
  }, [contentBlocks.length, localContent, handleContentChange])

  // =============================================================================
  // MODE HANDLERS
  // =============================================================================

  const handleModeChange = useCallback((newType: EditorMode['type']) => {
    setMode(prev => ({ ...prev, type: newType }))
  }, [])

  const handleFullscreenToggle = useCallback(() => {
    setMode(prev => ({ ...prev, fullscreen: !prev.fullscreen }))
  }, [])

  // =============================================================================
  // WORD COUNT
  // =============================================================================

  const wordCount = useMemo(() => {
    return localContent.trim().split(/\s+/).filter(word => word.length > 0).length
  }, [localContent])

  // =============================================================================
  // RENDER MODES
  // =============================================================================

  const renderViewMode = () => (
    <div 
      className={cn(
        "group relative min-h-[120px] p-4 border border-transparent rounded-lg cursor-pointer transition-all hover:border-gray-200 hover:bg-gray-50",
        !content && "text-gray-500 italic"
      )}
      onClick={() => handleModeChange('edit')}
    >
      {content ? (
        <div className="prose prose-sm max-w-none">
          {enableVariables && variableContext ? (
            <VariableInterpolatedContent
              content={content}
              context={variableContext}
              showPreview={true}
              enableRealTimeProcessing={true}
              highlightVariables={false}
              onInterpolationResult={setInterpolationResult}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      ) : (
        <span>{placeholder}</span>
      )}
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm">
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderEditMode = () => (
    <div className="space-y-4">
      <RichContentEditor
        content={localContent}
        onChange={handleContentChange}
        variableContext={variableContext}
        enablePreview={false}
        enableVariables={enableVariables}
        enableFormatting={enableRichText}
        enableConditionals={enableVariables}
        placeholder={placeholder}
        maxHeight={mode.fullscreen ? "70vh" : "400px"}
      />
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {enableImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddBlock('image')}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Add Image
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModeChange('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          {allowFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreenToggle}
            >
              {mode.fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <div className="flex space-x-4">
          {showWordCount && (
            <span>
              {wordCount} words
              {maxLength && ` / ${maxLength} max`}
            </span>
          )}
          
          {interpolationResult && (
            <div className="flex space-x-2">
              <Badge variant="outline" className="text-xs">
                {interpolationResult.processedVariables.length} variables
              </Badge>
              {interpolationResult.missingVariables.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {interpolationResult.missingVariables.length} missing
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isDirty && (
            <Badge variant="outline" className="text-xs">
              Unsaved changes
            </Badge>
          )}
          {autoSave && !isDirty && (
            <div className="flex items-center space-x-1">
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Auto-saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderPreviewMode = () => (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50">
        {enableVariables && variableContext ? (
          <VariableInterpolatedContent
            content={localContent}
            context={variableContext}
            showPreview={true}
            enableRealTimeProcessing={true}
            highlightVariables={true}
            showDebugInfo={true}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: localContent }} />
        )}
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleModeChange('edit')}
        >
          <Edit3 className="h-4 w-4 mr-1" />
          Edit
        </Button>
        
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <Save className="h-4 w-4 mr-1" />
          Save Preview
        </Button>
      </div>
    </div>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  const editorContent = () => {
    switch (mode.type) {
      case 'edit':
        return renderEditMode()
      case 'preview':
        return renderPreviewMode()
      default:
        return renderViewMode()
    }
  }

  if (mode.fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Content Editor</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFullscreenToggle}
              >
                <Minimize2 className="h-4 w-4 mr-1" />
                Exit Fullscreen
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-4xl mx-auto">
              {editorContent()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {editorContent()}
    </div>
  )
}

export default InlineContentEditor 