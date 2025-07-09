'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  Type, 
  Hash, 
  ToggleLeft, 
  Code2, 
  List,
  GripVertical,
  Settings
} from 'lucide-react'
import type { 
  OutputDefinition, 
  OutputDataType, 
  OutputDefinitionValidation
} from '@/lib/types/logic-section'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface OutputDefinitionEditorProps {
  outputs: OutputDefinition[]
  onChange: (outputs: OutputDefinition[]) => void
  className?: string
  disabled?: boolean
  maxOutputs?: number
  onValidationChange?: (validation: OutputDefinitionValidation) => void
}

interface OutputItemProps {
  output: OutputDefinition
  onUpdate: (output: OutputDefinition) => void
  onDelete: () => void
  disabled?: boolean
  errors?: string[]
  warnings?: string[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const OUTPUT_DATA_TYPES: { value: OutputDataType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'text', label: 'Text', description: 'Free-form text response', icon: Type },
  { value: 'number', label: 'Number', description: 'Numeric value', icon: Hash },
  { value: 'boolean', label: 'Boolean', description: 'True/false value', icon: ToggleLeft },
  { value: 'json', label: 'JSON', description: 'Structured data object', icon: Code2 },
  { value: 'array', label: 'Array', description: 'List of values', icon: List }
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateOutputId(): string {
  return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validateOutputName(name: string): { isValid: boolean; error?: string } {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' }
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return { isValid: false, error: 'Name must start with letter/underscore and contain only letters, numbers, underscores' }
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Name must be 50 characters or less' }
  }
  
  return { isValid: true }
}

function validateOutputDefinitions(outputs: OutputDefinition[]): OutputDefinitionValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const duplicateNames: string[] = []
  const invalidNames: string[] = []
  
  // Check for duplicate names
  const nameCount = new Map<string, number>()
  outputs.forEach(output => {
    const count = nameCount.get(output.name) || 0
    nameCount.set(output.name, count + 1)
  })
  
  nameCount.forEach((count, name) => {
    if (count > 1) {
      duplicateNames.push(name)
    }
  })
  
  // Validate each output
  outputs.forEach((output, index) => {
    const nameValidation = validateOutputName(output.name)
    if (!nameValidation.isValid) {
      invalidNames.push(output.name)
      errors.push(`Output ${index + 1}: ${nameValidation.error}`)
    }
    
    if (!output.description.trim()) {
      warnings.push(`Output "${output.name}": Description is empty`)
    }
    
    if (output.description.length > 200) {
      warnings.push(`Output "${output.name}": Description is very long (${output.description.length} chars)`)
    }
  })
  
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate output names: ${duplicateNames.join(', ')}`)
  }
  
  if (outputs.length === 0) {
    warnings.push('No outputs defined - AI responses will not be structured')
  }
  
  if (outputs.length > 10) {
    warnings.push('Many outputs defined - consider grouping related outputs')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    duplicateNames,
    invalidNames
  }
}

function getDataTypeIcon(dataType: OutputDataType) {
  const typeInfo = OUTPUT_DATA_TYPES.find(t => t.value === dataType)
  return typeInfo?.icon || Type
}

// =============================================================================
// OUTPUT ITEM COMPONENT
// =============================================================================

function OutputItem({ 
  output, 
  onUpdate, 
  onDelete, 
  disabled, 
  errors = [], 
  warnings = [] 
}: OutputItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingOutput, setEditingOutput] = useState<OutputDefinition>(output)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [touchedFields, setTouchedFields] = useState<{ name: boolean; description: boolean }>({
    name: false,
    description: false
  })
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({})

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const Icon = getDataTypeIcon(output.dataType)

  const handleSave = useCallback(() => {
    const nameValidation = validateOutputName(editingOutput.name)
    if (!nameValidation.isValid) {
      return // Don't save invalid names
    }
    
    // Check if description is also provided
    if (!editingOutput.description.trim()) {
      setTouchedFields({ name: true, description: true })
      setFieldErrors({ description: 'Description is required' })
      return
    }
    
    onUpdate(editingOutput)
    setIsEditing(false)
    setTouchedFields({ name: false, description: false })
    setFieldErrors({})
  }, [editingOutput, onUpdate])

  const handleCancel = useCallback(() => {
    setEditingOutput(output)
    setIsEditing(false)
    setTouchedFields({ name: false, description: false })
    setFieldErrors({})
  }, [output])

  const validateField = useCallback((field: 'name' | 'description', value: string) => {
    const errors: { name?: string; description?: string } = {}
    
    if (field === 'name') {
      if (!value.trim()) {
        errors.name = 'Name is required'
      } else {
        const nameValidation = validateOutputName(value)
        if (!nameValidation.isValid) {
          errors.name = nameValidation.error
        }
      }
    }
    
    if (field === 'description') {
      if (!value.trim()) {
        errors.description = 'Description is required'
      }
    }
    
    return errors
  }, [])

  const handleFieldBlur = useCallback((field: 'name' | 'description') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    
    const value = field === 'name' ? editingOutput.name : editingOutput.description
    const errors = validateField(field, value)
    
    setFieldErrors(prev => ({ ...prev, ...errors }))
  }, [editingOutput.name, editingOutput.description, validateField])

  if (isEditing) {
    return (
      <Card className={cn("border-2", hasErrors && "border-red-200", hasWarnings && "border-amber-200")}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Edit Output Definition</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSave} disabled={disabled}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={disabled}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Output Name *
              </label>
              <Input
                value={editingOutput.name}
                onChange={(e) => {
                  const newValue = e.target.value
                  setEditingOutput({ ...editingOutput, name: newValue })
                  // Clear field error if user provides a valid value
                  if (touchedFields.name && fieldErrors.name && newValue.trim()) {
                    const errors = validateField('name', newValue)
                    if (!errors.name) {
                      setFieldErrors(prev => ({ ...prev, name: undefined }))
                    }
                  }
                }}
                onBlur={() => handleFieldBlur('name')}
                placeholder="e.g., recommendation, score, summary"
                disabled={disabled}
                className={cn(
                  touchedFields.name && fieldErrors.name && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {touchedFields.name && fieldErrors.name && (
                <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{fieldErrors.name}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Data Type *
              </label>
              <Select
                value={editingOutput.dataType}
                onValueChange={(value: OutputDataType) => 
                  setEditingOutput({ ...editingOutput, dataType: value })
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_DATA_TYPES.map((type) => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Description *
            </label>
            <Textarea
              value={editingOutput.description}
              onChange={(e) => {
                const newValue = e.target.value
                setEditingOutput({ ...editingOutput, description: newValue })
                // Clear field error if user provides a valid value
                if (touchedFields.description && fieldErrors.description && newValue.trim()) {
                  setFieldErrors(prev => ({ ...prev, description: undefined }))
                }
              }}
              onBlur={() => handleFieldBlur('description')}
              placeholder="Describe what this output should contain..."
              disabled={disabled}
              rows={2}
              className={cn(
                touchedFields.description && fieldErrors.description && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {touchedFields.description && fieldErrors.description && (
              <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{fieldErrors.description}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${output.id}`}
              checked={editingOutput.required}
              onCheckedChange={(checked) => 
                setEditingOutput({ ...editingOutput, required: checked as boolean })
              }
              disabled={disabled}
            />
            <label htmlFor={`required-${output.id}`} className="text-sm text-foreground">
              Required output (extraction will fail if not found)
            </label>
          </div>

          {/* Advanced Settings Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-muted-foreground"
          >
            <Settings className="h-4 w-4 mr-1" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-3 border-t pt-3">
              <div className="text-sm font-medium text-foreground">Format & Validation</div>
              {/* Add format and validation configuration here */}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Advanced validation and formatting options will be implemented in the next iteration.
              </div>
            </div>
          )}

          {/* Errors and Warnings */}
          {(hasErrors || hasWarnings) && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{error}</span>
                </div>
              ))}
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-center space-x-1 text-amber-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Display mode
  return (
    <Card className={cn("group hover:shadow-md transition-shadow", hasErrors && "border-red-200", hasWarnings && "border-amber-200")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Drag Handle */}
            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            {/* Output Icon & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <code className="font-mono text-sm font-medium text-foreground">
                  {output.name}
                </code>
                <Badge variant="outline" className="text-xs">
                  {output.dataType}
                </Badge>
                {output.required && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    required
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {output.description}
              </p>
              
              {/* Validation indicators */}
              {(hasErrors || hasWarnings) && (
                <div className="mt-2 space-y-1">
                  {errors.slice(0, 1).map((error, index) => (
                    <div key={`error-${index}`} className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {warnings.slice(0, 1).map((warning, index) => (
                    <div key={`warning-${index}`} className="flex items-center space-x-1 text-amber-600 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(true)
                setTouchedFields({ name: false, description: false })
                setFieldErrors({})
              }}
              disabled={disabled}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={disabled}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function OutputDefinitionEditor({
  outputs,
  onChange,
  className,
  disabled = false,
  maxOutputs = 10,
  onValidationChange
}: OutputDefinitionEditorProps) {
  // Validation
  const validation = useMemo(() => {
    const result = validateOutputDefinitions(outputs)
    onValidationChange?.(result)
    return result
  }, [outputs, onValidationChange])

  // Output management
  const handleAddOutput = useCallback(() => {
    const newOutput: OutputDefinition = {
      id: generateOutputId(),
      name: `output_${outputs.length + 1}`,
      description: '',
      dataType: 'text',
      required: false,
      validation: [],
      format: {}
    }
    
    onChange([...outputs, newOutput])
  }, [outputs, onChange])

  const handleUpdateOutput = useCallback((index: number, updatedOutput: OutputDefinition) => {
    const newOutputs = [...outputs]
    newOutputs[index] = updatedOutput
    onChange(newOutputs)
  }, [outputs, onChange])

  const handleDeleteOutput = useCallback((index: number) => {
    const newOutputs = outputs.filter((_, i) => i !== index)
    onChange(newOutputs)
  }, [outputs, onChange])

  const canAddMore = outputs.length < maxOutputs

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Output Definitions</h3>
          <p className="text-sm text-muted-foreground">
            Define what structured data the AI should extract from its response
          </p>
        </div>
        
        {canAddMore && (
          <Button
            onClick={handleAddOutput}
            disabled={disabled}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Output
          </Button>
        )}
      </div>

      {/* Validation Summary */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-center space-x-1 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-center space-x-1 text-amber-700 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Output List */}
      <div className="space-y-3">
        {outputs.map((output, index) => {
          const outputErrors = validation.errors.filter(error => 
            error.includes(`Output ${index + 1}`) || error.includes(`"${output.name}"`)
          )
          const outputWarnings = validation.warnings.filter(warning => 
            warning.includes(`"${output.name}"`)
          )

          return (
            <OutputItem
              key={output.id}
              output={output}
              onUpdate={(updatedOutput) => handleUpdateOutput(index, updatedOutput)}
              onDelete={() => handleDeleteOutput(index)}
              disabled={disabled}
              errors={outputErrors}
              warnings={outputWarnings}
            />
          )
        })}
      </div>

      {/* Empty State */}
      {outputs.length === 0 && (
        <Card className="border-dashed border-2 border-input">
          <CardContent className="p-8 text-center">
            <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No outputs defined</h3>
            <p className="text-muted-foreground mb-4">
              Add output definitions to structure the AI response data
            </p>
            {canAddMore && (
              <Button onClick={handleAddOutput} disabled={disabled}>
                <Plus className="h-4 w-4 mr-1" />
                Add First Output
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Limits Warning */}
      {!canAddMore && (
        <div className="text-sm text-muted-foreground text-center">
          Maximum of {maxOutputs} outputs allowed
        </div>
      )}
    </div>
  )
}

export default OutputDefinitionEditor 