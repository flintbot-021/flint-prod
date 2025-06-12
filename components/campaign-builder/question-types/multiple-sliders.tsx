'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'

interface SliderConfig {
  id: string
  variableName: string
  question: string
  subheading: string
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
  sliders: SliderConfig[]
  allowAddMore: boolean
  buttonText: string
}

interface MultipleSlidersProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function MultipleSliders({ section, isPreview = false, onUpdate, className }: MultipleSlidersProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  const settings = (section.settings as unknown as MultipleSlidersSettings) || { 
    sliders: [], 
    allowAddMore: true, 
    buttonText: 'Next' 
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
    const newSlider: SliderConfig = {
      id: `slider_${Date.now()}`,
      variableName: `slider_${settings.sliders.length + 1}`,
      question: 'New slider question',
      subheading: '',
      minValue: 0,
      maxValue: 10,
      defaultValue: 5,
      step: 1,
      minLabel: 'Low',
      maxLabel: 'High',
      required: true,
      showValue: true
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

  if (isPreview) {
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-8', className)}>
        {settings.sliders.map((slider) => (
          <div key={slider.id} className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">
                {slider.question}
              </h3>
              {slider.subheading && (
                <p className="text-lg text-gray-300 mt-2">
                  {slider.subheading}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{slider.minLabel}</span>
                <span>{slider.maxLabel}</span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min={slider.minValue}
                  max={slider.maxValue}
                  step={slider.step}
                  defaultValue={slider.defaultValue}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled
                />
              </div>
              
              {slider.showValue && (
                <div className="text-center">
                  <span className="text-lg font-semibold text-white">
                    {slider.defaultValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {settings.sliders.map((slider, index) => (
        <SliderConfigCard
          key={slider.id}
          slider={slider}
          index={index}
          onUpdate={(updates) => updateSlider(index, updates)}
          onDelete={() => deleteSlider(index)}
          canDelete={settings.sliders.length > 1}
        />
      ))}
      
      {settings.allowAddMore && (
        <button
          onClick={addSlider}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="h-5 w-5 mx-auto mb-2" />
          Add another slider
        </button>
      )}

      {/* Global Settings */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label>Allow adding more sliders</Label>
          <Switch
            checked={settings.allowAddMore}
            onCheckedChange={(checked) => updateSettings({ allowAddMore: checked })}
          />
        </div>
        
        <div>
          <Label>Button Text</Label>
          <Input
            value={settings.buttonText}
            onChange={(e) => updateSettings({ buttonText: e.target.value })}
            placeholder="Next"
          />
        </div>
      </div>
    </div>
  )
}

function SliderConfigCard({ slider, index, onUpdate, onDelete, canDelete }: {
  slider: SliderConfig
  index: number
  onUpdate: (updates: Partial<SliderConfig>) => void
  onDelete: () => void
  canDelete: boolean
}) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="font-medium">Slider {index + 1}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono text-xs">
            @{slider.variableName}
          </Badge>
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Question and Variable Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Question Text</Label>
          <Input
            value={slider.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            placeholder="Slider question"
          />
        </div>
        
        <div>
          <Label>Variable Name</Label>
          <Input
            value={slider.variableName}
            onChange={(e) => onUpdate({ variableName: e.target.value })}
            placeholder="variable_name"
            className="font-mono text-sm"
          />
        </div>
      </div>

      {/* Subheading */}
      <div>
        <Label>Subheading (optional)</Label>
        <Input
          value={slider.subheading}
          onChange={(e) => onUpdate({ subheading: e.target.value })}
          placeholder="Additional context or instructions"
        />
      </div>

      {/* Slider Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Min Value</Label>
          <Input
            type="number"
            value={slider.minValue}
            onChange={(e) => onUpdate({ minValue: parseInt(e.target.value) })}
          />
        </div>
        
        <div>
          <Label>Max Value</Label>
          <Input
            type="number"
            value={slider.maxValue}
            onChange={(e) => onUpdate({ maxValue: parseInt(e.target.value) })}
          />
        </div>
        
        <div>
          <Label>Default Value</Label>
          <Input
            type="number"
            value={slider.defaultValue}
            onChange={(e) => onUpdate({ defaultValue: parseInt(e.target.value) })}
            min={slider.minValue}
            max={slider.maxValue}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Label</Label>
          <Input
            value={slider.minLabel}
            onChange={(e) => onUpdate({ minLabel: e.target.value })}
            placeholder="Low"
          />
        </div>
        
        <div>
          <Label>Max Label</Label>
          <Input
            value={slider.maxLabel}
            onChange={(e) => onUpdate({ maxLabel: e.target.value })}
            placeholder="High"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
          <Label>Required</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={slider.showValue}
            onCheckedChange={(checked) => onUpdate({ showValue: checked })}
          />
          <Label>Show Value</Label>
        </div>
      </div>
    </div>
  )
} 