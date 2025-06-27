'use client'

import { useState, useCallback } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, X } from 'lucide-react'
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
  textAlignment?: 'left' | 'center' | 'right'
}

export function BasicSection({ section, isPreview = false, onUpdate, className }: BasicSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as BasicSettings || {}
  const {
    title = 'Your Headline',
    subtitle = 'Add your subheading here',
    content = 'Add your content here. You can write multiple paragraphs and create rich content that engages your audience.',
    image = '',
    textAlignment = 'center'
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<BasicSettings>) => {
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
    }
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
        'basic-section'
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

  if (isPreview) {
    // Preview Mode - What end users see
    return (
      <div className={cn('py-16 px-6', className)}>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Image */}
          {image && (
            <div className="w-full">
              <img 
                src={image}
                alt={title || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Text Content */}
          <div className={cn('space-y-6', getAlignmentClass(textAlignment))}>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {title}
              </h1>
              
              {subtitle && (
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                  {subtitle}
                </p>
              )}
            </div>

            {content && (
              <div className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Build Mode - Simple and clean like text questions
  return (
    <div className={cn('py-16 space-y-6 max-w-2xl mx-auto', className)}>
      
      {/* Image Upload Area */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Section Image</label>
        
        {image ? (
          <div className="relative group">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img 
                src={image}
                alt="Section image"
                className="w-full h-full object-cover"
              />
              
              {/* Hover overlay for change */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="text-center space-y-2 text-white">
                  <Upload className="h-6 w-6 mx-auto" />
                  <p className="text-sm font-medium">Change image</p>
                </div>
              </div>
            </div>
            
            {/* Remove button */}
            <button
              onClick={() => updateSettings({ image: '' })}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            
            {/* Click to change */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <label className="block">
            <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors">
              {isUploading ? (
                <div className="text-center text-gray-400">
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload section image</p>
                  <p className="text-xs opacity-75">JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Title - Seamless inline editing (identical to hero section) */}
      <div className="pt-8">
        <InlineEditableText
          value={title}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          autoSave={false}
          placeholder="Your Headline"
          className="!text-4xl !font-bold text-center text-gray-400 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-4xl !font-bold !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-400 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="heading"
        />
      </div>

      {/* Subtitle - Seamless inline editing (identical to hero section) */}
      <div className="pt-4">
        <InlineEditableText
          value={subtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          autoSave={false}
          placeholder="Add your compelling subtitle here"
          className="!text-xl text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0"
          inputClassName="!text-xl !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent"
          showEditIcon={false}
          variant="body"
        />
      </div>

      {/* Rich Text Content - Additional paragraph section */}
      <div className="pt-6">
        <InlineEditableText
          value={content}
          onSave={(newContent) => updateSettings({ content: newContent })}
          autoSave={false}
          placeholder="Add your content here. You can write multiple paragraphs and create rich content that engages your audience."
          className="!text-lg text-center text-gray-500 hover:bg-transparent focus:bg-transparent !border-0 !bg-transparent !shadow-none !outline-none !ring-0 rounded-none px-0 py-0 !min-h-32"
          inputClassName="!text-lg !border-0 !bg-transparent !shadow-none !outline-none !ring-0 text-center text-gray-500 placeholder:text-gray-600 focus:!bg-transparent hover:!bg-transparent !min-h-32"
          showEditIcon={false}
          variant="body"
          multiline={true}
        />
      </div>
    </div>
  )
} 