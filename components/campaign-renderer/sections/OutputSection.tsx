'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Share2, CheckCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractResponseValue, buildVariablesFromInputs } from '@/lib/utils/section-variables'




interface OutputSectionConfig {
  title?: string
  subtitle?: string
  content?: string
  image?: string
  textAlignment?: 'left' | 'center' | 'right'
}

export function OutputSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  userInputs = {},
  sections = [],
  ...props
}: SectionRendererProps) {
  const [isSharing, setIsSharing] = useState(false)

  const outputConfig = config as OutputSectionConfig
  
  // Get settings without fallbacks - only show if actually configured
  const settings = {
    title: outputConfig?.title || title || '',
    subtitle: outputConfig?.subtitle || description || '',
    content: outputConfig?.content || '',
    image: outputConfig?.image || '',
    textAlignment: outputConfig?.textAlignment || 'center'
  }

  // Simple variable replacement fallback function
  const simpleVariableReplace = (text: string, variables: Record<string, any>): string => {
    try {
      if (!text || typeof text !== 'string') return text || ''
      
      let result = text
      Object.entries(variables || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const regex = new RegExp(`@${key}\\b`, 'g')
          result = result.replace(regex, String(value))
        }
      })
      return result
    } catch (error) {
      console.error('Error in simple variable replacement:', error)
      return text || ''
    }
  }

  // Build complete variable map
  const variableMap = useMemo(() => {
    const map: Record<string, any> = {}
    
    // Use the same logic as buildVariablesFromInputs to handle all section types including Multiple Sliders
    const inputVariables = buildVariablesFromInputs(sections, userInputs)
    Object.entries(inputVariables).forEach(([key, value]) => {
      map[key] = value
    })
    
    // Add AI output variables from stored results
    const aiResults = getAITestResults()
    if (aiResults) {
      Object.entries(aiResults).forEach(([key, value]) => {
        map[key] = value
      })
    }
    
    console.log('🎯 OutputSection variableMap:', map)
    
    return map
  }, [sections, userInputs])



  // Get text alignment class
  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left'
      case 'right': return 'text-right'
      case 'center':
      default: return 'text-center'
    }
  }



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

  // Show fallback if no content is configured
  if (!settings.title && !settings.subtitle && !settings.content && !settings.image) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center p-8 text-muted-foreground">
          <h2 className="text-xl font-medium mb-2">No output content configured</h2>
          <p className="text-sm">Configure this section in the campaign builder to display personalized results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header with navigation - same as other sections */}
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
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-muted-foreground">Results</span>
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced layout like builder preview */}
      <div className="flex-1 px-6 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-12">
          {/* Image */}
          {settings.image && (
            <div className="w-full">
              <img 
                src={settings.image}
                alt={settings.title || 'Section image'}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Text Content with Variable Interpolation */}
          <div className={cn('space-y-6', getAlignmentClass(settings.textAlignment))}>
            <div className="space-y-4">
              {settings.title && (
                <h1 
                  className={cn(
                    "font-bold text-foreground",
                    deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: simpleVariableReplace(settings.title, variableMap).replace(/\n/g, '<br>') 
                  }}
                />
              )}
              
              {settings.subtitle && (
                <div 
                  className={cn(
                    "text-muted-foreground max-w-3xl",
                    settings.textAlignment === 'center' ? "mx-auto" : "",
                    deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: simpleVariableReplace(settings.subtitle, variableMap).replace(/\n/g, '<br>') 
                  }}
                />
              )}
              </div>

            {settings.content && (
              <div 
                className={cn(
                  "text-foreground max-w-4xl leading-relaxed",
                  settings.textAlignment === 'center' ? "mx-auto" : "",
                  deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}
                dangerouslySetInnerHTML={{ 
                  __html: simpleVariableReplace(settings.content, variableMap).replace(/\n/g, '<br>') 
                }}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 pt-8">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2 border border-border",
                "bg-background hover:bg-gray-50 text-muted-foreground hover:text-foreground",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>{isSharing ? 'Sharing...' : 'Share'}</span>
            </button>

            <button
              onClick={handleComplete}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
                getMobileClasses("", deviceInfo?.type)
              )}
            >
              <span>Complete</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 