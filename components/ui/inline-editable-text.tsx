'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useInlineEdit, InlineEditOptions } from '@/hooks/use-inline-edit'
import { Input } from './input'
import { Textarea } from './textarea'
import { Loader2, AlertCircle, Check } from 'lucide-react'

export interface InlineEditableTextProps extends Omit<InlineEditOptions, 'onSave'> {
  value: string
  onSave: (value: string) => Promise<void> | void
  className?: string
  inputClassName?: string
  editClassName?: string
  errorClassName?: string
  placeholder?: string
  disabled?: boolean
  
  // Styling options
  variant?: 'default' | 'heading' | 'subheading' | 'body' | 'caption'
  size?: 'sm' | 'md' | 'lg'
  
  // Display options
  showEditIcon?: boolean
  showSaveStatus?: boolean
  truncate?: boolean
}

const variantStyles = {
  default: 'text-sm text-foreground',
  heading: 'text-xl font-semibold text-foreground',
  subheading: 'text-lg font-medium text-foreground', 
  body: 'text-sm text-foreground',
  caption: 'text-xs text-muted-foreground'
}

const sizeStyles = {
  sm: 'text-xs',
  md: 'text-sm', 
  lg: 'text-base'
}

export const InlineEditableText = forwardRef<
  HTMLDivElement,
  InlineEditableTextProps
>(({
  value,
  onSave,
  className,
  inputClassName,
  editClassName,
  errorClassName,
  placeholder = 'Click to edit...',
  disabled = false,
  variant = 'default',
  size = 'md',
  showEditIcon = false,
  showSaveStatus = true,
  truncate = false,
  multiline = false,
  maxLength,
  required = false,
  validation,
  autoSave = true,
  autoSaveDelay = 500,
  ...options
}, ref) => {
  const {
    isEditing,
    value: editValue,
    displayValue,
    error,
    isSaving,
    isDirty,
    startEdit,
    setValue,
    handleKeyDown,
    handleBlur,
    inputRef
  } = useInlineEdit(value, {
    onSave,
    placeholder,
    multiline,
    maxLength,
    required,
    validation,
    autoSave,
    autoSaveDelay,
    ...options
  })

  // Determine if content is empty
  const isEmpty = !value && !placeholder

  if (disabled) {
    return (
      <div
        ref={ref}
        className={cn(
          // Don't apply variant styles - let parent control all styling completely
          truncate && 'truncate',
          'cursor-not-allowed opacity-50',
          className
        )}
      >
        {displayValue}
      </div>
    )
  }

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input
    
    return (
      <div ref={ref} className={cn('relative', editClassName)}>
        <InputComponent
          ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full border-0 bg-transparent p-0 m-0 focus:ring-0 focus:border-0',
            'resize-none shadow-none', // Remove all default input styling
            className, // Use the same className as view mode for consistent styling
            error && 'border-red-500 focus:ring-red-500'
          )}
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit', 
            fontWeight: 'inherit',
            lineHeight: 'inherit', // Inherit line height from parent
            color: 'inherit',
            minHeight: 'auto',
            height: 'auto'
          }}
          autoFocus
        />
        
        {/* Save status indicator */}
        {showSaveStatus && (isSaving || isDirty) && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            ) : isDirty ? (
              <div className="w-2 h-2 bg-orange-400 rounded-full" />
            ) : (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className={cn(
            'absolute top-full left-0 mt-1 flex items-center space-x-1 text-xs text-red-600',
            errorClassName
          )}>
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  // View mode
  return (
    <div
      ref={ref}
      onClick={startEdit}
      className={cn(
        'relative cursor-text', // Removed outline-none to allow focus outline
        // Use the same className as edit mode for consistent styling
        truncate && 'truncate',
        isEmpty && 'text-gray-400 italic',
        // Keep focus outline for accessibility
        'focus:outline-offset-1',
        // Ensure consistent spacing with edit mode
        multiline && 'min-h-[inherit] whitespace-pre-wrap',
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${displayValue || 'text'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          startEdit()
        }
      }}
    >
      {/* Render content with line breaks preserved */}
      {displayValue ? (
        <span 
          dangerouslySetInnerHTML={{ 
            __html: displayValue.replace(/\n/g, '<br>') 
          }} 
        />
      ) : null}
      
      {/* Edit indicator - removed to avoid layout shifts */}
      
      {/* Empty state indicator */}
      {isEmpty && (
        <span className="text-gray-300 select-none">
          {placeholder || 'Click to add text...'}
        </span>
      )}
    </div>
  )
})

InlineEditableText.displayName = 'InlineEditableText' 