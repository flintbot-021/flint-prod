'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X, CheckCircle, File, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getCampaignTheme, getCampaignTextColor, getCampaignButtonStyles, getNextSectionButtonText } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'
import { ComplianceNotice } from '../ComplianceNotice'
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
  campaign,
  sections
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
  const headline = title || 'Upload your file'
  const subheading = description || ''
  const isRequired = configData.required ?? false
  // Use dynamic button text for better UX flow - prioritize smart flow over stored config
  const dynamicButtonText = getNextSectionButtonText(index, sections, 'Continue')
  const storedButtonText = configData.buttonText || config.buttonLabel || 'Continue'
  
  // If our dynamic text is different from default, use it (this means next section is special)
  const buttonLabel = dynamicButtonText !== 'Continue' ? dynamicButtonText : storedButtonText
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
    <div className={cn(
      "h-full flex flex-col",
      deviceInfo?.type === 'mobile' ? "pb-40" : "pb-32"
    )} style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center p-6 pt-20">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 
              className={cn(
                "font-black tracking-tight leading-tight",
                deviceInfo?.type === 'mobile' ? "text-4xl" : "text-5xl lg:text-6xl"
              )}
              style={primaryTextStyle}
            >
              {headline}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p 
                className={cn(
                  "font-medium leading-relaxed max-w-2xl mx-auto",
                  deviceInfo?.type === 'mobile' ? "text-lg" : "text-xl lg:text-2xl"
                )}
                style={mutedTextStyle}
              >
                {subheading}
              </p>
            )}
          </div>

          {/* Upload Card */}
          <div className={cn(
            "p-8 rounded-2xl backdrop-blur-md border-2 border-dashed transition-all duration-300 ease-out",
            "hover:shadow-xl hover:scale-[1.02]",
            isDragging && "scale-[1.02] shadow-2xl",
            uploadStatus === 'success' && "border-opacity-50"
          )}
          style={{
            backgroundColor: isDragging 
              ? 'rgba(59, 130, 246, 0.1)' 
              : uploadStatus === 'success'
              ? `${theme.buttonColor}20`
              : 'rgba(255, 255, 255, 0.08)',
            borderColor: isDragging 
              ? 'rgba(59, 130, 246, 0.5)' 
              : uploadStatus === 'success'
              ? `${theme.buttonColor}80`
              : 'rgba(255, 255, 255, 0.2)',
            boxShadow: isDragging 
              ? '0 12px 40px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
              : uploadStatus === 'success'
              ? `0 12px 40px ${theme.buttonColor}25, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedTypes}
                multiple={allowMultiple}
                onChange={handleFileInputChange}
              />

              {uploadStatus === 'success' ? (
                /* Success State - Clean and Simple */
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-5 w-5" style={{ color: theme.buttonColor }} />
                    <p className="text-sm font-medium" style={{ color: theme.buttonColor }}>
                      {totalFiles} file{totalFiles !== 1 ? 's' : ''} uploaded successfully
                    </p>
                  </div>
                  
                  {/* Show uploaded files inline */}
                  <div className="space-y-2">
                    {/* Existing Files */}
                    {existingFileMetadata.map((fileData, index) => (
                      <div
                        key={`existing-${index}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileData.name || `File ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
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
                          className="flex-shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Newly Uploaded Files */}
                    {uploadedFiles.map((fileInfo, index) => (
                      <div
                        key={`new-${index}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileInfo.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(fileInfo.size)}
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
                          className="flex-shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add more files button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFileDialog}
                    className="text-sm"
                  >
                    Add more files
                  </Button>
                </div>
              ) : (
                /* Upload State - Clean and Simple */
                <div
                  className={cn(
                    "text-center space-y-4 cursor-pointer transition-all duration-200",
                    isDragging && "scale-[1.02]"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                >
                  {/* Upload Icon - Simple and Clean */}
                  {uploadStatus === 'uploading' ? (
                    <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: theme.buttonColor }} />
                  ) : uploadStatus === 'error' ? (
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                  ) : (
                    <Upload className={cn(
                      "h-10 w-10 mx-auto transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}

                  {/* Upload Text - Simplified */}
                  <div className="space-y-2">
                    <p 
                      className="text-base font-medium transition-colors"
                      style={uploadStatus === 'uploading' 
                        ? { color: theme.buttonColor } 
                        : isDragging 
                        ? { color: theme.buttonColor }
                        : primaryTextStyle
                      }
                    >
                      {uploadStatus === 'uploading' 
                        ? "Uploading files..."
                        : isDragging 
                        ? "Drop your files here"
                        : "Drag and drop your files here"
                      }
                    </p>
                    
                    <p className="text-sm" style={mutedTextStyle}>or</p>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        openFileDialog()
                      }}
                    >
                      <File className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>

                  {/* File Requirements - Simplified */}
                  <div className="pt-2 border-t border-dashed border-gray-200">
                    <p className="text-xs text-muted-foreground">
                      {allowedTypes.map((type: SupportedFileType) => type.description).join(', ')} • Max {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
                      {allowMultiple && ` • Up to ${maxFiles} files`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl backdrop-blur-md border" 
                 style={{
                   backgroundColor: 'rgba(239, 68, 68, 0.1)',
                   borderColor: 'rgba(239, 68, 68, 0.3)',
                   boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                 }}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Notice */}
      {campaign && <ComplianceNotice campaign={campaign} currentIndex={index} sections={sections} deviceInfo={deviceInfo} />}

      {/* Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Upload className="h-5 w-5" />}
        label={`Upload`}
        validationText={validationText}
        navigationHints={{
          text: "Drag & drop files or click to browse • Enter to continue • ← → to navigate • Esc to go back"
        }}
        actionButton={{
          label: buttonLabel,
          onClick: handleContinue,
          disabled: !canContinue
        }}
        deviceInfo={deviceInfo}
        campaign={campaign}
      />
    </div>
  )
} 