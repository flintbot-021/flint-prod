'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getDefaultChoices } from '../utils'
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
  onResponseUpdate
}: SectionRendererProps) {
  const [selectedValue, setSelectedValue] = useState<string>('')
  
  const choices = config.options || getDefaultChoices()
  const isRequired = config.required ?? true
  
  // Cast config to access additional properties
  const configData = config as any
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'
  const question = configData.content || configData.question || title || 'Please select an option'
  const helpText = configData.helpText || description

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

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {helpText && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
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
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    getMobileClasses("", deviceInfo?.type)
                  )}
                >
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn(
                    "text-left",
                    isSelected ? "text-foreground font-medium" : "text-foreground"
                  )}>
                    {choiceLabel}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Required field indicator */}
          {isRequired && !selectedValue && (
            <div className="text-center text-sm text-muted-foreground">
              Please select an option to continue
            </div>
          )}
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
        label={`Choice ${index + 1}`}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !canContinue
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 