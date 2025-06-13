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
    headline: 'Rate the following',
    subheading: 'Please provide your ratings for each item below',
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

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-8', className)}>
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            {settings.headline}
          </h1>
          {settings.subheading && (
            <p className="text-xl text-gray-300">
              {settings.subheading}
            </p>
          )}
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {settings.sliders.map((slider) => (
            <div key={slider.id} className="space-y-3">
              <div className="text-left">
                <label className="text-lg font-medium text-white">
                  {slider.label}
                  {slider.required && <span className="text-red-400 ml-1">*</span>}
                </label>
              </div>
              
              <div className="space-y-2">
                <Slider
                  value={getSliderValue(slider.id, slider.defaultValue)}
                  onValueChange={(value) => setSliderValue(slider.id, value)}
                  max={slider.maxValue}
                  min={slider.minValue}
                  step={slider.step}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{slider.minLabel}</span>
                  <span>{slider.maxLabel}</span>
                </div>
              </div>
              
              {slider.showValue && (
                <div className="text-center">
                  <span className="text-lg font-bold text-blue-400">
                    {getSliderValue(slider.id, slider.defaultValue)[0]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('py-16 px-6 max-w-4xl mx-auto space-y-8', className)}>
      {/* Section Header Configuration */}
      <div className="text-center space-y-6 pb-8 border-b border-gray-700">
        <InlineEditableText
          value={settings.headline}
          onSave={(value) => updateSettings({ headline: value })}
          variant="body"
          placeholder="Section headline"
          className="text-4xl font-bold text-gray-300 text-center block w-full hover:bg-transparent rounded-none px-0 py-0"
          inputClassName="!text-4xl !font-bold !text-gray-300 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
        
        <InlineEditableText
          value={settings.subheading || ''}
          onSave={(value) => updateSettings({ subheading: value })}
          variant="body"
          placeholder="Section subheading (optional)"
          className="text-xl text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0"
          inputClassName="!text-xl !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Slider Configurations */}
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
    <div className="space-y-6 p-6 border border-gray-700 rounded-lg bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GripVertical className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-400">Slider {index + 1}</span>
        </div>
        
        <div className="flex items-center space-x-3">
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

      {/* Label and Variable Name */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <InlineEditableText
              value={slider.label}
              onSave={(value) => onUpdate({ label: value })}
              variant="body"
              placeholder="Type slider label here"
              className="text-lg font-medium text-gray-300 hover:bg-transparent rounded-none px-0 py-0"
              inputClassName="!text-lg !font-medium !text-gray-300 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
              showEditIcon={false}
              showSaveStatus={false}
              multiline={false}
              autoSave={false}
            />
          </div>
          
          <Badge variant="secondary" className="font-mono text-xs bg-gray-800 text-gray-300 ml-4 w-32 flex-shrink-0">
            <span className="truncate">
              @<InlineEditableText
                value={slider.variableName}
                onSave={(value) => onUpdate({ variableName: value })}
                variant="body"
                placeholder="variable_name"
                className="font-mono text-xs text-gray-300 hover:bg-transparent rounded-none px-0 py-0 inline truncate"
                inputClassName="!font-mono !text-xs !text-gray-300 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto w-full"
                showEditIcon={false}
                showSaveStatus={false}
                autoSave={false}
              />
            </span>
          </Badge>
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
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">min</div>
              <InlineEditableText
                value={slider.minValue.toString()}
                onSave={(value) => onUpdate({ minValue: parseInt(value) || 0 })}
                variant="caption"
                placeholder="0"
                className="text-sm text-gray-400 hover:bg-transparent rounded-none px-0 py-0"
                inputClassName="!text-sm !text-gray-400 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
                showEditIcon={false}
                showSaveStatus={false}
                autoSave={false}
              />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">step</div>
              <InlineEditableText
                value={slider.step.toString()}
                onSave={(value) => onUpdate({ step: parseInt(value) || 1 })}
                variant="caption"
                placeholder="1"
                className="text-sm text-gray-400 text-center hover:bg-transparent rounded-none px-0 py-0"
                inputClassName="!text-sm !text-gray-400 !text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
                showEditIcon={false}
                showSaveStatus={false}
                autoSave={false}
              />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">max</div>
              <InlineEditableText
                value={slider.maxValue.toString()}
                onSave={(value) => onUpdate({ maxValue: parseInt(value) || 100 })}
                variant="caption"
                placeholder="100"
                className="text-sm text-gray-400 text-right hover:bg-transparent rounded-none px-0 py-0"
                inputClassName="!text-sm !text-gray-400 !text-right !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
                showEditIcon={false}
                showSaveStatus={false}
                autoSave={false}
              />
            </div>
          </div>
        </div>
        
        {slider.showValue && (
          <div className="text-center">
            <span className="text-xl font-bold text-blue-400">
              {sliderValue[0]}
            </span>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">min label</div>
          <InlineEditableText
            value={slider.minLabel}
            onSave={(value) => onUpdate({ minLabel: value })}
            variant="caption"
            placeholder="Low"
            className="text-sm text-gray-400 hover:bg-transparent rounded-none px-0 py-0"
            inputClassName="!text-sm !text-gray-400 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
            showEditIcon={false}
            showSaveStatus={false}
            autoSave={false}
          />
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">max label</div>
          <InlineEditableText
            value={slider.maxLabel}
            onSave={(value) => onUpdate({ maxLabel: value })}
            variant="caption"
            placeholder="High"
            className="text-sm text-gray-400 hover:bg-transparent rounded-none px-0 py-0"
            inputClassName="!text-sm !text-gray-400 !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
            showEditIcon={false}
            showSaveStatus={false}
            autoSave={false}
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <span className="text-sm text-gray-400">Required</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.showValue}
            onCheckedChange={(checked) => onUpdate({ showValue: checked })}
          />
          <span className="text-sm text-gray-400">Show Value</span>
        </div>
      </div>
    </div>
  )
} 