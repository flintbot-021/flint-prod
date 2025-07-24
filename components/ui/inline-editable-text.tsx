'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface InlineEditableTextProps {
  value: string
  onSave: (value: string) => Promise<void> | void
  className?: string
  placeholder?: string
  disabled?: boolean
  multiline?: boolean
  autoSave?: boolean
  variant?: 'heading' | 'subheading' | 'paragraph' | 'label'
}

// Variant styles - clean and focused on typography only
const variantStyles = {
  heading: 'text-4xl font-bold leading-tight',
  subheading: 'text-xl font-medium leading-normal', 
  paragraph: 'text-base font-normal leading-normal',
  label: 'text-sm font-medium leading-normal'
}

export function InlineEditableText({
  value,
  onSave,
  className,
  placeholder = 'Click to edit...',
  disabled = false,
  multiline = false,
  autoSave = true,
  variant = 'paragraph'
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Determine if we have actual content (not just placeholder)
  const hasContent = value && value.trim().length > 0

  // Get variant styling
  const variantClasses = variantStyles[variant]

  const startEdit = () => {
    if (disabled) return
    
    setIsEditing(true)
    // Start with current value or empty string (clear placeholder)
    setEditValue(value || '')
  }

  const handleSave = async () => {
    const trimmedValue = editValue.trim()
    
    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      // Keep editing mode open on error
    }
  }

  const handleCancel = () => {
    setEditValue('')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (multiline) {
      // For multiline, save on Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSave()
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    } else {
      // For single line, save on Enter
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }
  }

  const handleBlur = () => {
    if (autoSave) {
      handleSave()
    } else {
      setIsEditing(false)
    }
  }

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Move cursor to end
      const element = inputRef.current
      const length = element.value.length
      element.setSelectionRange(length, length)
    }
  }, [isEditing])

  if (disabled) {
    return (
      <div className={cn('cursor-not-allowed opacity-50', variantClasses, className)}>
        {hasContent ? value : placeholder}
      </div>
    )
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    
    return (
      <InputComponent
        ref={inputRef as any}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder=""
        className={cn(
          // Remove all default input styling
          'border-0 outline-none ring-0 shadow-none bg-transparent p-0 m-0',
          'focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none',
          'resize-none', // For textarea
          variantClasses, // Apply variant styling
          className
        )}
        style={{
          width: '100%',
          minHeight: multiline ? '1.2em' : 'auto',
          height: 'auto'
        }}
      />
    )
  }

  // View mode
  return (
    <div
      onClick={startEdit}
      className={cn(
        'cursor-text',
        // Show light grey for placeholder, black for content
        hasContent ? 'text-black' : 'text-gray-400',
        variantClasses, // Apply variant styling
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${value || 'text'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          startEdit()
        }
      }}
    >
      {hasContent ? value : placeholder}
    </div>
  )
} 