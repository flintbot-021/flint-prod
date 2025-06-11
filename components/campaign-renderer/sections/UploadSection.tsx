'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X, CheckCircle, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { SectionNavigationBar } from '../SectionNavigationBar'

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
  onResponseUpdate
}: SectionRendererProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
  const maxFileSize = configData.maxFileSize || 10 * 1024 * 1024 // 10MB default

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

  const handleFileSelection = (files: FileList) => {
    setErrorMessage(null)
    const { valid, errors } = validateFiles(files)

    if (errors.length > 0) {
      setErrorMessage(errors.join('. '))
      setUploadStatus('error')
      return
    }

    if (valid.length > 0) {
      if (allowMultiple) {
        setUploadedFiles(prev => [...prev, ...valid])
      } else {
        setUploadedFiles(valid)
      }
      setUploadStatus('success')
      
      // Report to parent component
      onResponseUpdate(section.id, 'files', valid, {
        inputType: 'file_upload',
        isRequired: isRequired,
        fileCount: valid.length
      })
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    
    if (newFiles.length === 0) {
      setUploadStatus('idle')
    }
    
    // Update parent component
    onResponseUpdate(section.id, 'files', newFiles, {
      inputType: 'file_upload',
      isRequired: isRequired,
      fileCount: newFiles.length
    })
  }

  const handleContinue = () => {
    if (isRequired && uploadedFiles.length === 0) {
      return
    }

    onSectionComplete(index, {
      [section.id]: uploadedFiles,
      files_uploaded: uploadedFiles.length
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

  const canContinue = !isRequired || uploadedFiles.length > 0

  // Generate validation text for bottom bar
  const validationText = isRequired && uploadedFiles.length === 0 ? 'Please upload at least one file to continue' : undefined

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl lg:text-4xl"
            )}>
              {headline}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className={cn(
                "text-muted-foreground max-w-lg mx-auto",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {subheading}
              </p>
            )}
          </div>

          {/* Upload Card */}
          <Card className="border-2 border-dashed transition-all duration-200 hover:border-primary/50">
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
                    ? "bg-green-100 dark:bg-green-900/20" 
                    : uploadStatus === 'error'
                    ? "bg-destructive/10"
                    : isDragging
                    ? "bg-primary/10"
                    : "bg-muted"
                )}>
                  {uploadStatus === 'success' ? (
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                      ? "text-green-600 dark:text-green-400"
                      : isDragging 
                      ? "text-primary"
                      : "text-foreground"
                  )}>
                    {uploadStatus === 'success' 
                      ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} uploaded successfully`
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
          {uploadedFiles.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  Uploaded Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
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