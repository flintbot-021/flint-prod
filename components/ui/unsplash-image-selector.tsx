'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Search, ChevronRight, Upload, Check, X } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'

interface UnsplashImage {
  id: string
  urls: {
    small: string
    regular: string
    full: string
  }
  alt_description: string | null
  user: {
    name: string
  }
}

interface UnsplashImageSelectorProps {
  onImageSelect: (imageUrl: string) => void
  onUpload?: (files: FileList) => void
  currentImage?: string
  isUploading?: boolean
  className?: string
  placeholder?: string
}

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY

export function UnsplashImageSelector({
  onImageSelect,
  onUpload,
  currentImage,
  isUploading = false,
  className,
  placeholder = "Search for images..."
}: UnsplashImageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [images, setImages] = useState<UnsplashImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Search Unsplash images
  const searchImages = useCallback(async (query: string) => {
    if (!query.trim() || !UNSPLASH_ACCESS_KEY) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setImages(data.results || [])
        setCurrentIndex(0)
        if (data.results?.length > 0) {
          setSelectedImage(data.results[0].urls.regular)
        }
      }
    } catch (error) {
      console.error('Unsplash search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    searchImages(searchQuery)
  }, [searchQuery, searchImages])

  // Go to next image
  const handleNext = useCallback(() => {
    if (images.length === 0) return
    const nextIndex = (currentIndex + 1) % images.length
    setCurrentIndex(nextIndex)
    setSelectedImage(images[nextIndex].urls.regular)
  }, [images, currentIndex])

  // Confirm image selection
  const handleConfirmSelection = useCallback(() => {
    if (selectedImage) {
      onImageSelect(selectedImage)
    }
  }, [selectedImage, onImageSelect])

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onUpload) {
      onUpload(e.target.files)
      setShowUpload(false)
    }
  }, [onUpload])

  // Current image to display
  const currentDisplayImage = selectedImage || (images[currentIndex]?.urls?.regular)

  if (!UNSPLASH_ACCESS_KEY) {
    // Fallback to upload only if no Unsplash key
    return (
      <div className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-gray-400">Section Image</label>
        {currentImage ? (
          <div className="relative group">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img 
                src={currentImage}
                alt="Section image"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className="text-center space-y-2 text-white">
                  <Upload className="h-6 w-6 mx-auto" />
                  <p className="text-sm font-medium">Change image</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
            <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">
                {isUploading ? 'Uploading...' : 'Click to upload image'}
              </p>
              <p className="text-xs">PNG, JPG up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <label className="block text-sm font-medium text-gray-400">Section Image</label>
      
      {!showUpload ? (
        <div className="space-y-4">
          {/* Main Image Area */}
          <div className="relative">
            {(currentDisplayImage || currentImage) ? (
              <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <img 
                  src={currentDisplayImage || currentImage}
                  alt="Selected image"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute inset-0 flex items-center justify-center space-x-3">
                    {selectedImage && selectedImage !== currentImage && (
                      <Button
                        onClick={handleConfirmSelection}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Use This Image
                      </Button>
                    )}
                    
                    {currentImage && (
                      <button
                        onClick={() => onImageSelect('')}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Browse Controls */}
                  {images.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="text-sm bg-black/30 px-2 py-1 rounded">
                        {currentIndex + 1} of {images.length}
                        {images[currentIndex] && (
                          <span className="block text-xs opacity-75">by {images[currentIndex].user.name}</span>
                        )}
                      </div>
                      <Button 
                        onClick={handleNext}
                        variant="secondary" 
                        size="sm"
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State - Hero-style placeholder */
              <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-1">Search for images</p>
                <p className="text-sm text-gray-500">Find the perfect image from Unsplash</p>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-0 border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="rounded-none border-0 px-4 bg-gray-900 hover:bg-gray-800"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Upload Option */}
            <div className="text-center">
              <button
                onClick={() => setShowUpload(true)}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
              >
                or upload your own image
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upload Interface */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
            />
            <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors bg-gray-50">
              <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600 mb-1">
                {isUploading ? 'Uploading...' : 'Click to upload image'}
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setShowUpload(false)}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
            >
              ← Back to search images
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 