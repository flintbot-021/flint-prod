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
 * Extract the actual response value from a user input, resolving option IDs to meaningful values
 */
export function extractResponseValue(response: any, section: SectionWithOptions): any {
  let value = response
  
  // Handle nested response objects
  if (typeof response === 'object' && response !== null && response.response) {
    value = response.response
  }
  
  // For multiple choice sections, resolve option IDs to actual values
  if (section.type === 'multiple_choice' && typeof value === 'string') {
    // First, try to find options in section.options (from section_options table)
    if (section.options && section.options.length > 0) {
      const matchedOption = section.options.find((opt: any) => opt.value === value)
      if (matchedOption) {
        // Return the human-readable label from section_options table
        return matchedOption.label
      }
    }
    
    // If not found, try the section configuration (campaign builder stores options here)
    if (section.configuration) {
      const config = section.configuration as any
      if (config.options && Array.isArray(config.options)) {
        // Campaign builder format: { id: 'option-1', text: 'Option 1', order: 1 }
        const configOption = config.options.find((opt: any) => opt.id === value)
        if (configOption && configOption.text) {
          // Return the text field from campaign builder format
          return configOption.text
        }
      }
    }
  }
  
  // For slider sections, the value might already be the actual number
  if (section.type === 'slider') {
    return value // Should already be the numeric value
  }
  
  // For text questions, return as-is
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
  
  console.log('🔍 Building variables from inputs...')
  console.log('📋 Sections:', sections.map(s => ({ id: s.id, title: s.title, type: s.type, optionsCount: s.options?.length || 0 })))
  console.log('📝 User inputs:', userInputs)
  
  sections.forEach(section => {
    // Only process question sections
    if (isQuestionSection(section.type) && section.title) {
      const variableName = titleToVariableName(section.title)
      const userResponse = userInputs[section.id]
      
      if (userResponse) {
        const resolvedValue = extractResponseValue(userResponse, section)
        variables[variableName] = resolvedValue
        
        console.log(`✅ Variable "${variableName}": ${userResponse} → ${resolvedValue}`)
        if (section.options && section.type === 'multiple_choice') {
          console.log(`   Options available:`, section.options.map((opt: any) => `${opt.value}="${opt.label}"`))
        }
      } else {
        console.log(`⚠️ No response found for section ${section.id} (${section.title})`)
      }
    }
  })
  
  console.log('🎯 Final variables:', variables)
  return variables
}

/**
 * Extract available variables from sections for use in other components
 * Returns array of variable info objects
 */
export function getVariablesFromSections(sections: any[]): Array<{name: string; description: string; type: 'input' | 'output'}> {
  const variables: Array<{name: string; description: string; type: 'input' | 'output'}> = []
  
  sections.forEach(section => {
    // Input variables from question sections
    if (isQuestionSection(section.type) && section.title) {
      const variableName = titleToVariableName(section.title)
      variables.push({
        name: variableName,
        description: `User input from: ${section.title}`,
        type: 'input'
      })
    }
    
    // Output variables from AI logic sections
    if (section.type === 'logic-ai' && section.settings?.outputVariables) {
      section.settings.outputVariables.forEach((outputVar: any) => {
        if (outputVar.name) {
          variables.push({
            name: outputVar.name,
            description: outputVar.description || `AI output: ${outputVar.name}`,
            type: 'output'
          })
        }
      })
    }
  })
  
  return variables
} 