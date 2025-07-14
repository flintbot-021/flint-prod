'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X, CheckCircle, File, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor, getCampaignButtonStyles } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { uploadFiles, UploadedFileInfo, UploadProgress } from '@/lib/supabase/storage'
import { createClient } from '@/lib/supabase/client'

// Type for supported file types
interface SupportedFileType {
  type: string
  extensions: string[]
  maxSize: number // in bytes
  description: string
}

// Default supported file types
const DEFAULT_FILE_TYPES: SupportedFileType[] = [
  {
    type: 'document',
    extensions: ['pdf', 'doc', 'docx'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'PDF, Word documents'
  },
  {
    type: 'image',
    extensions: ['jpg', 'jpeg', 'png', 'gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Images (JPG, PNG, GIF)'
  }
]

export function UploadSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  campaignId,
  onPrevious,
  onSectionComplete,
  onResponseUpdate,
  userInputs,
  campaign
}: SectionRendererProps) {
  const supabase = createClient()
  
  // Initialize with existing uploaded files if available
  // Note: userInputs contains stored file metadata, not actual File objects
  const existingFileData = userInputs?.[section.id] || []
  const hasExistingFiles = Array.isArray(existingFileData) && existingFileData.length > 0
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const [existingFileMetadata, setExistingFileMetadata] = useState<UploadedFileInfo[]>(hasExistingFiles ? existingFileData : [])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    hasExistingFiles ? 'success' : 'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get configuration
  const configData = config as any
  const headline = configData.content || configData.question || title || 'Upload your file'
  const subheading = configData.subheading || description
  const isRequired = configData.required ?? true
  const buttonLabel = configData.buttonText || config.buttonLabel || 'Continue'
  const allowMultiple = configData.allowMultiple ?? false
  const maxFiles = configData.maxFiles || 1
  
  // File type configuration
  const allowedTypes = configData.allowedTypes || DEFAULT_FILE_TYPES
  const maxFileSize = Math.max(configData.maxFileSize || 10 * 1024 * 1024, 1024 * 1024) // Minimum 1MB, default 10MB

  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  const primaryButtonStyle = getCampaignButtonStyles(campaign, 'primary')

  // Validation functions
  const isFileTypeAllowed = (file: File): boolean => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    return allowedTypes.some((type: SupportedFileType) => 
      type.extensions.includes(fileExtension || '')
    )
  }

  const isFileSizeValid = (file: File): boolean => {
    return file.size <= maxFileSize
  }

  const validateFiles = (files: FileList): { valid: File[], errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    // Check file count
    if (!allowMultiple && files.length > 1) {
      errors.push('Only one file is allowed')
      return { valid: [files[0]], errors }
    }

    if (allowMultiple && files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
    }

    Array.from(files).slice(0, maxFiles).forEach(file => {
      if (!isFileTypeAllowed(file)) {
        errors.push(`${file.name}: File type not supported`)
        return
      }
      
      if (!isFileSizeValid(file)) {
        const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
        errors.push(`${file.name}: File size exceeds ${sizeMB}MB limit`)
        return
      }

      valid.push(file)
    })

    return { valid, errors }
  }

  // Event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files)
    }
  }

  const handleFileSelection = async (files: FileList) => {
    setErrorMessage(null)
    setIsUploading(true)
    setUploadStatus('uploading')
    
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setErrorMessage(errors.join('. '))
      setUploadStatus('error')
      setIsUploading(false)
      return
    }

    if (valid.length > 0) {
      try {
        console.log('📁 Uploading files to storage:', valid.map(f => f.name))
        
        // Upload files to Supabase storage
        const uploadedFileInfos = await uploadFiles(
          valid,
          campaignId || 'preview-campaign',
          section.id, // sectionId
          undefined, // leadId (optional)
          undefined, // responseId (optional)
          (progress: UploadProgress) => {
            setUploadProgress(prev => ({
              ...prev,
              [progress.fileId]: progress
            }))
          },
          supabase
        )
        
        console.log('✅ Files uploaded successfully:', uploadedFileInfos)
        
        // Add uploaded files to state
      if (allowMultiple) {
          setUploadedFiles(prev => [...prev, ...uploadedFileInfos])
      } else {
          setUploadedFiles(uploadedFileInfos)
      }
        
      setUploadStatus('success')
      
        // Report to parent component - combine existing and new files
        const allFiles = [...existingFileMetadata, ...uploadedFileInfos]
        onResponseUpdate(section.id, 'files', allFiles, {
          inputType: 'file_upload',
          isRequired: isRequired,
          fileCount: allFiles.length
        })
        
      } catch (error) {
        console.error('❌ File upload failed:', error)
        setErrorMessage('Upload failed. Please try again.')
        setUploadStatus('error')
      }
    }
    
    setIsUploading(false)
    setUploadProgress({})
  }

  const removeFile = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      // Remove from existing file metadata
      const newExistingFiles = existingFileMetadata.filter((_, i) => i !== index)
      setExistingFileMetadata(newExistingFiles)
      
      // Update status
      const totalFiles = newExistingFiles.length + uploadedFiles.length
      if (totalFiles === 0) {
        setUploadStatus('idle')
      }
      
      // Update parent component
      const allFiles = [...newExistingFiles, ...uploadedFiles]
      onResponseUpdate(section.id, 'files', allFiles, {
        inputType: 'file_upload',
        isRequired: isRequired,
        fileCount: allFiles.length
      })
    } else {
      // Remove from newly uploaded files
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    
      // Update status
      const totalFiles = existingFileMetadata.length + newFiles.length
      if (totalFiles === 0) {
      setUploadStatus('idle')
    }
    
    // Update parent component
      const allFiles = [...existingFileMetadata, ...newFiles]
      onResponseUpdate(section.id, 'files', allFiles, {
      inputType: 'file_upload',
      isRequired: isRequired,
        fileCount: allFiles.length
    })
    }
  }

  const handleContinue = () => {
    const totalFiles = existingFileMetadata.length + uploadedFiles.length
    if (isRequired && totalFiles === 0) {
      return
    }

    // Combine existing and new files for response
    const allFiles = [...existingFileMetadata, ...uploadedFiles]
    onSectionComplete(index, {
      [section.id]: allFiles,
      files_uploaded: totalFiles
    })
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Generate accepted file types for input
  const acceptedTypes = allowedTypes
    .flatMap((type: SupportedFileType) => type.extensions.map(ext => `.${ext}`))
    .join(',')

  const totalFiles = existingFileMetadata.length + uploadedFiles.length
  const canContinue = !isRequired || totalFiles > 0

  // Generate validation text for bottom bar
  const validationText = isRequired && totalFiles === 0 ? 'Please upload at least one file to continue' : undefined

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 
              className={cn(
                "font-bold",
                deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl lg:text-4xl"
              )}
              style={primaryTextStyle}
            >
              {headline}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p 
                className={cn(
                  "max-w-lg mx-auto",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}
                style={mutedTextStyle}
              >
                {subheading}
              </p>
            )}
          </div>

          {/* Upload Card */}
          <Card className={`mt-4 p-4 rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : uploadStatus === 'success'
              ? "bg-green-100"
              : "border-gray-300 hover:border-gray-400"
          }`}>
            <CardContent className="p-8">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedTypes}
                multiple={allowMultiple}
                onChange={handleFileInputChange}
              />

              <div
                className={cn(
                  "text-center space-y-6 cursor-pointer transition-all duration-200",
                  isDragging && "scale-105"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                {/* Upload Icon */}
                <div className={cn(
                  "mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                  uploadStatus === 'success' 
                    ? "bg-green-100" 
                    : uploadStatus === 'uploading'
                    ? "bg-blue-100"
                    : uploadStatus === 'error'
                    ? "bg-destructive/10"
                    : isDragging
                    ? "bg-primary/10"
                    : "bg-muted"
                )}>
                  {uploadStatus === 'uploading' ? (
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  ) : uploadStatus === 'success' ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : uploadStatus === 'error' ? (
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  ) : (
                    <Upload className={cn(
                      "h-8 w-8 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                </div>

                {/* Upload Text */}
                <div className="space-y-2">
                  <p className={cn(
                    "text-lg font-medium transition-colors",
                    uploadStatus === 'success' 
                      ? "text-green-600"
                      : uploadStatus === 'uploading'
                      ? "text-blue-600"
                      : isDragging 
                      ? "text-primary"
                      : "text-foreground"
                  )}>
                    {uploadStatus === 'uploading' 
                      ? "Uploading files..."
                      : uploadStatus === 'success' 
                      ? `${totalFiles} file${totalFiles !== 1 ? 's' : ''} uploaded successfully`
                      : isDragging 
                      ? "Drop your files here"
                      : "Drag and drop your files here"
                    }
                  </p>
                  
                  {uploadStatus !== 'success' && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">or</p>
                      <Button variant="outline" className="pointer-events-none">
                        <File className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                    </div>
                  )}
                </div>

                {/* File Requirements */}
                                  <div className="space-y-2">
                    <div className="flex flex-wrap justify-center gap-2">
                      {allowedTypes.map((type: SupportedFileType, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type.description}
                        </Badge>
                      ))}
                    <Badge variant="outline" className="text-xs">
                      Max {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
                    </Badge>
                  </div>
                  
                  {allowMultiple && (
                    <p className="text-xs text-muted-foreground">
                      Upload up to {maxFiles} files
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files List */}
          {totalFiles > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Selected Files ({totalFiles})
                </h3>
                <div className="space-y-3">
                  {/* Existing Files */}
                  {existingFileMetadata.map((fileData, index) => (
                    <div
                      key={`existing-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {fileData.name || `File ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileData.size ? formatFileSize(fileData.size) : 'Previously uploaded'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index, true)
                        }}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Newly Uploaded Files */}
                  {uploadedFiles.map((fileInfo, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {fileInfo.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileInfo.size)} • Uploaded successfully
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index, false)
                        }}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{errorMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Upload className="h-5 w-5" />}
        label={`Upload`}
        validationText={validationText}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !canContinue
        }}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 