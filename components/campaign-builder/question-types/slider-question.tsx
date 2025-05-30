'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SliderQuestionProps {
  settings: {
    question: string
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

  const renderEditableText = (
    field: string,
    value: string,
    placeholder: string,
    className: string = "",
    isTextarea: boolean = false
  ) => {
    const isCurrentlyEditing = editingField === field && isEditing

    if (isCurrentlyEditing) {
      return isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => handleInlineEdit(field, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              setEditingField(null)
            }
            if (e.key === 'Escape') {
              setEditingField(null)
            }
          }}
          className={cn(
            "w-full bg-transparent border-2 border-blue-500 rounded px-2 py-1 resize-none",
            className
          )}
          placeholder={placeholder}
          autoFocus
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => handleInlineEdit(field, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingField(null)
            }
            if (e.key === 'Escape') {
              setEditingField(null)
            }
          }}
          className={cn(
            "w-full bg-transparent border-2 border-blue-500 rounded px-2 py-1",
            className
          )}
          placeholder={placeholder}
          autoFocus
        />
      )
    }

    return (
      <div
        onClick={() => isEditing && setEditingField(field)}
        className={cn(
          className,
          isEditing && "cursor-text hover:bg-blue-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors",
          !value && "text-gray-400"
        )}
      >
        {value || placeholder}
      </div>
    )
  }

  const renderNumberInput = (
    field: string,
    value: number,
    placeholder: string,
    className: string = ""
  ) => {
    const isCurrentlyEditing = editingField === field && isEditing

    if (isCurrentlyEditing) {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleInlineEdit(field, parseInt(e.target.value) || 0)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingField(null)
            }
            if (e.key === 'Escape') {
              setEditingField(null)
            }
          }}
          className={cn(
            "w-full bg-transparent border-2 border-blue-500 rounded px-2 py-1",
            className
          )}
          placeholder={placeholder}
          autoFocus
        />
      )
    }

    return (
      <div
        onClick={() => isEditing && setEditingField(field)}
        className={cn(
          className,
          isEditing && "cursor-text hover:bg-blue-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
        )}
      >
        {value}
      </div>
    )
  }

  if (isPreview) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto p-8", className)}>
        <Card className="p-8">
          <div className="space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {settings.question}
              </h2>
              {settings.subheading && (
                <p className="text-lg text-gray-600">
                  {settings.subheading}
                </p>
              )}
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={settings.maxValue}
                  min={settings.minValue}
                  step={settings.step}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{settings.minValue}</span>
                  <span>{settings.maxValue}</span>
                </div>
              </div>
              
              {settings.showValue && (
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {sliderValue[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="pt-4">
              <Button 
                onClick={onNext}
                className="w-full"
                disabled={settings.required && sliderValue[0] === undefined}
              >
                {settings.buttonText}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Question Settings */}
      <div className="space-y-4">
        {/* Main Question */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Question
          </Label>
          {renderEditableText(
            'question',
            settings.question,
            'Type your question here',
            'text-xl font-semibold text-gray-900'
          )}
        </div>

        {/* Subheading */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Subheading (Optional)
          </Label>
          {renderEditableText(
            'subheading',
            settings.subheading || '',
            'Add a subheading...',
            'text-base text-gray-600'
          )}
        </div>
      </div>

      {/* Slider Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Min Value
          </Label>
          {renderNumberInput(
            'minValue',
            settings.minValue,
            '0',
            'text-sm text-gray-900'
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Max Value
          </Label>
          {renderNumberInput(
            'maxValue',
            settings.maxValue,
            '100',
            'text-sm text-gray-900'
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Default Value
          </Label>
          {renderNumberInput(
            'defaultValue',
            settings.defaultValue,
            '50',
            'text-sm text-gray-900'
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Step
          </Label>
          {renderNumberInput(
            'step',
            settings.step,
            '1',
            'text-sm text-gray-900'
          )}
        </div>
      </div>

      {/* Preview Slider */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Slider Preview
        </Label>
        <div className="space-y-3">
          <Slider
            value={[settings.defaultValue]}
            max={settings.maxValue}
            min={settings.minValue}
            step={settings.step}
            className="w-full"
            disabled
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{settings.minValue}</span>
            <span>{settings.maxValue}</span>
          </div>
          {settings.showValue && (
            <div className="text-center">
              <span className="text-lg font-semibold text-blue-600">
                {settings.defaultValue}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Button Text */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Button Text
        </Label>
        {renderEditableText(
          'buttonText',
          settings.buttonText,
          'Next',
          'text-sm text-gray-900'
        )}
      </div>
    </div>
  )
} 