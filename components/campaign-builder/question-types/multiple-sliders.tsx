'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { InlineEditableText } from '@/components/ui/inline-editable-text'

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

interface MultipleSlidersProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function MultipleSliders({ section, isPreview = false, onUpdate, className }: MultipleSlidersProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [sliderValues, setSliderValues] = useState<Record<string, number[]>>({})
  
  const settings = (section.settings as unknown as MultipleSlidersSettings) || { 
    headline: '',
    subheading: '',
    sliders: []
  }

  const updateSettings = async (newSettings: Partial<MultipleSlidersSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addSlider = async () => {
    // Use the last slider as a template, or defaults if no sliders exist
    const lastSlider = settings.sliders[settings.sliders.length - 1]
    const template = lastSlider || {
      minValue: 0,
      maxValue: 10,
      defaultValue: 5,
      step: 1,
      minLabel: 'Low',
      maxLabel: 'High',
      required: true,
      showValue: true
    }
    
    const newSlider: SliderConfig = {
      id: `slider_${Date.now()}`,
      variableName: `slider_${settings.sliders.length + 1}`,
      label: 'New slider label',
      // Inherit configuration from template
      minValue: template.minValue,
      maxValue: template.maxValue,
      defaultValue: template.defaultValue,
      step: template.step,
      minLabel: template.minLabel,
      maxLabel: template.maxLabel,
      required: template.required,
      showValue: template.showValue
    }
    
    await updateSettings({
      sliders: [...settings.sliders, newSlider]
    })
  }

  const updateSlider = async (index: number, updates: Partial<SliderConfig>) => {
    const updatedSliders = [...settings.sliders]
    updatedSliders[index] = { ...updatedSliders[index], ...updates }
    await updateSettings({ sliders: updatedSliders })
  }

  const deleteSlider = async (index: number) => {
    const updatedSliders = settings.sliders.filter((_, i) => i !== index)
    await updateSettings({ sliders: updatedSliders })
  }

  const getSliderValue = (sliderId: string, defaultValue: number) => {
    return sliderValues[sliderId] || [defaultValue]
  }

  const setSliderValue = (sliderId: string, value: number[]) => {
    setSliderValues(prev => ({ ...prev, [sliderId]: value }))
  }

  // Helper function to check if content exists (same as other sections)
  const hasContent = (value: string) => value && value.trim().length > 0

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        <style>
          {`
            .slider-hide-value [data-radix-tooltip-content],
            .slider-hide-value [role="tooltip"],
            .slider-hide-value .slider-tooltip,
            .slider-hide-value [data-tooltip] {
              display: none !important;
              visibility: hidden !important;
            }
          `}
        </style>
        {/* Section Header */}
        <div className="text-center">
          {/* Headline - Only show if has content */}
          {hasContent(settings.headline) && (
            <div className="pt-8">
              <h1 className="text-4xl font-bold text-gray-900">
                {settings.headline}
              </h1>
            </div>
          )}
          
          {/* Subheading - Only show if has content */}
          {hasContent(settings.subheading) && (
            <div className="pt-4">
              <p className="text-xl text-gray-600">
                {settings.subheading}
              </p>
            </div>
          )}
        </div>

        {/* Sliders */}
        <div className={hasContent(settings.headline) || hasContent(settings.subheading) ? "pt-6 space-y-8" : "pt-8 space-y-8"}>
          {settings.sliders.map((slider) => (
            <div key={slider.id} className="space-y-6">
              <div className="text-left relative">
                <label className="text-lg font-medium text-gray-900">
                  {slider.label}
                  {slider.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {slider.showValue && (
                  <div className="absolute top-0 right-0">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold shadow-md">
                      {getSliderValue(slider.id, slider.defaultValue)[0]}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className={slider.showValue ? '' : 'slider-hide-value'}>
                  <Slider
                    value={getSliderValue(slider.id, slider.defaultValue)}
                    onValueChange={(value) => setSliderValue(slider.id, value)}
                    max={slider.maxValue}
                    min={slider.minValue}
                    step={slider.step}
                    className="w-full"
                  />
                </div>
                {/* Labels below slider */}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{slider.minLabel}</span>
                  <span>{slider.maxLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-16 px-6 max-w-4xl mx-auto', className)}>
      {/* Section Header Configuration */}
      <div className="text-center pb-8 border-b border-gray-700">
        <div className="pt-8">
          <InlineEditableText
            value={settings.headline}
            onSave={(value) => updateSettings({ headline: value })}
            placeholder="Type your question here"
            variant="heading"
            className="text-center block w-full"
          />
        </div>
        
        <div className="pt-4">
          <InlineEditableText
            value={settings.subheading || ''}
            onSave={(value) => updateSettings({ subheading: value })}
            placeholder="Type sub heading here"
            variant="subheading"
            className="text-center block w-full"
          />
        </div>
      </div>

      {/* Individual Sliders */}
      <div className="pt-8 space-y-8">
        {settings.sliders.map((slider, index) => (
          <SliderConfigCard
            key={slider.id}
            slider={slider}
            index={index}
            onUpdate={(updates) => updateSlider(index, updates)}
            onDelete={() => deleteSlider(index)}
            canDelete={settings.sliders.length > 1}
            sliderValue={getSliderValue(slider.id, slider.defaultValue)}
            onSliderValueChange={(value) => setSliderValue(slider.id, value)}
          />
        ))}
      </div>
      
      <div className="flex justify-center pt-6">
        <Button
          onClick={addSlider}
          variant="outline"
          className="border-dashed border-2 h-12 px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another slider
        </Button>
      </div>
    </div>
  )
}

function SliderConfigCard({ 
  slider, 
  index, 
  onUpdate, 
  onDelete, 
  canDelete,
  sliderValue,
  onSliderValueChange
}: {
  slider: SliderConfig
  index: number
  onUpdate: (updates: Partial<SliderConfig>) => void
  onDelete: () => void
  canDelete: boolean
  sliderValue: number[]
  onSliderValueChange: (value: number[]) => void
}) {
  return (
    <div className="space-y-6 p-8 border border-gray-100 rounded-lg bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <GripVertical className="h-4 w-4 text-gray-500 mt-1" />
          <div className="flex-1">
            <InlineEditableText
              value={slider.label}
              onSave={(value) => onUpdate({ label: value })}
              placeholder="Type slider question here"
              variant="label"
              className="text-gray-900 text-lg font-medium"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="font-mono text-xs bg-gray-800 text-gray-300 min-w-32 flex-shrink-0 flex items-center">
            <span className="text-gray-400">@</span>
            <InlineEditableText
              value={slider.variableName}
              onSave={(value) => onUpdate({ variableName: value })}
              placeholder="variable_name"
              variant="label"
              className="font-mono text-xs text-gray-300 flex-1 min-w-0"
            />
          </Badge>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {/* Slider Preview */}
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Slider
            value={sliderValue}
            onValueChange={onSliderValueChange}
            max={slider.maxValue}
            min={slider.minValue}
            step={slider.step}
            className="w-full"
          />
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="w-16 text-left space-y-2">
              <div className="text-center">
                <InlineEditableText
                  value={slider.minValue.toString()}
                  onSave={(value) => {
                    const numValue = parseInt(value.replace(/[^-0-9]/g, '')) || 0
                    onUpdate({ minValue: numValue })
                  }}
                  placeholder="0"
                  variant="label"
                  className="text-sm text-center w-full"
                />
              </div>
              <div className="text-center">
                <InlineEditableText
                  value={slider.minLabel}
                  onSave={(value) => onUpdate({ minLabel: value })}
                  placeholder="Low"
                  variant="label"
                  className="text-xs text-center w-full text-gray-500"
                />
              </div>
            </div>
            <div className="text-center">
              <InlineEditableText
                value={slider.step.toString()}
                onSave={(value) => {
                  const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 1
                  onUpdate({ step: Math.max(1, numValue) }) // Ensure step is at least 1
                }}
                placeholder="1"
                variant="label"
                className="text-sm text-center"
              />
              <div className="text-xs text-gray-500 mt-1">increments</div>
            </div>
            <div className="w-16 text-right space-y-2">
              <div className="text-center">
                <InlineEditableText
                  value={slider.maxValue.toString()}
                  onSave={(value) => {
                    const numValue = parseInt(value.replace(/[^-0-9]/g, '')) || 100
                    onUpdate({ maxValue: numValue })
                  }}
                  placeholder="100"
                  variant="label"
                  className="text-sm text-center w-full"
                />
              </div>
              <div className="text-center">
                <InlineEditableText
                  value={slider.maxLabel}
                  onSave={(value) => onUpdate({ maxLabel: value })}
                  placeholder="High"
                  variant="label"
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