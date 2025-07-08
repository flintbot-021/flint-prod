'use client'

import { useState, useRef } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Layout,
  Eye,
  Edit3
} from 'lucide-react'

interface InfoSectionProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

type TextAlign = 'left' | 'center' | 'right'
type ImagePosition = 'top' | 'left' | 'right' | 'background'
type SectionLayout = 'text-only' | 'image-only' | 'text-with-image' | 'full-background'

interface InfoSectionSettings {
  title?: string
  content?: string
  imageUrl?: string
  imageAlt?: string
  textAlign?: TextAlign
  imagePosition?: ImagePosition
  layout?: SectionLayout
  backgroundColor?: string
  textColor?: string
  titleSize?: 'small' | 'medium' | 'large' | 'xl'
  showTitle?: boolean
  buttonLabel?: string
  buttonUrl?: string
  showButton?: boolean
}

export function InfoSection({ 
  section, 
  isPreview = false, 
  onUpdate, 
  className 
}: InfoSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get current settings with defaults
  const settings = section.settings as InfoSectionSettings || {}
  const {
    title = '',
    content = '',
    imageUrl = '',
    imageAlt = '',
    textAlign = 'left',
    imagePosition = 'top',
    layout = 'text-only',
    backgroundColor = '',
    textColor = '',
    titleSize = 'large',
    showTitle = true,
    buttonLabel = 'Continue',
    buttonUrl = '',
    showButton = false
  } = settings

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<InfoSectionSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update info section settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle text field changes
  const handleTitleChange = async (newTitle: string) => {
    await updateSettings({ title: newTitle })
  }

  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
  }

  const handleImageAltChange = async (newAlt: string) => {
    await updateSettings({ imageAlt: newAlt })
  }



  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setIsUploading(true)
    try {
      // For demo purposes, create a data URL
      // In production, this would upload to a proper image service
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string
        await updateSettings({ 
          imageUrl,
          imageAlt: imageAlt || file.name.replace(/\.[^/.]+$/, "")
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle image removal
  const handleImageRemove = async () => {
    await updateSettings({ imageUrl: '', imageAlt: '' })
  }

  // Layout validation
  const validateTitle = (text: string): string | null => {
    if (showTitle && !text.trim()) {
      return 'Title is required when title display is enabled'
    }
    if (text.length > 100) {
      return 'Title must be 100 characters or less'
    }
    return null
  }

  const validateContent = (text: string): string | null => {
    if (!text.trim()) {
      return 'Content is required'
    }
    if (text.length > 2000) {
      return 'Content must be 2000 characters or less'
    }
    return null
  }

  // Get title size classes
  const getTitleSizeClass = () => {
    switch (titleSize) {
      case 'small': return 'text-lg'
      case 'medium': return 'text-xl'
      case 'large': return 'text-2xl'
      case 'xl': return 'text-3xl'
      default: return 'text-2xl'
    }
  }

  // Get text alignment classes
  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'center': return 'text-center'
      case 'right': return 'text-right'
      default: return 'text-left'
    }
  }

  if (isPreview) {
    // Preview Mode - Show how the section appears to users
    return (
      <div 
        className={cn('relative overflow-hidden', className)}
        style={{
          backgroundColor: backgroundColor || undefined,
          color: textColor || undefined
        }}
      >
        {/* Background Image */}
        {layout === 'full-background' && imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>
        )}

        <div className={cn(
          'relative z-10 p-6',
          layout === 'full-background' && 'text-white min-h-[400px] flex flex-col justify-center'
        )}>
          {/* Text and Image Layout */}
          {layout === 'text-with-image' && imagePosition === 'left' ? (
            <div className="flex items-start space-x-6">
              {/* Left Image */}
              {imageUrl && (
                <div className="flex-shrink-0 w-1/3">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </div>
              )}
              
              {/* Text Content */}
              <div className={cn('flex-1', getTextAlignClass())}>
                {showTitle && title && (
                  <h2 className={cn('font-bold mb-4', getTitleSizeClass())}>
                    {title}
                  </h2>
                )}
                {content && (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{content}</p>
                  </div>
                )}
                {showButton && buttonLabel && (
                  <Button className="mt-6" disabled>
                    {buttonLabel}
                  </Button>
                )}
              </div>
            </div>
          ) : layout === 'text-with-image' && imagePosition === 'right' ? (
            <div className="flex items-start space-x-6">
              {/* Text Content */}
              <div className={cn('flex-1', getTextAlignClass())}>
                {showTitle && title && (
                  <h2 className={cn('font-bold mb-4', getTitleSizeClass())}>
                    {title}
                  </h2>
                )}
                {content && (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{content}</p>
                  </div>
                )}
                {showButton && buttonLabel && (
                  <Button className="mt-6" disabled>
                    {buttonLabel}
                  </Button>
                )}
              </div>
              
              {/* Right Image */}
              {imageUrl && (
                <div className="flex-shrink-0 w-1/3">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            // Default layout (top image, text only, etc.)
            <div className={cn('space-y-6', getTextAlignClass())}>
              {/* Top Image */}
              {(layout === 'image-only' || (layout === 'text-with-image' && imagePosition === 'top')) && imageUrl && (
                <div className="w-full">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-full h-auto rounded-lg object-cover max-h-80"
                  />
                </div>
              )}

              {/* Text Content */}
              {layout !== 'image-only' && (
                <div>
                  {showTitle && title && (
                    <h2 className={cn('font-bold mb-4', getTitleSizeClass())}>
                      {title}
                    </h2>
                  )}
                  {content && (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{content}</p>
                    </div>
                  )}
                  {showButton && buttonLabel && (
                    <Button className="mt-6" disabled>
                      {buttonLabel}
                    </Button>
                  )}
                </div>
              )}
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
        {/* Layout Selection */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Section Layout
          </Label>
          <Select
            value={layout}
            onValueChange={(value: SectionLayout) => updateSettings({ layout: value })}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4" />
                  <span className="capitalize">{layout.replace('-', ' ')}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text-only">
                <div className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span>Text Only</span>
                </div>
              </SelectItem>
              <SelectItem value="image-only">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image Only</span>
                </div>
              </SelectItem>
              <SelectItem value="text-with-image">
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4" />
                  <span>Text with Image</span>
                </div>
              </SelectItem>
              <SelectItem value="full-background">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Full Background</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title Section */}
        {layout !== 'image-only' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="showTitle"
                checked={showTitle}
                onCheckedChange={(checked) => updateSettings({ showTitle: checked })}
                disabled={isSaving}
              />
              <Label htmlFor="showTitle" className="text-sm font-medium cursor-pointer">
                Show title
              </Label>
            </div>

            {showTitle && (
              <>
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Title
                  </Label>
                  <InlineEditableText
                    value={title}
                    onSave={handleTitleChange}
                    variant="heading"
                    placeholder="Enter section title..."
                    className="p-3 border border-border rounded-lg w-full font-medium"
                    showEditIcon={false}
                    showSaveStatus={true}
                    maxLength={100}
                    required={showTitle}
                    validation={validateTitle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Title Size
                    </Label>
                    <Select
                      value={titleSize}
                      onValueChange={(value: typeof titleSize) => updateSettings({ titleSize: value })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Text Alignment
                    </Label>
                    <Select
                      value={textAlign}
                      onValueChange={(value: TextAlign) => updateSettings({ textAlign: value })}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center space-x-2">
                            {textAlign === 'left' && <AlignLeft className="h-4 w-4" />}
                            {textAlign === 'center' && <AlignCenter className="h-4 w-4" />}
                            {textAlign === 'right' && <AlignRight className="h-4 w-4" />}
                            <span className="capitalize">{textAlign}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">
                          <div className="flex items-center space-x-2">
                            <AlignLeft className="h-4 w-4" />
                            <span>Left</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="center">
                          <div className="flex items-center space-x-2">
                            <AlignCenter className="h-4 w-4" />
                            <span>Center</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="right">
                          <div className="flex items-center space-x-2">
                            <AlignRight className="h-4 w-4" />
                            <span>Right</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Content Section */}
        {layout !== 'image-only' && (
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Content
            </Label>
            <InlineEditableText
              value={content}
              onSave={handleContentChange}
              variant="body"
              placeholder="Enter your content text..."
              className="min-h-[120px] p-3 border border-border rounded-lg w-full"
              showEditIcon={false}
              showSaveStatus={true}
              multiline={true}
              maxLength={2000}
              required={true}
              validation={validateContent}
            />
          </div>
        )}

        {/* Image Section */}
        {layout !== 'text-only' && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground block">
              Image
            </Label>

            {/* Image Upload/Display */}
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleImageRemove}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-input rounded-lg p-8 text-center cursor-pointer hover:border-input transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-600">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG up to 5MB
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Image Alt Text */}
            {imageUrl && (
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Image Alt Text
                </Label>
                <InlineEditableText
                  value={imageAlt}
                  onSave={handleImageAltChange}
                  variant="body"
                  placeholder="Describe this image for accessibility..."
                  className="p-3 border border-border rounded-lg w-full text-muted-foreground"
                  showEditIcon={false}
                  showSaveStatus={true}
                  maxLength={200}
                />
              </div>
            )}

            {/* Image Position for text-with-image layout */}
            {layout === 'text-with-image' && (
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Image Position
                </Label>
                <Select
                  value={imagePosition}
                  onValueChange={(value: ImagePosition) => updateSettings({ imagePosition: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Button Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showButton"
              checked={showButton}
              onCheckedChange={(checked) => updateSettings({ showButton: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="showButton" className="text-sm font-medium cursor-pointer">
              Show button
            </Label>
          </div>

          {showButton && (
              <div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  Button URL (Optional)
                </Label>
                <Input
                  value={buttonUrl}
                  onChange={(e) => updateSettings({ buttonUrl: e.target.value })}
                  placeholder="https://example.com"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </div>

        {/* Style Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground block">
            Style Options
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Background Color
              </Label>
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className="w-full h-10"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Text Color
              </Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => updateSettings({ textColor: e.target.value })}
                className="w-full h-10"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium text-foreground mb-3 block">
            Preview
          </Label>
          <div className="bg-muted rounded-lg overflow-hidden">
            <InfoSection
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