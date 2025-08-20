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
            
            {helpText && (
              <p 
                className={cn(
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}
                style={mutedTextStyle}
              >
                {helpText}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {choices.map((choice: any, idx: number) => {
              const choiceValue = typeof choice === 'string' ? choice : choice.value || choice.text
              const choiceLabel = typeof choice === 'string' ? choice : choice.label || choice.text || choice.value
              const isSelected = selectedValue === choiceValue
              
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(choiceValue)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all duration-200",
                    "flex items-center space-x-3 hover:shadow-md",
                    !isSelected && "hover:bg-muted/50",
                    getMobileClasses("", deviceInfo?.type)
                  )}
                  style={{
                    ...(isSelected ? {
                      borderColor: theme.buttonColor, // primary button at 100%
                      backgroundColor: hexToRgba(theme.buttonColor, 0.2), // 20% opacity of button color
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    } : {
                      borderColor: `${theme.buttonColor}1A`, // primary button at 10% opacity
                      backgroundColor: `#ffffff33`, // 20% opacity white
                    })
                  }}
                >
                  <div className="flex-shrink-0">
                  {isSelected ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: theme.buttonColor }} />
                  ) : (
                      <Circle className="h-5 w-5" style={{ color: `${theme.buttonColor}1A` }} />
                  )}
                  </div>
                  <span 
                    className={cn(
                      "text-left",
                      isSelected && "font-medium"
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
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} />}

      {/* Shared Navigation Bar */}
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