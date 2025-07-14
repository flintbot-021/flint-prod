'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, Share2, RotateCcw } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses, getCampaignTheme, getCampaignButtonStyles, getCampaignTextColor } from '../utils'
import { cn } from '@/lib/utils'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractResponseValue, buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { useToast } from '@/components/ui/use-toast'

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
  onNavigateToSection,
  userInputs = {},
  sections = [],
  campaign,
  ...props
}: SectionRendererProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

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

  // Find the previous non-AI logic section
  const handlePreviousSkipLogic = () => {
    if (!sections || sections.length === 0) {
      onPrevious()
      return
    }

    // Find the previous section that is not an AI logic section
    for (let i = index - 1; i >= 0; i--) {
      if (sections[i].type !== 'logic') {
        if (onNavigateToSection) {
          onNavigateToSection(i)
        }
        return
      }
    }
    
    // If no non-logic section found, just use regular previous
    onPrevious()
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      // Copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href)
      
      // Show toast notification
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this link with others",
      })
      
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the URL manually",
        variant: "destructive"
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleTryAgain = () => {
    // Clear any cached data/AI results
    if (typeof window !== 'undefined') {
      // Clear AI test results
      localStorage.removeItem('ai_test_results')
      // Clear any other cached data if needed
    }
    
    // Navigate back to the start (section 0)
    if (onNavigateToSection) {
      onNavigateToSection(0)
    }
  }

  // Get campaign theme colors
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  const primaryButtonStyle = getCampaignButtonStyles(campaign, 'primary')
  const secondaryButtonStyle = getCampaignButtonStyles(campaign, 'secondary')

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
    <div 
      className="h-full flex flex-col pb-20"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Main Content */}
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
                    "font-bold",
                    deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
                  )}
                  style={primaryTextStyle}
                  dangerouslySetInnerHTML={{ 
                    __html: simpleVariableReplace(settings.title, variableMap).replace(/\n/g, '<br>') 
                  }}
                />
              )}
              
              {settings.subtitle && (
                <div 
                  className={cn(
                    "max-w-3xl",
                    settings.textAlignment === 'center' ? "mx-auto" : "",
                    deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                  )}
                  style={mutedTextStyle}
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
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={handlePreviousSkipLogic}
            className={cn(
              "flex items-center px-4 py-2 text-muted-foreground hover:text-foreground transition-colors",
              getMobileClasses("min-h-[44px]", deviceInfo?.type)
            )}
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2",
                getMobileClasses("min-h-[44px]", deviceInfo?.type)
              )}
              style={secondaryButtonStyle}
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Try Again Button */}
            <button
              onClick={handleTryAgain}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-200",
                "flex items-center space-x-2 shadow-lg hover:shadow-xl",
                getMobileClasses("min-h-[44px]", deviceInfo?.type)
              )}
              style={primaryButtonStyle}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 