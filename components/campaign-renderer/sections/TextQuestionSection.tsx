'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'

// =============================================================================
// TEXT QUESTION SECTION COMPONENT
// =============================================================================

export function TextQuestionSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onNext,
  onPrevious,
  onSectionComplete,
  onResponseUpdate
}: SectionRendererProps) {
  const [textValue, setTextValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const isRequired = config.required ?? true
  const inputType = config.inputType || 'textarea'
  const placeholder = config.placeholder || 'Type your response here...'
  const label = config.label || title
  
  // Cast config to access additional properties
  const configData = config as any
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'
  
  // Get the actual content from config
  const headline = configData.content || configData.question || title || 'Please share your thoughts'
  const subheading = configData.subheading || description
  
  // Handle text changes
  const handleTextChange = (value: string) => {
    setTextValue(value)
    
    // Real-time response update
    onResponseUpdate(section.id, 'text_response', value, {
      inputType: inputType,
      isRequired: isRequired,
      wordCount: value.trim().split(/\s+/).filter(word => word.length > 0).length,
      characterCount: value.length
    })
  }

  // Handle submission
  const handleSubmit = () => {
    const trimmedValue = textValue.trim()
    
    if (isRequired && !trimmedValue) {
      // Could add validation feedback here
      return
    }

    const submissionData = {
      [section.id]: trimmedValue,
      text_response: trimmedValue
    }

    console.log('📝 TEXT QUESTION SUBMISSION:')
    console.log('  Section ID:', section.id)
    console.log('  Section Title:', section.title)
    console.log('  Text Value:', trimmedValue)
    console.log('  Submission Data:', submissionData)
    console.log('  Section Index:', index)

    onSectionComplete(index, submissionData)
  }

  // Handle key shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (!isRequired || textValue.trim()) {
          handleSubmit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [textValue, isRequired])

  const isValid = !isRequired || textValue.trim().length > 0
  const wordCount = textValue.trim().split(/\s+/).filter(word => word.length > 0).length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with navigation */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={onPrevious}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-muted-foreground">Question {index + 1}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Question Title */}
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {headline}
            </h1>
            
            {subheading && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {subheading}
              </p>
            )}
          </div>

          {/* Input Field */}
          <div className="space-y-4">
            {label && label !== title && (
              <label className="block text-sm font-medium text-foreground">
                {label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}

            {inputType === 'textarea' ? (
              <textarea
                value={textValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                rows={6}
                className={cn(
                  "w-full px-4 py-3 border rounded-lg resize-none transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-muted-foreground",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg",
                  isFocused ? "border-blue-500 shadow-lg" : "border-border",
                  getMobileClasses("", deviceInfo?.type)
                )}
              />
            ) : (
              <input
                type={inputType}
                value={textValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={cn(
                  "w-full px-4 py-3 border rounded-lg transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-muted-foreground",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg",
                  isFocused ? "border-blue-500 shadow-lg" : "border-border",
                  getMobileClasses("", deviceInfo?.type)
                )}
              />
            )}

            {/* Character/Word Count */}
            {inputType === 'textarea' && textValue && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                <span>{textValue.length} characters</span>
              </div>
            )}

            {/* Validation message */}
            {isRequired && !textValue.trim() && textValue.length > 0 && (
              <p className="text-red-500 text-sm">This field is required</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                getMobileClasses("", deviceInfo?.type),
                isValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>{buttonLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          {deviceInfo?.type !== 'mobile' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 