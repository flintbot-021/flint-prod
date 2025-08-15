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
              
              {helpText && (
                <p 
                  className={cn(
                    "font-medium leading-relaxed max-w-3xl mx-auto",
                    deviceInfo?.type === 'mobile' 
                      ? "text-lg sm:text-xl" 
                      : "text-xl sm:text-2xl lg:text-3xl"
                  )}
                  style={mutedTextStyle}
                >
                  {helpText}
                </p>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="h-5 w-5 opacity-60" style={primaryTextStyle} />
              <span className="text-sm font-medium opacity-60" style={primaryTextStyle}>
                Choice {index + 1}
              </span>
            </div>
          </div>

          {/* Choices Section */}
          <div className="max-w-3xl mx-auto space-y-4">
            {choices.map((choice: any, idx: number) => {
              const choiceValue = typeof choice === 'string' ? choice : choice.value || choice.text
              const choiceLabel = typeof choice === 'string' ? choice : choice.label || choice.text || choice.value
              const isSelected = selectedValue === choiceValue
              
              return (
                <button
                  key={idx}
                  onClick={() => handleChoiceSelect(choiceValue)}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 ease-out",
                    "flex items-center space-x-4 shadow-lg hover:shadow-xl",
                    "transform hover:scale-[1.02] active:scale-[0.98]",
                    "bg-white/90 backdrop-blur-sm",
                    !isSelected && "hover:bg-muted/20 border-gray-200 hover:border-gray-300",
                    getMobileClasses("p-4 space-x-3", deviceInfo?.type)
                  )}
                  style={{
                    ...(isSelected ? {
                      borderColor: theme.buttonColor,
                      backgroundColor: `${theme.buttonColor}20`,
                      boxShadow: `0 8px 25px -5px ${theme.buttonColor}40, 0 4px 10px -2px ${theme.buttonColor}20`
                    } : {
                      borderColor: '#e5e7eb',
                    })
                  }}
                >
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.buttonColor }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <Circle className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <span 
                    className={cn(
                      "text-left text-lg leading-relaxed",
                      isSelected ? "font-semibold" : "font-medium"
                    )}
                    style={primaryTextStyle}
                  >
                    {choiceLabel}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Helper Text */}
          <div className="text-center mt-8">
            <p className="text-sm opacity-60" style={mutedTextStyle}>
              Choose one option to continue
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} />}

      {/* Enhanced Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<CheckCircle2 className="h-5 w-5" style={primaryTextStyle} />}
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