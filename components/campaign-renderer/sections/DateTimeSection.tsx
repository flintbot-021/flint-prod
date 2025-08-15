'use client'

import React, { useState, useEffect } from 'react'
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
  
  // Get configuration
  const configData = config as any
  const question = title || 'Select Date'
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
    <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-12">
            <div className="space-y-3">
              <h1 
                className={cn(
                  "font-black tracking-tight leading-tight text-gray-900",
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
              <Calendar className="h-5 w-5 opacity-60" style={primaryTextStyle} />
              <span className="text-sm font-medium opacity-60" style={primaryTextStyle}>
                Date & Time {index + 1}
              </span>
            </div>
          </div>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto space-y-8">

            <div className="grid gap-6">
              {/* Date Input - Only if includeDate is true */}
              {includeDate && (
                <div className="space-y-3">
                  <Label htmlFor={`date-${section.id}`} className="text-lg font-semibold flex items-center gap-3" style={primaryTextStyle}>
                    <Calendar className="h-5 w-5" style={primaryTextStyle} />
                    Select Date {isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`date-${section.id}`}
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className={cn(
                      "w-full !h-auto !px-6 !py-6 border-2 rounded-2xl text-lg font-medium",
                      "focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",
                      "transition-all duration-300 ease-out",
                      "shadow-lg hover:shadow-xl",
                      "bg-white border-gray-300 hover:border-gray-400",
                      "text-gray-900 placeholder:text-gray-500",
                      "focus-visible:ring-4 focus-visible:ring-blue-500/20",
                      error && includeDate && !selectedDate 
                        ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" 
                        : "",
                      getMobileClasses("!px-4 !py-4 text-base", deviceInfo?.type)
                    )}
                    style={{
                      colorScheme: 'light'
                    }}
                  />
                </div>
              )}

              {/* Time Input - Only if includeTime is true */}
              {includeTime && (
                <div className="space-y-3">
                  <Label htmlFor={`time-${section.id}`} className="text-lg font-semibold flex items-center gap-3" style={primaryTextStyle}>
                    <Clock className="h-5 w-5" style={primaryTextStyle} />
                    Select Time {isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`time-${section.id}`}
                    type="time"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    className={cn(
                      "w-full !h-auto !px-6 !py-6 border-2 rounded-2xl text-lg font-medium",
                      "focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",
                      "transition-all duration-300 ease-out",
                      "shadow-lg hover:shadow-xl",
                      "bg-white border-gray-300 hover:border-gray-400",
                      "text-gray-900 placeholder:text-gray-500",
                      "focus-visible:ring-4 focus-visible:ring-blue-500/20",
                      error && includeTime && !selectedTime 
                        ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" 
                        : "",
                      getMobileClasses("!px-4 !py-4 text-base", deviceInfo?.type)
                    )}
                    style={{
                      colorScheme: 'light'
                    }}
                  />
                </div>
              )}
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
                {includeDate && includeTime 
                  ? "Select both date and time to continue"
                  : includeDate 
                  ? "Pick your preferred date"
                  : "Choose your preferred time"
                }
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
        icon={<Calendar className="h-5 w-5" style={primaryTextStyle} />}
        label={`Date & Time ${index + 1}`}
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