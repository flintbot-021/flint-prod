'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import { uploadFiles, UploadedFileInfo } from '@/lib/supabase/storage'

interface BasicSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface BasicSettings {
  title?: string
  subtitle?: string
  content?: string
  image?: string
  imagePosition?: 'above' | 'below'
  textAlignment?: 'left' | 'center' | 'right'
}

export function BasicSection({ section, isPreview = false, onUpdate, className }: BasicSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as BasicSettings || {}
  const {
    title = '',
    subtitle = '',
    content = '',
    image = '',
    imagePosition = 'above',
    textAlignment = 'center'
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<BasicSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update basic settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle title change
  const handleTitleChange = async (newTitle: string) => {
    await updateSettings({ title: newTitle })
  }

  // Handle subtitle change
  const handleSubtitleChange = async (newSubtitle: string) => {
    await updateSettings({ subtitle: newSubtitle })
  }

  // Handle content change
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  // Handle image upload
  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    
    try {
      // TODO: Get actual campaign ID from context
      const campaignId = 'demo-campaign'
      
      const uploadedFiles = await uploadFiles(
        [file],
        campaignId,
        undefined
      )
      
      if (uploadedFiles.length > 0) {
        await updateSettings({ image: uploadedFiles[0].url })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Get text alignment class
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }

  // Render image component
  const renderImage = () => {
    if (!image) return null

    return (
      <div className="w-full">
        <img 
          src={image}
          alt={title || 'Section image'}
          className="w-full h-64 md:h-80 object-cover rounded-lg"
        />
      </div>
    )
  }

  // Render text content
  const renderTextContent = () => (
    <div className={cn('space-y-6', getAlignmentClass(textAlignment))}>
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          {title || 'Your Headline'}
        </h1>
        
        {subtitle && (
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {content && (
        <div className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )

  if (isPreview) {
    // Preview Mode - Show the basic section layout
    return (
      <div className={cn('py-16 px-6', className)}>
        <div className="max-w-4xl mx-auto space-y-12">
          {imagePosition === 'above' && (
            <>
              {renderImage()}
              {renderTextContent()}
            </>
          )}

          {imagePosition === 'below' && (
            <>
              {renderTextContent()}
              {renderImage()}
            </>
          )}
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('py-16 px-6 max-w-4xl mx-auto space-y-8', className)}>
      {/* Content Preview */}
      <div className="relative w-full min-h-96 bg-gray-900 rounded-lg p-8 overflow-hidden">
        <div className="space-y-8">
          {imagePosition === 'above' && (
            <>
              {image && (
                <div className="w-full">
                  <img 
                    src={image}
                    alt={title || 'Section image'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className={cn('space-y-4', getAlignmentClass(textAlignment))}>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {title || 'Your Headline'}
                </h1>
                {subtitle && (
                  <p className="text-lg text-gray-300">
                    {subtitle}
                  </p>
                )}
                {content && (
                  <div className="text-base text-gray-400 whitespace-pre-wrap">
                    {content}
                  </div>
                )}
              </div>
            </>
          )}

          {imagePosition === 'below' && (
            <>
              <div className={cn('space-y-4', getAlignmentClass(textAlignment))}>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {title || 'Your Headline'}
                </h1>
                {subtitle && (
                  <p className="text-lg text-gray-300">
                    {subtitle}
                  </p>
                )}
                {content && (
                  <div className="text-base text-gray-400 whitespace-pre-wrap">
                    {content}
                  </div>
                )}
              </div>
              {image && (
                <div className="w-full">
                  <img 
                    src={image}
                    alt={title || 'Section image'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">Headline</Label>
        <InlineEditableText
          value={title}
          onSave={handleTitleChange}
          variant="body"
          placeholder="Your compelling headline"
          className="text-4xl font-bold text-gray-400 block w-full hover:bg-transparent rounded-none px-0 py-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 !border-0 !bg-transparent !shadow-none !outline-none !ring-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subtitle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">Subheading</Label>
        <InlineEditableText
          value={subtitle}
          onSave={handleSubtitleChange}
          variant="body"
          placeholder="Add your subheading here"
          className="text-xl text-gray-500 block w-full hover:bg-transparent rounded-none px-0 py-0"
          inputClassName="!text-xl !text-gray-500 !border-0 !bg-transparent !shadow-none !outline-none !ring-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={true}
          autoSave={false}
        />
      </div>

      {/* Rich Text Content */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">Content (Rich Text)</Label>
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="Add your content here. You can write multiple paragraphs, format text, and create rich content..."
          className="text-lg text-gray-500 block w-full hover:bg-transparent rounded-none px-0 py-0 min-h-32"
          inputClassName="!text-lg !text-gray-500 !border-0 !bg-transparent !shadow-none !outline-none !ring-0 !min-h-32"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={true}
          autoSave={false}
        />
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-300">Section Image</Label>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors">
                {isUploading ? (
                  <div className="flex items-center space-x-2 text-blue-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Upload Section Image</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
            </label>
            
            {image && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateSettings({ image: '' })}
                className="text-gray-400 border-gray-600 hover:border-gray-500"
              >
                Remove
              </Button>
            )}
          </div>

          {/* Image Position */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Image Position</Label>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={imagePosition === 'above' ? 'default' : 'outline'}
                onClick={() => updateSettings({ imagePosition: 'above' })}
                className="text-xs"
              >
                Above Text
              </Button>
              <Button
                size="sm"
                variant={imagePosition === 'below' ? 'default' : 'outline'}
                onClick={() => updateSettings({ imagePosition: 'below' })}
                className="text-xs"
              >
                Below Text
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-300">Text Alignment</Label>
        <div className="flex space-x-2">
          {(['left', 'center', 'right'] as const).map((alignment) => (
            <Button
              key={alignment}
              size="sm"
              variant={textAlignment === alignment ? 'default' : 'outline'}
              onClick={() => updateSettings({ textAlignment: alignment })}
              className="text-xs capitalize"
            >
              {alignment}
            </Button>
          ))}
        </div>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4">
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  )
} 