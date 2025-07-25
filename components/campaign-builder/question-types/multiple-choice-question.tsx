'use client'

import { useState, useMemo, useCallback, memo } from 'react'
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
  headline?: string
  subheading?: string
  options?: ChoiceOption[]
  selectionType?: SelectionType
  required?: boolean
  buttonLabel?: string
}

// Sortable Option Component for Edit Mode
const SortableEditOption = memo(function SortableEditOption({ 
  option, 
  onUpdate, 
  onDelete, 
  selectionType = 'single'
}: {
  option: ChoiceOption
  onUpdate: (id: string, text: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
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
          placeholder="Option goes here..."
          className="w-full text-base text-gray-700"
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
})

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
    headline = '',
    subheading = '',
    options = [
      { id: 'option-1', text: 'Option 1', order: 1 },
      { id: 'option-2', text: 'Option 2', order: 2 },
      { id: 'option-3', text: 'Option 3', order: 3 }
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

  // Sort options by order - memoized to prevent unnecessary re-renders
  const sortedOptions = useMemo(() => {
    // Ensure all options have valid id and order values
    const validOptions = options.map((option, index) => ({
      id: option.id || `option-${index + 1}`,
      text: option.text || `Option ${index + 1}`,
      order: option.order || (index + 1)
    }))
    // Create a stable sort that doesn't cause React key issues
    return validOptions.sort((a, b) => a.order - b.order)
  }, [options])

  // Memoize the sortable items array
  const sortableItems = useMemo(() => {
    return sortedOptions.map(o => o.id || `option-${o.order || 0}`)
  }, [sortedOptions])

  // Handle settings updates
  const updateSettings = useCallback(async (newSettings: Partial<MultipleChoiceSettings>) => {
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
  }, [settings, onUpdate])

  // Handle content change
  const handleHeadlineChange = useCallback(async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
  }, [updateSettings])

  // Handle subheading change
  const handleSubheadingChange = useCallback(async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }, [updateSettings])

  // Handle option update
  const handleUpdateOption = useCallback(async (optionId: string, newText: string) => {
    const updatedOptions = options.map((option, index) => {
      const currentId = option.id || `option-${index + 1}`
      return currentId === optionId ? { 
        ...option, 
        id: currentId,
        text: newText,
        order: option.order || (index + 1)
      } : {
        ...option,
        id: currentId,
        order: option.order || (index + 1)
      }
    })
    await updateSettings({ options: updatedOptions })
  }, [options, updateSettings])

  // Handle option deletion
  const handleDeleteOption = useCallback(async (optionId: string) => {
    const updatedOptions = options
      .filter((option, index) => (option.id || `option-${index + 1}`) !== optionId)
      .map((option, index) => ({
        ...option,
        id: option.id || `option-${index + 1}`,
        order: index + 1
      }))
    await updateSettings({ options: updatedOptions })
  }, [options, updateSettings])

  // Handle adding new option
  const handleAddOption = useCallback(async () => {
    const validOrders = options.map(o => o.order || 0).filter(order => !isNaN(order))
    const newOrder = validOrders.length > 0 ? Math.max(...validOrders) + 1 : options.length + 1
    // Defensive: ensure no string is spread as an object
    const newOption: ChoiceOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: `Option ${newOrder}`,
      order: newOrder
    }
    // Only add if it's a valid object
    if (typeof newOption.text === 'string' && typeof newOption.id === 'string' && typeof newOption.order === 'number') {
    await updateSettings({ options: [...options, newOption] })
    } else {
      console.error('Attempted to add invalid option:', newOption)
    }
  }, [options, updateSettings])

  // Handle drag end
  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event

    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = options.findIndex(option => option.id === active.id)
      const newIndex = options.findIndex(option => option.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedOptions = arrayMove(options, oldIndex, newIndex).map((option, index) => ({
          ...option,
          id: option.id || `option-${index + 1}`,
          text: option.text || `Option ${index + 1}`,
          order: index + 1
        }))

        await updateSettings({ options: reorderedOptions })
      }
    }
  }, [options, updateSettings])

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        {/* Question Text */}
        <div className="pt-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {headline || 'Your question text here...'}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h1>
          
          {subheading && (
            <div className="pt-4">
              <p className="text-xl text-gray-600">
                {subheading}
              </p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="pt-6 space-y-3">
          {sortedOptions.map((option, index) => (
            <label 
              key={`preview-${option.id || index}`} 
              className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {selectionType === 'single' ? (
                <input 
                  type="radio" 
                  name={`preview-options-${section.id}`} 
                  value={option.id}
                  className="h-4 w-4" 
                />
              ) : (
                <input 
                  type="checkbox" 
                  value={option.id}
                  className="h-4 w-4" 
                />
              )}
              <span className="flex-1 text-lg text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  // Edit Mode - Direct inline editing
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="pt-8">
        <InlineEditableText
          value={headline}
          onSave={handleHeadlineChange}
          placeholder="Type your question here"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Type sub heading here"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Options Section */}
      <div className="pt-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedOptions.map((option, index) => (
                <SortableEditOption
                  key={`${option.id || index}-${option.order || index}`}
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
          className="w-full py-6 border-dashed border-2 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 mt-4"
          disabled={isSaving || options.length >= 10}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add another option
        </Button>
      </div>


    </div>
  )
} 