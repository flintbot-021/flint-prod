'use client'

import React, { useState, useEffect } from 'react'
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
  const minValue = configData.minValue !== undefined ? configData.minValue : 1
  const maxValue = configData.maxValue !== undefined ? configData.maxValue : 10
  const step = configData.step !== undefined ? configData.step : 1
  const minLabel = configData.minLabel || 'Low'
  const maxLabel = configData.maxLabel || 'High'
  const isRequired = configData.required ?? false
  const allowPlus = configData.allowPlus || false
  
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText

  // Initialize with existing response if available, otherwise use middle value
  const existingResponse = userInputs?.[section.id] 
  const calculateMiddleValue = () => {
    // Calculate the middle point and align it to the step increment
    const range = maxValue - minValue
    const middlePoint = minValue + (range / 2)
    
    // Round to the nearest step increment from minValue
    const stepsFromMin = Math.round((middlePoint - minValue) / step)
    return minValue + (stepsFromMin * step)
  }
  
  // Extract numeric value from response (handle both direct numbers and objects with value property)
  const getNumericValue = (response: any): number => {
    if (response === undefined || response === null) {
      return calculateMiddleValue()
    }
    
    // If it's already a number, use it
    if (typeof response === 'number') {
      return response
    }
    
    // If it's an object with a value property, extract the value
    if (typeof response === 'object' && 'value' in response) {
      return typeof response.value === 'number' ? response.value : calculateMiddleValue()
    }
    
    // If it's a string that can be parsed as a number
    if (typeof response === 'string') {
      const parsed = parseFloat(response)
      return !isNaN(parsed) ? parsed : calculateMiddleValue()
    }
    
    // Fallback to middle value
    return calculateMiddleValue()
  }
  
  const defaultValue = getNumericValue(existingResponse)
  const [sliderValue, setSliderValue] = useState<number>(defaultValue)

  // Update slider value if min/max changes and no user input exists
  useEffect(() => {
    if (existingResponse === undefined) {
      const newMiddleValue = calculateMiddleValue()
      if (sliderValue !== newMiddleValue) {
        setSliderValue(newMiddleValue)
      }
    }
  }, [minValue, maxValue, step, existingResponse, sliderValue])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setSliderValue(value)
    
    // Determine if this is a "plus" value
    const isMaxWithPlus = allowPlus && value === maxValue
    const displayValue = isMaxWithPlus ? `${value}+` : value
    
    // Report to parent component - use section.id as field for consistency with variable system
    onResponseUpdate(section.id, section.id, value, {
      inputType: 'slider',
      isRequired: isRequired,
      range: { min: minValue, max: maxValue, step },
      displayValue: displayValue,
      isMaxWithPlus: isMaxWithPlus
    })
  }

  const handleContinue = () => {
    const isMaxWithPlus = allowPlus && sliderValue === maxValue
    const displayValue = isMaxWithPlus ? `${sliderValue}+` : sliderValue
    
    onSectionComplete(index, {
      [section.id]: sliderValue,
      slider_response: sliderValue,
      [`${section.id}_display`]: displayValue,
      [`${section.id}_is_max_plus`]: isMaxWithPlus
    })
  }

  // Get campaign theme colors
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')



  return (
    <div className={cn(
      "h-full flex flex-col",
      deviceInfo?.type === 'mobile' ? "pb-40" : "pb-32"
    )} style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12 pt-20">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <h1 className={cn(
              "font-black tracking-tight leading-tight",
              deviceInfo?.type === 'mobile' ? "text-4xl" : "text-5xl lg:text-6xl"
            )} style={primaryTextStyle}>
              {question}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className={cn(
                "font-medium leading-relaxed max-w-2xl mx-auto",
                deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl lg:text-2xl"
              )} style={mutedTextStyle}>
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {/* Current Value Display */}
            <div className="text-center">
              <div 
                className="inline-flex items-center justify-center min-w-20 min-h-20 px-4 py-3 rounded-2xl text-3xl font-black backdrop-blur-md border shadow-2xl transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                  border: `2px solid rgba(255, 255, 255, 0.2)`,
                  boxShadow: `0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                }}
              >
                {sliderValue}{allowPlus && sliderValue === maxValue ? '+' : ''}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="space-y-6">
              <div className="relative p-6 rounded-2xl backdrop-blur-md border shadow-lg" 
                   style={{
                     backgroundColor: 'rgba(255, 255, 255, 0.08)',
                     border: '1px solid rgba(255, 255, 255, 0.15)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                   }}>
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
                    "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider",
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
              </div>

              {/* Labels */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-white/10" 
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', ...mutedTextStyle }}>
                  {minLabel}
                </span>
                <span className="text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm border border-white/10" 
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', ...mutedTextStyle }}>
                  {maxLabel}
                </span>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Activity className="h-5 w-5 text-primary" />}
        label={`Rating ${index + 1}`}
        navigationHints={{
          text: "Drag slider or use arrow keys • Enter to continue • ← → to navigate • Esc to go back"
        }}
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