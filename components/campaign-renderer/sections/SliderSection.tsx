'use client'

import React, { useState } from 'react'
import { Activity } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

export function SliderSection({
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
  // Get configuration
  const configData = config as any
  const question = configData.content || configData.question || title || 'Rate your response'
  const subheading = configData.subheading || description
  const minValue = configData.minValue || 1
  const maxValue = configData.maxValue || 10
  const step = configData.step || 1
  const minLabel = configData.minLabel || 'Low'
  const maxLabel = configData.maxLabel || 'High'
  const isRequired = configData.required ?? true
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'

  const [sliderValue, setSliderValue] = useState<number>(Math.floor((minValue + maxValue) / 2))

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



  return (
    <div className="h-full bg-background flex flex-col pb-20">
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
            
            {subheading && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {subheading}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {/* Current Value Display */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {sliderValue}
              </div>
            </div>
            
            {/* Slider Container */}
            <div className="space-y-4">
              <div className="relative">
              <input
                type="range"
                min={minValue}
                max={maxValue}
                step={step}
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className={cn(
                    "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
                    "slider-thumb:appearance-none slider-thumb:w-6 slider-thumb:h-6",
                    "slider-thumb:rounded-full slider-thumb:bg-primary",
                    "slider-thumb:cursor-pointer slider-thumb:shadow-lg",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                  )}
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      ((sliderValue - minValue) / (maxValue - minValue)) * 100
                    }%, #e5e7eb ${
                      ((sliderValue - minValue) / (maxValue - minValue)) * 100
                    }%, #e5e7eb 100%)`
                  }}
              />
              

              </div>

              {/* Labels */}
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
              </div>
            </div>

            {/* Additional context */}
            <div className="text-center text-sm text-muted-foreground">
              Move the slider to select your rating from {minValue} to {maxValue}
          </div>
          </div>
        </div>
      </div>

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
      />
    </div>
  )
} 