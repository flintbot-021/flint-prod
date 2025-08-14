'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Upload, File, Image, FileAudio, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadFiles, UploadedFileInfo, UploadProgress } from '@/lib/supabase/storage'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/auth'
import { Campaign } from '@/lib/types/database'
import { getCampaignTheme } from '@/components/campaign-renderer/utils'

interface UploadQuestionProps {
  section: CampaignSection
  campaignId: string
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  campaign?: Campaign
}

interface UploadSettings {
  headline?: string
  subheading?: string
  allowImages?: boolean
  allowDocuments?: boolean
  allowAudio?: boolean
  allowVideo?: boolean
  maxFileSize?: number // in MB
  maxFiles?: number
  required?: boolean
  buttonLabel?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadProgress?: number
}

export function UploadQuestion({ 
  section, 
  campaignId,
  isPreview = false, 
  onUpdate, 
  className,
  campaign
}: UploadQuestionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Get current settings with defaults
  const settings = section.settings as UploadSettings || {}
  const {
    headline = '',
    subheading = '',
    allowImages = true,
    allowDocuments = true,
    allowAudio = false,
    allowVideo = false,
    maxFileSize = 10, // 10MB default
    maxFiles = 5,
    required = false,
    buttonLabel = 'Next'
  } = settings

  // Get campaign theme for styling
  const theme = getCampaignTheme(campaign)
  const spinnerColor = theme.buttonColor

  // Handle settings updates
  const updateSettings = async (newSettings: Partial<UploadSettings>) => {
    setIsSaving(true)
    try {
      await onUpdate({
        settings: {
          ...settings,
          ...newSettings
        }
      })
    } catch (error) {
      console.error('Failed to update upload settings:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle content change
  const handleHeadlineChange = async (newHeadline: string) => {
    await updateSettings({ headline: newHeadline })
  }

  // Handle subheading change
  const handleSubheadingChange = async (newSubheading: string) => {
    await updateSettings({ subheading: newSubheading })
  }

  // Handle setting change
  const handleSettingChange = async (setting: keyof UploadSettings, value: boolean | number) => {
    await updateSettings({ [setting]: value })
  }

  // Get accepted file types based on settings
  const getAcceptedTypes = () => {
    const types: string[] = []
    if (allowImages) types.push('image/*')
    if (allowDocuments) types.push('.pdf,.doc,.docx,.txt,.rtf')
    if (allowAudio) types.push('audio/*')
    if (allowVideo) types.push('video/*')
    return types.join(',')
  }

  // Get human-readable file types for display
  const getAcceptedTypesText = () => {
    const types: string[] = []
    if (allowImages) types.push('Images (JPG, PNG, GIF)')
    if (allowDocuments) types.push('Documents (PDF, DOC, DOCX)')
    if (allowAudio) types.push('Audio files')
    if (allowVideo) types.push('Video files')
    
    if (types.length === 0) return 'No file types allowed'
    if (types.length === 1) return types[0]
    if (types.length === 2) return types.join(' & ')
    
    return types.slice(0, -1).join(', ') + ' & ' + types[types.length - 1]
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
    if (fileType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <FileText className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file type first
      if (!isFileTypeAllowed(file, settings)) {
        const acceptedTypes = getAcceptedTypesText()
        alert(`File type not allowed. "${file.name}" is not a supported file type.\n\nAccepted types: ${acceptedTypes}`)
        return false
      }
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large (${formatFileSize(file.size)}).\n\nMaximum size allowed: ${maxFileSize}MB`)
        return false
      }
      
      return true
    })

    if (!validFiles.length) return

    setIsUploading(true)
    
    try {
      if (isPreview) {
        const uploadedFileInfos = await uploadFiles(
          validFiles,
          campaignId,
          '',
          undefined,
          undefined,
          undefined,
          supabase
        )
        setUploadedFiles(prev => [...prev, ...uploadedFileInfos])
      } else {
        // In build mode, just show preview of what would be uploaded
        const mockFiles: UploadedFileInfo[] = validFiles.map((file, index) => ({
          id: `mock-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '#',
          path: `mock/path/${file.name}`
        }))
        
        setUploadedFiles(prev => [...prev, ...mockFiles])
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }, [settings, isPreview, maxFileSize, campaignId, user])

  // Handle drag and drop
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
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Remove file
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper functions
  function isFileTypeAllowed(file: File, settings: UploadSettings): boolean {
    const { allowImages, allowDocuments, allowAudio, allowVideo } = settings
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()
    
    // Check images
    if (allowImages && (
      file.type.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '')
    )) return true
    
    // Check documents
    if (allowDocuments && (
      file.type === 'application/pdf' ||
      file.type.includes('document') ||
      file.type.includes('sheet') ||
      file.type.includes('presentation') ||
      file.type === 'text/plain' ||
      file.type === 'application/rtf' ||
      ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExtension || '')
    )) return true
    
    // Check audio
    if (allowAudio && (
      file.type.startsWith('audio/') ||
      ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(fileExtension || '')
    )) return true
    
    // Check video
    if (allowVideo && (
      file.type.startsWith('video/') ||
      ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension || '')
    )) return true
    
    return false
  }

  if (isPreview) {
    // Preview Mode - Show file upload interface
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
        {/* Question Text */}
        <div className="pt-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {headline || 'Upload your files'}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h1>
          
          {subheading && (
            <div className="pt-4">
              <p className="text-xl text-gray-600">
                {subheading}
              </p>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="pt-6 space-y-4">
          {!allowImages && !allowDocuments && !allowAudio && !allowVideo ? (
            <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center bg-gray-100">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-500">
                No file types are currently allowed for upload
              </p>
              <p className="text-sm text-gray-400 mt-2">
                The campaign builder needs to enable at least one file type
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragOver 
                  ? 'border-blue-500 bg-blue-50/10' 
                  : 'border-gray-600 hover:border-gray-500'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg text-gray-300">
                Drag and drop your files here, or{' '}
                <label className="text-blue-500 hover:text-blue-400 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    multiple
                    accept={getAcceptedTypes()}
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-sm text-gray-400">
                {getAcceptedTypesText()} • Max {maxFiles} files, {maxFileSize}MB each
              </p>
            </div>
          </div>
          )}

          {/* Show uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2" style={{ color: spinnerColor }}>
                <div 
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
                  style={{ borderColor: spinnerColor, borderTopColor: 'transparent' }}
                />
                <span className="text-sm">Uploading files...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="pt-8">
        <InlineEditableText
          value={headline}
          onSave={handleHeadlineChange}
          placeholder="Type your question here"
          variant="heading"
          className="text-center block w-full"
        />
      </div>

      {/* Subheading */}
      <div className="pt-4">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          placeholder="Type sub heading here"
          variant="subheading"
          className="text-center block w-full"
        />
      </div>

      {/* Upload Configuration */}
      <div className="pt-6">
        {/* File Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Allowed File Types</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Images</span>
              </div>
              <Switch
                checked={allowImages}
                onCheckedChange={(checked) => handleSettingChange('allowImages', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Documents</span>
              </div>
              <Switch
                checked={allowDocuments}
                onCheckedChange={(checked) => handleSettingChange('allowDocuments', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileAudio className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Audio</span>
              </div>
              <Switch
                checked={allowAudio}
                onCheckedChange={(checked) => handleSettingChange('allowAudio', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-900">Video</span>
              </div>
              <Switch
                checked={allowVideo}
                onCheckedChange={(checked) => handleSettingChange('allowVideo', checked)}
                className="scale-75"
              />
            </div>
          </div>
        </div>
      </div>


    </div>
  )
} 