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

interface UploadQuestionProps {
  section: CampaignSection
  campaignId: string
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

interface UploadSettings {
  content?: string
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
  className 
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
    content = '',
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
  const handleContentChange = async (newContent: string) => {
    await updateSettings({ content: newContent })
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
      // Check file type
      if (!isFileTypeAllowed(file, settings)) {
        alert(`File type ${file.type} is not allowed`)
        return false
      }
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`)
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
    
    if (allowImages && file.type.startsWith('image/')) return true
    if (allowDocuments && (
      file.type === 'application/pdf' ||
      file.type.includes('document') ||
      file.type === 'text/plain' ||
      file.type.includes('sheet') ||
      file.type.includes('presentation')
    )) return true
    if (allowAudio && file.type.startsWith('audio/')) return true
    if (allowVideo && file.type.startsWith('video/')) return true
    
    return false
  }

  if (isPreview) {
    // Preview Mode - Show file upload interface
    return (
      <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
        <div className="space-y-6">
          {/* Question Text */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {content || 'Upload your files'}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className="text-xl text-gray-600">
                {subheading}
              </p>
            )}
          </div>

          {/* Upload Area */}
          <div className="space-y-4">
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
                <p className="text-sm text-gray-500">
                  Maximum {maxFiles} files, {maxFileSize}MB each
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  {allowImages && <p>Images: JPG, PNG, GIF, etc.</p>}
                  {allowDocuments && <p>Documents: PDF, DOC, TXT, etc.</p>}
                  {allowAudio && <p>Audio: MP3, WAV, etc.</p>}
                  {allowVideo && <p>Video: MP4, AVI, etc.</p>}
                </div>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">Uploaded Files ({uploadedFiles.length})</h3>
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
                <div className="inline-flex items-center space-x-2 text-blue-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Uploading files...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Edit Mode - Configuration interface
  return (
    <div className={cn('py-16 px-6 max-w-2xl mx-auto space-y-6', className)}>
      {/* Main Question - Large, center-aligned */}
      <div className="text-center">
        <InlineEditableText
          value={content}
          onSave={handleContentChange}
          variant="body"
          placeholder="Upload your files"
          className="text-4xl font-bold text-gray-400 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-4xl !font-bold !text-gray-400 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Subheading */}
      <div className="text-center">
        <InlineEditableText
          value={subheading}
          onSave={handleSubheadingChange}
          variant="body"
          placeholder="Type sub heading here"
          className="text-xl text-gray-500 text-center block w-full hover:bg-transparent rounded-none px-0 py-0 mx-0 my-0"
          inputClassName="!text-xl !text-gray-500 text-center !border-0 !border-none !bg-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 focus:!border-0 focus:!border-none focus:!bg-transparent focus:!shadow-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!border-none focus-visible:!bg-transparent focus-visible:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          showEditIcon={false}
          showSaveStatus={false}
          multiline={false}
          autoSave={false}
        />
      </div>

      {/* Upload Configuration */}
      <div className="space-y-6 pt-6">
        {/* File Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Allowed File Types</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Images</span>
              </div>
              <Switch
                checked={allowImages}
                onCheckedChange={(checked) => handleSettingChange('allowImages', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Documents</span>
              </div>
              <Switch
                checked={allowDocuments}
                onCheckedChange={(checked) => handleSettingChange('allowDocuments', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileAudio className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Audio</span>
              </div>
              <Switch
                checked={allowAudio}
                onCheckedChange={(checked) => handleSettingChange('allowAudio', checked)}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Video</span>
              </div>
              <Switch
                checked={allowVideo}
                onCheckedChange={(checked) => handleSettingChange('allowVideo', checked)}
                className="scale-75"
              />
            </div>
          </div>
        </div>

        {/* Upload Limits */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300">Upload Limits</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Max File Size (MB)</Label>
              <select
                value={maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value={1}>1 MB</option>
                <option value={5}>5 MB</option>
                <option value={10}>10 MB</option>
                <option value={25}>25 MB</option>
                <option value={50}>50 MB</option>
                <option value={100}>100 MB</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Max Number of Files</Label>
              <select
                value={maxFiles}
                onChange={(e) => handleSettingChange('maxFiles', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value={1}>1 file</option>
                <option value={3}>3 files</option>
                <option value={5}>5 files</option>
                <option value={10}>10 files</option>
                <option value={20}>20 files</option>
              </select>
            </div>
          </div>
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