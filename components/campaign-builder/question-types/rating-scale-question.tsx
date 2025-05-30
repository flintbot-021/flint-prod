'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Star, Heart, ThumbsUp, Smile, Zap, Target } from 'lucide-react'

interface RatingScaleQuestionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

type ScaleType = 'numbers' | 'stars' | 'hearts' | 'thumbs' | 'smileys' | 'custom'
type ScaleRange = 3 | 5 | 7 | 10

interface RatingScaleSettings {
  content?: string
  scaleType?: ScaleType
  minValue?: number
  maxValue?: number
  step?: number
  showLabels?: boolean
  minLabel?: string
  maxLabel?: string
  centerLabel?: string
  required?: boolean
  buttonLabel?: string
  helpText?: string
  defaultValue?: number
  showNumbers?: boolean
}

export function RatingScaleQuestion({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: RatingScaleQuestionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [previewValue, setPreviewValue] = useState<number[]>([])
  
  // Get current settings with defaults
  const settings = section.settings as RatingScaleSettings || {}
  const {
    content = '',
    scaleType = 'numbers',
    minValue = 1,
    maxValue = 5,
    step = 1,
    showLabels = true,
    minLabel = 'Poor',
    maxLabel = 'Excellent',
    centerLabel = '',
    required = false,
    buttonLabel = 'Next',
    helpText = '',
    defaultValue = undefined,
    showNumbers = true
  } = settings

  // Initialize preview value
  useState(() => {
    if (defaultValue !== undefined) {
      setPreviewValue([defaultValue])
    }
  })

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<RatingScaleSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update rating scale settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle help text change
  const handleHelpTextChange = async (newHelpText: string) => {
    await updateSettings({ helpText: newHelpText })
  }

  // Handle label changes
  const handleMinLabelChange = async (newLabel: string) => {
    await updateSettings({ minLabel: newLabel })
  }

  const handleMaxLabelChange = async (newLabel: string) => {
    await updateSettings({ maxLabel: newLabel })
  }

  const handleCenterLabelChange = async (newLabel: string) => {
    await updateSettings({ centerLabel: newLabel })
  }

  // Scale type icons and renderers
  const getScaleTypeIcon = (type: ScaleType) => {
    switch (type) {
      case 'stars': return Star
      case 'hearts': return Heart
      case 'thumbs': return ThumbsUp
      case 'smileys': return Smile
      case 'custom': return Target
      default: return Zap
    }
  }

  // Render scale items based on type
  const renderScaleItems = (value?: number, interactive = false) => {
    const items = []
    const range = maxValue - minValue + 1
    
    for (let i = minValue; i <= maxValue; i += step) {
      const isSelected = value === i
      const isHovered = interactive && previewValue[0] >= i
      
      items.push(
        <div
          key={i}
          className={cn(
            'flex flex-col items-center space-y-2 p-2 rounded-lg transition-all cursor-pointer',
            interactive && 'hover:bg-accent',
            isSelected && 'bg-blue-50 border-2 border-blue-300',
            !isSelected && 'border-2 border-transparent'
          )}
          onClick={interactive ? () => setPreviewValue([i]) : undefined}
        >
          {/* Scale Icon/Visual */}
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
            isSelected || isHovered ? 'text-blue-600' : 'text-gray-400'
          )}>
            {scaleType === 'numbers' && (
              <span className="text-lg font-medium">{i}</span>
            )}
            {scaleType === 'stars' && (
              <Star className={cn('h-6 w-6', (isSelected || isHovered) && 'fill-current')} />
            )}
            {scaleType === 'hearts' && (
              <Heart className={cn('h-6 w-6', (isSelected || isHovered) && 'fill-current')} />
            )}
            {scaleType === 'thumbs' && (
              <ThumbsUp className={cn('h-6 w-6', (isSelected || isHovered) && 'fill-current')} />
            )}
            {scaleType === 'smileys' && (
              <Smile className={cn('h-6 w-6', (isSelected || isHovered) && 'fill-current')} />
            )}
            {scaleType === 'custom' && (
              <div className={cn(
                'w-6 h-6 rounded-full border-2',
                (isSelected || isHovered) ? 'bg-blue-600 border-blue-600' : 'border-input'
              )} />
            )}
          </div>
          
          {/* Number Label */}
          {showNumbers && scaleType !== 'numbers' && (
            <span className="text-xs text-muted-foreground">{i}</span>
          )}
        </div>
      )
    }
    
    return items
  }

  // Render slider version
  const renderSlider = () => (
    <div className="space-y-4">
      <Slider
        value={previewValue.length > 0 ? previewValue : defaultValue ? [defaultValue] : [minValue]}
        onValueChange={setPreviewValue}
        min={minValue}
        max={maxValue}
        step={step}
        className="w-full"
        disabled={!isPreview}
      />
      
      {/* Value display */}
      <div className="text-center">
        <span className="text-lg font-medium text-blue-600">
          {previewValue[0] || defaultValue || minValue}
        </span>
      </div>
    </div>
  )

  // Validation
  const validateContent = (text: string): string | null => {
    if (!text.trim()) {
      return 'Question text is required'
    }
    if (text.length > 200) {
      return 'Question text must be 200 characters or less'
    }
    return null
  }

  // Common scale presets
  const scalePresets = [
    { label: '1-3 Scale', min: 1, max: 3 },
    { label: '1-5 Scale', min: 1, max: 5 },
    { label: '1-7 Scale', min: 1, max: 7 },
    { label: '1-10 Scale', min: 1, max: 10 },
    { label: '0-10 Scale', min: 0, max: 10 }
  ]

  if (isPreview) {
    // Preview Mode - Show how the question appears to users
    return (
      <div className={cn('p-6', className)}>
        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              {content || 'Your question text here...'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {helpText && (
              <p className="text-sm text-muted-foreground mb-4">{helpText}</p>
            )}
          </div>

          {/* Scale Labels */}
          {showLabels && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{minLabel}</span>
              {centerLabel && maxValue - minValue >= 4 && (
                <span>{centerLabel}</span>
              )}
              <span>{maxLabel}</span>
            </div>
          )}

          {/* Scale Display */}
          {maxValue - minValue <= 7 ? (
            <div className="flex justify-between items-center">
              {renderScaleItems(previewValue[0], true)}
            </div>
          ) : (
            renderSlider()
          )}

          {/* Selected Value Display */}
          {previewValue.length > 0 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Selected: <span className="font-medium">{previewValue[0]}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Question Content */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Question Text {required && <span className="text-red-500">*</span>}
          </Label>
          <InlineEditableText
            value={content}
            onSave={handleContentChange}
            variant="body"
            placeholder="Enter your question text..."
            className="min-h-[60px] p-3 border border-border rounded-lg w-full"
            showEditIcon={false}
            showSaveStatus={true}
            multiline={true}
            maxLength={200}
            required={true}
            validation={validateContent}
          />
        </div>

        {/* Scale Type and Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Scale Type
            </Label>
            <Select
              value={scaleType}
              onValueChange={(value: ScaleType) => updateSettings({ scaleType: value })}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const Icon = getScaleTypeIcon(scaleType)
                      return <Icon className="h-4 w-4" />
                    })()}
                    <span className="capitalize">{scaleType}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numbers">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Numbers</span>
                  </div>
                </SelectItem>
                <SelectItem value="stars">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Stars</span>
                  </div>
                </SelectItem>
                <SelectItem value="hearts">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Hearts</span>
                  </div>
                </SelectItem>
                <SelectItem value="thumbs">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Thumbs Up</span>
                  </div>
                </SelectItem>
                <SelectItem value="smileys">
                  <div className="flex items-center space-x-2">
                    <Smile className="h-4 w-4" />
                    <span>Smileys</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Custom</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Scale Preset
            </Label>
            <Select
              value={`${minValue}-${maxValue}`}
              onValueChange={(value) => {
                const preset = scalePresets.find(p => `${p.min}-${p.max}` === value)
                if (preset) {
                  updateSettings({ 
                    minValue: preset.min, 
                    maxValue: preset.max,
                    defaultValue: undefined // Reset default when changing range
                  })
                }
              }}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scalePresets.map((preset) => (
                  <SelectItem key={`${preset.min}-${preset.max}`} value={`${preset.min}-${preset.max}`}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Range */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Min Value
            </Label>
            <Input
              type="number"
              value={minValue}
              onChange={(e) => {
                const newMin = parseInt(e.target.value)
                if (!isNaN(newMin) && newMin < maxValue) {
                  updateSettings({ minValue: newMin })
                }
              }}
              min={0}
              max={maxValue - 1}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Max Value
            </Label>
            <Input
              type="number"
              value={maxValue}
              onChange={(e) => {
                const newMax = parseInt(e.target.value)
                if (!isNaN(newMax) && newMax > minValue) {
                  updateSettings({ maxValue: newMax })
                }
              }}
              min={minValue + 1}
              max={20}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Step
            </Label>
            <Input
              type="number"
              value={step}
              onChange={(e) => {
                const newStep = parseInt(e.target.value) || 1
                updateSettings({ step: newStep })
              }}
              min={1}
              max={maxValue - minValue}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showLabels"
              checked={showLabels}
              onCheckedChange={(checked) => updateSettings({ showLabels: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="showLabels" className="text-sm font-medium cursor-pointer">
              Show scale labels
            </Label>
          </div>

          {showLabels && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Min Label
                </Label>
                <InlineEditableText
                  value={minLabel}
                  onSave={handleMinLabelChange}
                  variant="body"
                  placeholder="e.g., Poor, Disagree"
                  className="p-3 border border-border rounded-lg w-full"
                  showEditIcon={false}
                  showSaveStatus={true}
                  maxLength={50}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Max Label
                </Label>
                <InlineEditableText
                  value={maxLabel}
                  onSave={handleMaxLabelChange}
                  variant="body"
                  placeholder="e.g., Excellent, Agree"
                  className="p-3 border border-border rounded-lg w-full"
                  showEditIcon={false}
                  showSaveStatus={true}
                  maxLength={50}
                />
              </div>
            </div>
          )}

          {showLabels && maxValue - minValue >= 4 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Center Label (Optional)
              </Label>
              <InlineEditableText
                value={centerLabel}
                onSave={handleCenterLabelChange}
                variant="body"
                placeholder="e.g., Neutral, Okay"
                className="p-3 border border-border rounded-lg w-full"
                showEditIcon={false}
                showSaveStatus={true}
                maxLength={50}
              />
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={required}
              onCheckedChange={(checked) => updateSettings({ required: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="required" className="text-sm font-medium cursor-pointer">
              Required field
            </Label>
          </div>

          {scaleType !== 'numbers' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="showNumbers"
                checked={showNumbers}
                onCheckedChange={(checked) => updateSettings({ showNumbers: checked })}
                disabled={isSaving}
              />
              <Label htmlFor="showNumbers" className="text-sm font-medium cursor-pointer">
                Show numbers below icons
              </Label>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Default Value (Optional)
            </Label>
            <Input
              type="number"
              value={defaultValue || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined
                updateSettings({ defaultValue: value })
              }}
              min={minValue}
              max={maxValue}
              placeholder="No default"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Help Text */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Help Text (Optional)
          </Label>
          <InlineEditableText
            value={helpText}
            onSave={handleHelpTextChange}
            variant="body"
            placeholder="Add helpful instructions for users..."
            className="p-3 border border-border rounded-lg w-full text-muted-foreground"
            showEditIcon={false}
            showSaveStatus={true}
            maxLength={200}
            multiline={true}
          />
        </div>

        {/* Preview Section */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Preview
          </Label>
          <div className="bg-muted rounded-lg p-4">
            <RatingScaleQuestion
              section={section}
              isPreview={true}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 