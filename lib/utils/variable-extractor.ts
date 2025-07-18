/**
 * Variable Extractor Utility
 * 
 * This utility extracts variables from campaign sections to make them available
 * for use in logic sections via the @-mention system.
 */

import type { CampaignSection } from '@/lib/types/campaign-builder'
import type { CampaignVariable, VariableType, CreateCampaignVariable } from '@/lib/types/database'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VariableInfo {
  id: string
  name: string
  displayName: string
  type: VariableType
  description: string
  sectionId: string
  sectionTitle: string
  sectionType: string
  previewValue?: string
  source: 'user_input'
}

export interface VariableExtractionOptions {
  includePreviewValues?: boolean
  filterByType?: VariableType[]
  excludeSectionTypes?: string[]
}

// =============================================================================
// VARIABLE EXTRACTION FUNCTIONS
// =============================================================================

/**
 * Extract variables from a single section
 */
export function extractVariablesFromSection(
  section: CampaignSection,
  options: VariableExtractionOptions = {}
): VariableInfo[] {
  const variables: VariableInfo[] = []
  
  // Skip hidden sections or unsupported types
  if (!section.isVisible || 
      options.excludeSectionTypes?.includes(section.type)) {
    return variables
  }

  switch (section.type) {
    case 'question-text':
      variables.push({
        id: `${section.id}_response`,
        name: createVariableName(section.title),
        displayName: section.title || 'Text Response',
        type: 'text',
        description: `Text response from: ${section.title}`,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionType: section.type,
        previewValue: options.includePreviewValues ? 'Sample text response...' : undefined,
        source: 'user_input'
      })
      break

    case 'question-multiple-choice':
      const settings = section.settings as any
      const selectionType = settings?.selectionType || 'single'
      
      variables.push({
        id: `${section.id}_response`,
        name: createVariableName(section.title),
        displayName: section.title || 'Choice Response',
        type: selectionType === 'multiple' ? 'array' : 'text',
        description: `${selectionType === 'multiple' ? 'Multiple choice' : 'Single choice'} response from: ${section.title}`,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionType: section.type,
        previewValue: options.includePreviewValues ? 
          (selectionType === 'multiple' ? '["Option 1", "Option 2"]' : 'Option 1') : 
          undefined,
        source: 'user_input'
      })
      break

    case 'question-slider':
      variables.push({
        id: `${section.id}_response`,
        name: createVariableName(section.title),
        displayName: section.title || 'Slider Value',
        type: 'number',
        description: `Numeric slider value from: ${section.title}`,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionType: section.type,
        previewValue: options.includePreviewValues ? '75' : undefined,
        source: 'user_input'
      })
      break

    case 'question-upload':
      variables.push({
        id: `${section.id}_files`,
        name: createVariableName(`${section.title}_files`),
        displayName: section.title || 'Uploaded Files',
        type: 'array',
        description: `File upload data from: ${section.title}`,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionType: section.type,
        previewValue: options.includePreviewValues ? '[{"name": "document.pdf", "size": 1024000, "type": "application/pdf"}]' : undefined,
        source: 'user_input'
      })
      break

    case 'capture':
      const captureSettings = section.settings as any
      const enabledFields = captureSettings?.enabledFields || {}
      
      // Extract each enabled field as a separate variable
      if (enabledFields.name) {
        variables.push({
          id: `${section.id}_name`,
          name: createVariableName(`${section.title}_name`),
          displayName: `${section.title} - Name`,
          type: 'text',
          description: `Name field from: ${section.title}`,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionType: section.type,
          previewValue: options.includePreviewValues ? 'John Doe' : undefined,
          source: 'user_input'
        })
      }
      
      if (enabledFields.email) {
        variables.push({
          id: `${section.id}_email`,
          name: createVariableName(`${section.title}_email`),
          displayName: `${section.title} - Email`,
          type: 'text',
          description: `Email field from: ${section.title}`,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionType: section.type,
          previewValue: options.includePreviewValues ? 'john@example.com' : undefined,
          source: 'user_input'
        })
      }
      
      if (enabledFields.phone) {
        variables.push({
          id: `${section.id}_phone`,
          name: createVariableName(`${section.title}_phone`),
          displayName: `${section.title} - Phone`,
          type: 'text',
          description: `Phone field from: ${section.title}`,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionType: section.type,
          previewValue: options.includePreviewValues ? '+1 (555) 123-4567' : undefined,
          source: 'user_input'
        })
      }
      break

    // Skip other section types for now (info, output, etc.)
    default:
      break
  }

  // Filter by type if specified
  if (options.filterByType?.length) {
    return variables.filter(v => options.filterByType!.includes(v.type))
  }

  return variables
}

/**
 * Extract variables from all sections in a campaign
 */
export function extractVariablesFromCampaign(
  sections: CampaignSection[],
  options: VariableExtractionOptions = {}
): VariableInfo[] {
  // Sort sections by order to ensure proper dependency resolution
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  
  const allVariables: VariableInfo[] = []
  
  for (const section of sortedSections) {
    const sectionVariables = extractVariablesFromSection(section, options)
    allVariables.push(...sectionVariables)
  }
  
  return allVariables
}

/**
 * Extract variables available for a specific section (only previous sections)
 */
export function extractAvailableVariablesForSection(
  sections: CampaignSection[],
  targetSectionOrder: number,
  options: VariableExtractionOptions = {}
): VariableInfo[] {
  // Only include sections that come before the target section
  const previousSections = sections.filter(section => 
    section.order < targetSectionOrder && section.isVisible
  )
  
  return extractVariablesFromCampaign(previousSections, options)
}

/**
 * Convert variable info to campaign variable format for database storage
 */
export function variableInfoToCampaignVariable(
  variable: VariableInfo,
  campaignId: string
): CreateCampaignVariable {
  return {
    campaign_id: campaignId,
    name: variable.name,
    type: variable.type,
    default_value: variable.previewValue || null,
    description: variable.description,
    source: variable.source,
    configuration: {}
  }
}

/**
 * Extract rich context for a specific section, including content, sub-headings, and info section content
 */
export function extractRichContextForSection(
  sections: CampaignSection[],
  targetSectionOrder: number
): {
  questionContext: string[]
  contentContext: string[]
  variables: string[]
} {
  const precedingSections = sections.filter(s => s.order < targetSectionOrder)
  
  const questionContext: string[] = []
  const contentContext: string[] = []
  const variables: string[] = []

  precedingSections.forEach(section => {
    const settings = section.settings as any

    // Skip capture sections - they're for lead generation, not AI processing
    if (section.type.includes('capture')) {
      return
    }

    // Extract from question sections
    if (section.type.includes('question-')) {
      if (section.type === 'question-slider-multiple') {
        // Handle multiple sliders - extract each individual slider
        if (settings.sliders && Array.isArray(settings.sliders)) {
          settings.sliders.forEach((slider: any) => {
            if (slider.variableName && slider.label) {
              questionContext.push(slider.label)
              variables.push(slider.variableName)
            }
          })
        }
      } else if (section.title) {
        // Handle single-input question sections
        const questionText = settings?.content || settings?.questionText || section.title || 'Untitled Question'
        questionContext.push(questionText)

        // Extract variable name using the same logic as createVariableName
        const variableName = settings?.variableName || 
                            createVariableName(section.title) || 
                            `question_${section.order}`
        variables.push(variableName)

        // Add options for multiple choice questions
        if (section.type === 'question-multiple-choice' && settings?.options) {
          const options = settings.options.map((opt: any) => opt.text || opt.label || opt).join(', ')
          questionContext.push(`Options: ${options}`)
        }
      }
    }

    // Extract from content sections
    if (section.type.includes('content-') || section.type === 'info' || section.type === 'hero') {
      const contentText = settings?.content || settings?.text || settings?.description || section.title
      if (contentText && contentText.trim()) {
        contentContext.push(contentText)
      }

      // Extract sub-headings if available
      if (settings?.subtitle || settings?.subheading) {
        contentContext.push(`Subheading: ${settings.subtitle || settings.subheading}`)
      }
    }
  })

  return {
    questionContext,
    contentContext,
    variables
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a valid variable name from a section title
 */
export function createVariableName(title: string): string {
  if (!title) return 'untitled_variable'
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '') // Remove special characters but keep underscores
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .substring(0, 50) // Limit length
    || 'untitled_variable' // Fallback if empty
}

/**
 * Validate variable name format
 */
export function isValidVariableName(name: string): boolean {
  // Must start with letter or underscore, contain only alphanumeric and underscores
  const variableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  return variableNameRegex.test(name) && name.length <= 50
}

/**
 * Sanitize variable name to make it valid
 */
export function sanitizeVariableName(name: string): string {
  if (!name) return 'variable'
  
  let sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]+/, '') // Remove leading numbers
    .replace(/_+/g, '_') // Replace multiple underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
  
  // Ensure it starts with a letter or underscore
  if (sanitized && !/^[a-z_]/.test(sanitized)) {
    sanitized = 'var_' + sanitized
  }
  
  return sanitized.substring(0, 50) || 'variable'
} 