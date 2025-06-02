'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Plus, X, GripVertical, Circle, Square } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface MultipleChoiceQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

type SelectionType = 'single' | 'multiple'

interface ChoiceOption {
  id: string
  text: string
  order: number
}

interface MultipleChoiceSettings {
  content?: string
  subheading?: string
  options?: ChoiceOption[]
  selectionType?: SelectionType
  required?: boolean
  buttonLabel?: string
}

// Sortable Option Component for Edit Mode
function SortableEditOption({ 
  option, 
  onUpdate, 
  onDelete, 
  selectionType = 'single'
}: {
  option: ChoiceOption
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  selectionType?: SelectionType
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center space-x-3 p-3 border border-gray-300 rounded-lg bg-white",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Selection Type Icon */}
      <div className="flex-shrink-0">
        {selectionType === 'single' ? (
          <Circle className="h-4 w-4 text-gray-400" />
        ) : (
          <Square className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Option Text */}
      <div className="flex-1">
        <InlineEditableText
          value={option.text}
          onSave={(newText) => onUpdate(option.id, newText)}
          variant="body"
          placeholder="Option goes here..."
          className="w-full text-base text-gray-700 hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-base !text-gray-700 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          maxLength={100}
          autoSave={false}
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(option.id)}
        className="text-gray-400 hover:text-red-500 p-1"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function MultipleChoiceQuestion({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: MultipleChoiceQuestionProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as MultipleChoiceSettings || {}
  const {
    content = '',
    subheading = '',
    options = [
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: 'Option 2', order: 2 },
      { id: '3', text: 'Option 3', order: 3 }
    ],
    selectionType = 'single',
    required = false,
    buttonLabel = 'Next'
  } = settings

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sort options by order
  const sortedOptions = [...options].sort((a, b) => a.order - b.order)

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<MultipleChoiceSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update multiple choice settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle subheading change
  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Handle option update
  const handleUpdateOption = (optionId: string, newText: string) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, text: newText } : option
    )
    updateSettings({ options: updatedOptions })
  }

  // Handle option deletion
  const handleDeleteOption = (optionId: string) => {
    const updatedOptions = options.filter(option => option.id !== optionId)
    updateSettings({ options: updatedOptions })
  }

  // Handle adding new option
  const handleAddOption = () => {
    const newOrder = Math.max(...options.map(o => o.order), 0) + 1
    const newOption: ChoiceOption = {
      id: `option-${Date.now()}`,
      text: `Option ${newOrder}`,
      order: newOrder
    }
    updateSettings({ options: [...options, newOption] })
  }

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = options.findIndex(option => option.id === active.id)
      const newIndex = options.findIndex(option => option.id === over.id)
      
      const reorderedOptions = arrayMove(options, oldIndex, newIndex).map((option, index) => ({
        ...option,
        order: index + 1
      }))

      updateSettings({ options: reorderedOptions })
    }
  }

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        <div className="space-y-6">
          {/* Question Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              {content || 'Your question text here...'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className="text-xl text-gray-300">
                {subheading}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-6">
            {sortedOptions.map((option) => (
              <label 
                key={option.id} 
                className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {selectionType === 'single' ? (
                  <input type="radio" name="preview-options" className="h-4 w-4" />
                ) : (
                  <input type="checkbox" className="h-4 w-4" />
                )}
                <span className="flex-1 text-lg text-white">{option.text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Direct inline editing
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="Type your question here"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subheading */}
      <div className="text-center">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          variant="body"
          placeholder="Type sub heading here"
          className="text-xl text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Options Section */}
      <div className="space-y-4 pt-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedOptions.map((option) => (
                <SortableEditOption
                  key={option.id}
                  option={option}
                  onUpdate={handleUpdateOption}
                  onDelete={handleDeleteOption}
                  selectionType={selectionType}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Option Button */}
        <Button
          onClick={handleAddOption}
          variant="outline"
          className="w-full py-6 border-dashed border-2 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
          disabled={isSaving || options.length >= 10}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add another option
        </Button>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 