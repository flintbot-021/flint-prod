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
export function debugAITestStorage(campaignId?: string): void {
  console.log('🐛 DEBUG: AI Test Storage Inspection')
  if (campaignId) {
    console.log(`📦 Raw localStorage value for campaign ${campaignId}:`, localStorage.getItem(`aiTestResults_${campaignId}`))
    console.log('🗂️ Parsed results:', getAITestResults(campaignId))
    console.log('🔢 Number of stored variables:', Object.keys(getAITestResults(campaignId)).length)
    console.log('🏷️ Available variable names:', getAvailableAIVariables(campaignId))
  } else {
    console.log('⚠️ No campaignId provided - cannot show test results')
    // Show all campaign keys
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('aiTestResults_')) {
        keys.push(key)
      }
    }
    console.log('📦 Found AI test result keys:', keys)
  }
}

/**
 * Test function to manually store sample data (for debugging)
 */
export function testStoreAIResults(campaignId: string): void {
  if (!campaignId) {
    console.error('❌ testStoreAIResults requires campaignId')
    return
  }
  const testData = {
    time: "45 minutes",
    speed: "8 mph", 
    far: "3.2 miles"
  }
  storeAITestResults(testData, campaignId)
  console.log(`🧪 Test data stored for campaign ${campaignId}:`, testData)
  console.log('🔍 Verification - retrieving time:', getAITestResult('time', campaignId))
  console.log('🔍 Verification - retrieving speed:', getAITestResult('speed', campaignId))
  console.log('🔍 Verification - retrieving far:', getAITestResult('far', campaignId))
}

// Make it available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAIStorage = debugAITestStorage;
  (window as any).testStoreAIResults = testStoreAIResults
}

/**
 * Get stored AI test results from localStorage (campaign-scoped)
 */
export function getAITestResults(campaignId?: string): AITestResults {
  try {
    if (typeof window === 'undefined') return {}
    
    // If no campaignId provided, return empty (no more global fallback)
    if (!campaignId) {
      console.warn('getAITestResults called without campaignId - returning empty results')
      return {}
    }
    
    const key = `aiTestResults_${campaignId}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to retrieve AI test results:', error)
    return {}
  }
}

/**
 * Store AI test results in localStorage (campaign-scoped)
 */
export function storeAITestResults(results: AITestResults, campaignId: string): void {
  try {
    if (typeof window === 'undefined') return
    
    if (!campaignId) {
      console.error('storeAITestResults called without campaignId - cannot store results')
      return
    }
    
    const key = `aiTestResults_${campaignId}`
    const existingData = getAITestResults(campaignId)
    const updatedData = { ...existingData, ...results }
    localStorage.setItem(key, JSON.stringify(updatedData))
    console.log(`✅ AI test results stored for campaign ${campaignId}:`, updatedData)
    
    // Dispatch custom event to notify components of the update
    window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
      detail: { campaignId, data: updatedData }
    }))
  } catch (error) {
    console.error('Failed to store AI test results:', error)
  }
}

/**
 * Get a specific AI test result by variable name (campaign-scoped)
 */
export function getAITestResult(variableName: string, campaignId: string): string | number | boolean | null {
  const results = getAITestResults(campaignId)
  return results[variableName] || null
}

/**
 * Clear AI test results for a specific campaign
 */
export function clearAITestResults(campaignId: string): void {
  try {
    if (typeof window === 'undefined') return
    
    if (!campaignId) {
      console.error('clearAITestResults called without campaignId - cannot clear results')
      return
    }
    
    const key = `aiTestResults_${campaignId}`
    localStorage.removeItem(key)
    console.log(`✅ AI test results cleared for campaign ${campaignId}`)
  } catch (error) {
    console.error('Failed to clear AI test results:', error)
  }
}

/**
 * Clear all AI test results (for cleanup/debugging purposes)
 */
export function clearAllAITestResults(): void {
  try {
    if (typeof window === 'undefined') return
    
    // Find all aiTestResults keys and remove them
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('aiTestResults_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`✅ Cleared ${keysToRemove.length} AI test result entries`)
  } catch (error) {
    console.error('Failed to clear AI test results:', error)
  }
}

/**
 * Replace variables in text with stored AI test results for preview mode (campaign-scoped)
 * @param text - Text containing @variable references
 * @param campaignId - Campaign ID to scope the test results
 * @param fallbackText - Text to show if no test data available (default: variable name)
 */
export function replaceVariablesWithTestData(
  text: string, 
  campaignId: string,
  fallbackText: string = 'placeholder'
): string {
  const results = getAITestResults(campaignId)
  
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
 * Get all available AI variable names from stored results (campaign-scoped)
 */
export function getAvailableAIVariables(campaignId: string): string[] {
  const results = getAITestResults(campaignId)
  return Object.keys(results)
}

/**
 * Check if we have any stored AI test results (campaign-scoped)
 */
export function hasAITestResults(campaignId: string): boolean {
  return Object.keys(getAITestResults(campaignId)).length > 0
}

/**
 * Update a variable name in stored AI test results (campaign-scoped)
 * Called when section titles change and variable names get updated
 */
export function updateAITestResultVariableName(
  oldVariableName: string,
  newVariableName: string,
  campaignId: string
): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (!oldVariableName || !newVariableName || oldVariableName === newVariableName || !campaignId) {
      return false
    }

    const storedResults = getAITestResults(campaignId)
    
    // Check if the old variable name exists in stored results
    if (!(oldVariableName in storedResults)) {
      console.log(`🔄 Variable "${oldVariableName}" not found in stored AI test results for campaign ${campaignId}, no update needed`)
      return false
    }

    // Create updated results with new variable name
    const updatedResults = { ...storedResults }
    updatedResults[newVariableName] = updatedResults[oldVariableName]
    delete updatedResults[oldVariableName]

    // Store the updated results
    const key = `aiTestResults_${campaignId}`
    localStorage.setItem(key, JSON.stringify(updatedResults))
    
    console.log(`✅ Updated AI test results for campaign ${campaignId}: "${oldVariableName}" → "${newVariableName}"`)
    console.log('📊 Updated stored results:', updatedResults)
    
    // Dispatch custom event to notify components of the update
    window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
      detail: { campaignId, data: updatedResults }
    }))
    
    return true
  } catch (error) {
    console.error('Failed to update AI test result variable name:', error)
    return false
  }
}

/**
 * Update multiple variable names in stored AI test results (campaign-scoped)
 * Called when AI logic section output variables are renamed
 */
export function updateAITestResultVariableNames(
  variableNameMap: Record<string, string>,
  campaignId: string
): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (!variableNameMap || Object.keys(variableNameMap).length === 0 || !campaignId) {
      return false
    }

    const storedResults = getAITestResults(campaignId)
    let hasChanges = false
    const updatedResults = { ...storedResults }
    
    // Update each variable name mapping
    Object.entries(variableNameMap).forEach(([oldName, newName]) => {
      if (oldName !== newName && oldName in updatedResults) {
        updatedResults[newName] = updatedResults[oldName]
        delete updatedResults[oldName]
        hasChanges = true
        console.log(`🔄 Renaming AI test result for campaign ${campaignId}: "${oldName}" → "${newName}"`)
      }
    })

    if (hasChanges) {
      // Store the updated results
      const key = `aiTestResults_${campaignId}`
      localStorage.setItem(key, JSON.stringify(updatedResults))
      
      console.log(`✅ Updated ${Object.keys(variableNameMap).length} AI test result variable names for campaign ${campaignId}`)
      console.log('📊 Updated stored results:', updatedResults)
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('aiTestResultsUpdated', { 
        detail: { campaignId, data: updatedResults }
      }))
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error updating AI test result variable names:', error)
    return false
  }
} 