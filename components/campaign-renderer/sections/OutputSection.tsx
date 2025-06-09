'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Share2, CheckCircle } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { getAITestResults, replaceVariablesWithTestData } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractResponseValue } from '@/lib/utils/section-variables'

/**
 * Replace variables in content with provided variable values
 */
function replaceVariablesInContent(
  text: string, 
  variables: Record<string, any>,
  fallbackText: string = 'placeholder'
): string {
  return text.replace(/@(\w+)/g, (match, variableName) => {
    const value = variables[variableName]
    
    if (value !== undefined && value !== null && value !== '') {
      return String(value)
    }
    
    // Return original @variable if no data or fallback if specified
    return fallbackText === 'placeholder' ? match : fallbackText
  })
}

interface OutputSectionConfig {
  content: string
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
  const [processedContent, setProcessedContent] = useState<string>('')
  const [availableVariables, setAvailableVariables] = useState<Record<string, any>>({})

  const outputConfig = config as OutputSectionConfig

  // Build complete variable map
  const variableMap = useMemo(() => {
    const map: Record<string, any> = {}
    
    // Add input variables from question sections
    const questionSections = sections.filter(s => 
      isQuestionSection(s.type) && s.title
    )
    
    questionSections.forEach(sec => {
      if (sec.title) {
        const variableName = titleToVariableName(sec.title)
        const response = userInputs[sec.id]
        
        if (response) {
          map[variableName] = extractResponseValue(response, sec)
        }
      }
    })
    
    // Add AI output variables from stored results
    const aiResults = getAITestResults()
    if (aiResults) {
      Object.entries(aiResults).forEach(([key, value]) => {
        map[key] = value
      })
    }
    
    return map
  }, [sections, userInputs])

  // Interpolate variables in content
  const interpolatedContent = useMemo(() => {
    let content = outputConfig?.content || ''
    
    // Replace @variable with actual values
    Object.entries(variableMap).forEach(([variable, value]) => {
      const regex = new RegExp(`@${variable}\\b`, 'g')
      content = content.replace(regex, String(value))
    })
    
    return content
  }, [outputConfig?.content, variableMap])

  // Parse content for basic formatting (you can enhance this)
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Handle basic markdown-like formatting
        let formattedLine = line
        
        // Bold text: **text**
        formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Italic text: *text*
        formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        return (
          <div key={index} className="mb-2">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </div>
        )
      })
  }

  useEffect(() => {
    // Build complete content from all available fields
    let fullContent = ''
    
    if (title) {
      fullContent += `<h1 class="text-4xl font-bold mb-4">${title}</h1>`
    }
    
    if (description) {
      fullContent += `<p class="text-xl text-gray-600 mb-6">${description}</p>`
    }
    
    if (outputConfig?.content) {
      fullContent += `<div class="text-lg leading-relaxed">${outputConfig.content.replace(/\n/g, '<br>')}</div>`
    }
    
    // Process content with variables if any content exists
    if (fullContent) {
      const processed = replaceVariablesInContent(fullContent, variableMap, 'Not available')
      setProcessedContent(processed)
    } else {
      // Create fallback content showing all available variables
      const fallbackContent = createFallbackContent(variableMap)
      setProcessedContent(fallbackContent)
    }
  }, [title, description, outputConfig?.content, variableMap])

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

     if (!outputConfig?.content) {
     return (
       <div className="p-8 text-center text-gray-500">
         <p>No output content configured</p>
         <p className="text-sm mt-2">Configure this section in the campaign builder</p>
       </div>
     )
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
                {JSON.stringify(variableMap, null, 2)}
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