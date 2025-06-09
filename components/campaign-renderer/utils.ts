// =============================================================================
// UTILITY FUNCTIONS FOR CAMPAIGN RENDERER
// =============================================================================

import { VariableContext } from './types'

/**
 * Process variable content using the advanced variable interpolation engine
 * This will be enhanced to integrate with the actual variable system later
 */
export async function processVariableContent(
  content: string, 
  context: Record<string, any> = {}
): Promise<string> {
  if (!content) return content
  
  try {
    // TODO: Integrate with actual variable interpolation engine
    // For now, use simple interpolation as fallback
    return interpolateTextSimple(content, context)
  } catch (error) {
    console.error('Variable processing error:', error)
    return interpolateTextSimple(content, context)
  }
}

/**
 * Simple variable interpolation fallback
 * Replaces @variable and {{variable}} patterns with values from context
 */
export function interpolateTextSimple(
  content: string, 
  context: Record<string, any> = {}
): string {
  if (!content) return content
  
  let result = content
  
  // Replace @variable syntax
  Object.entries(context).forEach(([key, value]) => {
    const stringValue = String(value)
    result = result.replace(new RegExp(`@${key}`, 'g'), stringValue)
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), stringValue)
  })
  
  return result
}

/**
 * Get mobile-optimized CSS classes based on device type
 */
export function getMobileClasses(baseClasses: string, deviceType?: string): string {
  const mobileEnhancements = deviceType === 'mobile' 
    ? 'min-h-[44px] touch-manipulation select-none' 
    : ''
  
  return [baseClasses, mobileEnhancements].filter(Boolean).join(' ')
}

/**
 * Get section weight for progress calculations
 */
export function getSectionWeight(sectionType: string): number {
  const weights = {
    'capture': 3,      // High weight - critical for completion
    'text_question': 2, // Medium weight - important data
    'multiple_choice': 2, // Medium weight - important data
    'slider': 2,       // Medium weight - important data
    'logic': 1,        // Low weight - automated processing
    'info': 1,         // Low weight - informational
    'output': 4        // Highest weight - final result
  }
  return weights[sectionType as keyof typeof weights] || 1
}

/**
 * Create error object with context
 */
export function createError(
  message: string,
  type: 'network' | 'api' | 'validation' | 'system' | 'user',
  retryable: boolean = true,
  details?: any
) {
  return {
    message,
    type,
    retryable,
    retryCount: 0,
    details,
    lastRetryAt: undefined,
    recovered: false
  }
}

/**
 * Get default choices for multiple choice sections
 */
export function getDefaultChoices() {
  return [
    { id: '1', label: 'Option 1', value: 'option1' },
    { id: '2', label: 'Option 2', value: 'option2' },
    { id: '3', label: 'Option 3', value: 'option3' }
  ]
}

/**
 * Get default capture fields
 */
export function getDefaultCaptureFields() {
  return [
    { id: 'name', type: 'text', label: 'Full Name', required: true },
    { id: 'email', type: 'email', label: 'Email Address', required: true }
  ]
}

/**
 * Format time duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Debounce function for auto-save functionality
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
} 