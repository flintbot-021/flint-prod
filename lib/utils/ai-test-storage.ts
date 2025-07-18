/**
 * Utility functions for managing AI test results in localStorage
 * Used for preview mode to show realistic AI-generated data
 */

export interface AITestResults {
  [variableName: string]: string | number | boolean
}

/**
 * Debug function to inspect what's in localStorage
 */
export function debugAITestStorage(): void {
  console.log('🐛 DEBUG: AI Test Storage Inspection')
  console.log('📦 Raw localStorage value:', localStorage.getItem('aiTestResults'))
  console.log('🗂️ Parsed results:', getAITestResults())
  console.log('🔢 Number of stored variables:', Object.keys(getAITestResults()).length)
  console.log('🏷️ Available variable names:', getAvailableAIVariables())
}

/**
 * Test function to manually store sample data (for debugging)
 */
export function testStoreAIResults(): void {
  const testData = {
    time: "45 minutes",
    speed: "8 mph", 
    far: "3.2 miles"
  }
  storeAITestResults(testData)
  console.log('🧪 Test data stored:', testData)
  console.log('🔍 Verification - retrieving time:', getAITestResult('time'))
  console.log('🔍 Verification - retrieving speed:', getAITestResult('speed'))
  console.log('🔍 Verification - retrieving far:', getAITestResult('far'))
}

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAIStorage = debugAITestStorage;
  (window as any).testStoreAIResults = testStoreAIResults
}

/**
 * Get stored AI test results from localStorage
 */
export function getAITestResults(): AITestResults {
  try {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem('aiTestResults')
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to retrieve AI test results:', error)
    return {}
  }
}

/**
 * Store AI test results in localStorage
 */
export function storeAITestResults(results: AITestResults): void {
  try {
    if (typeof window === 'undefined') return
    const existingData = getAITestResults()
    const updatedData = { ...existingData, ...results }
    localStorage.setItem('aiTestResults', JSON.stringify(updatedData))
    console.log('✅ AI test results stored:', updatedData)
    
    // Dispatch custom event to notify components of the update
    window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
      detail: updatedData 
    }))
  } catch (error) {
    console.error('Failed to store AI test results:', error)
  }
}

/**
 * Get a specific AI test result by variable name
 */
export function getAITestResult(variableName: string): string | number | boolean | null {
  const results = getAITestResults()
  return results[variableName] || null
}

/**
 * Clear all stored AI test results
 */
export function clearAITestResults(): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem('aiTestResults')
    console.log('✅ AI test results cleared')
  } catch (error) {
    console.error('Failed to clear AI test results:', error)
  }
}

/**
 * Replace variables in text with stored AI test results for preview mode
 * @param text - Text containing @variable references
 * @param fallbackText - Text to show if no test data available (default: variable name)
 */
export function replaceVariablesWithTestData(
  text: string, 
  fallbackText: string = 'placeholder'
): string {
  const results = getAITestResults()
  
  return text.replace(/@(\w+)/g, (match, variableName) => {
    const testValue = results[variableName]
    
    if (testValue !== undefined && testValue !== null) {
      return String(testValue)
    }
    
    // Return original @variable if no test data or fallback if specified
    return fallbackText === 'placeholder' ? match : fallbackText
  })
}

/**
 * Get all available AI variable names from stored results
 */
export function getAvailableAIVariables(): string[] {
  const results = getAITestResults()
  return Object.keys(results)
}

/**
 * Check if we have any stored AI test results
 */
export function hasAITestResults(): boolean {
  return Object.keys(getAITestResults()).length > 0
}

/**
 * Update a variable name in stored AI test results
 * Called when section titles change and variable names get updated
 */
export function updateAITestResultVariableName(
  oldVariableName: string,
  newVariableName: string
): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (!oldVariableName || !newVariableName || oldVariableName === newVariableName) {
      return false
    }

    const storedResults = getAITestResults()
    
    // Check if the old variable name exists in stored results
    if (!(oldVariableName in storedResults)) {
      console.log(`🔄 Variable "${oldVariableName}" not found in stored AI test results, no update needed`)
      return false
    }

    // Create updated results with new variable name
    const updatedResults = { ...storedResults }
    updatedResults[newVariableName] = updatedResults[oldVariableName]
    delete updatedResults[oldVariableName]

    // Store the updated results
    localStorage.setItem('aiTestResults', JSON.stringify(updatedResults))
    
    console.log(`✅ Updated AI test results: "${oldVariableName}" → "${newVariableName}"`)
    console.log('📊 Updated stored results:', updatedResults)
    
    // Dispatch custom event to notify components of the update
    window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
      detail: updatedResults 
    }))
    
    return true
  } catch (error) {
    console.error('Failed to update AI test result variable name:', error)
    return false
  }
}

/**
 * Update multiple variable names in stored AI test results
 * Called when AI logic section output variables are renamed
 */
export function updateAITestResultVariableNames(
  variableNameMap: Record<string, string>
): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (!variableNameMap || Object.keys(variableNameMap).length === 0) {
      return false
    }

    const storedResults = getAITestResults()
    let hasChanges = false
    const updatedResults = { ...storedResults }
    
    // Update each variable name mapping
    Object.entries(variableNameMap).forEach(([oldName, newName]) => {
      if (oldName !== newName && oldName in updatedResults) {
        updatedResults[newName] = updatedResults[oldName]
        delete updatedResults[oldName]
        hasChanges = true
        console.log(`🔄 Renaming AI test result: "${oldName}" → "${newName}"`)
      }
    })

    if (hasChanges) {
      // Store the updated results
      localStorage.setItem('aiTestResults', JSON.stringify(updatedResults))
      
      console.log(`✅ Updated ${Object.keys(variableNameMap).length} AI test result variable names`)
      console.log('📊 Updated stored results:', updatedResults)
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
        detail: updatedResults 
      }))
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error updating AI test result variable names:', error)
    return false
  }
} 