'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn, normalizeUrl } from '@/lib/utils'
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
  const existingResponse = String(userInputs?.[section.id] || '')
  const [inputValue, setInputValue] = useState(existingResponse)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  
  // Get configuration
  const configData = config as any
  const question = title || 'Please enter your response'
  const subheading = description || ''
  const fieldLabel = configData.label || configData.fieldLabel || ''
  const isUrlInput = configData.isUrlInput || false
  const textArea = configData.textArea ?? true // Default to true for backward compatibility
  const placeholder = configData.placeholder || (isUrlInput ? 'https://example.com' : 'Type your answer here...')
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
  
  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      // First normalize the URL to add protocol if missing
      const normalizedUrl = normalizeUrl(url)
      new URL(normalizedUrl)
      return true
    } catch {
      return false
    }
  }

  // Domain validation helper - checks if input looks like a valid domain
  const isValidDomain = (input: string): boolean => {
    // Must have at least one dot
    if (!input.includes('.')) return false
    
    const parts = input.split('.')
    if (parts.length < 2) return false
    
    // Last part must be a valid TLD (2+ characters, letters only, and look like a real TLD)
    const tld = parts[parts.length - 1].toLowerCase()
    
    // Common TLD validation - must be 2+ chars and letters only
    if (!/^[a-z]{2,}$/.test(tld)) return false
    
    // Reject obvious non-TLDs (words that are too long or don't look like TLDs)
    if (tld.length > 10) return false // Most TLDs are short
    
    // Basic domain pattern check
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
    
    return domainPattern.test(input)
  }

  const validateInput = (value: string): string | null => {
    if (isRequired && value.trim().length === 0) {
      return 'This field is required'
    }
    
    // URL-specific validation
    if (isUrlInput && value.trim().length > 0) {
      const trimmedValue = value.trim()
      
      // Check if it's already a valid URL with protocol
      if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) {
        if (!isValidUrl(trimmedValue)) {
          return 'Please enter a valid URL (e.g., https://example.com)'
        }
      }
      // Check if it's a valid domain that can be normalized
      else if (!isValidDomain(trimmedValue)) {
        return 'Please enter a valid domain (e.g., example.com, www.example.com) or full URL'
      }
    }
    
    // Only enforce minLength if the field is required OR if the user has entered some text
    if (!isUrlInput && value.length > 0 && value.length < minLength) {
      return `Please enter at least ${minLength} character${minLength !== 1 ? 's' : ''}`
    }
    
    if (value.length > maxLength) {
      return `Please keep your response under ${maxLength} characters`
    }
    
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setError(null)

    // Real-time validation
    const validationError = validateInput(value)
    if (validationError) {
      setError(validationError)
    }
    
    onResponseUpdate(section.id, isUrlInput ? 'url_response' : 'text_response', value, {
      inputType: isUrlInput ? 'url' : 'text',
      isValid: !validationError,
      isRequired: isRequired,
      isUrlInput: isUrlInput
    })
  }

  const handleContinue = () => {
    const validationError = validateInput(inputValue)
    
    if (validationError) {
      setError(validationError)
      return
    }

    // Normalize URL if it's a URL input
    const finalValue = isUrlInput ? normalizeUrl(inputValue.trim()) : inputValue.trim()

    onSectionComplete(index, {
      [section.id]: finalValue,
      text_response: finalValue
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Note: Most keyboard navigation is now handled by the global SectionRenderer
    // This local handler is kept for any text-specific edge cases on desktop only
    
    // Skip keyboard shortcuts on mobile devices to prevent conflicts
    if (deviceInfo?.type === 'mobile') {
      return
    }
    
    // For URL inputs and single-line inputs, we still handle Enter locally for immediate response
    if (e.key === 'Enter' && (isUrlInput || !textArea) && canContinue) {
      e.preventDefault()
      handleContinue()
    }
  }

  const canContinue = !isRequired || (inputValue.trim().length > 0 && inputValue.trim().length >= minLength && inputValue.length <= maxLength)

  // Auto-focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Generate validation text for bottom bar
  const validationText = isRequired ? 'This field is required' : undefined

  return (
    <div className={cn(
      "h-full flex flex-col",
      deviceInfo?.type === 'mobile' ? "pb-40" : "pb-32"
    )} style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12 pt-20">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <h1 
              className={cn(
                "font-black tracking-tight leading-tight",
                deviceInfo?.type === 'mobile' ? "text-4xl" : "text-5xl lg:text-6xl"
              )}
              style={primaryTextStyle}
            >
              {question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p 
                className={cn(
                  "font-medium leading-relaxed max-w-2xl mx-auto",
                  deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl lg:text-2xl"
                )}
                style={mutedTextStyle}
              >
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {fieldLabel && (
              <label className="block text-base font-semibold" style={primaryTextStyle}>
                {fieldLabel}
              </label>
            )}
            <div className="relative">
              {isUrlInput ? (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="url"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className={cn(
                    "w-full p-6 rounded-2xl backdrop-blur-md border-0",
                    "focus:ring-2 focus:ring-opacity-50 focus:outline-none",
                    "transition-all duration-300 ease-out",
                    "shadow-lg hover:shadow-xl",
                    "placeholder:text-opacity-60",
                    "font-mono text-base", // Monospace font for URLs
                    error 
                      ? "ring-2 ring-red-500 ring-opacity-50" 
                      : "hover:shadow-2xl focus:shadow-2xl",
                    getMobileClasses("text-lg", deviceInfo?.type)
                  )}
                  style={{
                    backgroundColor: `rgba(255, 255, 255, 0.15)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(255, 255, 255, 0.2)`,
                    color: theme.textColor,
                    boxShadow: error 
                      ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                />
              ) : textArea ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  rows={6}
                  maxLength={maxLength}
                  className={cn(
                    "w-full p-6 rounded-2xl resize-none backdrop-blur-md border-0",
                    "focus:ring-2 focus:ring-opacity-50 focus:outline-none",
                    "transition-all duration-300 ease-out",
                    "shadow-lg hover:shadow-xl",
                    "placeholder:text-opacity-60",
                    error 
                      ? "ring-2 ring-red-500 ring-opacity-50" 
                      : "hover:shadow-2xl focus:shadow-2xl",
                    getMobileClasses("text-lg", deviceInfo?.type)
                  )}
                  style={{
                    backgroundColor: `rgba(255, 255, 255, 0.15)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(255, 255, 255, 0.2)`,
                    color: theme.textColor,
                    boxShadow: error 
                      ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className={cn(
                    "w-full p-6 rounded-2xl backdrop-blur-md border-0",
                    "focus:ring-2 focus:ring-opacity-50 focus:outline-none",
                    "transition-all duration-300 ease-out",
                    "shadow-lg hover:shadow-xl",
                    "placeholder:text-opacity-60",
                    error 
                      ? "ring-2 ring-red-500 ring-opacity-50" 
                      : "hover:shadow-2xl focus:shadow-2xl",
                    getMobileClasses("text-lg", deviceInfo?.type)
                  )}
                  style={{
                    backgroundColor: `rgba(255, 255, 255, 0.15)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid rgba(255, 255, 255, 0.2)`,
                    color: theme.textColor,
                    boxShadow: error 
                      ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}
            </div>

            {/* Character Counter - Only show for textarea mode */}
            <div className="flex justify-between items-center">
              <div>
                {error && (
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 backdrop-blur-sm border border-red-500/20">
                    <span className="text-red-600 font-medium text-sm">{error}</span>
                  </div>
                )}
              </div>
              {textArea && (
                <div className="px-3 py-1 rounded-full backdrop-blur-sm border border-white/10" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <span className={cn(
                    "text-sm font-medium",
                    inputValue.length > maxLength * 0.9 && "text-amber-500",
                    inputValue.length >= maxLength && "text-red-500"
                  )} style={inputValue.length > maxLength * 0.9 ? undefined : mutedTextStyle}>
                    {inputValue.length}/{maxLength}
                  </span>
                </div>
              )}
          </div>


          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<MessageSquare className="h-5 w-5 text-primary" />}
        label={`Question ${index + 1}`}
        validationText={validationText}
        navigationHints={{
          text: deviceInfo?.type === 'mobile' 
            ? "Type your answer • Tap Continue to proceed" 
            : "Press Enter to continue • ← → to navigate • Esc to go back"
        }}
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