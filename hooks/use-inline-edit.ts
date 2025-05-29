import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './use-debounce'

export interface InlineEditOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  validation?: (value: string) => string | null
  onSave?: (value: string) => Promise<void> | void
  onCancel?: () => void
  onEdit?: () => void
  placeholder?: string
  multiline?: boolean
  maxLength?: number
  required?: boolean
}

export interface InlineEditReturn {
  isEditing: boolean
  value: string
  displayValue: string
  error: string | null
  isSaving: boolean
  isDirty: boolean
  
  // Actions
  startEdit: () => void
  save: () => Promise<void>
  cancel: () => void
  setValue: (value: string) => void
  
  // Keyboard handlers
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleBlur: () => void
  
  // Ref for input element
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
}

export function useInlineEdit(
  initialValue: string,
  options: InlineEditOptions = {}
): InlineEditReturn {
  const {
    autoSave = true,
    autoSaveDelay = 500,
    validation,
    onSave,
    onCancel,
    onEdit,
    placeholder = '',
    multiline = false,
    maxLength,
    required = false
  } = options

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [originalValue, setOriginalValue] = useState(initialValue)
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  
  // Debounced value for auto-save
  const debouncedValue = useDebounce(value, autoSaveDelay)
  
  // Track if the value has changed from original
  const isDirty = value !== originalValue

  // Update local state when initialValue changes (external updates)
  useEffect(() => {
    if (!isEditing && initialValue !== originalValue) {
      setValue(initialValue)
      setOriginalValue(initialValue)
    }
  }, [initialValue, isEditing, originalValue])

  // Validate the current value
  const validateValue = useCallback((val: string): string | null => {
    if (required && !val.trim()) {
      return 'This field is required'
    }
    if (maxLength && val.length > maxLength) {
      return `Maximum length is ${maxLength} characters`
    }
    if (validation) {
      return validation(val)
    }
    return null
  }, [required, maxLength, validation])

  // Auto-save when value changes (debounced)
  useEffect(() => {
    if (autoSave && isEditing && isDirty && !error) {
      const validationError = validateValue(debouncedValue)
      if (!validationError) {
        save()
      }
    }
  }, [debouncedValue, autoSave, isEditing, isDirty, error, validateValue])

  // Validate on value change
  useEffect(() => {
    if (isEditing) {
      const validationError = validateValue(value)
      setError(validationError)
    }
  }, [value, isEditing, validateValue])

  const startEdit = useCallback(() => {
    setIsEditing(true)
    setOriginalValue(value)
    setError(null)
    onEdit?.()
    
    // Focus input on next tick
    setTimeout(() => {
      inputRef.current?.focus()
      if (inputRef.current) {
        // Select all text for easy replacement
        if ('select' in inputRef.current) {
          inputRef.current.select()
        }
      }
    }, 0)
  }, [value, onEdit])

  const save = useCallback(async () => {
    if (error) return
    
    const validationError = validateValue(value)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSaving(true)
      await onSave?.(value)
      setOriginalValue(value)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [value, error, validateValue, onSave])

  const cancel = useCallback(() => {
    setValue(originalValue)
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }, [originalValue, onCancel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (!multiline || (multiline && e.ctrlKey)) {
          e.preventDefault()
          save()
        }
        break
      case 'Escape':
        e.preventDefault()
        cancel()
        break
      case 'Tab':
        // Allow tabbing out, which should save
        if (!error) {
          save()
        }
        break
    }
  }, [save, cancel, multiline, error])

  const handleBlur = useCallback(() => {
    // Auto-save on blur if no errors
    if (!error && isDirty) {
      save()
    } else if (!isDirty) {
      setIsEditing(false)
    }
  }, [error, isDirty, save])

  // Display value with fallback to placeholder
  const displayValue = value || placeholder

  return {
    isEditing,
    value,
    displayValue,
    error,
    isSaving,
    isDirty,
    startEdit,
    save,
    cancel,
    setValue,
    handleKeyDown,
    handleBlur,
    inputRef
  }
} 