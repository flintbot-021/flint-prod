'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor, getNextSectionButtonText } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// =============================================================================
// DATE TIME SECTION COMPONENT
// =============================================================================

export function DateTimeSection({
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
  // Parse existing response (could be combined date/time or separate values)
  const existingData = userInputs?.[section.id] as any
  const [selectedDate, setSelectedDate] = useState(existingData?.date || (typeof existingResponse === 'string' && existingResponse.includes('-') ? existingResponse.split(' ')[0] : ''))
  const [selectedTime, setSelectedTime] = useState(existingData?.time || (typeof existingResponse === 'string' && existingResponse.includes(':') ? existingResponse.split(' ')[1] : ''))
  const [error, setError] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)
  
  // Get configuration
  const configData = config as any
  const question = title || 'Select a date and time'
  const subheading = description || ''
  const includeDate = configData.includeDate ?? true
  const includeTime = configData.includeTime ?? false
  const isRequired = configData.required ?? false
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
  const validateInput = (): string | null => {
    if (isRequired) {
      if (includeDate && !selectedDate) {
        return 'Please select a date'
      }
      if (includeTime && !selectedTime) {
        return 'Please select a time'
      }
      if (!includeDate && !includeTime) {
        return 'Please make a selection'
      }
    }
    return null
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedDate(value)
    setError(null)
    
    // Update response with combined date/time value
    const combinedValue = getCombinedValue(value, selectedTime)
    onResponseUpdate(section.id, 'date_time_response', combinedValue, {
      inputType: 'date_time',
      date: value,
      time: selectedTime,
      includeDate,
      includeTime,
      isValid: !validateInput(),
      isRequired: isRequired
    })
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedTime(value)
    setError(null)
    
    // Update response with combined date/time value
    const combinedValue = getCombinedValue(selectedDate, value)
    onResponseUpdate(section.id, 'date_time_response', combinedValue, {
      inputType: 'date_time',
      date: selectedDate,
      time: value,
      includeDate,
      includeTime,
      isValid: !validateInput(),
      isRequired: isRequired
    })
  }

  const getCombinedValue = (date: string, time: string): string => {
    const parts = []
    if (includeDate && date) parts.push(date)
    if (includeTime && time) parts.push(time)
    return parts.join(' ')
  }

  const handleContinue = () => {
    const validationError = validateInput()
    
    if (validationError) {
      setError(validationError)
      return
    }

    const combinedValue = getCombinedValue(selectedDate, selectedTime)
    onSectionComplete(index, {
      [section.id]: combinedValue,
      date_time_response: combinedValue,
      date: selectedDate,
      time: selectedTime
    })
  }

  const canContinue = !isRequired || !validateInput()

  // Auto-focus the appropriate input when component mounts
  useEffect(() => {
    // Focus on date input if it's enabled, otherwise time input
    const inputToFocus = includeDate ? dateInputRef.current : timeInputRef.current
    if (inputToFocus) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        inputToFocus.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [includeDate, includeTime])

  // Generate validation text for bottom bar
  const validationText = isRequired ? (
    includeDate && includeTime ? 
      'Date and time required' : 
      includeDate ? 
        'Date required' : 
        includeTime ? 
          'Time required' : 
          'Selection required'
  ) : undefined

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

          <div className="space-y-10">
            {/* Date Input - Only if includeDate is true */}
            {includeDate && (
              <div className="space-y-6">
                <div className="relative max-w-sm mx-auto">
                  <Input
                    ref={dateInputRef}
                    id={`date-${section.id}`}
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className={cn(
                      "w-full p-5 rounded-2xl backdrop-blur-md border transition-all duration-300 ease-out",
                      "focus:ring-2 focus:ring-opacity-50 focus:outline-none shadow-xl hover:shadow-2xl",
                      "text-center font-semibold text-lg",
                      error && includeDate && !selectedDate 
                        ? "ring-2 ring-red-500 ring-opacity-50 border-red-500/30" 
                        : "hover:scale-[1.02] focus:scale-[1.02]",
                      getMobileClasses("text-lg", deviceInfo?.type)
                    )}
                    style={{
                      ...primaryTextStyle,
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(20px)',
                      border: error && includeDate && !selectedDate
                        ? '2px solid rgba(239, 68, 68, 0.4)'
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: error && includeDate && !selectedDate
                        ? '0 12px 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Time Input - Only if includeTime is true */}
            {includeTime && (
              <div className="space-y-6">
                <div className="relative max-w-sm mx-auto">
                  <Input
                    ref={timeInputRef}
                    id={`time-${section.id}`}
                    type="time"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    className={cn(
                      "w-full p-5 rounded-2xl backdrop-blur-md border transition-all duration-300 ease-out",
                      "focus:ring-2 focus:ring-opacity-50 focus:outline-none shadow-xl hover:shadow-2xl",
                      "text-center font-semibold text-lg",
                      error && includeTime && !selectedTime 
                        ? "ring-2 ring-red-500 ring-opacity-50 border-red-500/30" 
                        : "hover:scale-[1.02] focus:scale-[1.02]",
                      getMobileClasses("text-lg", deviceInfo?.type)
                    )}
                    style={{
                      ...primaryTextStyle,
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(20px)',
                      border: error && includeTime && !selectedTime
                        ? '2px solid rgba(239, 68, 68, 0.4)'
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: error && includeTime && !selectedTime
                        ? '0 12px 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 px-6 py-4 rounded-2xl backdrop-blur-md border shadow-xl"
                     style={{
                       backgroundColor: 'rgba(239, 68, 68, 0.1)',
                       border: '2px solid rgba(239, 68, 68, 0.3)',
                       boxShadow: '0 12px 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                     }}>
                  <span className="text-red-600 font-semibold text-base">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Calendar className="h-5 w-5" style={primaryTextStyle} />}
        label={`Question ${index + 1}`}
        validationText={validationText}
        navigationHints={{
          text: "Use date/time inputs • Enter to continue • ← → to navigate • Esc to go back"
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