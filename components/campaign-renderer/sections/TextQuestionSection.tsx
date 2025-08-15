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
    <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-12">
            <div className="space-y-3">
              <h1 
                className={cn(
                  "font-black tracking-tight leading-tight",
                  deviceInfo?.type === 'mobile' 
                    ? "text-4xl sm:text-5xl" 
                    : "text-5xl sm:text-6xl lg:text-7xl"
                )}
                style={primaryTextStyle}
              >
                {question}
                {isRequired && <span className="text-red-500 ml-2">*</span>}
              </h1>
              
              {subheading && (
                <p 
                  className={cn(
                    "font-medium leading-relaxed max-w-3xl mx-auto",
                    deviceInfo?.type === 'mobile' 
                      ? "text-lg sm:text-xl" 
                      : "text-xl sm:text-2xl lg:text-3xl"
                  )}
                  style={mutedTextStyle}
                >
                  {subheading}
                </p>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-5 w-5 opacity-60" style={primaryTextStyle} />
              <span className="text-sm font-medium opacity-60" style={primaryTextStyle}>
                Question {index + 1}
              </span>
            </div>
          </div>

          {/* Input Section */}
          <div className="max-w-3xl mx-auto space-y-6">
            {fieldLabel && (
              <label className="block text-lg font-semibold mb-3" style={primaryTextStyle}>
                {fieldLabel}
              </label>
            )}
            
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                rows={deviceInfo?.type === 'mobile' ? 4 : 6}
                maxLength={maxLength}
                className={cn(
                  "w-full p-6 border-2 rounded-2xl resize-none",
                  "text-lg leading-relaxed",
                  "focus:ring-4 focus:ring-opacity-20 focus:border-transparent",
                  "transition-all duration-300 ease-out",
                  "shadow-lg hover:shadow-xl",
                  "bg-white/90 backdrop-blur-sm",
                  error 
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                  getMobileClasses("text-base", deviceInfo?.type)
                )}
                style={{
                  minHeight: deviceInfo?.type === 'mobile' ? '120px' : '160px'
                }}
              />
              
              {/* Floating Character Counter */}
              <div className="absolute bottom-3 right-4">
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  "transition-colors duration-200",
                  inputValue.length > maxLength * 0.9 
                    ? "bg-amber-100 text-amber-700" 
                    : inputValue.length >= maxLength 
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {inputValue.length}/{maxLength}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Helper Text */}
            <div className="text-center">
              <p className="text-sm opacity-60" style={mutedTextStyle}>
                {deviceInfo?.type === 'desktop' && "Press Ctrl+Enter to continue, or use the button below"}
                {deviceInfo?.type !== 'desktop' && "Tap the button below when you're ready to continue"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} />}

      {/* Enhanced Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<MessageSquare className="h-5 w-5" style={primaryTextStyle} />}
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