'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BasicSectionProps {
  settings: {
    title: string
    content: string
    image: string
    imagePosition: 'top' | 'bottom' | 'left' | 'right'
    alignment: 'left' | 'center' | 'right'
    buttonText: string
    showButton: boolean
  }
  isPreview?: boolean
  isEditing?: boolean
  onChange?: (settings: any) => void
  onNext?: () => void
  className?: string
}

export function BasicSection({
  settings,
  isPreview = false,
  isEditing = false,
  onChange,
  onNext,
  className
}: BasicSectionProps) {
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
          rows={5}
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

  const renderImageContent = () => {
    if (!settings.image) return null

    return (
      <div className="w-full">
        <img 
          src={settings.image} 
          alt={settings.title || "Section image"}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>
    )
  }

  const renderTextContent = () => (
    <div className={cn("space-y-4", getAlignmentClass(settings.alignment))}>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
        {settings.title}
      </h2>
      
      {settings.content && (
        <div className="text-lg text-gray-600 whitespace-pre-wrap max-w-3xl mx-auto">
          {settings.content}
        </div>
      )}

      {settings.showButton && (
        <div className="pt-6">
          <Button 
            onClick={onNext}
            size="lg"
            className="text-lg px-8 py-4 h-auto"
          >
            {settings.buttonText}
          </Button>
        </div>
      )}
    </div>
  )

  if (isPreview) {
    return (
      <div className={cn("w-full min-h-screen bg-white", className)}>
        <div className="max-w-6xl mx-auto px-4 py-16">
          {settings.imagePosition === 'top' && (
            <div className="space-y-8">
              {renderImageContent()}
              {renderTextContent()}
            </div>
          )}

          {settings.imagePosition === 'bottom' && (
            <div className="space-y-8">
              {renderTextContent()}
              {renderImageContent()}
            </div>
          )}

          {(settings.imagePosition === 'left' || settings.imagePosition === 'right') && (
            <div className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center",
              settings.imagePosition === 'right' && "lg:grid-flow-dense"
            )}>
              <div className={settings.imagePosition === 'right' ? 'lg:col-start-2' : ''}>
                {renderImageContent()}
              </div>
              <div className={settings.imagePosition === 'right' ? 'lg:col-start-1' : ''}>
                {renderTextContent()}
              </div>
            </div>
          )}

          {!settings.image && renderTextContent()}
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
            'Section Title',
            'text-xl font-bold text-gray-900'
          )}
        </div>

        {/* Content */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Content
          </Label>
          {renderEditableText(
            'content',
            settings.content,
            'Add your content here...',
            'text-base text-gray-700',
            true
          )}
        </div>
      </div>

      {/* Image Settings */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Image (Optional)
        </Label>
        <div className="space-y-3">
          {settings.image ? (
            <div className="relative">
              <img 
                src={settings.image} 
                alt="Section image preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleSettingChange('image', '')}
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
                  handleSettingChange('image', url)
                }
              }}
            >
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500">Click to add image</p>
                <p className="text-xs text-gray-400">Or paste an image URL</p>
              </div>
            </div>
          )}
          
          {/* URL Input */}
          <div>
            <input
              type="url"
              value={settings.image}
              onChange={(e) => handleSettingChange('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Image Position */}
      {settings.image && (
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Image Position
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'bottom', 'left', 'right'] as const).map((position) => (
              <Button
                key={position}
                variant={settings.imagePosition === position ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSettingChange('imagePosition', position)}
                className="capitalize"
              >
                {position}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Text Alignment */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Text Alignment
        </Label>
        <div className="flex space-x-3">
          {(['left', 'center', 'right'] as const).map((alignment) => (
            <Button
              key={alignment}
              variant={settings.alignment === alignment ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSettingChange('alignment', alignment)}
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
              'Next',
              'text-sm text-gray-900'
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Section Preview
        </Label>
        <div className="bg-white rounded p-6 min-h-[200px]">
          <div className={cn("space-y-4", getAlignmentClass(settings.alignment))}>
            <h3 className="text-lg font-bold text-gray-900">
              {settings.title}
            </h3>
            
            {settings.content && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {settings.content.length > 100 ? settings.content.substring(0, 100) + '...' : settings.content}
              </p>
            )}

            {settings.image && (
              <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Image Preview</span>
              </div>
            )}

            {settings.showButton && (
              <Button 
                size="sm"
                disabled
              >
                {settings.buttonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 