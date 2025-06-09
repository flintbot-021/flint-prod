'use client'

import React, { useEffect } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'

export function LogicSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onSectionComplete
}: SectionRendererProps) {

  useEffect(() => {
    // Auto-complete logic sections after a brief delay
    const timer = setTimeout(() => {
      onSectionComplete(index, {
        [section.id]: 'processed',
        logic_processed: true
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [index, section.id, onSectionComplete])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Zap className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
            
            <h1 className={cn(
              "font-bold text-foreground",
              deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
            )}>
              {title || 'Processing...'}
            </h1>
            
            {description && (
              <p className={cn(
                "text-muted-foreground",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-muted-foreground">
              Analyzing your responses...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 