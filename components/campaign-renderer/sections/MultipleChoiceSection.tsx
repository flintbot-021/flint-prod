'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getDefaultChoices, getCampaignTheme, getCampaignTextColor, getCampaignButtonStyles, getNextSectionButtonText } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'

export function MultipleChoiceSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  onResponseUpdate,
  userInputs,
  campaign,
  sections
}: SectionRendererProps) {
  // Initialize with existing response if available
  const existingResponse = userInputs?.[section.id] || ''
  const [selectedValue, setSelectedValue] = useState<string>(existingResponse)
  
  const choices = config.options || getDefaultChoices()
  const isRequired = config.required ?? false
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
  // Cast config to access additional properties
  const configData = config as any
  
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText
  const question = title || 'Please select an option'
  const helpText = description

  const handleChoiceSelect = (value: string) => {
    setSelectedValue(value)
    
    // Report selection to parent component
    onResponseUpdate(section.id, 'choice', value, {
      inputType: 'multiple_choice',
      isRequired: isRequired,
      selectedOption: value
    })
  }

  const handleContinue = () => {
    if (isRequired && !selectedValue) {
      return
    }

    onSectionComplete(index, {
      [section.id]: selectedValue,
      selected_choice: selectedValue
    })
  }

  const canContinue = !isRequired || selectedValue !== ''

  // Generate validation text for bottom bar
  const validationText = isRequired && !selectedValue ? 'Please select an option to continue' : undefined

  // Helper function to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    // Remove # if present
    const cleanHex = hex.replace('#', '')
    
    // Parse hex to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

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
            
            {helpText && (
              <p 
                className={cn(
                  "font-medium leading-relaxed max-w-2xl mx-auto",
                  deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl lg:text-2xl"
                )}
                style={mutedTextStyle}
              >
                {helpText}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {choices.map((choice: any, idx: number) => {
              const choiceValue = typeof choice === 'string' ? choice : choice.value || choice.text
              const choiceLabel = typeof choice === 'string' ? choice : choice.label || choice.text || choice.value
              const isSelected = selectedValue === choiceValue
              
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(choiceValue)}
                  className={cn(
                    "w-full p-6 rounded-2xl text-left transition-all duration-300 ease-out",
                    "flex items-center space-x-4 backdrop-blur-md border",
                    "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                    "group relative overflow-hidden",
                    getMobileClasses("", deviceInfo?.type)
                  )}
                  style={{
                    ...(isSelected ? {
                      backgroundColor: hexToRgba(theme.buttonColor, 0.2),
                      border: `2px solid ${theme.buttonColor}`,
                      boxShadow: `0 12px 40px ${hexToRgba(theme.buttonColor, 0.25)}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                    } : {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    })
                  }}
                >
                  <div className="flex-shrink-0 relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      isSelected 
                        ? "shadow-lg" 
                        : "group-hover:scale-110"
                    )}
                    style={{
                      backgroundColor: isSelected 
                        ? theme.buttonColor 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: isSelected 
                        ? `2px solid rgba(255, 255, 255, 0.3)` 
                        : `1px solid rgba(255, 255, 255, 0.2)`
                    }}>
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5" style={{ color: theme.buttonTextColor }} />
                      ) : (
                        <Circle className="h-4 w-4 opacity-60" style={{ color: theme.textColor }} />
                      )}
                    </div>
                  </div>
                  <span 
                    className={cn(
                      "text-left flex-1 transition-all duration-300",
                      isSelected ? "font-semibold text-lg" : "font-medium text-base group-hover:font-semibold"
                    )}
                    style={{ color: theme.textColor }}
                  >
                    {choiceLabel}
                  </span>
                </button>
              )
            })}
          </div>


        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

      {/* Shared Navigation Bar - Rendered via Portal */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
        label={`Choice ${index + 1}`}
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