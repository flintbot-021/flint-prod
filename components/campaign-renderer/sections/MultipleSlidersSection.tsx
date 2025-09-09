'use client'

import React, { useState, useEffect } from 'react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor, getNextSectionButtonText } from '../utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'
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
  campaign,
  sections,
  isPreview
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
  
  // Dynamic button text logic
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : 'Continue'
  
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
        // Use full height for public mode, header-adjusted height for preview mode
        isPreview ? 'min-h-[calc(100vh-4rem)] flex flex-col' : 'min-h-screen flex flex-col',
        deviceInfo?.type === 'mobile' ? 'pb-40' : 'pb-32',
        getMobileClasses('', deviceInfo?.type)
      )}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 pt-20">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Section Header */}
          <div className="text-center space-y-6">
            {headline && (
              <h1 
                className={cn(
                  'font-black tracking-tight leading-tight',
                  deviceInfo?.type === 'mobile' ? 'text-4xl' : 'text-5xl lg:text-6xl'
                )}
                style={primaryTextStyle}
              >
                {headline}
              </h1>
            )}
            
            {subheading && (
              <p 
                className={cn(
                  'font-medium leading-relaxed max-w-2xl mx-auto',
                  deviceInfo?.type === 'mobile' ? 'text-lg' : 'text-xl lg:text-2xl'
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
                  
                  {/* Unified Slider Container */}
                  <div 
                    className={cn(
                      'rounded-2xl backdrop-blur-md border transition-all duration-300',
                      'hover:shadow-xl hover:scale-[1.02]',
                      hasError && 'ring-2 ring-red-500/50'
                    )}
                    style={{
                      backgroundColor: hasError 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      border: hasError 
                        ? '1px solid rgba(239, 68, 68, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: hasError 
                        ? '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                        : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Clickable Header */}
                    <div 
                      className="cursor-pointer select-none relative flex items-center justify-between p-4"
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
                      
                      {/* Current Value Display - Enhanced Circle in Top Right */}
                      {slider.showValue && (
                        <div className="absolute top-3 right-3">
                          <div 
                            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-black backdrop-blur-md border shadow-xl transition-all duration-300 hover:scale-110"
                            style={{ 
                              backgroundColor: theme.buttonColor,
                              color: theme.buttonTextColor,
                              border: `2px solid rgba(255, 255, 255, 0.2)`,
                              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                            }}
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
                      <div className="space-y-4 px-6 pb-6 pt-2">
                      
                      {/* Slider */}
                      <div className="relative px-2">
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            .themed-multi-slider-${slider.id}::-webkit-slider-thumb {
                              appearance: none;
                              width: 24px;
                              height: 24px;
                              border-radius: 50%;
                              background: ${theme.backgroundColor};
                              border: 2px solid ${theme.buttonColor};
                              cursor: pointer;
                              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                            .themed-multi-slider-${slider.id}::-moz-range-thumb {
                              width: 24px;
                              height: 24px;
                              border-radius: 50%;
                              background: ${theme.backgroundColor};
                              border: 2px solid ${theme.buttonColor};
                              cursor: pointer;
                              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                            .themed-multi-slider-${slider.id}:focus::-webkit-slider-thumb {
                              box-shadow: 0 0 0 3px ${theme.buttonColor}40;
                            }
                          `
                        }} />
                        <input
                          type="range"
                          min={slider.minValue}
                          max={slider.maxValue}
                          step={slider.step}
                          value={currentValue}
                          onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                          className={cn(
                            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
                            'focus:outline-none focus:ring-2 focus:ring-opacity-50',
                            hasError && 'ring-2 ring-red-500',
                            `themed-multi-slider-${slider.id}`
                          )}
                          style={{
                            background: `linear-gradient(to right, ${theme.buttonColor} 0%, ${theme.buttonColor} ${
                              ((currentValue - slider.minValue) / (slider.maxValue - slider.minValue)) * 100
                            }%, #e5e7eb ${
                              ((currentValue - slider.minValue) / (slider.maxValue - slider.minValue)) * 100
                            }%, #e5e7eb 100%)`,
                          }}
                        />
                      </div>
                      
                      {/* Labels below slider */}
                      <div className="flex justify-between items-center">
                        <span 
                          className="px-3 py-1 rounded-full backdrop-blur-sm border text-sm font-medium"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            ...mutedTextStyle
                          }}
                        >
                          {slider.minLabel}
                        </span>
                        <span 
                          className="px-3 py-1 rounded-full backdrop-blur-sm border text-sm font-medium"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            ...mutedTextStyle
                          }}
                        >
                          {slider.maxLabel}
                        </span>
                      </div>
                      
                      {/* Error Message */}
                      {hasError && (
                        <div className="text-center">
                          <div className="inline-flex items-center px-3 py-2 rounded-lg backdrop-blur-sm border text-sm font-medium text-red-400"
                               style={{
                                 backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                 border: '1px solid rgba(239, 68, 68, 0.3)'
                               }}>
                            {errors[slider.id]}
                          </div>
                        </div>
                      )}
                      </div>
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

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

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
        navigationHints={{
          text: "Click to expand/collapse sliders • Drag to adjust values • Enter to continue • ← → to navigate • Esc to go back"
        }}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !canContinue()
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 