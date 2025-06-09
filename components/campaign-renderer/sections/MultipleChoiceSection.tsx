'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getDefaultChoices } from '../utils'
import { cn } from '@/lib/utils'

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
  
  // Get the actual content from config
  const headline = configData.content || configData.question || title || 'Choose an option'
  const subheading = configData.subheading || description
  
  // Transform choices to ensure consistent structure
  const normalizedChoices = choices.map((choice, index) => {
    // Handle different possible structures
    const rawChoice = choice as any
    return {
      id: rawChoice.id || rawChoice.option_id || `choice-${index}`,
      label: rawChoice.label || rawChoice.text || rawChoice.option_text || `Option ${index + 1}`,
      value: rawChoice.value || rawChoice.option_value || rawChoice.id || rawChoice.option_id || `option-${index}`
    }
  })

  const handleSelect = (value: string) => {
    setSelectedValue(value)
    onResponseUpdate(section.id, 'choice', value, {
      inputType: 'multiple_choice',
      isRequired: isRequired
    })
  }

  const handleSubmit = () => {
    if (isRequired && !selectedValue) return
    
    const submissionData = {
      [section.id]: selectedValue,
      choice: selectedValue
    }

    console.log('🔘 MULTIPLE CHOICE SUBMISSION:')
    console.log('  Section ID:', section.id)
    console.log('  Section Title:', section.title)
    console.log('  Selected Value:', selectedValue)
    console.log('  Submission Data:', submissionData)
    console.log('  Section Index:', index)
    console.log('  Available Choices:', normalizedChoices)

    onSectionComplete(index, submissionData)
  }

  const isValid = !isRequired || selectedValue

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={onPrevious}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-sm text-muted-foreground">Question {index + 1}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {headline}
            </h1>
            
            {subheading && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {normalizedChoices.map((choice, choiceIndex) => {
              const isSelected = selectedValue === choice.value
              
              return (
                <button
                  key={`${choice.id}-${choiceIndex}`}
                  onClick={() => handleSelect(choice.value)}
                  className={cn(
                    "w-full p-4 border-2 rounded-xl text-left transition-all duration-200",
                    "flex items-center space-x-3 shadow-sm hover:shadow-md",
                    getMobileClasses("", deviceInfo?.type),
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-900 shadow-blue-100"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 bg-white"
                  )}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "flex-1 font-medium",
                    deviceInfo?.type === 'mobile' ? "text-base" : "text-lg",
                    isSelected ? "text-blue-900" : "text-gray-900"
                  )}>
                    {choice.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                getMobileClasses("", deviceInfo?.type),
                isValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>{buttonLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 