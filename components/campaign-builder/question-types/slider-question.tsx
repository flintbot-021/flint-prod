'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { InlineEditableText } from '@/components/ui/inline-editable-text'

interface SliderQuestionProps {
  settings: {
    headline: string
    subheading?: string
    minValue: number
    maxValue: number
    defaultValue: number
    step: number
    showValue: boolean
    required: boolean
    buttonText: string
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  onNext?: () => void
  className?: string
}

export function SliderQuestion({
  settings,
  isPreview = false,
  isEditing = false,
  onChange,
  onNext,
  className
}: SliderQuestionProps) {
  const [sliderValue, setSliderValue] = useState<number[]>([settings.defaultValue])
  const [editingField, setEditingField] = useState<string | null>(null)

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])

  const handleInlineEdit = (field: string, value: string | number) => {
    handleSettingChange(field, value)
    setEditingField(null)
  }

  const handleHeadlineChange = async (newHeadline: string) => {
    onChange?.({
      ...settings,
      headline: newHeadline
    })
  }

  const handleSubheadingChange = async (newSubheading: string) => {
    onChange?.({
      ...settings,
      subheading: newSubheading
    })
  }

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        {/* Question */}
        <div className="pt-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {settings.headline || 'Your question text here...'}
          </h1>
          {settings.subheading && (
            <div className="pt-4">
              <p className="text-xl text-gray-600">
                {settings.subheading}
              </p>
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="pt-6 space-y-4">
          <div className="space-y-2">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={settings.maxValue}
              min={settings.minValue}
              step={settings.step}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{settings.minValue}</span>
              <span>{settings.maxValue}</span>
            </div>
          </div>
          
          {settings.showValue && (
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-400">
                {sliderValue[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="pt-8">
        <InlineEditableText
          value={settings.headline}
          onSave={handleHeadlineChange}
          placeholder="Type your question here"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={settings.subheading || ''}
          onSave={handleSubheadingChange}
          placeholder="Type sub heading here"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Slider Preview */}
      <div className="pt-6">
        <div className="space-y-2">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={settings.maxValue}
            min={settings.minValue}
            step={settings.step}
            className="w-full"
          />
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="w-12 text-left">
              <InlineEditableText
                value={settings.minValue.toString()}
                onSave={(value) => onChange?.({ ...settings, minValue: parseInt(value) || 0 })}
                placeholder="0"
                className="text-sm text-center w-full"
              />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">increments</div>
              <InlineEditableText
                value={settings.step.toString()}
                onSave={(value) => onChange?.({ ...settings, step: parseInt(value) || 1 })}
                placeholder="1"
                className="text-sm text-center"
              />
            </div>
            <div className="w-12 text-right">
              <InlineEditableText
                value={settings.maxValue.toString()}
                onSave={(value) => onChange?.({ ...settings, maxValue: parseInt(value) || 100 })}
                placeholder="100"
                className="text-sm text-center w-full"
              />
            </div>
          </div>
        </div>
        
        {settings.showValue && (
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-400">
              {sliderValue[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
} 