'use client'

import React, { useState, useEffect } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ChevronDown, ChevronRight } from 'lucide-react'

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
  onResponseUpdate,
  userInputs,
  campaign
}: SectionRendererProps) {
  const [values, setValues] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSliders, setExpandedSliders] = useState<Record<string, boolean>>({})
  
  const configData = config as unknown as MultipleSlidersSettings
  const sliders = configData.sliders || []
  const headline = title || 'Rate the following'
  const subheading = description || ''
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  
  // Initialize values and expansion state with existing responses if available
  useEffect(() => {
    const existingResponses = userInputs?.[section.id] || {}
    const defaultValues: Record<string, number> = {}
    const defaultExpanded: Record<string, boolean> = {}
    
    sliders.forEach(slider => {
      // Use existing response if available, otherwise use default value
      defaultValues[slider.id] = existingResponses[slider.variableName] !== undefined 
        ? existingResponses[slider.variableName] 
        : slider.defaultValue
      defaultExpanded[slider.id] = true // Start with all sliders expanded
    })
    setValues(defaultValues)
    setExpandedSliders(defaultExpanded)
  }, [sliders, userInputs, section.id])

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

  const toggleSliderExpansion = (sliderId: string) => {
    setExpandedSliders(prev => ({
      ...prev,
      [sliderId]: !prev[sliderId]
    }))
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
      
      // Auto-expand any sliders with errors
      const expandUpdates: Record<string, boolean> = {}
      Object.keys(validationErrors).forEach(sliderId => {
        expandUpdates[sliderId] = true
      })
      setExpandedSliders(prev => ({ ...prev, ...expandUpdates }))
      
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
    <div 
      className={cn(
        'min-h-screen flex flex-col',
        getMobileClasses('', deviceInfo?.type)
      )}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h1 
              className={cn(
                'font-bold leading-tight',
                deviceInfo?.type === 'mobile' ? 'text-2xl' : 'text-4xl'
              )}
              style={primaryTextStyle}
            >
              {headline}
            </h1>
            
            {subheading && (
              <p 
                className={cn(
                  deviceInfo?.type === 'mobile' ? 'text-base' : 'text-xl'
                )}
                style={mutedTextStyle}
              >
                {subheading}
              </p>
            )}
          </div>
          
          {sliders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg" style={primaryTextStyle}>
                No sliders configured for this section.
              </p>
              <p className="text-sm mt-2" style={mutedTextStyle}>
                Please configure sliders in the campaign builder.
              </p>
            </div>
          ) : (
            sliders.map((slider, sliderIndex) => {
              const isExpanded = expandedSliders[slider.id]
              const hasError = !!errors[slider.id]
              const currentValue = values[slider.id] || slider.defaultValue
              
              return (
                <div key={slider.id} className="space-y-4">
                  
                  {/* Clickable Slider Label */}
                  <div 
                    className={cn(
                      'cursor-pointer select-none',
                      'flex items-center justify-between',
                      'p-3 rounded-lg transition-colors duration-200',
                      'hover:bg-gray-50',
                      hasError && 'ring-1 ring-red-500/50 bg-red-900/10'
                    )}
                    onClick={() => toggleSliderExpansion(slider.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Expansion Icon */}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 transition-transform duration-200" />
                      )}
                      
                      {/* Label */}
                      <h3 
                        className={cn(
                          'font-medium',
                          deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl'
                        )}
                        style={primaryTextStyle}
                      >
                        {slider.label}
                        {slider.required && <span className="text-red-400 ml-1">*</span>}
                      </h3>
                    </div>
                    
                    {/* Current Value Display */}
                    <div className="flex items-center space-x-2">
                      {hasError && (
                        <span className="text-red-400 text-sm">
                          Required
                        </span>
                      )}
                      <span 
                        className={cn(
                          'font-medium',
                          deviceInfo?.type === 'mobile' ? 'text-base' : 'text-lg',
                          hasError && 'text-red-400'
                        )}
                        style={hasError ? undefined : mutedTextStyle}
                      >
                        {currentValue}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Slider Interface */}
                  <div className={cn(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    isExpanded 
                      ? 'max-h-[300px] opacity-100' 
                      : 'max-h-0 opacity-0'
                  )}>
                    <div className="space-y-4 px-3 pb-2">
                      
                      {/* Labels */}
                      <div className="flex justify-between text-sm" style={mutedTextStyle}>
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
                          value={currentValue}
                          onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                          className={cn(
                            'w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500',
                            hasError && 'ring-2 ring-red-500'
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
                            {currentValue}
                          </span>
                        </div>
                      )}
                      
                      {/* Error Message */}
                      {hasError && (
                        <div className="text-center">
                          <span className="text-red-400 text-sm">
                            {errors[slider.id]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Separator between sliders */}
                  {sliderIndex < sliders.length - 1 && (
                    <div className="border-t border-gray-700" />
                  )}
                </div>
              )
            })
          )}
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
        campaign={campaign}
      />
    </div>
  )
} 