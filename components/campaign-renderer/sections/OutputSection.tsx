'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Share2, CheckCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { getAITestResults, replaceVariablesWithTestData } from '@/lib/utils/ai-test-storage'

export function OutputSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onPrevious,
  onSectionComplete,
  userInputs = {}
}: SectionRendererProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [processedContent, setProcessedContent] = useState<string>('')
  const [availableVariables, setAvailableVariables] = useState<Record<string, any>>({})

  useEffect(() => {
    // Get AI-generated variables and user inputs
    const aiResults = getAITestResults()
    const allVariables = { ...userInputs, ...aiResults }
    
    console.log('🎯 OutputSection - Available variables:', allVariables)
    console.log('🔍 Full section object:', section)
    console.log('🔍 Full config object:', config)
    console.log('🔍 Section configuration:', section.configuration)
    
    setAvailableVariables(allVariables)
    
    // Extract content from section configuration (database format)
    const configuration = section.configuration as any
    const outputTitle = configuration?.title || config.title || title
    const outputSubtitle = configuration?.subtitle || config.subtitle 
    const outputContent = configuration?.content || config.content
    
    console.log('📄 Extracted title:', outputTitle)
    console.log('📄 Extracted subtitle:', outputSubtitle)
    console.log('📄 Extracted content:', outputContent)
    
    // Build complete content from all available fields
    let fullContent = ''
    
    if (outputTitle) {
      fullContent += `<h1 class="text-4xl font-bold mb-4">${outputTitle}</h1>`
    }
    
    if (outputSubtitle) {
      fullContent += `<p class="text-xl text-gray-600 mb-6">${outputSubtitle}</p>`
    }
    
    if (outputContent) {
      fullContent += `<div class="text-lg leading-relaxed">${outputContent.replace(/\n/g, '<br>')}</div>`
    }
    
    console.log('📝 Full content to process:', fullContent)
    
    // Process content with variables if any content exists
    if (fullContent) {
      const processed = replaceVariablesWithTestData(fullContent, 'Not available')
      console.log('✨ Processed content:', processed)
      setProcessedContent(processed)
    } else {
      // Create fallback content showing all available variables
      const fallbackContent = createFallbackContent(allVariables)
      setProcessedContent(fallbackContent)
    }
  }, [section.configuration, config, title, userInputs])

  const createFallbackContent = (variables: Record<string, any>) => {
    if (Object.keys(variables).length === 0) {
      return '<p>No data available to display.</p>'
    }

    const variableList = Object.entries(variables)
      .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `<div class="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-semibold text-gray-900 mb-2">${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</h3>
        <p class="text-gray-700">${value}</p>
      </div>`)
      .join('')

    return `
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Your Personalized Results</h2>
        ${variableList}
      </div>
    `
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Main Content - same structure as other sections */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Main Content Display */}
          <div className="text-center space-y-6">
            {processedContent ? (
              <div className={cn(
                "text-foreground prose prose-lg max-w-none",
                deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
              )}>
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <h1 className={cn(
                  "font-bold text-foreground mb-4",
                  deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
                )}>
                  Loading Results...
                </h1>
                <p className="text-sm">Processing your responses and AI-generated content.</p>
              </div>
            )}
          </div>

          {/* Debug Info (only in preview) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                🔍 Debug: Available Variables
              </summary>
              <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(availableVariables, null, 2)}
              </pre>
            </details>
          )}

          {/* Action Buttons - same style as other sections */}
          <div className="flex justify-center space-x-3">
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