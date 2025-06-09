// =============================================================================
// SHARED TYPES FOR CAMPAIGN RENDERER COMPONENTS
// =============================================================================

import { Campaign, SectionWithOptions } from '@/lib/types/database'

// Re-export for convenience
export type { SectionWithOptions } from '@/lib/types/database'

// Device and environment info
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  screenSize: { width: number; height: number }
  orientation: 'portrait' | 'landscape'
  touchCapable: boolean
  userAgent: string
  pixelRatio: number
}

// Network state for offline handling
export interface NetworkState {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  lastOnline?: Date
  lastOffline?: Date
}

// Error handling
export interface ErrorState {
  message: string
  type: 'network' | 'api' | 'validation' | 'system' | 'user'
  retryable: boolean
  retryCount?: number
  lastRetryAt?: Date
  details?: any
  recovered?: boolean
}

// Progress tracking
export interface ProgressMetrics {
  totalProgress: number
  weightedProgress: number
  captureProgress: number
  timeEstimate: number
  completionForecast: string
  milestones: string[]
}

// Variable context for interpolation
export interface VariableContext {
  leadData: Record<string, any>
  campaignData: Record<string, any>
  sessionData: Record<string, any>
}

// Section configuration (from database)
export interface SectionConfiguration {
  content?: string
  subheading?: string
  label?: string
  placeholder?: string
  required?: boolean
  buttonLabel?: string
  buttonText?: string
  question?: string
  options?: Array<{
    id: string
    label: string
    value: string
  }>
  min_value?: number
  max_value?: number
  step?: number
  min_label?: string
  max_label?: string
  default_value?: number
  input_type?: 'text' | 'textarea' | 'email' | 'tel' | 'number'
  prompt?: string
  outputVariables?: Array<{
    id: string
    name: string
    description: string
  }>
  title?: string
  subtitle?: string
}

// Base props that all section components will receive
export interface BaseSectionProps {
  section: SectionWithOptions
  index: number
  isActive: boolean
  isPreview?: boolean
  campaignId?: string
  
  // Navigation handlers
  onNext: () => void
  onPrevious: () => void
  onNavigateToSection: (index: number) => void
  
  // Data handlers
  onSectionComplete: (sectionIndex: number, data: any) => void
  onResponseUpdate: (sectionId: string, fieldId: string, value: any, metadata?: any) => void
}

// Enhanced props that section components actually use
export interface SectionRendererProps extends BaseSectionProps {
  config: SectionConfiguration
  title: string
  description: string
  deviceInfo?: DeviceInfo
  networkState?: NetworkState
  userInputs?: Record<string, any>
}

// Campaign state management
export interface CampaignState {
  currentSection: number
  userInputs: Record<string, any>
  completedSections: Set<number>
  startTime: Date
  sessionId: string
  leadId?: string
} 