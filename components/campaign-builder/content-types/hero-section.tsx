'use client'

import { useState, useCallback } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, X, Palette } from 'lucide-react'
import { uploadFiles, UploadedFileInfo } from '@/lib/supabase/storage'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/auth'
import { UnsplashImageSelector } from '@/components/ui/unsplash-image-selector'

interface HeroSectionProps {
  section: CampaignSection
  campaignId: string
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface HeroSettings {
  title?: string
  subtitle?: string
  backgroundImage?: string
  overlayColor?: string
  overlayOpacity?: number
  buttonText?: string
  showButton?: boolean
}

export function HeroSection({ section, campaignId, isPreview = false, onUpdate, className }: HeroSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as HeroSettings || {}
  const {
    title = 'Your Hero Title',
    subtitle = 'Add your compelling subtitle here',
    backgroundImage = '',
    overlayColor = '#000000',
    overlayOpacity = 40,
    buttonText = 'Get Started',
    showButton = true
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<HeroSettings>) => {
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update hero settings:', error)
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
      const uploadedFiles = await uploadFiles(
        [file],
        campaignId,
        '',
        undefined,
        undefined,
        undefined,
        supabase
      )
      
      if (uploadedFiles.length > 0) {
        await updateSettings({ backgroundImage: uploadedFiles[0].url })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [campaignId, user])

  // Fixed overlay style - 50% black background
  const getOverlayStyle = () => {
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
  }

  if (isPreview) {
    // Preview Mode - Full screen hero (end-user view)
    return (
      <div className={cn('relative w-full min-h-screen flex items-center justify-center overflow-hidden', className)}>
        {/* Background Image */}
        <div className="absolute inset-0">
          {backgroundImage ? (
            <img 
              src={backgroundImage}
              alt="Hero background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700" />
          )}
        </div>

        {/* Overlay */}
        <div 
          className="absolute inset-0"
          style={getOverlayStyle()}
        />

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}

          <div className="pt-4">
            <button className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4 font-semibold rounded-md">
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Build Mode - Simple and clean like text questions
  return (
    <div className={cn('py-16 space-y-6 max-w-2xl mx-auto', className)}>
      
      {/* Background Image Selector */}
      <UnsplashImageSelector
        onImageSelect={(imageUrl) => updateSettings({ backgroundImage: imageUrl })}
        onUpload={handleImageUpload}
        currentImage={backgroundImage}
        isUploading={isUploading}
        placeholder="Search for background images..."
      />

      {/* Hero Title - Seamless inline editing */}
      <div className="pt-8">
        <InlineEditableText
          value={title}
          onSave={(newTitle) => updateSettings({ title: newTitle })}
          variant="body"
          placeholder="Your Hero Title"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subtitle - Seamless inline editing */}
      <div className="pt-4">
        <InlineEditableText
          value={subtitle}
          onSave={(newSubtitle) => updateSettings({ subtitle: newSubtitle })}
          variant="body"
          placeholder="Add your compelling subtitle here"
          className="text-xl text-gray-500 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 !rounded-none !p-0 !m-0 h-auto"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Call-to-Action Button */}
      <div className="pt-6 text-center">
        <InlineEditableText
          value={buttonText}
          onSave={(newButtonText) => updateSettings({ buttonText: newButtonText })}
          autoSave={false}
          placeholder="Get Started"
          className="!bg-blue-600 !text-white hover:!bg-blue-700 !text-base !px-6 !py-3 !font-semibold !rounded-md inline-block !border-0 !shadow-none !outline-none !ring-0"
          inputClassName="!bg-blue-600 !text-white !text-base !font-semibold !border-0 !shadow-none !outline-none !ring-0 text-center placeholder:!text-blue-200 focus:!bg-blue-600 hover:!bg-blue-600 !px-6 !py-3 !rounded-md"
          showEditIcon={false}
          variant="body"
        />
      </div>
    </div>
  )
} 