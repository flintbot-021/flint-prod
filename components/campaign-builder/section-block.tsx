'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { SectionTopBar } from './section-top-bar'
import { SectionBottomBar } from './section-bottom-bar'
import { Card } from '@/components/ui/card'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, FileText, AlertCircle } from 'lucide-react'
import { QuestionComponentFactory } from './question-types/question-component-factory'
import { ContentComponentFactory } from './content-types/content-component-factory'

interface SectionBlockProps {
  section: CampaignSection
  onUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  onDelete: (sectionId: string) => void
  onDuplicate: (sectionId: string) => void
  onConfigure?: (sectionId: string) => void
  onTypeChange?: (sectionId: string, newType: string) => void
  className?: string
  isCollapsible?: boolean
  initiallyCollapsed?: boolean
}

export function SectionBlock({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onConfigure,
  onTypeChange,
  className,
  isCollapsible = true,
  initiallyCollapsed = false
}: SectionBlockProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const [isSaving, setIsSaving] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id,
    data: {
      type: 'campaign-section',
      section
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sectionType = getSectionTypeById(section.type)
  const isQuestionType = sectionType?.category === 'input' || 
    ['multiple-choice', 'text-input', 'rating-scale', 'email-capture', 'contact-form'].includes(section.type)

  // Handle section name updates
  const handleNameChange = async (newName: string) => {
    if (newName.trim() === section.title) return
    
    setIsSaving(true)
    try {
      await onUpdate(section.id, { title: newName.trim() })
    } catch (error) {
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle type changes
  const handleTypeChange = async (newType: string) => {
    if (newType === section.type) return
    
    setIsSaving(true)
    try {
      // Update the section type and potentially reset settings
      const newSectionType = getSectionTypeById(newType)
      const updates: Partial<CampaignSection> = {
        type: newType,
        settings: newSectionType?.defaultSettings || {}
      }
      
      await onUpdate(section.id, updates)
      onTypeChange?.(section.id, newType)
    } catch (error) {
      console.error('Failed to update section type:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    setIsSaving(true)
    try {
      await onUpdate(section.id, { isVisible: !section.isVisible })
    } catch (error) {
      console.error('Failed to update visibility:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle required toggle for questions
  const handleRequiredChange = async (required: boolean) => {
    setIsSaving(true)
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          required 
        } 
      })
    } catch (error) {
      console.error('Failed to update required status:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle button label changes
  const handleButtonLabelChange = async (newLabel: string) => {
    setIsSaving(true)
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          buttonLabel: newLabel.trim() 
        } 
      })
    } catch (error) {
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content updates
  const handleContentChange = async (newContent: string) => {
    setIsSaving(true)
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          content: newContent 
        } 
      })
    } catch (error) {
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete with confirmation
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${section.title}"?`)) {
      onDelete(section.id)
    }
  }

  // Get current settings
  const isRequired = Boolean(section.settings?.required) || false
  const buttonLabel = (section.settings?.buttonLabel as string) || 'Next'
  const content = (section.settings?.content as string) || ''

  // Render section content based on type and mode
  const renderSectionContent = () => {
    if (isCollapsed) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          <ChevronRight className="h-4 w-4 mx-auto mb-2" />
          Section collapsed - click to expand
        </div>
      )
    }

    // Use question component factory for question types
    const questionTypes = ['text-input', 'multiple-choice', 'rating-scale', 'email-capture', 'contact-form']
    if (questionTypes.includes(section.type)) {
      return (
        <QuestionComponentFactory
          section={section}
          isPreview={isPreview}
          onUpdate={(updates) => onUpdate(section.id, updates)}
        />
      )
    }

    // Use content component factory for content types
    const contentTypes = ['info', 'text-block', 'image-block', 'hero', 'content', 'video', 'divider', 'spacer']
    if (contentTypes.includes(section.type)) {
      return (
        <ContentComponentFactory
          section={section}
          isPreview={isPreview}
          onUpdate={(updates) => onUpdate(section.id, updates)}
        />
      )
    }

    // Fallback to existing logic for any other section types
    if (isPreview) {
      return renderPreviewContent()
    }

    return renderEditContent()
  }

  // Render preview mode content
  const renderPreviewContent = () => {
    switch (section.type) {
      case 'multiple-choice':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {content || 'Your question text here...'}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <div className="space-y-2">
              {['Option 1', 'Option 2', 'Option 3'].map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer">
                  <input type="radio" name={`preview-${section.id}`} className="h-4 w-4" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )
      
      case 'text-input':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {content || 'Your question text here...'}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <input 
              type="text" 
              placeholder="Type your answer here..."
              className="w-full p-3 border border-border rounded-lg"
              disabled
            />
          </div>
        )
      
      case 'text-block':
        return (
          <div className="p-6">
            <div className="prose max-w-none">
              {content || 'Your content text here...'}
            </div>
          </div>
        )
      
      case 'email-capture':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {content || 'Enter your email address'}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <input 
              type="email" 
              placeholder="your@email.com"
              className="w-full p-3 border border-border rounded-lg"
              disabled
            />
          </div>
        )
      
      default:
        return (
          <div className="p-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Preview for {sectionType?.name || section.type}</p>
              <p className="text-xs mt-1">{content || 'No content configured'}</p>
            </div>
          </div>
        )
    }
  }

  // Render edit mode content
  const renderEditContent = () => {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {isQuestionType ? 'Question Text' : 'Content'}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <InlineEditableText
              value={content}
              onSave={handleContentChange}
              variant="body"
              placeholder={
                isQuestionType 
                  ? "Enter your question text..." 
                  : "Enter your content..."
              }
              className="min-h-[60px] p-3 border border-border rounded-lg w-full"
              showEditIcon={false}
              showSaveStatus={true}
              multiline={true}
              maxLength={1000}
            />
          </div>

          {/* Section-specific settings */}
          {section.type === 'multiple-choice' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Answer Options
              </label>
              <div className="space-y-2">
                {['Option 1', 'Option 2', 'Option 3'].map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full border border-input flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <input 
                      type="text" 
                      defaultValue={option}
                      className="flex-1 p-2 border border-border rounded text-sm"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Preview */}
          {section.settings && Object.keys(section.settings).length > 0 && (
            <div className="bg-muted rounded-lg p-3">
              <h4 className="text-sm font-medium text-foreground mb-2">Current Settings:</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                {Object.entries(section.settings).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all duration-200 overflow-hidden',
        isDragging && 'opacity-50 shadow-lg scale-105 rotate-2',
        !section.isVisible && 'opacity-60',
        'hover:shadow-md',
        className
      )}
    >
      {/* Top Bar */}
      <SectionTopBar
        section={section}
        isPreview={isPreview}
        isCollapsed={isCollapsed}
        onNameChange={handleNameChange}
        onTypeChange={handleTypeChange}
        onPreviewToggle={() => setIsPreview(!isPreview)}
        onVisibilityToggle={handleVisibilityToggle}
        onDelete={handleDelete}
        onConfigure={() => onConfigure?.(section.id)}
        onCollapseToggle={() => isCollapsible && setIsCollapsed(!isCollapsed)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      {/* Content Area */}
      <div className={cn(
        'transition-all duration-200',
        isCollapsed && 'h-0 overflow-hidden'
      )}>
        {renderSectionContent()}
      </div>

      {/* Bottom Bar */}
      {!isCollapsed && (
        <SectionBottomBar
          section={section}
          isQuestion={isQuestionType}
          isRequired={isRequired}
          buttonLabel={buttonLabel}
          onRequiredChange={isQuestionType ? handleRequiredChange : undefined}
          onButtonLabelChange={handleButtonLabelChange}
          showButtonPreview={true}
        />
      )}

      {/* Loading Overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-background bg-opacity-50 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        </div>
      )}
    </Card>
  )
} 