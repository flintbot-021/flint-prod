'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'

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
  const minValue = config.min_value || 0
  const maxValue = config.max_value || 10
  const step = config.step || 1
  const defaultValue = config.default_value || Math.floor((minValue + maxValue) / 2)
  
  const [value, setValue] = useState(defaultValue)

  const handleChange = (newValue: number) => {
    setValue(newValue)
    onResponseUpdate(section.id, 'slider_value', newValue, {
      inputType: 'slider',
      min: minValue,
      max: maxValue,
      step: step
    })
  }

  const handleSubmit = () => {
    onSectionComplete(index, {
      [section.id]: value,
      slider_value: value
    })
  }

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
              {title || 'Rate your response'}
            </h1>
            
            {description && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {description}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <span className="text-4xl font-bold text-blue-600">{value}</span>
            </div>
            
            <div className="space-y-2">
              <input
                type="range"
                min={minValue}
                max={maxValue}
                step={step}
                value={value}
                onChange={(e) => handleChange(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{config.min_label || minValue}</span>
                <span>{config.max_label || maxValue}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 