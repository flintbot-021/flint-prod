import { SectionWithOptions } from '@/lib/types/database'

/**
 * Convert section title to valid variable name
 * "What is your name?" → "what_is_your_name"
 */
export function titleToVariableName(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

/**
 * Check if section type is a question section (should become a variable)
 */
export function isQuestionSection(sectionType: string): boolean {
  return sectionType.includes('question-') || 
         ['text_question', 'multiple_choice', 'slider'].includes(sectionType)
}

/**
 * Extract all question section variables from campaign sections
 * Returns mapping of variable name to original title
 */
export function extractSectionVariables(sections: SectionWithOptions[]): Record<string, string> {
  const variables: Record<string, string> = {}
  
  sections
    .filter(s => isQuestionSection(s.type))
    .forEach(section => {
      if (section.title) {
        const varName = titleToVariableName(section.title)
        variables[varName] = section.title // Store both for reference
      }
    })
    
  return variables
}

/**
 * Extract the actual response value from a user input, handling nested objects and choice conversion
 */
export function extractResponseValue(response: any, section: SectionWithOptions): any {
  let value = response
  
  // Handle nested response objects
  if (typeof response === 'object' && response !== null && response.response) {
    value = response.response
    
    // Convert choice IDs to text if needed
    if (typeof value === 'string' && value.startsWith('option-')) {
      const choice = section.options?.find((opt: any) => opt.value === value)
      value = choice?.label || value
    }
  }
  
  return value
}

/**
 * Simple function to build variables map from sections and user inputs
 * This replaces all the complex variable matching logic
 */
export function buildVariablesFromInputs(
  sections: SectionWithOptions[], 
  userInputs: Record<string, any>
): Record<string, any> {
  const variables: Record<string, any> = {}
  
  sections.forEach(section => {
    // Only process question sections
    if (isQuestionSection(section.type) && section.title) {
      const variableName = titleToVariableName(section.title)
      const userResponse = userInputs[section.id]
      
      if (userResponse) {
        variables[variableName] = extractResponseValue(userResponse, section)
      }
    }
  })
  
  return variables
} 