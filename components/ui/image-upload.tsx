'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Maximize,
  Minimize,
  Eye,
  Link,
  FolderOpen
} from 'lucide-react'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ImageUploadProps {
  value?: ImageInfo | null
  onChange: (image: ImageInfo | null) => void
  className?: string
  maxSizeKB?: number
  acceptedFormats?: string[]
  showPreview?: boolean
  enableSizing?: boolean
  enablePositioning?: boolean
  enableMediaLibrary?: boolean
  placeholder?: string
}

export interface ImageInfo {
  id: string
  url: string
  name: string
  size: number
  type: string
  alt?: string
  caption?: string
  width?: number
  height?: number
  position?: 'left' | 'center' | 'right' | 'full'
  sizing?: 'small' | 'medium' | 'large' | 'custom'
  customWidth?: number
  customHeight?: number
}

interface ImagePreviewProps {
  image: ImageInfo
  onUpdate: (updates: Partial<ImageInfo>) => void
  onRemove: () => void
  enableSizing: boolean
  enablePositioning: boolean
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generateImageId = (): string => {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// =============================================================================
// IMAGE PREVIEW COMPONENT
// =============================================================================

function ImagePreview({ 
  image, 
  onUpdate, 
  onRemove, 
  enableSizing, 
  enablePositioning 
}: ImagePreviewProps) {
  const [showSettings, setShowSettings] = useState(false)

  const handlePositionChange = (position: ImageInfo['position']) => {
    onUpdate({ position })
  }

  const handleSizingChange = (sizing: ImageInfo['sizing']) => {
    onUpdate({ sizing })
  }

  const handleCustomSizeChange = (width?: number, height?: number) => {
    onUpdate({ 
      sizing: 'custom',
      customWidth: width,
      customHeight: height
    })
  }

  const getPositionIcon = (pos: string) => {
    switch (pos) {
      case 'left': return AlignLeft
      case 'center': return AlignCenter
      case 'right': return AlignRight
      case 'full': return Maximize
      default: return AlignCenter
    }
  }

  return (
    <Card className="relative group">
      <CardContent className="p-4 space-y-4">
        {/* Image Display */}
        <div className={cn(
          "relative overflow-hidden rounded-lg bg-accent",
          image.position === 'left' && "ml-0 mr-auto",
          image.position === 'center' && "mx-auto",
          image.position === 'right' && "ml-auto mr-0",
          image.position === 'full' && "w-full"
        )}>
          <img
            src={image.url}
            alt={image.alt || image.name}
            className={cn(
              "object-cover",
              image.sizing === 'small' && "w-32 h-32",
              image.sizing === 'medium' && "w-48 h-48",
              image.sizing === 'large' && "w-64 h-64",
              image.sizing === 'custom' && image.customWidth && image.customHeight && 
                `w-[${image.customWidth}px] h-[${image.customHeight}px]`,
              !image.sizing && "w-48 h-48"
            )}
            style={
              image.sizing === 'custom' && (image.customWidth || image.customHeight) ? {
                width: image.customWidth ? `${image.customWidth}px` : 'auto',
                height: image.customHeight ? `${image.customHeight}px` : 'auto'
              } : undefined
            }
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{image.name}</span>
            <Badge variant="outline" className="text-xs">
              {formatFileSize(image.size)}
            </Badge>
          </div>
          
          {/* Alt Text */}
          <div>
            <Label className="text-xs text-muted-foreground">Alt Text</Label>
            <Input
              value={image.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Describe this image..."
              className="text-xs h-8"
            />
          </div>

          {/* Caption */}
          <div>
            <Label className="text-xs text-muted-foreground">Caption (optional)</Label>
            <Input
              value={image.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="Image caption..."
              className="text-xs h-8"
            />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4 pt-4 border-t">
            {/* Positioning */}
            {enablePositioning && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Position</Label>
                <div className="flex space-x-1">
                  {[
                    { value: 'left', label: 'Left', icon: AlignLeft },
                    { value: 'center', label: 'Center', icon: AlignCenter },
                    { value: 'right', label: 'Right', icon: AlignRight },
                    { value: 'full', label: 'Full Width', icon: Maximize }
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={image.position === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePositionChange(value as ImageInfo['position'])}
                      className="h-8 px-2"
                      title={label}
                    >
                      <Icon className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizing */}
            {enableSizing && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Size</Label>
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    {[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                      { value: 'custom', label: 'Custom' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={image.sizing === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSizingChange(value as ImageInfo['sizing'])}
                        className="h-8 px-3 text-xs"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  
                  {image.sizing === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Width (px)</Label>
                        <Input
                          type="number"
                          value={image.customWidth || ''}
                          onChange={(e) => handleCustomSizeChange(parseInt(e.target.value) || undefined, image.customHeight)}
                          placeholder="Auto"
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Height (px)</Label>
                        <Input
                          type="number"
                          value={image.customHeight || ''}
                          onChange={(e) => handleCustomSizeChange(image.customWidth, parseInt(e.target.value) || undefined)}
                          placeholder="Auto"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ImageUpload({
  value,
  onChange,
  className,
  maxSizeKB = 5000, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  showPreview = true,
  enableSizing = true,
  enablePositioning = true,
  enableMediaLibrary = false,
  placeholder = "Upload an image or drag and drop"
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // =============================================================================
  // FILE HANDLING
  // =============================================================================

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`
    }
    
    if (file.size > maxSizeKB * 1024) {
      return `File too large. Maximum size: ${formatFileSize(maxSizeKB * 1024)}`
    }

    return null
  }

  const processFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setUploadError(validationError)
        return
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file)
      
      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        const imageInfo: ImageInfo = {
          id: generateImageId(),
          url,
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height,
          position: 'center',
          sizing: 'medium'
        }
        
        onChange(imageInfo)
        URL.revokeObjectURL(url) // Clean up
      }
      
      img.src = url

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [onChange, maxSizeKB, acceptedFormats])

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  const handleRemove = useCallback(() => {
    if (value?.url) {
      URL.revokeObjectURL(value.url)
    }
    onChange(null)
  }, [value, onChange])

  const handleImageUpdate = useCallback((updates: Partial<ImageInfo>) => {
    if (value) {
      onChange({ ...value, ...updates })
    }
  }, [value, onChange])

  // =============================================================================
  // RENDER
  // =============================================================================

  if (value && showPreview) {
    return (
      <div className={className}>
        <ImagePreview
          image={value}
          onUpdate={handleImageUpdate}
          onRemove={handleRemove}
          enableSizing={enableSizing}
          enablePositioning={enablePositioning}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-blue-500 bg-blue-50" : "border-input",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mx-auto w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isUploading ? 'Uploading...' : placeholder}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFormats.map(f => f.split('/')[1]).join(', ')} up to {formatFileSize(maxSizeKB * 1024)}
            </p>
          </div>
          
          {!isUploading && (
            <div className="flex space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              
              {enableMediaLibrary && (
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Media Library
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Display */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{uploadError}</span>
          </div>
        </div>
      )}

      {/* Upload by URL */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm text-muted-foreground">Or add image URL:</Label>
          </div>
          <div className="flex space-x-2 mt-2">
            <Input
              placeholder="https://example.com/image.jpg"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  const url = e.currentTarget.value
                  const imageInfo: ImageInfo = {
                    id: generateImageId(),
                    url,
                    name: url.split('/').pop() || 'Image',
                    size: 0,
                    type: 'image/jpeg',
                    position: 'center',
                    sizing: 'medium'
                  }
                  onChange(imageInfo)
                  e.currentTarget.value = ''
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                if (input?.value) {
                  const url = input.value
                  const imageInfo: ImageInfo = {
                    id: generateImageId(),
                    url,
                    name: url.split('/').pop() || 'Image',
                    size: 0,
                    type: 'image/jpeg',
                    position: 'center',
                    sizing: 'medium'
                  }
                  onChange(imageInfo)
                  input.value = ''
                }
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImageUpload 