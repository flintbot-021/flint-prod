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
  headline?: string
  subheading?: string
  backgroundImage?: string
  overlayColor?: string
  overlayOpacity?: number
  buttonText?: string
  showButton?: boolean
  // For backward compatibility
  title?: string
  subtitle?: string
}

export function HeroSection({ section, campaignId, isPreview = false, onUpdate, className }: HeroSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  
  // Get current settings - don't apply defaults here to avoid saving placeholders
  const settings = section.settings as HeroSettings || {}
  const headline = (settings.headline || settings.title || '') as string
  const subheading = (settings.subheading || settings.subtitle || '') as string
  const backgroundImage = settings.backgroundImage || ''
  const overlayColor = settings.overlayColor || '#000000'
  const overlayOpacity = settings.overlayOpacity ?? 40
  const buttonText = settings.buttonText || 'Get Started'
  const showButton = settings.showButton ?? true

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<HeroSettings>) => {
    try {
      // Always save as headline/subheading
      const mappedSettings = { ...settings, ...newSettings }
      if ('title' in mappedSettings) mappedSettings.headline = mappedSettings.title
      if ('subtitle' in mappedSettings) mappedSettings.subheading = mappedSettings.subtitle
      delete mappedSettings.title
      delete mappedSettings.subtitle
      await onUpdate({
        settings: mappedSettings
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
          {headline && (
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              {headline}
            </h1>
          )}
          
          {subheading && (
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
              {subheading}
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
  const handleHeadlineChange = async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
  }

  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Call-to-Action Button
  return (
    <div className={cn('py-16 max-w-2xl mx-auto', className)}>
      
      {/* Background Image Selector */}
      <UnsplashImageSelector
        onImageSelect={(imageUrl) => updateSettings({ backgroundImage: imageUrl })}
        onUpload={handleImageUpload}
        currentImage={backgroundImage}
        isUploading={isUploading}
        placeholder="Search for background images..."
      />

      {/* Hero Headline - Seamless inline editing */}
      <div className="pt-8">
        <InlineEditableText
          value={headline}
          onSave={handleHeadlineChange}
          placeholder="Your Hero Headline"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Hero Subheading - Seamless inline editing */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Add your compelling subheading here"
          variant="subheading"
          className="text-center block w-full"
          multiline={true}
        />
      </div>

      {/* Call-to-Action Button */}
      <div className="pt-6 text-center">
        <InlineEditableText
          value={buttonText}
          onSave={(newButtonText) => updateSettings({ buttonText: newButtonText })}
          placeholder="Get Started"
          className="bg-blue-600 text-white hover:bg-blue-700 text-base px-6 py-3 font-semibold rounded-md inline-block"
        />
      </div>
    </div>
  )
} 