'use client'

import React, { useState, useEffect } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ChevronDown, ChevronRight, Activity } from 'lucide-react'

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
  const headline = title || ''
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
            {headline && (
              <h1 
                className={cn(
                  'font-bold leading-tight',
                  deviceInfo?.type === 'mobile' ? 'text-2xl' : 'text-4xl'
                )}
                style={primaryTextStyle}
              >
                {headline}
              </h1>
            )}
            
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
                      'cursor-pointer select-none relative',
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
                    
                    {/* Current Value Display - Small Circle in Top Right */}
                    {slider.showValue && (
                      <div className="absolute top-2 right-2">
                        <div 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-md"
                          style={{ backgroundColor: theme.buttonColor }}
                        >
                          {currentValue}
                        </div>
                      </div>
                    )}
                    
                    {/* Error Display */}
                    {hasError && (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400 text-sm">
                          Required
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Slider Interface */}
                  <div className={cn(
                    'overflow-hidden transition-all duration-300 ease-in-out',
                    isExpanded 
                      ? 'max-h-[300px] opacity-100' 
                      : 'max-h-0 opacity-0'
                  )}>
                    <div className="space-y-4 px-3 pb-2">
                      
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
                            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                            'slider-thumb:appearance-none slider-thumb:w-6 slider-thumb:h-6',
                            'slider-thumb:rounded-full',
                            'slider-thumb:cursor-pointer slider-thumb:shadow-lg',
                            'focus:outline-none focus:ring-2 focus:ring-opacity-50',
                            hasError && 'ring-2 ring-red-500'
                          )}
                          style={{
                            background: `linear-gradient(to right, ${theme.buttonColor} 0%, ${theme.buttonColor} ${
                              ((currentValue - slider.minValue) / (slider.maxValue - slider.minValue)) * 100
                            }%, #e5e7eb ${
                              ((currentValue - slider.minValue) / (slider.maxValue - slider.minValue)) * 100
                            }%, #e5e7eb 100%)`,
                            // Apply theme colors to webkit slider components
                            ['--slider-thumb-color' as any]: theme.buttonColor,
                            ['--slider-focus-color' as any]: theme.buttonColor,
                          }}
                        />
                      </div>
                      
                      {/* Labels below slider */}
                      <div className="flex justify-between items-center text-sm" style={mutedTextStyle}>
                        <span>{slider.minLabel}</span>
                        <span>{slider.maxLabel}</span>
                      </div>
                      
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
        onPrevious={onPrevious}
        icon={<Activity className="h-5 w-5 text-primary" />}
        label={`Sliders ${index + 1}`}
        validationText={
          sliders.some(s => s.required) 
            ? 'Please complete all required sliders' 
            : undefined
        }
        actionButton={{
          label: 'Next',
          onClick: handleContinue,
          disabled: !canContinue()
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 