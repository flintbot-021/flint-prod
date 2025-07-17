'use client'

import { cn } from '@/lib/utils'
import { Plus, FileText, Star } from 'lucide-react'
import { SectionType } from '@/lib/types/campaign-builder'
import { usePostHog } from 'posthog-js/react'

interface OptionalSectionPlaceholderProps {
  type: 'hero' | 'text-question'
  onAdd: (sectionType: SectionType) => void
  className?: string
  campaignId?: string
  campaignName?: string
}

const OPTIONAL_SECTIONS = {
  hero: {
    id: 'content-hero',
    name: 'Hero Section',
    description: 'Eye-catching header with background image',
    icon: Star,
    color: 'orange'
  },
  'text-question': {
    id: 'question-text',
    name: 'Text Question',
    description: 'Short text or long text responses',
    icon: FileText,
    color: 'blue'
  }
}

export function OptionalSectionPlaceholder({ 
  type, 
  onAdd, 
  className,
  campaignId,
  campaignName 
}: OptionalSectionPlaceholderProps) {
  const section = OPTIONAL_SECTIONS[type]
  const Icon = section.icon
  const posthog = usePostHog()

  const handleAdd = () => {
    // Track PostHog event based on type
    if (posthog) {
      const eventName = type === 'hero' ? 'start_with_hero' : 'start_with_text'
      posthog.capture(eventName, {
        campaign_id: campaignId,
        campaign_name: campaignName,
        section_type: section.id,
        section_name: section.name,
        interaction_type: 'empty_state_click',
        placement: 'canvas_empty_state'
      })
    }
    
    // Create a section type object that matches what onSectionAdd expects
    const sectionType: SectionType = {
      id: section.id,
      name: section.name,
      description: section.description,
      category: type === 'hero' ? 'content' : 'input',
      icon: section.icon as any,
      color: section.color,
      defaultSettings: {}
    }
    
    onAdd(sectionType)
  }

  const colorClasses = {
    orange: {
      border: 'border-orange-200 hover:border-orange-300',
      bg: 'bg-orange-50 hover:bg-orange-100',
      icon: 'text-orange-500',
      text: 'text-orange-700',
      button: 'text-orange-600 hover:text-orange-700'
    },
    blue: {
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: 'text-blue-500',
      text: 'text-blue-700',
      button: 'text-blue-600 hover:text-blue-700'
    }
  }

  const colors = colorClasses[section.color as keyof typeof colorClasses]
  const isSuggestion = className?.includes('suggestion')

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group',
        isSuggestion ? 'p-3' : 'p-4',
        colors.border,
        colors.bg,
        className
      )}
      onClick={handleAdd}
    >
      {/* Badge */}
      <div className={cn(
        'absolute text-white text-xs px-2 py-1 rounded-full font-medium',
        isSuggestion 
          ? 'bg-gray-500 -top-1 -right-1' 
          : 'bg-blue-500 -top-2 -right-2'
      )}>
        {isSuggestion ? 'Suggested' : 'Get Started'}
      </div>

      {/* Content */}
      {isSuggestion ? (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors bg-white shadow-sm group-hover:shadow-md">
            <Icon className={cn('h-4 w-4', colors.icon)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-sm font-medium', colors.text)}>
              {section.name}
            </h3>
            <p className={cn('text-xs opacity-75', colors.text)}>
              {section.description}
            </p>
          </div>

          {/* Add button */}
          <div className={cn(
            'inline-flex items-center space-x-1 text-xs font-medium transition-colors flex-shrink-0',
            colors.button
          )}>
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">Add</span>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors bg-white shadow-sm group-hover:shadow-md">
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
          
          <h3 className={cn('font-medium mb-1 text-sm', colors.text)}>
            {section.name}
          </h3>
          
          <p className={cn('text-xs mb-3 opacity-90', colors.text)}>
            {section.description}
          </p>

          {/* Add button */}
          <div className={cn(
            'inline-flex items-center space-x-1 text-xs font-medium transition-colors',
            colors.button
          )}>
            <Plus className="h-3 w-3" />
            <span>Add {section.name}</span>
          </div>
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
} 

interface TemplatePlaceholderProps {
  onClick: () => void
  className?: string
  campaignId?: string
  campaignName?: string
}

export function TemplatePlaceholder({ 
  onClick, 
  className,
  campaignId,
  campaignName 
}: TemplatePlaceholderProps) {
  const Icon = Star
  const posthog = usePostHog()

  const handleClick = () => {
    // Track PostHog event for template start
    if (posthog) {
      posthog.capture('start_with_template', {
        campaign_id: campaignId,
        campaign_name: campaignName,
        interaction_type: 'empty_state_click',
        placement: 'canvas_empty_state'
      })
    }
    
    onClick()
  }

  const colorClasses = {
    purple: {
      border: 'border-purple-200 hover:border-purple-300',
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: 'text-purple-500',
      text: 'text-purple-700',
      button: 'text-purple-600 hover:text-purple-700'
    }
  }

  const colors = colorClasses.purple

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group p-4',
        colors.border,
        colors.bg,
        className
      )}
      onClick={handleClick}
    >
      <div className="absolute text-white text-xs px-2 py-1 rounded-full font-medium bg-purple-500 -top-2 -right-2">
        Start Fresh
      </div>
      <div className="text-center">
        <div className="mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors bg-white shadow-sm group-hover:shadow-md">
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
        
        <h3 className={cn('font-medium mb-1 text-sm', colors.text)}>
          Start with Template
        </h3>
        
        <p className={cn('text-xs mb-3 opacity-90', colors.text)}>
          Use a pre-built holiday finder template
        </p>
        <div className={cn(
          'inline-flex items-center space-x-1 text-xs font-medium transition-colors',
          colors.button
        )}>
          <Plus className="h-3 w-3" />
          <span>Use Template</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
} 