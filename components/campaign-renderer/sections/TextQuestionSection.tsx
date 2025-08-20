'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor, getNextSectionButtonText } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'

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
  onResponseUpdate,
  userInputs,
  campaign,
  sections
}: SectionRendererProps) {
  // Initialize with existing response if available
  const existingResponse = userInputs?.[section.id] || ''
  const [inputValue, setInputValue] = useState(existingResponse)
  const [error, setError] = useState<string | null>(null)
  
  // Get configuration
  const configData = config as any
  const question = title || 'Please enter your response'
  const subheading = description || ''
  const fieldLabel = configData.label || configData.fieldLabel || ''
  const placeholder = configData.placeholder || 'Type your answer here...'
  const isRequired = configData.required ?? false
  const minLength = configData.minLength || 1
  const maxLength = configData.maxLength || 500
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
  const validateInput = (value: string): string | null => {
    if (isRequired && value.trim().length === 0) {
      return 'This field is required'
    }
    
    // Only enforce minLength if the field is required OR if the user has entered some text
    if (value.length > 0 && value.length < minLength) {
      return `Please enter at least ${minLength} character${minLength !== 1 ? 's' : ''}`
    }
    
    if (value.length > maxLength) {
      return `Please keep your response under ${maxLength} characters`
    }
    
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    setError(null)

    // Real-time validation
    const validationError = validateInput(value)
    if (validationError) {
      setError(validationError)
    }
    
    onResponseUpdate(section.id, 'text_response', value, {
      inputType: 'text',
      isValid: !validationError,
      isRequired: isRequired
    })
  }

  const handleContinue = () => {
    const validationError = validateInput(inputValue)
    
    if (validationError) {
      setError(validationError)
      return
    }

    onSectionComplete(index, {
      [section.id]: inputValue.trim(),
      text_response: inputValue.trim()
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleContinue()
    }
  }

  const canContinue = !isRequired || (inputValue.trim().length > 0 && inputValue.trim().length >= minLength && inputValue.length <= maxLength)

  // Generate validation text for bottom bar
  const validationText = isRequired ? 'This field is required' : undefined

  return (
    <div className="h-full flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 
              className={cn(
                "font-bold",
                deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
              )}
              style={primaryTextStyle}
            >
              {question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p 
                className={cn(
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}
                style={mutedTextStyle}
              >
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {fieldLabel && (
              <label className="block text-sm font-medium" style={primaryTextStyle}>
                {fieldLabel}
              </label>
            )}
              <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
                placeholder={placeholder}
                rows={6}
              maxLength={maxLength}
                className={cn(
                "w-full p-4 border rounded-lg resize-none",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-all duration-200",
                error 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300",
                getMobileClasses("text-base", deviceInfo?.type)
                )}
                style={{
                  backgroundColor: `#ffffff33`, // 20% opacity of white
                  color: theme.textColor
                }}
              />

            {/* Character Counter */}
            <div className="flex justify-between items-center text-sm">
              <div>
                {error && (
                  <span className="text-red-600">{error}</span>
                )}
              </div>
              <span className={cn(
                "text-muted-foreground",
                inputValue.length > maxLength * 0.9 && "text-amber-600",
                inputValue.length >= maxLength && "text-red-600"
              )}>
                {inputValue.length}/{maxLength}
              </span>
          </div>


          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        label={`Question ${index + 1}`}
        validationText={validationText}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !canContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 