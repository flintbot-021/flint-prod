'use client'

import React, { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { BaseSectionProps, SectionConfiguration, SectionRendererProps, SectionWithOptions } from './types'

// Import section components
import {
  CaptureSection,
  TextQuestionSection,
  MultipleChoiceSection,
  UploadSection,
  SliderSection,
  InfoSection,
  LogicSection,
  OutputSection,
  DynamicRedirectSection,
  HtmlEmbedSection
} from './sections'

// =============================================================================
// SECTION TYPE DETECTION HELPERS
// =============================================================================

// Helper function to detect if a text_question is actually an upload question
function isUploadQuestion(config: SectionConfiguration): boolean {
  // Check for upload-specific configuration fields
  return !!(
    config.maxFiles ||
    config.allowImages ||
    config.allowDocuments ||
    config.allowVideo ||
    config.allowAudio ||
    config.maxFileSize
  )
}

// Helper function to detect if a text_question is a date-time question
function isDateTimeQuestion(config: SectionConfiguration): boolean {
  return !!(config.includeDate || config.includeTime)
}

// =============================================================================
// MAIN SECTION RENDERER
// =============================================================================

interface SectionRendererPropsExtended extends BaseSectionProps {
  userInputs?: Record<string, any>
  sections?: SectionWithOptions[]
}

export function SectionRenderer(props: SectionRendererPropsExtended) {
  const { section, userInputs = {}, sections } = props

  // Extract configuration from section - memoized
  const config: SectionConfiguration = useMemo(() => 
    (section.configuration || {}) as SectionConfiguration, 
    [section.configuration]
  )

  // Basic device info detection (can be enhanced by pages if needed) - memoized
  const deviceInfo = useMemo(() => {
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
  }, []) // Empty deps - device info shouldn't change during session

  // Memoize title and description extraction
  const sectionTitle = useMemo(() => 
    section.title || config.content || config.question || '', 
    [section.title, config.content, config.question]
  )
  
  const sectionDescription = useMemo(() => 
    section.description || config.subheading || '', 
    [section.description, config.subheading]
  )

  // Enhanced props with all required fields for SectionRendererProps - memoized
  const enhancedProps: SectionRendererProps = useMemo(() => ({
    ...props,
    config,
    title: sectionTitle,
    description: sectionDescription,
    deviceInfo,
    userInputs,
    sections
  }), [props, config, sectionTitle, sectionDescription, deviceInfo, userInputs, sections])

  // Route to appropriate section component based on type
  switch (section.type) {
    case 'capture':
      return <CaptureSection {...enhancedProps} />
    
    case 'text_question':
      // Check if this is actually an upload question
      if (isUploadQuestion(config)) {
        return <UploadSection {...enhancedProps} />
      }
      // Check if this is actually a date-time question (for future implementation)
      // if (isDateTimeQuestion(config)) {
      //   return <DateTimeSection {...enhancedProps} />
      // }
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
    
    case 'dynamic_redirect':
      return <DynamicRedirectSection {...enhancedProps} />
    
    case 'html_embed':
      return <HtmlEmbedSection {...enhancedProps} />
    
    default:
      return <UnsupportedSection {...enhancedProps} />
  }
}

// =============================================================================
// UNSUPPORTED SECTION FALLBACK
// =============================================================================

function UnsupportedSection({ section, onNext }: SectionRendererProps) {
  return (
    <div className="h-full bg-background flex items-center justify-center">
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