'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  settings: {
    title: string
    subtitle: string
    backgroundImage: string
    textAlignment: 'left' | 'center' | 'right'
    buttonText: string
    showButton: boolean
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  onNext?: () => void
  className?: string
}

export function HeroSection({
  settings,
  isPreview = false,
  isEditing = false,
  onChange,
  onNext,
  className
}: HeroSectionProps) {
  const [editingField, setEditingField] = useState<string | null>(null)

  const handleSettingChange = useCallback((key: string, value: any) => {
    if (onChange) {
      const newSettings = { ...settings, [key]: value }
      onChange(newSettings)
    }
  }, [settings, onChange])

  const handleInlineEdit = (field: string, value: string) => {
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

  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }

  if (isPreview) {
    return (
      <div className={cn("w-full min-h-screen relative overflow-hidden", className)}>
        {/* Background */}
        <div className="absolute inset-0">
          {settings.backgroundImage ? (
            <img 
              src={settings.backgroundImage} 
              alt="Hero background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4">
          <div className={cn("max-w-4xl w-full space-y-6", getAlignmentClass(settings.textAlignment))}>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              {settings.title}
            </h1>
            
            {settings.subtitle && (
              <p className="text-xl md:text-2xl text-white opacity-90 max-w-3xl mx-auto">
                {settings.subtitle}
              </p>
            )}

            {settings.showButton && (
              <div className="pt-8">
                <Button 
                  onClick={onNext}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
                >
                  {settings.buttonText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Content Settings */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Title
          </Label>
          {renderEditableText(
            'title',
            settings.title,
            'Your Hero Title',
            'text-2xl font-bold text-gray-900'
          )}
        </div>

        {/* Subtitle */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Subtitle
          </Label>
          {renderEditableText(
            'subtitle',
            settings.subtitle,
            'Add your compelling subtitle here',
            'text-lg text-gray-600',
            true
          )}
        </div>
      </div>

      {/* Background Image */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Background Image
        </Label>
        <div className="space-y-3">
          {settings.backgroundImage ? (
            <div className="relative">
              <img 
                src={settings.backgroundImage} 
                alt="Background preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleSettingChange('backgroundImage', '')}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => {
                // In a real implementation, this would open a file picker
                const url = prompt('Enter image URL:')
                if (url) {
                  handleSettingChange('backgroundImage', url)
                }
              }}
            >
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500">Click to add background image</p>
                <p className="text-xs text-gray-400">Or paste an image URL</p>
              </div>
            </div>
          )}
          
          {/* URL Input */}
          <div>
            <input
              type="url"
              value={settings.backgroundImage}
              onChange={(e) => handleSettingChange('backgroundImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Text Alignment
        </Label>
        <div className="flex space-x-3">
          {(['left', 'center', 'right'] as const).map((alignment) => (
            <Button
              key={alignment}
              variant={settings.textAlignment === alignment ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSettingChange('textAlignment', alignment)}
              className="capitalize"
            >
              {alignment}
            </Button>
          ))}
        </div>
      </div>

      {/* Button Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Switch
            checked={settings.showButton}
            onCheckedChange={(checked) => handleSettingChange('showButton', checked)}
          />
          <Label className="text-sm font-medium text-gray-700">
            Show Button
          </Label>
        </div>

        {settings.showButton && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Button Text
            </Label>
            {renderEditableText(
              'buttonText',
              settings.buttonText,
              'Get Started',
              'text-sm text-gray-900'
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Hero Preview
        </Label>
        <div className="relative h-48 rounded overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            {settings.backgroundImage ? (
              <img 
                src={settings.backgroundImage} 
                alt="Hero background"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full px-4">
            <div className={cn("space-y-3", getAlignmentClass(settings.textAlignment))}>
              <h3 className="text-lg font-bold text-white leading-tight">
                {settings.title}
              </h3>
              
              {settings.subtitle && (
                <p className="text-sm text-white opacity-90">
                  {settings.subtitle}
                </p>
              )}

              {settings.showButton && (
                <Button 
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100 mt-3"
                  disabled
                >
                  {settings.buttonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 