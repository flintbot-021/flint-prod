'use client'

import React, { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Upload, File, Image, FileAudio, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { uploadFiles, UploadedFileInfo, UploadProgress, ensureStorageBucket } from '@/lib/supabase/storage'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadProgress?: number
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Get settings with defaults
  const settings = config as UploadSettings
  const {
    content = 'Upload your files',
    subheading = '',
    allowImages = true,
    allowDocuments = true,
    allowAudio = false,
    allowVideo = false,
    maxFileSize = 10, // 10MB default
    maxFiles = 5,
    required = false,
    buttonLabel = 'Continue'
  } = settings

  const headline = content || title || 'Upload your files'
  const isRequired = required
  const isValid = !isRequired || uploadedFiles.length > 0

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

  // Helper function to check if file type is allowed
  const isFileTypeAllowed = (file: File): boolean => {
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

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return

    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles = fileArray.filter(file => {
      // Check file type
      if (!isFileTypeAllowed(file)) {
        setUploadError(`File type ${file.type} is not allowed`)
        return false
      }
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setUploadError(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`)
        return false
      }
      
      return true
    })

    if (!validFiles.length) return

    setUploadError(null)
    setIsUploading(true)
    
    try {
      // Ensure storage bucket exists
      await ensureStorageBucket()
      
      // Use campaignId from props, fallback to demo for preview
      const actualCampaignId = campaignId || 'preview-campaign'
      const leadId = 'preview-lead' // This will be set properly when lead system is integrated
      
      const uploadedFileInfos = await uploadFiles(
        validFiles,
        actualCampaignId,
        section.id, // sectionId
        leadId,
        undefined, // responseId - will be set when response is created
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [progress.fileId]: progress
          }))
        }
      )
      
      const newFiles = [...uploadedFiles, ...uploadedFileInfos]
      setUploadedFiles(newFiles)
      
      // Update response
      onResponseUpdate(section.id, 'files', newFiles, {
        inputType: 'file_upload',
        isRequired: isRequired,
        fileCount: newFiles.length,
        totalSize: newFiles.reduce((sum, file) => sum + file.size, 0)
      })
      
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }, [uploadedFiles, maxFiles, maxFileSize, isRequired, section.id, onResponseUpdate, allowImages, allowDocuments, allowAudio, allowVideo])

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
    const newFiles = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(newFiles)
    
    // Update response
    onResponseUpdate(section.id, 'files', newFiles, {
      inputType: 'file_upload',
      isRequired: isRequired,
      fileCount: newFiles.length,
      totalSize: newFiles.reduce((sum, file) => sum + file.size, 0)
    })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = () => {
    if (isRequired && uploadedFiles.length === 0) return
    
    const submissionData = {
      [section.id]: uploadedFiles,
      files: uploadedFiles,
      fileCount: uploadedFiles.length,
      totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
    }

    console.log('📁 FILE UPLOAD SUBMISSION:')
    console.log('  Section ID:', section.id)
    console.log('  Section Title:', section.title)
    console.log('  Uploaded Files:', uploadedFiles)
    console.log('  Submission Data:', submissionData)
    console.log('  Section Index:', index)

    onSectionComplete(index, submissionData)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={onPrevious}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <span className="text-sm text-muted-foreground">Upload {index + 1}</span>
        </div>
      </div>

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
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragOver 
                  ? "border-blue-500 bg-blue-50/10" 
                  : "border-gray-300 hover:border-gray-400 bg-gray-50/50",
                getMobileClasses("", deviceInfo?.type)
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className={cn(
                  "text-gray-600",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}>
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
                <div className="text-xs text-gray-500 space-y-1">
                  {allowImages && <p>Images: JPG, PNG, GIF, etc.</p>}
                  {allowDocuments && <p>Documents: PDF, DOC, TXT, etc.</p>}
                  {allowAudio && <p>Audio: MP3, WAV, etc.</p>}
                  {allowVideo && <p>Video: MP4, AVI, etc.</p>}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Uploaded Files ({uploadedFiles.length}/{maxFiles})
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Uploading files...</span>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!isValid || isUploading}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                getMobileClasses("", deviceInfo?.type),
                isValid && !isUploading
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>{buttonLabel}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 