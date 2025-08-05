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
    minLabel?: string
    maxLabel?: string
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
        <div className="pt-8 space-y-6">
          {settings.showValue && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold shadow-lg">
                {sliderValue[0]}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={settings.maxValue}
              min={settings.minValue}
              step={settings.step}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <div className="text-center space-y-2">
                <div>{settings.minValue}</div>
                <div className="text-xs">{settings.minLabel || 'Low'}</div>
              </div>
              <div className="text-center space-y-2">
                <div>{settings.maxValue}</div>
                <div className="text-xs">{settings.maxLabel || 'High'}</div>
              </div>
            </div>
          </div>
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
      <div className="pt-8">
        <div className="space-y-4">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={settings.maxValue}
            min={settings.minValue}
            step={settings.step}
            className="w-full"
          />
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="w-16 text-left space-y-2">
              <div className="text-center">
                <InlineEditableText
                  value={settings.minValue.toString()}
                  onSave={(value) => onChange?.({ ...settings, minValue: parseInt(value) || 0 })}
                  placeholder="0"
                  className="text-sm text-center w-full"
                />
              </div>
              <div className="text-center">
                <InlineEditableText
                  value={settings.minLabel || 'Low'}
                  onSave={(value) => onChange?.({ ...settings, minLabel: value })}
                  placeholder="Low"
                  className="text-xs text-center w-full text-gray-500"
                />
              </div>
            </div>
            <div className="text-center">
              <InlineEditableText
                value={settings.step.toString()}
                onSave={(value) => onChange?.({ ...settings, step: parseInt(value) || 1 })}
                placeholder="1"
                className="text-sm text-center"
              />
              <div className="text-xs text-gray-500 mt-1">increments</div>
            </div>
            <div className="w-16 text-right space-y-2">
              <div className="text-center">
                <InlineEditableText
                  value={settings.maxValue.toString()}
                  onSave={(value) => onChange?.({ ...settings, maxValue: parseInt(value) || 100 })}
                  placeholder="100"
                  className="text-sm text-center w-full"
                />
              </div>
              <div className="text-center">
                <InlineEditableText
                  value={settings.maxLabel || 'High'}
                  onSave={(value) => onChange?.({ ...settings, maxLabel: value })}
                  placeholder="High"
                  className="text-xs text-center w-full text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 