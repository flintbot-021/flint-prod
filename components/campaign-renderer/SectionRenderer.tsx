'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { BaseSectionProps, SectionConfiguration, SectionRendererProps } from './types'

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

interface SectionRendererPropsExtended extends BaseSectionProps {
  userInputs?: Record<string, any>
}

export function SectionRenderer(props: SectionRendererPropsExtended) {
  const { section, userInputs = {} } = props

  // Extract configuration from section
  const config: SectionConfiguration = (section.configuration || {}) as SectionConfiguration

  // Basic device info detection (can be enhanced by pages if needed)
  const getBasicDeviceInfo = () => {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop' as const,
        screenSize: { width: 1200, height: 800 },
        orientation: 'landscape' as const,
        touchCapable: false,
        userAgent: '',
        pixelRatio: 1
      }
    }
    
    const width = window.innerWidth
    const height = window.innerHeight
    const touchCapable = 'ontouchstart' in window
    
    let type: 'mobile' | 'tablet' | 'desktop'
    if (width < 768) type = 'mobile'
    else if (width < 1024) type = 'tablet' 
    else type = 'desktop'
    
    return {
      type,
      screenSize: { width, height },
      orientation: width > height ? 'landscape' as const : 'portrait' as const,
      touchCapable,
      userAgent: navigator.userAgent,
      pixelRatio: window.devicePixelRatio || 1
    }
  }

  // Enhanced props with all required fields for SectionRendererProps
  const enhancedProps: SectionRendererProps = {
    ...props,
    config,
    title: section.title || config.content || config.question || '',
    description: section.description || config.subheading || '',
    deviceInfo: getBasicDeviceInfo(),
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

function UnsupportedSection({ section, onNext }: SectionRendererProps) {
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