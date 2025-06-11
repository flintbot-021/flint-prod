'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, X, CheckCircle } from 'lucide-react'
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
      setErrorMessage('Please upload at least one file to continue')
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

  return (
    <div className="h-full bg-background flex flex-col pb-20">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {headline}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h1>
            
            {subheading && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {subheading}
              </p>
            )}
          </div>

          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging 
                ? "border-blue-500 bg-blue-50" 
                : uploadStatus === 'success'
                ? "border-green-500 bg-green-50"
                : uploadStatus === 'error'
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedTypes}
              multiple={allowMultiple}
              onChange={handleFileInputChange}
            />

            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : uploadStatus === 'error' ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploadStatus === 'success' 
                    ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} uploaded`
                    : isDragging 
                    ? "Drop your files here"
                    : "Drag and drop your files here, or click to browse"
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {allowedTypes.map((type: SupportedFileType) => type.description).join(', ')} up to {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
                </p>
                {allowMultiple && (
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum {maxFiles} files
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Uploaded Files:</h3>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Navigation Bar */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        icon={<Upload className="h-5 w-5 text-primary" />}
        label={`Upload ${index + 1}`}
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