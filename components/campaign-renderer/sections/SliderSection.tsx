'use client'

import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getCampaignTheme, getCampaignButtonStyles, getCampaignTextColor, getNextSectionButtonText } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'

// Custom CSS for enhanced slider styling
const sliderStyles = `
  .enhanced-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  .enhanced-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--slider-thumb-color);
    cursor: pointer;
    border: 4px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .enhanced-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  .enhanced-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--slider-thumb-color);
    cursor: pointer;
    border: 4px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .enhanced-slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  .enhanced-slider:focus::-webkit-slider-thumb {
    outline: none;
    ring: 4px;
    ring-color: var(--slider-focus-color);
    ring-opacity: 0.3;
  }
`

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
    <>
      {/* Inject custom slider styles */}
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
      
      <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: theme.backgroundColor }}>
        {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center space-y-6 mb-16">
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
              <Activity className="h-5 w-5 opacity-60" style={primaryTextStyle} />
              <span className="text-sm font-medium opacity-60" style={primaryTextStyle}>
                Rating {index + 1}
              </span>
            </div>
          </div>

          {/* Slider Interface */}
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Current Value Display - Enhanced */}
            <div className="text-center">
              <div className="relative inline-block">
                <div 
                  className={cn(
                    "inline-flex items-center justify-center rounded-3xl font-black shadow-2xl",
                    "transform transition-all duration-300 hover:scale-105",
                    deviceInfo?.type === 'mobile' 
                      ? "w-24 h-24 text-3xl" 
                      : "w-32 h-32 text-5xl"
                  )}
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: theme.backgroundColor
                  }}
                >
                  {sliderValue}
                </div>
                
                {/* Animated Ring */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-3xl opacity-20 animate-pulse",
                    deviceInfo?.type === 'mobile' ? "w-24 h-24" : "w-32 h-32"
                  )}
                  style={{
                    backgroundColor: theme.buttonColor,
                    transform: 'scale(1.1)'
                  }}
                />
              </div>
            </div>
            
            {/* Enhanced Slider Container */}
            <div className="space-y-8">
              <div className="relative px-4">
                {/* Custom Slider Track with Enhanced Design */}
                <div className="relative">
                  <input
                    type="range"
                    min={minValue}
                    max={maxValue}
                    step={step}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className={cn(
                      "w-full enhanced-slider",
                      "focus:outline-none focus:ring-4 focus:ring-opacity-20",
                      "transition-all duration-200"
                    )}
                    style={{
                      height: '12px',
                      borderRadius: '6px',
                      background: `linear-gradient(to right, ${theme.buttonColor} 0%, ${theme.buttonColor} ${
                        ((sliderValue - minValue) / (maxValue - minValue)) * 100
                      }%, #e5e7eb ${
                        ((sliderValue - minValue) / (maxValue - minValue)) * 100
                      }%, #e5e7eb 100%)`,
                      // Custom thumb styling
                      ['--slider-thumb-color' as any]: theme.buttonColor,
                      ['--slider-focus-color' as any]: theme.buttonColor,
                    }}
                  />
                  
                  {/* Value Ticks */}
                  <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs font-medium opacity-50" style={mutedTextStyle}>
                    {Array.from({ length: Math.min(maxValue - minValue + 1, 11) }, (_, i) => {
                      const tickValue = minValue + Math.floor(i * (maxValue - minValue) / Math.min(maxValue - minValue, 10))
                      return (
                        <span 
                          key={i} 
                          className={cn(
                            "transition-all duration-200",
                            tickValue === sliderValue && "font-bold opacity-100"
                          )}
                          style={tickValue === sliderValue ? primaryTextStyle : undefined}
                        >
                          {tickValue}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Enhanced Labels with Icons */}
              <div className="flex justify-between items-center px-4">
                <div className="text-center space-y-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full mx-auto opacity-60"></div>
                  <span className="text-sm font-semibold" style={mutedTextStyle}>
                    {minLabel}
                  </span>
                  <div className="text-xs opacity-60" style={mutedTextStyle}>
                    {minValue}
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto opacity-60"></div>
                  <span className="text-sm font-semibold" style={mutedTextStyle}>
                    {maxLabel}
                  </span>
                  <div className="text-xs opacity-60" style={mutedTextStyle}>
                    {maxValue}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Helper Text */}
            <div className="text-center space-y-2">
              <p className="text-sm opacity-60" style={mutedTextStyle}>
                {deviceInfo?.type === 'mobile' 
                  ? "Drag the slider or tap to select your rating" 
                  : "Drag the slider or click anywhere on the track to select your rating"
                }
              </p>
              <p className="text-xs opacity-40" style={mutedTextStyle}>
                Range: {minValue} to {maxValue}
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
        icon={<Activity className="h-5 w-5" style={primaryTextStyle} />}
        label={`Rating ${index + 1}`}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
    </>
  )
} 