'use client'

import { CampaignSection } from '@/lib/types/campaign-builder'
import { TextQuestion } from './text-question'
import { MultipleChoiceQuestion } from './multiple-choice-question'
import { RatingScaleQuestion } from './rating-scale-question'
import { SliderQuestion } from './slider-question'
import { CaptureSection } from './capture-section'
import { cn } from '@/lib/utils'
import { AlertCircle, FileText } from 'lucide-react'
import { ContentComponentFactory } from '../content-types/content-component-factory'

interface QuestionComponentFactoryProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
}

export function QuestionComponentFactory({
  section,
  isPreview = false,
  onUpdate,
  className
}: QuestionComponentFactoryProps) {
  // Route to appropriate question component based on section type
  switch (section.type) {
    case 'question-text':
      return (
        <TextQuestion
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )
    
    case 'question-multiple-choice':
      return (
        <MultipleChoiceQuestion
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    case 'question-slider':
      return (
        <SliderQuestion
          settings={section.settings as any}
          isPreview={isPreview}
          isEditing={!isPreview}
          onChange={(newSettings) => onUpdate({ settings: newSettings })}
          className={className}
        />
      )
    
    case 'rating-scale':
      return (
        <RatingScaleQuestion
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    case 'capture-details':
    case 'capture':
      return (
        <CaptureSection
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // Legacy mappings for backward compatibility
    case 'text-input':
      return (
        <TextQuestion
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )
    
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // For email capture, use text input with email type
    case 'email-capture':
      return (
        <TextQuestion
          section={{
            ...section,
            settings: {
              ...section.settings,
              inputType: 'email',
              content: section.settings?.content || 'Enter your email address',
              placeholder: 'your@email.com',
              validation: {
                pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                message: 'Please enter a valid email address'
              }
            }
          }}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )

    // For contact form, use text input with specific settings
    case 'contact-form':
      return (
        <div className={cn('space-y-6', className)}>
          {/* Name Field */}
          <TextQuestion
            section={{
              ...section,
              id: `${section.id}-name`,
              title: 'Name',
              settings: {
                content: 'What\'s your name?',
                placeholder: 'Enter your full name',
                inputType: 'text',
                required: true,
                maxLength: 100
              }
            }}
            isPreview={isPreview}
            onUpdate={async (updates) => {
              // Handle contact form name field updates
              await onUpdate({
                settings: {
                  ...section.settings,
                  nameField: updates.settings
                }
              })
            }}
          />

          {/* Email Field */}
          <TextQuestion
            section={{
              ...section,
              id: `${section.id}-email`,
              title: 'Email',
              settings: {
                content: 'What\'s your email address?',
                placeholder: 'your@email.com',
                inputType: 'email',
                required: true,
                validation: {
                  pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                  message: 'Please enter a valid email address'
                }
              }
            }}
            isPreview={isPreview}
            onUpdate={async (updates) => {
              // Handle contact form email field updates
              await onUpdate({
                settings: {
                  ...section.settings,
                  emailField: updates.settings
                }
              })
            }}
          />

          {/* Phone Field (Optional) */}
          <TextQuestion
            section={{
              ...section,
              id: `${section.id}-phone`,
              title: 'Phone',
              settings: {
                content: 'What\'s your phone number? (Optional)',
                placeholder: '+1 (555) 123-4567',
                inputType: 'phone',
                required: false,
                validation: {
                  pattern: '^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,15}$',
                  message: 'Please enter a valid phone number'
                }
              }
            }}
            isPreview={isPreview}
            onUpdate={async (updates) => {
              // Handle contact form phone field updates
              await onUpdate({
                settings: {
                  ...section.settings,
                  phoneField: updates.settings
                }
              })
            }}
          />
        </div>
      )

    // Fallback for unsupported or content section types
    default:
      return (
        <ContentComponentFactory
          section={section}
          isPreview={isPreview}
          onUpdate={onUpdate}
          className={className}
        />
      )
  }
}

// Export individual question components for direct use
export { TextQuestion, MultipleChoiceQuestion, RatingScaleQuestion, SliderQuestion, CaptureSection } 