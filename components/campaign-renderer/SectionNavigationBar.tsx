'use client'

import React from 'react'
import { ChevronLeft, ArrowLeft, ArrowRight, Loader2, CheckCircle, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMobileClasses, getCampaignButtonStyles } from './utils'
import { Campaign } from '@/lib/types/database'

interface SectionNavigationBarProps {
  // Navigation
  onPrevious: () => void
  onNext?: () => void
  canGoPrevious?: boolean
  canGoNext?: boolean
  
  // Simple center content (for basic usage)
  icon?: React.ReactNode
  label?: string
  validationText?: string
  
  // Advanced center content (for public page usage)
  centerContent?: React.ReactNode
  
  // Progress information
  progress?: {
    current: number
    total: number
    percentage?: number
    timeEstimate?: number
    completionForecast?: string
  }
  
  // Status indicators
  status?: {
    isSaving?: boolean
    isSaved?: boolean
    isOffline?: boolean
    pendingUpdates?: number
  }
  
  // Navigation hints
  navigationHints?: {
    text: string
    isTouchDevice?: boolean
  }
  
  // Section dots for progress visualization
  sectionDots?: {
    sections: Array<{
      index: number
      title?: string
      isCompleted: boolean
      canAccess: boolean
    }>
    currentIndex: number
    onSectionClick?: (index: number) => void
  }
  
  // Action buttons (right side)
  actionButton?: {
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary'
    icon?: React.ReactNode
  }
  
  // Alternative: multiple action buttons
  actionButtons?: Array<{
    label: string
    onClick: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary'
    icon?: React.ReactNode
  }>
  
  // Device info for responsive styling
  deviceInfo?: {
    type: 'mobile' | 'tablet' | 'desktop'
  }
  
  // Custom styling
  className?: string
  
  // Layout variants
  variant?: 'simple' | 'full' // simple = basic section usage, full = public page usage
  
  // Campaign for theme support
  campaign?: Campaign
}

export function SectionNavigationBar({
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
  icon,
  label,
  validationText,
  centerContent,
  progress,
  status,
  navigationHints,
  sectionDots,
  actionButton,
  actionButtons,
  deviceInfo,
  className,
  variant = 'simple',
  campaign
}: SectionNavigationBarProps) {
  const isFull = variant === 'full'
  const actions = actionButtons || (actionButton ? [actionButton] : [])
  
  return (
    <div className={cn("fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg", className)}>
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Previous Button */}
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={cn(
              "flex items-center text-muted-foreground hover:text-foreground transition-colors",
              !canGoPrevious && "opacity-50 cursor-not-allowed",
              isFull && deviceInfo?.type === 'mobile' && "px-6 py-3"
            )}
          >
            {isFull ? (
              <ArrowLeft className={cn(
                "mr-1",
                deviceInfo?.type === 'mobile' ? "h-5 w-5" : "h-4 w-4"
              )} />
            ) : (
              <ChevronLeft className="h-5 w-5 mr-1" />
            )}
            <span className={cn(
              "hidden sm:inline",
              isFull && deviceInfo?.type === 'mobile' && "inline"
            )}>
              Previous
            </span>
          </button>
          
          {/* Center: Content */}
          <div className="flex flex-col items-center space-y-2">
            {/* Custom center content takes precedence */}
            {centerContent ? (
              centerContent
            ) : (
              <>
                {/* Progress and Status for full variant */}
                {isFull && progress && (
                  <div className="flex items-center space-x-4">
                    {/* Real-time Save Status */}
                    {status?.isSaving && (
                      <div className="flex items-center text-sm text-amber-600">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        <span>Saving...</span>
                      </div>
                    )}
                    
                    {status?.isSaved && !status?.isSaving && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Saved</span>
                      </div>
                    )}
                    
                    {/* Progress Details */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm text-muted-foreground">
                          {progress.current} of {progress.total}
                        </span>
                        {progress.percentage !== undefined && (
                          <span className="text-sm font-medium text-blue-600">
                            {progress.percentage}%
                          </span>
                        )}
                      </div>
                      
                      {/* Time Estimate */}
                      {progress.timeEstimate && progress.timeEstimate > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ~{Math.ceil(progress.timeEstimate / 60)}min remaining
                          {progress.completionForecast && ` • Est. ${progress.completionForecast}`}
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      {progress.percentage !== undefined && (
                        <div className="w-32 h-1 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Section Dots */}
                    {sectionDots && (
                      <div className="flex space-x-1">
                        {sectionDots.sections.map((section) => (
                          <div
                            key={section.index}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors cursor-pointer",
                              section.index === sectionDots.currentIndex
                                ? "bg-blue-600 ring-2 ring-blue-200"
                                : section.isCompleted
                                ? "bg-green-500"
                                : section.canAccess
                                ? "bg-gray-300 hover:bg-gray-400"
                                : "bg-gray-200"
                            )}
                            onClick={() => {
                              if (section.canAccess && section.index !== sectionDots.currentIndex && sectionDots.onSectionClick) {
                                sectionDots.onSectionClick(section.index)
                              }
                            }}
                            title={`${section.title || `Section ${section.index + 1}`}${
                              !section.canAccess ? ' (Locked)' : ''
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Simple icon + label for basic variant */}
                {!isFull && (icon || label || validationText) && (
                  <div className="flex items-center">
                    {icon && <div className="mr-2">{icon}</div>}
                    <span className="text-sm text-muted-foreground">
                      {label}
                      {label && validationText && ' | '}
                      {validationText}
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* Navigation Hints */}
            {isFull && navigationHints && (
              <div className="text-xs text-gray-400 text-center max-w-xs">
                {navigationHints.text}
              </div>
            )}
            
            {/* Network Status */}
            {isFull && status?.isOffline && (
              <div className="flex items-center text-xs text-red-500">
                <WifiOff className="h-3 w-3 mr-1" />
                <span>Offline</span>
              </div>
            )}
          </div>
          
          {/* Right: Action Button(s) or Next Button */}
          {onNext ? (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={cn(
                "flex items-center text-muted-foreground hover:text-foreground transition-colors",
                !canGoNext && "opacity-50 cursor-not-allowed",
                isFull && deviceInfo?.type === 'mobile' && "px-6 py-3"
              )}
            >
              <span className={cn(
                "hidden sm:inline",
                isFull && deviceInfo?.type === 'mobile' && "inline"
              )}>
                Next
              </span>
              <ArrowRight className={cn(
                "ml-1",
                deviceInfo?.type === 'mobile' ? "h-5 w-5" : "h-4 w-4"
              )} />
            </button>
          ) : actions.length > 0 ? (
            <div className="flex items-center space-x-2">
              {actions.map((action, index) => {
                const buttonStyles = getCampaignButtonStyles(campaign, action.variant === 'secondary' ? 'secondary' : 'primary')
                
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      "px-6 py-2 rounded-lg font-medium transition-all duration-200",
                      "flex items-center space-x-2 shadow-md hover:shadow-lg",
                      action.disabled && "cursor-not-allowed opacity-50",
                      getMobileClasses("", deviceInfo?.type)
                    )}
                    style={action.disabled ? { backgroundColor: '#e5e7eb', color: '#6b7280' } : buttonStyles}
                  >
                    {action.icon && action.icon}
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="w-20"></div> // Spacer to maintain layout
          )}
        </div>
      </div>
    </div>
  )
} 