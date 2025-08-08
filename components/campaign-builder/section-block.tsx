'use client'

import { useState, useEffect } from 'react'
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
  isSelected?: boolean
  onSelect?: () => void
  className?: string
  isCollapsible?: boolean
  initiallyCollapsed?: boolean
  onCollapseChange?: (sectionId: string, isCollapsed: boolean) => void
  allSections?: CampaignSection[]
  campaignId: string
  showDragHandle?: boolean // Controls whether the drag handle is visible
}

export function SectionBlock({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onConfigure,
  onTypeChange,
  isSelected = false,
  onSelect,
  className,
  isCollapsible = true,
  initiallyCollapsed = true,
  onCollapseChange,
  allSections,
  campaignId,
  showDragHandle = true
}: SectionBlockProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)

  // Sync internal collapsed state with external prop changes (for expand/collapse all)
  useEffect(() => {
    setIsCollapsed(initiallyCollapsed)
  }, [initiallyCollapsed])

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

  // Handle section name updates - optimistic approach
  const handleNameChange = async (newName: string) => {
    if (newName.trim() === section.title) return
    
    // Save in background without blocking the UI
    try {
      await onUpdate(section.id, { title: newName.trim() })
    } catch (error) {
      // Handle error but don't block the UI
      console.error('Failed to save section name:', error)
      throw error
    }
  }

  // Handle type changes - optimistic approach
  const handleTypeChange = async (newType: string) => {
    if (newType === section.type) return
    
    // Save in background without blocking the UI
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
    }
  }

  // Handle visibility toggle - optimistic approach
  const handleVisibilityToggle = async () => {
    // Save in background without blocking the UI
    try {
      await onUpdate(section.id, { isVisible: !section.isVisible })
    } catch (error) {
      console.error('Failed to update visibility:', error)
    }
  }

  // Handle required toggle for questions - optimistic approach
  const handleRequiredChange = async (required: boolean) => {
    // Save in background without blocking the UI
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          required 
        } 
      })
    } catch (error) {
      console.error('Failed to update required status:', error)
    }
  }

  // Handle button label changes - optimistic approach
  const handleButtonLabelChange = async (newLabel: string) => {
    // Save in background without blocking the UI
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          buttonLabel: newLabel.trim() 
        } 
      })
    } catch (error) {
      throw error
    }
  }

  // Handle content updates - optimistic approach
  const handleContentChange = async (newContent: string) => {
    // Save in background without blocking the UI
    try {
      await onUpdate(section.id, { 
        settings: { 
          ...section.settings, 
          content: newContent 
        } 
      })
    } catch (error) {
      throw error
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
    const questionTypes = [
      'text-input', 'multiple-choice', 'rating-scale', 'email-capture', 'contact-form',
      'question-text', 'question-multiple-choice', 'question-slider', 'question-slider-multiple', 'question-date-time', 'question-upload', 'capture-details', 'capture'
    ]
    if (questionTypes.includes(section.type)) {
      return (
        <QuestionComponentFactory
          section={section}
          isPreview={isPreview}
          onUpdate={(updates) => onUpdate(section.id, updates)}
          campaignId={campaignId}
        />
      )
    }

    // Use content component factory for content types
    const contentTypes = [
      'info', 'text-block', 'image-block', 'hero', 'content', 'video', 'divider', 'spacer',
      'content-hero', 'content-basic', 'logic-ai', 'output-results', 'output-download', 'output-redirect', 'output-advanced', 'output-dynamic-redirect', 'output-html-embed'
    ]
    if (contentTypes.includes(section.type)) {
      return (
        <ContentComponentFactory
          section={section}
          isPreview={isPreview}
          onUpdate={(updates) => onUpdate(section.id, updates)}
          allSections={allSections}
          campaignId={campaignId}
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
              placeholder={
                isQuestionType 
                  ? "Enter your question text..." 
                  : "Enter your content..."
              }
              className="min-h-[60px] p-3 border border-border rounded-lg w-full"
              multiline={true}
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
      onClick={onSelect}
      className={cn(
        'transition-all duration-200 overflow-hidden cursor-pointer',
        isDragging && 'opacity-50 shadow-lg scale-105 rotate-2',
        !section.isVisible && 'opacity-60',
        isSelected && 'ring-1 ring-black shadow-lg',
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
        onDuplicate={() => onDuplicate(section.id)}
        onDelete={handleDelete}
        onConfigure={() => onConfigure?.(section.id)}
        onCollapseToggle={() => {
          if (isCollapsible) {
            const newCollapsedState = !isCollapsed
            setIsCollapsed(newCollapsedState)
            onCollapseChange?.(section.id, newCollapsedState)
          }
        }}
        dragHandleProps={{ ...attributes, ...listeners }}
        allSections={allSections}
        showDragHandle={showDragHandle}
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
          onButtonLabelChange={section.type === 'capture' ? handleButtonLabelChange : undefined}
          onSectionUpdate={(updates) => onUpdate(section.id, updates)}
          showButtonPreview={true}
          isPreview={isPreview}
        />
      )}
    </Card>
  )
} 