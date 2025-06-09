'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'

export function InfoSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete
}: SectionRendererProps) {
  const handleContinue = () => {
    onSectionComplete(index, {
      [section.id]: 'viewed',
      info_viewed: true
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
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-muted-foreground">Information</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {title || 'Information'}
            </h1>
            
            {description && (
              <div className={cn(
                "text-muted-foreground prose prose-lg max-w-none",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                <div dangerouslySetInnerHTML={{ __html: description }} />
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              className={cn(
                "px-8 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 