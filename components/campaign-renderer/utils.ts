// =============================================================================
// UTILITY FUNCTIONS FOR CAMPAIGN RENDERER
// =============================================================================

import { VariableContext } from './types'
import { Campaign } from '@/lib/types/database'

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

// =============================================================================
// THEME UTILITIES
// =============================================================================

/**
 * Default theme colors used when campaign doesn't specify custom colors
 */
export const DEFAULT_THEME = {
  background_color: '#FFFFFF',
  button_color: '#3B82F6',
  text_color: '#1F2937'
}

/**
 * Extract theme colors from campaign settings with fallbacks
 */
export function getCampaignTheme(campaign?: Campaign) {
  const themeSettings = campaign?.settings?.theme
  
  return {
    backgroundColor: themeSettings?.background_color || DEFAULT_THEME.background_color,
    buttonColor: themeSettings?.button_color || DEFAULT_THEME.button_color,
    textColor: themeSettings?.text_color || DEFAULT_THEME.text_color,
    // Keep legacy colors for backward compatibility
    primaryColor: themeSettings?.primary_color || themeSettings?.button_color || DEFAULT_THEME.button_color,
    secondaryColor: themeSettings?.secondary_color || themeSettings?.text_color || DEFAULT_THEME.text_color
  }
}

/**
 * Generate CSS style object for campaign theme
 */
export function getCampaignThemeStyles(campaign?: Campaign) {
  const theme = getCampaignTheme(campaign)
  
  return {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    '--button-color': theme.buttonColor,
    '--text-color': theme.textColor,
    '--background-color': theme.backgroundColor
  } as React.CSSProperties
}

/**
 * Get button styles for campaign theme
 */
export function getCampaignButtonStyles(campaign?: Campaign, variant: 'primary' | 'secondary' = 'primary') {
  const theme = getCampaignTheme(campaign)
  
  if (variant === 'primary') {
    return {
      backgroundColor: theme.buttonColor,
      color: getContrastColor(theme.buttonColor),
      border: `1px solid ${theme.buttonColor}`
    } as React.CSSProperties
  } else {
    return {
      backgroundColor: 'transparent',
      color: theme.buttonColor,
      border: `1px solid ${theme.buttonColor}`
    } as React.CSSProperties
  }
}

/**
 * Get text color classes for campaign theme
 */
export function getCampaignTextColor(campaign?: Campaign, intensity: 'primary' | 'muted' = 'primary') {
  const theme = getCampaignTheme(campaign)
  
  if (intensity === 'primary') {
    return { color: theme.textColor }
  } else {
    // For muted text, use a lighter version of the text color
    return { color: `${theme.textColor}CC` } // 80% opacity
  }
}

/**
 * Simple contrast color calculation (black or white based on background brightness)
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // Return black or white based on brightness
  return brightness > 128 ? '#000000' : '#FFFFFF'
}

/**
 * Apply theme to background sections (like hero sections)
 */
export function getThemedBackgroundStyles(campaign?: Campaign, overlayOpacity = 0.4) {
  const theme = getCampaignTheme(campaign)
  
  return {
    backgroundColor: theme.backgroundColor,
    '--overlay-color': `${theme.textColor}${Math.round(overlayOpacity * 255).toString(16).padStart(2, '0')}`
  } as React.CSSProperties
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