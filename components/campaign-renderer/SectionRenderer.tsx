'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { BaseSectionProps, SectionConfiguration } from './types'

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

interface SectionRendererPropsWithUserInputs extends BaseSectionProps {
  userInputs?: Record<string, any>
}

export function SectionRenderer(props: SectionRendererPropsWithUserInputs) {
  const { section, index, userInputs = {} } = props

  // Extract configuration from section
  const config: SectionConfiguration = (section.configuration || {}) as SectionConfiguration

  // Enhanced props with section content (no variable processing for now)
  const enhancedProps = {
    ...props,
    config,
    title: section.title || '',
    description: section.description || '',
    userInputs
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
      console.log('🎯 SectionRenderer routing to LogicSection for section:', section.id)
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