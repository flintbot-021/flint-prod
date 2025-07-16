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
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        <div className="space-y-6">
          {/* Question */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {settings.headline || 'Your question text here...'}
            </h1>
            {settings.subheading && (
              <p className="text-xl text-gray-600">
                {settings.subheading}
              </p>
            )}
          </div>

          {/* Slider */}
          <div className="space-y-4 pt-6">
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
      </div>
    )
  }

  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={settings.headline}
          onSave={handleHeadlineChange}
          variant="body"
          placeholder="Type your question here"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subheading */}
      <div className="text-center">
        <InlineEditableText
          value={settings.subheading || ''}
          onSave={handleSubheadingChange}
          variant="body"
          placeholder="Type sub heading here"
          className="text-xl text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Slider Preview */}
      <div className="space-y-4 pt-6">
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
            <InlineEditableText
              value={settings.minValue.toString()}
              onSave={(value) => onChange?.({ ...settings, minValue: parseInt(value) || 0 })}
              variant="caption"
              placeholder="0"
              className="text-sm text-gray-400 hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
              inputClassName="!text-sm !text-gray-400 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
              showEditIcon={false}
              showSaveStatus={false}
              autoSave={false}
            />
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">increments</div>
              <InlineEditableText
                value={settings.step.toString()}
                onSave={(value) => onChange?.({ ...settings, step: parseInt(value) || 1 })}
                variant="caption"
                placeholder="1"
                className="text-sm text-gray-400 text-center hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
                inputClassName="!text-sm !text-gray-400 !text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
                showEditIcon={false}
                showSaveStatus={false}
                autoSave={false}
              />
            </div>
            <InlineEditableText
              value={settings.maxValue.toString()}
              onSave={(value) => onChange?.({ ...settings, maxValue: parseInt(value) || 100 })}
              variant="caption"
              placeholder="100"
              className="text-sm text-gray-400 text-right hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
              inputClassName="!text-sm !text-gray-400 !text-right !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
              showEditIcon={false}
              showSaveStatus={false}
              autoSave={false}
            />
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