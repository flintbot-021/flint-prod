'use client'

import React, { useState, useEffect } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

interface SliderConfig {
  id: string
  variableName: string
  label: string
  minValue: number
  maxValue: number
  defaultValue: number
  step: number
  minLabel: string
  maxLabel: string
  required: boolean
  showValue: boolean
}

interface MultipleSlidersSettings {
  headline: string
  subheading: string
  sliders: SliderConfig[]
}

export function MultipleSlidersSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onNext,
  onPrevious,
  onSectionComplete,
  onResponseUpdate
}: SectionRendererProps) {
  const [values, setValues] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const configData = config as unknown as MultipleSlidersSettings
  const sliders = configData.sliders || []
  const headline = configData.headline || title || 'Rate the following'
  const subheading = configData.subheading || description || ''
  
  // Initialize default values
  useEffect(() => {
    const defaultValues: Record<string, number> = {}
    sliders.forEach(slider => {
      defaultValues[slider.id] = slider.defaultValue
    })
    setValues(defaultValues)
  }, [sliders])

  const handleSliderChange = (sliderId: string, value: number) => {
    setValues(prev => ({ ...prev, [sliderId]: value }))
    
    // Clear any existing error for this slider
    if (errors[sliderId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[sliderId]
        return newErrors
      })
    }

    // Find the slider config to get variable name
    const slider = sliders.find(s => s.id === sliderId)
    if (slider) {
      onResponseUpdate(section.id, slider.variableName, value, {
        sliderId: sliderId,
        sliderLabel: slider.label,
        isValid: true,
        isRequired: slider.required
      })
    }
  }

  const validateResponses = (): Record<string, string> => {
    const validationErrors: Record<string, string> = {}
    
    sliders.forEach(slider => {
      if (slider.required) {
        const value = values[slider.id]
        if (value === undefined || value === null) {
          validationErrors[slider.id] = 'This slider is required'
        }
      }
    })
    
    return validationErrors
  }

  const handleContinue = () => {
    const validationErrors = validateResponses()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Build response object with variable names as keys
    const responses: Record<string, any> = {}
    
    sliders.forEach(slider => {
      const value = values[slider.id]
      if (value !== undefined) {
        responses[slider.variableName] = value
      }
    })

    onSectionComplete(index, {
      [section.id]: responses, // Store responses under section ID
      ...responses // Also store each variable directly for easy access
    })
  }

  const canContinue = () => {
    const requiredSliders = sliders.filter(s => s.required)
    return requiredSliders.every(slider => {
      const value = values[slider.id]
      return value !== undefined && value !== null
    })
  }

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      getMobileClasses('', deviceInfo?.type)
    )}>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h1 className={cn(
              'font-bold text-white leading-tight',
              deviceInfo?.type === 'mobile' ? 'text-2xl' : 'text-4xl'
            )}>
              {headline}
            </h1>
            
            {subheading && (
              <p className={cn(
                'text-gray-300',
                deviceInfo?.type === 'mobile' ? 'text-base' : 'text-xl'
              )}>
                {subheading}
              </p>
            )}
          </div>
          
          {sliders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                No sliders configured for this section.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please configure sliders in the campaign builder.
              </p>
            </div>
          ) : (
            sliders.map((slider, sliderIndex) => (
            <div key={slider.id} className="space-y-6">
              
              {/* Slider Label */}
              <div className="text-left">
                <h3 className={cn(
                  'font-medium text-white',
                  deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl'
                )}>
                  {slider.label}
                  {slider.required && <span className="text-red-400 ml-1">*</span>}
                </h3>
              </div>

              {/* Slider Interface */}
              <div className="space-y-4">
                
                {/* Labels */}
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{slider.minLabel}</span>
                  <span>{slider.maxLabel}</span>
                </div>
                
                {/* Slider */}
                <div className="relative px-2">
                  <input
                    type="range"
                    min={slider.minValue}
                    max={slider.maxValue}
                    step={slider.step}
                    value={values[slider.id] || slider.defaultValue}
                    onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                    className={cn(
                      'w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors[slider.id] && 'ring-2 ring-red-500'
                    )}
                  />
                </div>
                
                {/* Value Display */}
                {slider.showValue && (
                  <div className="text-center">
                    <span className={cn(
                      'font-bold text-white',
                      deviceInfo?.type === 'mobile' ? 'text-xl' : 'text-2xl'
                    )}>
                      {values[slider.id] || slider.defaultValue}
                    </span>
                  </div>
                )}
                
                {/* Error Message */}
                {errors[slider.id] && (
                  <div className="text-center">
                    <span className="text-red-400 text-sm">
                      {errors[slider.id]}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Separator between sliders */}
              {sliderIndex < sliders.length - 1 && (
                <div className="border-t border-gray-700 pt-8" />
              )}
            </div>
          )))}
        </div>
      </div>

      {/* Navigation */}
      <SectionNavigationBar
        canGoNext={canContinue()}
        onNext={handleContinue}
        onPrevious={onPrevious}
        actionButton={{
          label: 'Continue',
          onClick: handleContinue,
          disabled: !canContinue()
        }}
        canGoPrevious={index > 0}
        validationText={
          sliders.some(s => s.required) 
            ? 'Please complete all required sliders' 
            : undefined
        }
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 