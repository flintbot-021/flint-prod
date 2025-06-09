'use client'

import React, { useState } from 'react'
import { ChevronLeft, Download, Share2, CheckCircle, Sparkles } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'

export function OutputSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete
}: SectionRendererProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'My Results',
          text: description || 'Check out my personalized results!',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleComplete = () => {
    onSectionComplete(index, {
      [section.id]: 'completed',
      output_viewed: true
    })
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
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-muted-foreground">Results</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Success Banner */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className={cn(
              "font-bold text-foreground mb-4",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {title || 'Your Personalized Results'}
            </h1>
            
            {description && (
              <p className={cn(
                "text-muted-foreground mb-6",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Results Content */}
          <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
            <div className="prose prose-lg max-w-none">
              {config.content ? (
                <div dangerouslySetInnerHTML={{ __html: config.content }} />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Your results will be displayed here.</p>
                  <p className="text-sm mt-2">Content will be generated based on your responses.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2 border border-border",
                "bg-white hover:bg-gray-50 text-gray-700",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>{isSharing ? 'Sharing...' : 'Share Results'}</span>
            </button>

            <button
              onClick={handleComplete}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <Download className="h-4 w-4" />
              <span>Save Results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 