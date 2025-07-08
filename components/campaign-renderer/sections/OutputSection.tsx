'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Copy, CheckCircle, RotateCcw } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { getMobileClasses } from '../utils'
import { cn } from '@/lib/utils'
import { getAITestResults, clearAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection, extractResponseValue, buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { toast } from '@/components/ui/use-toast'
import { SectionNavigationBar } from '../SectionNavigationBar'




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
  onNavigateToSection,
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
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link copied to clipboard!',
        description: 'Share this link with friends to show your personalized results.',
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Unable to copy link',
        description: 'Please copy the URL from your browser address bar to share.',
        variant: 'destructive'
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleTryAgain = () => {
    // Clear all cached AI results
    clearAITestResults()
    
    // Show feedback toast
    toast({
      title: 'Starting over!',
      description: 'All results have been cleared. Redirecting to the beginning...',
    })
    
    // Navigate back to the first section (index 0)
    if (onNavigateToSection) {
      setTimeout(() => {
        onNavigateToSection(0)
      }, 500) // Small delay to let user see the toast
    }
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
        {/* Main Content - Enhanced layout like builder preview */}
        <div className="flex-1 px-6 py-12 pb-20">
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
                <h1 className={cn(
                  "font-bold text-foreground",
                  deviceInfo?.type === 'mobile' ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
                )}>
                  {simpleVariableReplace(settings.title, variableMap)}
                </h1>
              )}
              
              {settings.subtitle && (
                <div className={cn(
                     "text-muted-foreground max-w-3xl",
                     settings.textAlignment === 'center' ? "mx-auto" : "",
                     deviceInfo?.type === 'mobile' ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                )}>
                     {simpleVariableReplace(settings.subtitle, variableMap)}
                   </div>
              )}
              </div>

            {settings.content && (
                             <div className={cn(
                 "text-foreground max-w-4xl leading-relaxed",
                 settings.textAlignment === 'center' ? "mx-auto" : "",
                 deviceInfo?.type === 'mobile' ? "text-base" : "text-lg"
                )}>
                 {simpleVariableReplace(settings.content, variableMap).split('\n').map((line, i) => (
                   <div key={i} className="mb-2">{line}</div>
                 ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Bottom Navigation Bar with Action Buttons */}
      <SectionNavigationBar
        onPrevious={onPrevious}
        actionButtons={[
          {
            label: isSharing ? 'Copying...' : 'Share',
            onClick: handleShare,
            disabled: isSharing,
            variant: 'secondary' as const,
            icon: <Copy className="h-4 w-4" />
          },
          {
            label: 'Try Again',
            onClick: handleTryAgain,
            variant: 'primary' as const,
            icon: <RotateCcw className="h-4 w-4" />
          }
        ]}
        deviceInfo={deviceInfo}
      />
    </div>
  )
} 