'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor } from '../utils'
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
  campaign
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
  const question = title || 'Select a date and time'
  const subheading = description || ''
  const includeDate = configData.includeDate ?? true
  const includeTime = configData.includeTime ?? false
  const isRequired = configData.required ?? false
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'
  
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

          <div className="space-y-6">
            {/* Date Input - Only if includeDate is true */}
            {includeDate && (
              <div className="space-y-3">
                <Label htmlFor={`date-${section.id}`} className="text-sm font-medium flex items-center gap-2" style={primaryTextStyle}>
                  <Calendar className="h-4 w-4" style={primaryTextStyle} />
                  Date
                </Label>
                <Input
                  id={`date-${section.id}`}
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className={cn(
                    "w-full",
                    error && includeDate && !selectedDate 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300",
                    getMobileClasses("text-base", deviceInfo?.type)
                  )}
                  style={{
                    ...primaryTextStyle,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: theme.buttonColor + '40'
                  }}
                />
              </div>
            )}

            {/* Time Input - Only if includeTime is true */}
            {includeTime && (
              <div className="space-y-3">
                <Label htmlFor={`time-${section.id}`} className="text-sm font-medium flex items-center gap-2" style={primaryTextStyle}>
                  <Clock className="h-4 w-4" style={primaryTextStyle} />
                  Time
                </Label>
                <Input
                  id={`time-${section.id}`}
                  type="time"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className={cn(
                    "w-full",
                    error && includeTime && !selectedTime 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300",
                    getMobileClasses("text-base", deviceInfo?.type)
                  )}
                  style={{
                    ...primaryTextStyle,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: theme.buttonColor + '40'
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-center">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} isFirstQuestion={index === 0} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Calendar className="h-5 w-5" style={primaryTextStyle} />}
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