'use client'

import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getCampaignTheme, getCampaignButtonStyles, getCampaignTextColor, getNextSectionButtonText } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'

export function SliderSection({
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
  // Get configuration
  const configData = config as any
  const question = title || 'Rate your response'
  const subheading = description || ''
  const minValue = configData.minValue || 1
  const maxValue = configData.maxValue || 10
  const step = configData.step || 1
  const minLabel = configData.minLabel || 'Low'
  const maxLabel = configData.maxLabel || 'High'
  const isRequired = configData.required ?? false
  
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText

  // Initialize with existing response if available, otherwise use default
  const existingResponse = userInputs?.[section.id] 
  const defaultValue = existingResponse !== undefined ? existingResponse : Math.floor((minValue + maxValue) / 2)
  const [sliderValue, setSliderValue] = useState<number>(defaultValue)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setSliderValue(value)
    
    // Report to parent component
    onResponseUpdate(section.id, 'slider_value', value, {
      inputType: 'slider',
      isRequired: isRequired,
      range: { min: minValue, max: maxValue, step }
    })
  }

  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: sliderValue,
      slider_response: sliderValue
    })
  }

  // Get campaign theme colors
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')



  return (
    <div className="h-full flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )} style={primaryTextStyle}>
              {question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className={cn(
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )} style={mutedTextStyle}>
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {/* Current Value Display */}
            <div className="text-center">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor
                }}
              >
                {sliderValue}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="space-y-4">
              <div className="relative">
              <>
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .themed-slider-${section.id}::-webkit-slider-thumb {
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: ${theme.backgroundColor};
                      border: 2px solid ${theme.buttonColor};
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .themed-slider-${section.id}::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: ${theme.backgroundColor};
                      border: 2px solid ${theme.buttonColor};
                      cursor: pointer;
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .themed-slider-${section.id}:focus::-webkit-slider-thumb {
                      box-shadow: 0 0 0 3px ${theme.buttonColor}40;
                    }
                  `
                }} />
                <input
                  type="range"
                  min={minValue}
                  max={maxValue}
                  step={step}
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className={cn(
                    "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-opacity-50",
                    `themed-slider-${section.id}`
                  )}
                  style={{
                    background: `linear-gradient(to right, ${theme.buttonColor} 0%, ${theme.buttonColor} ${
                      ((sliderValue - minValue) / (maxValue - minValue)) * 100
                    }%, #e5e7eb ${
                      ((sliderValue - minValue) / (maxValue - minValue)) * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </>
              

              </div>

              {/* Labels */}
              <div className="flex justify-between items-center text-sm" style={mutedTextStyle}>
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
              </div>
            </div>

            {/* Additional context */}
            <div className="text-center text-sm" style={mutedTextStyle}>
              Move the slider to select your rating from {minValue} to {maxValue}
          </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Activity className="h-5 w-5 text-primary" />}
        label={`Rating ${index + 1}`}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 