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
         sectionType.includes('capture') ||
         ['text_question', 'multiple_choice', 'slider'].includes(sectionType)
}

/**
 * Check if section type supports multiple inputs per section
 */
export function isMultipleInputSection(sectionType: string): boolean {
  return sectionType.includes('-multiple')
}

/**
 * Check if a text_question section is actually an upload question
 */
export function isUploadQuestion(config: any): boolean {
  // Check for upload-specific configuration fields
  return !!(
    config.maxFiles ||
    config.allowImages ||
    config.allowDocuments ||
    config.allowVideo ||
    config.allowAudio ||
    config.maxFileSize
  )
}

/**
 * Check if section should be treated as a file variable for AI processing
 */
export function isFileVariable(section: SectionWithOptions): boolean {
  if (section.type === 'text_question') {
    return isUploadQuestion(section.configuration || {})
  }
  return false
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
 * Extract input variables with type information for AI processing
 * Returns array of variables with metadata
 */
export function extractInputVariablesWithTypes(sections: SectionWithOptions[], currentOrder: number): Array<{
  name: string
  title: string
  type: 'text' | 'file'
  section: SectionWithOptions
}> {
  return sections
    .filter(s => s.order_index < currentOrder && isQuestionSection(s.type) && s.title)
    .map(section => ({
      name: titleToVariableName(section.title!),
      title: section.title!,
      type: isFileVariable(section) ? 'file' : 'text',
      section
    }))
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
    // Options are now stored in section.configuration.options
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
  console.log('📋 Sections:', sections.map(s => ({ 
    id: s.id, 
    title: s.title, 
    type: s.type, 
    hasOptions: !!(s.configuration as any)?.options?.length,
    hasSliders: !!(s.configuration as any)?.sliders?.length
  })))
  console.log('📝 User inputs:', userInputs)
  
  sections.forEach(section => {
    // Only process question sections OR sections with sliders (for Multiple Sliders saved as 'info')
    if (isQuestionSection(section.type) || (section.configuration as any)?.sliders) {
      
      // Check if this is a Multiple Sliders section (either by type or by having sliders config)
      const isMultipleSliders = isMultipleInputSection(section.type) || 
                               (section.type.includes('slider-multiple')) ||
                               ((section.configuration as any)?.sliders?.length > 0)
      
      if (isMultipleSliders) {
        // Handle multiple-input sections (Multiple Sliders)
        const settings = section.configuration as any
        const sectionResponses = userInputs[section.id] || {}
        
        console.log(`🎯 Processing Multiple Sliders section ${section.id}:`, {
          type: section.type,
          hasSliders: !!settings.sliders,
          slidersCount: settings.sliders?.length || 0,
          sectionResponses
        })
        
        // For multiple sliders - check both type conditions and sliders config
        if ((section.type.includes('slider-multiple') || settings.sliders) && settings.sliders) {
          settings.sliders.forEach((slider: any) => {
            if (sectionResponses[slider.variableName] !== undefined) {
              variables[slider.variableName] = sectionResponses[slider.variableName]
              console.log(`✅ Multiple slider variable "${slider.variableName}": ${sectionResponses[slider.variableName]}`)
            } else {
              console.log(`⚠️ No response found for slider variable "${slider.variableName}" in section ${section.id}`)
            }
          })
        }
      } else if (section.title) {
        // Handle existing single-input sections (unchanged)
      const variableName = titleToVariableName(section.title)
      const userResponse = userInputs[section.id]
      
      if (userResponse) {
        const resolvedValue = extractResponseValue(userResponse, section)
        variables[variableName] = resolvedValue
        
        console.log(`✅ Variable "${variableName}": ${userResponse} → ${resolvedValue}`)
        if (section.type === 'multiple_choice' && section.configuration) {
          const config = section.configuration as any
          if (config.options && Array.isArray(config.options)) {
            console.log(`   Options available:`, config.options.map((opt: any) => `${opt.id}="${opt.text}"`))
          }
        }
      } else {
        console.log(`⚠️ No response found for section ${section.id} (${section.title})`)
        }
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