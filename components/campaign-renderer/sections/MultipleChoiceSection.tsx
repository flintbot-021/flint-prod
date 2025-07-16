'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getDefaultChoices, getCampaignTheme, getCampaignTextColor, getCampaignButtonStyles } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

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
  campaign
}: SectionRendererProps) {
  // Initialize with existing response if available
  const existingResponse = userInputs?.[section.id] || ''
  const [selectedValue, setSelectedValue] = useState<string>(existingResponse)
  
  const choices = config.options || getDefaultChoices()
  const isRequired = config.required ?? true
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
  // Cast config to access additional properties
  const configData = config as any
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'
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
                      borderColor: theme.buttonColor,
                      backgroundColor: `${theme.buttonColor}15`,
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    } : {
                      borderColor: '#e5e7eb', // border-border equivalent
                    })
                  }}
                >
                  <div className="flex-shrink-0">
                  {isSelected ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: theme.buttonColor }} />
                  ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  </div>
                  <span 
                    className={cn(
                      "text-left",
                      isSelected && "font-medium"
                    )}
                    style={primaryTextStyle}
                  >
                    {choiceLabel}
                  </span>
                </button>
              )
            })}
          </div>


        </div>
      </div>

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