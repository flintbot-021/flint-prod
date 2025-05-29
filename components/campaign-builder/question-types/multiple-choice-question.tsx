'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Plus, X, GripVertical, Circle, Square, CheckSquare } from 'lucide-react'
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
  options?: ChoiceOption[]
  selectionType?: SelectionType
  minSelections?: number
  maxSelections?: number
  required?: boolean
  buttonLabel?: string
  helpText?: string
  randomizeOrder?: boolean
  allowOther?: boolean
  otherLabel?: string
}

// Sortable Option Component
function SortableOption({ 
  option, 
  onUpdate, 
  onDelete, 
  isPreview = false,
  selectionType = 'single'
}: {
  option: ChoiceOption
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  isPreview?: boolean
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

  if (isPreview) {
    return (
      <label className={cn(
        "flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
        isDragging && "opacity-50"
      )}>
        {selectionType === 'single' ? (
          <input type="radio" name="preview-options" className="h-4 w-4" />
        ) : (
          <input type="checkbox" className="h-4 w-4" />
        )}
        <span className="flex-1">{option.text || `Option ${option.order}`}</span>
      </label>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white",
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
          placeholder={`Option ${option.order}`}
          className="w-full"
          showEditIcon={false}
          showSaveStatus={false}
          maxLength={100}
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
    options = [
      { id: '1', text: 'Option 1', order: 1 },
      { id: '2', text: 'Option 2', order: 2 },
      { id: '3', text: 'Option 3', order: 3 }
    ],
    selectionType = 'single',
    minSelections = 1,
    maxSelections = 1,
    required = false,
    buttonLabel = 'Next',
    helpText = '',
    randomizeOrder = false,
    allowOther = false,
    otherLabel = 'Other'
  } = settings

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  // Handle help text change
  const handleHelpTextChange = async (newHelpText: string) => {
    await updateSettings({ helpText: newHelpText })
  }

  // Add new option
  const handleAddOption = () => {
    const newOption: ChoiceOption = {
      id: `option-${Date.now()}`,
      text: '',
      order: options.length + 1
    }
    updateSettings({ options: [...options, newOption] })
  }

  // Update option text
  const handleUpdateOption = (optionId: string, newText: string) => {
    const updatedOptions = options.map(option =>
      option.id === optionId ? { ...option, text: newText } : option
    )
    updateSettings({ options: updatedOptions })
  }

  // Delete option
  const handleDeleteOption = (optionId: string) => {
    if (options.length <= 2) {
      alert('You must have at least 2 options')
      return
    }
    
    const updatedOptions = options
      .filter(option => option.id !== optionId)
      .map((option, index) => ({ ...option, order: index + 1 }))
    
    updateSettings({ options: updatedOptions })
  }

  // Handle drag end for reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = options.findIndex(option => option.id === active.id)
      const newIndex = options.findIndex(option => option.id === over.id)
      
      const reorderedOptions = arrayMove(options, oldIndex, newIndex)
        .map((option, index) => ({ ...option, order: index + 1 }))
      
      updateSettings({ options: reorderedOptions })
    }
  }

  // Handle selection type change
  const handleSelectionTypeChange = (newType: SelectionType) => {
    const updates: Partial<MultipleChoiceSettings> = {
      selectionType: newType
    }
    
    if (newType === 'single') {
      updates.maxSelections = 1
      updates.minSelections = 1
    } else {
      updates.maxSelections = options.length
      updates.minSelections = 1
    }
    
    updateSettings(updates)
  }

  // Validation
  const validateContent = (text: string): string | null => {
    if (!text.trim()) {
      return 'Question text is required'
    }
    if (text.length > 200) {
      return 'Question text must be 200 characters or less'
    }
    return null
  }

  // Sorted options for display
  const sortedOptions = [...options].sort((a, b) => a.order - b.order)

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('p-6', className)}>
        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              {content || 'Your question text here...'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {helpText && (
              <p className="text-sm text-gray-600 mb-4">{helpText}</p>
            )}
            {selectionType === 'multiple' && (
              <p className="text-sm text-gray-500 mb-4">
                Select {minSelections === maxSelections 
                  ? `exactly ${minSelections}` 
                  : `${minSelections}-${maxSelections}`
                } option{maxSelections !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {(randomizeOrder ? [...sortedOptions].sort(() => Math.random() - 0.5) : sortedOptions).map((option) => (
              <SortableOption
                key={option.id}
                option={option}
                onUpdate={handleUpdateOption}
                onDelete={handleDeleteOption}
                isPreview={true}
                selectionType={selectionType}
              />
            ))}

            {/* Other Option */}
            {allowOther && (
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                {selectionType === 'single' ? (
                  <input type="radio" name="preview-options" className="h-4 w-4" />
                ) : (
                  <input type="checkbox" className="h-4 w-4" />
                )}
                <span className="flex-1">{otherLabel}</span>
                <Input placeholder="Please specify..." className="w-32" disabled />
              </label>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Question Content */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Question Text {required && <span className="text-red-500">*</span>}
          </Label>
          <InlineEditableText
            value={content}
            onSave={handleContentChange}
            variant="body"
            placeholder="Enter your question text..."
            className="min-h-[60px] p-3 border border-gray-200 rounded-lg w-full"
            showEditIcon={false}
            showSaveStatus={true}
            multiline={true}
            maxLength={200}
            required={true}
            validation={validateContent}
          />
        </div>

        {/* Selection Type and Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Selection Type
            </Label>
            <Select
              value={selectionType}
              onValueChange={handleSelectionTypeChange}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {selectionType === 'single' ? (
                      <Circle className="h-4 w-4" />
                    ) : (
                      <CheckSquare className="h-4 w-4" />
                    )}
                    <span className="capitalize">{selectionType} Choice</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">
                  <div className="flex items-center space-x-2">
                    <Circle className="h-4 w-4" />
                    <span>Single Choice</span>
                  </div>
                </SelectItem>
                <SelectItem value="multiple">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>Multiple Choice</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectionType === 'multiple' && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Selection Limits
              </Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={minSelections}
                  onChange={(e) => updateSettings({ minSelections: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={maxSelections}
                  placeholder="Min"
                  className="w-20"
                  disabled={isSaving}
                />
                <span className="self-center text-gray-500">to</span>
                <Input
                  type="number"
                  value={maxSelections}
                  onChange={(e) => updateSettings({ maxSelections: parseInt(e.target.value) || 1 })}
                  min={minSelections}
                  max={options.length}
                  placeholder="Max"
                  className="w-20"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>

        {/* Options Management */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-gray-700">
              Answer Options ({options.length})
            </Label>
            <Button
              onClick={handleAddOption}
              size="sm"
              variant="outline"
              disabled={isSaving || options.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedOptions.map((option) => (
                  <SortableOption
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
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={required}
              onCheckedChange={(checked) => updateSettings({ required: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="required" className="text-sm font-medium cursor-pointer">
              Required field
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="randomize"
              checked={randomizeOrder}
              onCheckedChange={(checked) => updateSettings({ randomizeOrder: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="randomize" className="text-sm font-medium cursor-pointer">
              Randomize option order
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allowOther"
              checked={allowOther}
              onCheckedChange={(checked) => updateSettings({ allowOther: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="allowOther" className="text-sm font-medium cursor-pointer">
              Allow "Other" option
            </Label>
          </div>
        </div>

        {/* Help Text */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Help Text (Optional)
          </Label>
          <InlineEditableText
            value={helpText}
            onSave={handleHelpTextChange}
            variant="body"
            placeholder="Add helpful instructions for users..."
            className="p-3 border border-gray-200 rounded-lg w-full text-gray-600"
            showEditIcon={false}
            showSaveStatus={true}
            maxLength={200}
            multiline={true}
          />
        </div>

        {/* Preview Section */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Preview
          </Label>
          <div className="bg-gray-50 rounded-lg p-4">
            <MultipleChoiceQuestion
              section={section}
              isPreview={true}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 