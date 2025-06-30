'use client'

import { cn } from '@/lib/utils'
import { Plus, User, Zap, Target } from 'lucide-react'
import { SectionType } from '@/lib/types/campaign-builder'

interface MandatorySectionPlaceholderProps {
  type: 'capture' | 'logic' | 'output'
  onAdd: (sectionType: SectionType) => void
  className?: string
}

const MANDATORY_SECTIONS = {
  capture: {
    id: 'capture-details',
    name: 'Capture Section',
    description: 'Collect user information (name, email, etc.)',
    icon: User,
    color: 'blue'
  },
  logic: {
    id: 'logic-ai',
    name: 'Logic Section', 
    description: 'AI processing to generate personalized results',
    icon: Zap,
    color: 'purple'
  },
  output: {
    id: 'output-results',
    name: 'Output Section',
    description: 'Show personalized results to users',
    icon: Target,
    color: 'green'
  }
}

export function MandatorySectionPlaceholder({ 
  type, 
  onAdd, 
  className 
}: MandatorySectionPlaceholderProps) {
  const section = MANDATORY_SECTIONS[type]
  const Icon = section.icon

  const handleAdd = () => {
    // Create a section type object that matches what onSectionAdd expects
    const sectionType: SectionType = {
      id: section.id,
      name: section.name,
      description: section.description,
      category: type === 'capture' ? 'input' : type === 'logic' ? 'logic' : 'output',
      icon: section.icon as any, // Type assertion since SectionType expects a specific icon type
      color: section.color,
      defaultSettings: {}
    }
    
    onAdd(sectionType)
  }

  const colorClasses = {
    blue: {
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: 'text-blue-500',
      text: 'text-blue-700',
      button: 'text-blue-600 hover:text-blue-700'
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-300',
      bg: 'bg-purple-50 hover:bg-purple-100', 
      icon: 'text-purple-500',
      text: 'text-purple-700',
      button: 'text-purple-600 hover:text-purple-700'
    },
    green: {
      border: 'border-green-200 hover:border-green-300',
      bg: 'bg-green-50 hover:bg-green-100',
      icon: 'text-green-500', 
      text: 'text-green-700',
      button: 'text-green-600 hover:text-green-700'
    }
  }

  const colors = colorClasses[section.color as keyof typeof colorClasses]

  const isCompact = className?.includes('compact')

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer group',
        isCompact ? 'p-3' : 'p-6',
        colors.border,
        colors.bg,
        className
      )}
      onClick={handleAdd}
    >
      {/* Required badge */}
      <div className={cn(
        'absolute bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium',
        isCompact ? '-top-1 -right-1' : '-top-2 -right-2'
      )}>
        Required
      </div>

      {/* Content */}
      {isCompact ? (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors bg-white shadow-sm group-hover:shadow-md">
            <Icon className={cn('h-4 w-4', colors.icon)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-sm font-semibold', colors.text)}>
              {section.name}
            </h3>
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
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors bg-white shadow-sm group-hover:shadow-md">
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
          
          <h3 className={cn('font-semibold mb-1', colors.text)}>
            {section.name}
          </h3>
          
          <p className={cn('text-sm mb-4 opacity-90', colors.text)}>
            {section.description}
          </p>

          {/* Add button */}
          <div className={cn(
            'inline-flex items-center space-x-2 text-sm font-medium transition-colors',
            colors.button
          )}>
            <Plus className="h-4 w-4" />
            <span>Add {section.name}</span>
          </div>
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
} 