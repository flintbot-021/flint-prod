'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { BaseSectionProps, SectionConfiguration } from './types'
import { processVariableContent, interpolateTextSimple } from './utils'

// Import section components
import {
  CaptureSection,
  TextQuestionSection,
  MultipleChoiceSection,
  SliderSection,
  InfoSection,
  LogicSection,
  OutputSection
} from './sections'

// =============================================================================
// MAIN SECTION RENDERER
// =============================================================================

export function SectionRenderer(props: BaseSectionProps) {
  const { section, index } = props
  const [processedTitle, setProcessedTitle] = useState('')
  const [processedDescription, setProcessedDescription] = useState('')
  const [isProcessingVariables, setIsProcessingVariables] = useState(false)

  // Extract configuration from section
  const config: SectionConfiguration = (section.configuration || {}) as SectionConfiguration

  // Process variables in title and description
  useEffect(() => {
    const processVariables = async () => {
      setIsProcessingVariables(true)
      try {
        // Create a context from current user inputs (passed via props if needed)
        const context = {} // This will be enhanced with actual user inputs later
        
        const title = await processVariableContent(section.title || '', context)
        const description = await processVariableContent(section.description || '', context)
        
        setProcessedTitle(title)
        setProcessedDescription(description)
      } catch (error) {
        console.error('Error processing variables:', error)
        // Fallback to simple interpolation
        setProcessedTitle(interpolateTextSimple(section.title || '', {}))
        setProcessedDescription(interpolateTextSimple(section.description || '', {}))
      } finally {
        setIsProcessingVariables(false)
      }
    }

    processVariables()
  }, [section.title, section.description])

  // Enhanced props with processed content
  const enhancedProps = {
    ...props,
    config,
    title: processedTitle,
    description: processedDescription
  }

  // Route to appropriate section component based on type
  switch (section.type) {
    case 'capture':
      return <CaptureSection {...enhancedProps} />
    
    case 'text_question':
      return <TextQuestionSection {...enhancedProps} />
    
    case 'multiple_choice':
      return <MultipleChoiceSection {...enhancedProps} />
    
    case 'slider':
      return <SliderSection {...enhancedProps} />
    
    case 'info':
      return <InfoSection {...enhancedProps} />
    
    case 'logic':
      return <LogicSection {...enhancedProps} />
    
    case 'output':
      return <OutputSection {...enhancedProps} />
    
    default:
      return <UnsupportedSection {...enhancedProps} />
  }
}

// =============================================================================
// UNSUPPORTED SECTION FALLBACK
// =============================================================================

function UnsupportedSection({ section, onNext }: BaseSectionProps & { config: SectionConfiguration, title: string, description: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Unsupported Section Type
        </h3>
        <p className="text-muted-foreground mb-6">
          Section type "{section.type}" is not yet supported.
        </p>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Skip This Section
        </button>
      </div>
    </div>
  )
} 