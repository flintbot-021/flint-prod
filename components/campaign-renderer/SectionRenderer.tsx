'use client'

import React, { useMemo, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { BaseSectionProps, SectionConfiguration, SectionRendererProps, SectionWithOptions, DeviceInfo } from './types'
import { Campaign } from '@/lib/types/database'
import { isValidEmail } from './utils'

// Import section components
import {
  CaptureSection,
  TextQuestionSection,
  DateTimeSection,
  MultipleChoiceSection,
  UploadSection,
  SliderSection,
  MultipleSlidersSection,
  InfoSection,
  BasicContentSection,
  HeroContentSection,
  LogicSection,
  OutputSection,
  DynamicRedirectSection,
  HtmlEmbedSection,
  OutputAdvancedSection
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
  deviceInfo?: DeviceInfo // Add deviceInfo override support
  campaign?: Campaign // Add campaign theme support
}

export function SectionRenderer(props: SectionRendererPropsExtended) {
  const { section, userInputs = {}, sections, campaign } = props

  // Check if section is hidden (check both direct property and configuration)
  const isHidden = ('isVisible' in section && section.isVisible === false) || 
                   (section.configuration && (section.configuration as any).isVisible === false)

  // =============================================================================
  // KEYBOARD NAVIGATION SYSTEM
  // =============================================================================

  // Check if the current section can proceed (has valid input)
  const canProceed = useCallback(() => {
    const sectionType = section.type as any
    const configData = (section.configuration || {}) as any
    const builderSettings = ('settings' in section && section.settings) ? section.settings : {}
    const mergedConfig = { ...configData, ...builderSettings }
    
    switch (sectionType) {
      case 'text_question':
        const isRequired = mergedConfig.required ?? false
        const existingResponse = String(userInputs?.[section.id] || '')
        const minLength = mergedConfig.minLength || 1
        const maxLength = mergedConfig.maxLength || 500
        return !isRequired || (existingResponse.trim().length >= minLength && existingResponse.length <= maxLength)
      
      case 'multiple_choice':
        const isChoiceRequired = mergedConfig.required ?? false
        const selectedChoice = userInputs?.[section.id]
        return !isChoiceRequired || selectedChoice !== undefined
      
      case 'slider':
        // Sliders always have a value (default to middle), so always can proceed
        return true
      
      case 'capture':
        // Disable keyboard navigation for capture sections due to complex validation
        // Users must click the Continue button to ensure proper form validation
        return false
      
      case 'date_time_question':
        const isDateRequired = mergedConfig.required ?? false
        const dateResponse = userInputs?.[section.id]
        return !isDateRequired || dateResponse !== undefined
      
      case 'upload_question':
        const isUploadRequired = mergedConfig.required ?? false
        const uploadResponse = userInputs?.[section.id]
        return !isUploadRequired || (uploadResponse && uploadResponse.length > 0)
      
      // Content sections can always proceed
      case 'info':
      case 'content-basic':
      case 'content-hero':
      case 'logic':
      case 'output':
      case 'output-advanced':
      case 'dynamic_redirect':
      case 'html_embed':
        return true
      
      default:
        return true
    }
  }, [section, userInputs])

  // Helper function to trigger section completion (simulates clicking Continue button)
  const triggerSectionCompletion = useCallback(() => {
    // Find and trigger the Continue button click to ensure proper data handling
    const continueButton = document.querySelector('[data-continue-button="true"]') as HTMLButtonElement
    if (continueButton && !continueButton.disabled) {
      continueButton.click()
      return true
    }
    
    // Fallback to onNext if no continue button found
    props.onNext()
    return false
  }, [props.onNext])

  // Global keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't interfere if user is typing in an input field
    const target = event.target as HTMLElement
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.closest('input, textarea, [contenteditable="true"]')
    
    // Special handling for sliders - don't interfere with slider interaction
    const isSliderSection = section.type === 'slider' || section.type === 'question-slider-multiple'
    const isSliderInput = (target as HTMLInputElement).type === 'range' || 
                         target.closest('input[type="range"]') ||
                         target.closest('[role="slider"]') ||
                         target.classList.contains('slider') ||
                         target.closest('.slider')
    
    // Special handling for text questions - allow keyboard navigation even in text areas
    const isTextQuestion = section.type === 'text_question'
    const isTextArea = target.tagName === 'TEXTAREA'
    
    // Handle different key combinations
    switch (event.key) {
      case 'Enter':
        // For text questions with text areas, Enter should proceed (not create new line)
        if (isTextQuestion && isTextArea && canProceed()) {
          event.preventDefault()
          triggerSectionCompletion()
        }
        // Enter key: proceed if can proceed and not in input field
        else if (!isInputField && canProceed()) {
          event.preventDefault()
          triggerSectionCompletion()
        }
        // For other text inputs, allow Ctrl+Enter or Cmd+Enter to proceed even when focused
        else if (isInputField && (event.ctrlKey || event.metaKey) && canProceed()) {
          event.preventDefault()
          triggerSectionCompletion()
        }
        break
      
      case 'ArrowRight':
        // Don't interfere with slider navigation
        if (isSliderSection && isSliderInput) {
          return // Let the slider handle arrow keys
        }
        // For text questions, allow right arrow to proceed even when focused on text area
        else if (isTextQuestion && isTextArea && canProceed()) {
          event.preventDefault()
          triggerSectionCompletion()
        }
        // Right arrow: proceed if can proceed and not in input field
        else if (!isInputField && canProceed()) {
          event.preventDefault()
          triggerSectionCompletion()
        }
        break
      
      case 'ArrowLeft':
        // Don't interfere with slider navigation
        if (isSliderSection && isSliderInput) {
          return // Let the slider handle arrow keys
        }
        // For text questions, allow left arrow to go back even when focused on text area
        else if (isTextQuestion && isTextArea) {
          event.preventDefault()
          props.onPrevious()
        }
        // Left arrow: go back if not in input field
        else if (!isInputField) {
          event.preventDefault()
          props.onPrevious()
        }
        break
      
      case 'Escape':
        // Escape: go back (always works)
        event.preventDefault()
        props.onPrevious()
        break
    }
  }, [canProceed, triggerSectionCompletion, props.onPrevious, section.type])

  // Add keyboard event listener
  useEffect(() => {
    // Only add keyboard navigation if this is the active section
    if (props.isActive) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [props.isActive, handleKeyDown])
  
  // In public campaign view, completely skip hidden sections
  if (isHidden && !props.isPreview) {
    return null
  }
  
  // In builder preview, show hidden sections with a placeholder
  if (isHidden && props.isPreview) {
    return (
      <div className="h-full bg-muted/30 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M18.535 18.535l-4.242-4.242M18.535 18.535L19.95 17.121m-1.414 1.414L16.95 16.95M4.929 4.929L7.05 7.05M2.05 2.05l20 20" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Section Hidden
          </h3>
          <p className="text-sm text-muted-foreground/80 mb-4">
            This section is hidden and won't appear in the live campaign. Use the dropdown menu to show it again.
          </p>
          <div className="text-xs text-muted-foreground/60">
            Section: {section.title || 'Untitled'}
          </div>
        </div>
      </div>
    )
  }

  // Extract configuration from section - memoized
  // Merge both configuration and settings to ensure builder settings are available in renderer
  const config: SectionConfiguration = useMemo(() => {
    const baseConfig = (section.configuration || {}) as SectionConfiguration
    const builderSettings = ('settings' in section && section.settings) ? section.settings : {}
    
    return {
      ...baseConfig,
      ...builderSettings
    } as SectionConfiguration
  }, [section.configuration, ('settings' in section) ? section.settings : {}])



  // Use provided deviceInfo or auto-detect - memoized
  const deviceInfo = useMemo(() => {
    // If deviceInfo is provided (e.g., from preview page), use it
    if (props.deviceInfo) {
      return props.deviceInfo
    }

    // Otherwise, auto-detect based on window size
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
  }, [props.deviceInfo]) // Include props.deviceInfo in deps

  // Memoize title and description extraction
  const sectionTitle = useMemo(() => 
    (config as any).headline || (config as any).title || (config as any).content || section.title || config.question || '',
    [config, section.title, config.content, config.question]
  )
  
  const sectionDescription = useMemo(() => 
    section.description || (config as any).description || (config as any).subheading || (config as any).subtitle || '',
    [section.description, config, config.subheading, config.subtitle]
  )

  // Enhanced props with all required fields for SectionRendererProps - memoized
  const enhancedProps: SectionRendererProps = useMemo(() => ({
    ...props,
    config,
    title: sectionTitle,
    description: sectionDescription,
    deviceInfo,
    userInputs,
    sections,
    campaign
  }), [props, config, sectionTitle, sectionDescription, deviceInfo, userInputs, sections, campaign])

  // Route to appropriate section component based on type
  switch (section.type as any) {
    case 'capture':
      return <CaptureSection {...enhancedProps} />
    
    case 'text_question':
      // Check if this is actually an upload question
      if (isUploadQuestion(config)) {
        return <UploadSection {...enhancedProps} />
      }
      // Check if this is actually a date-time question
      if (isDateTimeQuestion(config)) {
        return <DateTimeSection {...enhancedProps} />
      }
      return <TextQuestionSection {...enhancedProps} />
    
    case 'upload_question':
      return <UploadSection {...enhancedProps} />
    
    case 'date_time_question':
      return <DateTimeSection {...enhancedProps} />
    
    case 'multiple_choice':
      return <MultipleChoiceSection {...enhancedProps} />
    
    case 'slider':
      return <SliderSection {...enhancedProps} />
    
    case 'question-slider-multiple':
      return <MultipleSlidersSection {...enhancedProps} />
    
    // Direct routing for content sections - no detection needed!
    case 'content-hero':
      return <HeroContentSection {...enhancedProps} />
    
    case 'content-basic':
      return <BasicContentSection {...enhancedProps} />
    
    case 'info':
      // Check if this is actually a Multiple Sliders section that was incorrectly saved as 'info'
      if ((config as any).sliders && Array.isArray((config as any).sliders)) {
        return <MultipleSlidersSection {...enhancedProps} />
      }
      
      // Check if this is actually a Hero section (legacy sections saved as 'info')
      const configAny = config as any
      
      // Hero sections are identified by having overlay properties OR being explicitly hero-like
      const isHeroSection = !!(
        configAny.overlayColor || 
        configAny.overlayOpacity !== undefined || 
        configAny.showButton !== undefined || 
        configAny.buttonText ||
        // Only consider image as hero indicator if it has overlay properties
        (configAny.image && (configAny.overlayColor || configAny.overlayOpacity !== undefined))
      )
      
      // Check if this is actually a Basic content section (legacy sections saved as 'info')
      const isBasicSection = !!(
        configAny.textAlignment || 
        configAny.subtitle ||
        (configAny.content && typeof configAny.content === 'string') ||
        // Basic sections can have images but without overlay properties
        (configAny.image && !configAny.overlayColor && configAny.overlayOpacity === undefined)
      )
      
      // Debug the detection logic
      console.log('🔍 SECTION DETECTION DEBUG:', {
        sectionTitle: section.title,
        sectionType: section.type,
        hasOverlayColor: !!configAny.overlayColor,
        hasOverlayOpacity: configAny.overlayOpacity !== undefined,
        hasShowButton: configAny.showButton !== undefined,
        hasButtonText: !!configAny.buttonText,
        hasImage: !!configAny.image,
        hasTextAlignment: !!configAny.textAlignment,
        hasSubtitle: !!configAny.subtitle,
        hasContent: !!(configAny.content && typeof configAny.content === 'string'),
        isHeroSection,
        isBasicSection,
        routingTo: isHeroSection ? 'HERO' : isBasicSection ? 'BASIC' : 'INFO'
      })
      
      if (isHeroSection) {
        return <HeroContentSection {...enhancedProps} />
      }
      
      if (isBasicSection) {
        return <BasicContentSection {...enhancedProps} />
      }
      
      // Default to generic info section
      return <InfoSection {...enhancedProps} />
    
    case 'logic':
      return <LogicSection {...enhancedProps} />
    
    case 'output':
      if ((config as any)?.mode === 'advanced') {
        return <OutputAdvancedSection {...enhancedProps} />
      }
      return <OutputSection {...enhancedProps} />
    case 'output-advanced':
      return <OutputAdvancedSection {...enhancedProps} />
    
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