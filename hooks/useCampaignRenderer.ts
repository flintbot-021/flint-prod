'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { SectionWithOptions } from '@/lib/types/database'
import { useCampaignState } from './useCampaignState'
import { useDeviceInfo } from './useDeviceInfo'
import { useNetworkState } from './useNetworkState'
import { useErrorHandler } from './useErrorHandler'
import { useVariableEngine } from './useVariableEngine'

// =============================================================================
// COMBINED CAMPAIGN RENDERER HOOK
// =============================================================================

interface CampaignRendererOptions {
  sections: SectionWithOptions[]
  initialSection?: number
  campaignId?: string
  onLeadCreate?: (leadData: any) => Promise<string | undefined>
  onProgressUpdate?: (progress: number, sectionIndex: number) => void
  campaignData?: Record<string, any>
}

export function useCampaignRenderer({
  sections,
  initialSection = 0,
  campaignId,
  onLeadCreate,
  onProgressUpdate,
  campaignData = {}
}: CampaignRendererOptions) {
  
  // Initialize all hooks
  const campaignState = useCampaignState(
    sections, 
    initialSection, 
    onLeadCreate, 
    onProgressUpdate
  )
  
  const deviceInfo = useDeviceInfo()
  const networkState = useNetworkState()
  const errorHandler = useErrorHandler()
  const variableEngine = useVariableEngine({
    campaignData,
    leadData: {},
    sessionData: { sessionId: campaignState.sessionId }
  })

  // Update variable context when campaign state changes
  useEffect(() => {
    variableEngine.updateContext({
      leadData: campaignState.userInputs,
      sessionData: {
        sessionId: campaignState.sessionId,
        currentSection: campaignState.currentSection,
        progress: campaignState.progress,
        startTime: campaignState.startTime,
        leadId: campaignState.leadId
      }
    })
  }, [
    campaignState.userInputs, 
    campaignState.sessionId, 
    campaignState.currentSection,
    campaignState.progress,
    campaignState.leadId
    // Note: Removed variableEngine from dependencies to prevent infinite loop
  ])

  // Enhanced section complete handler with variable context updates
  const handleSectionComplete = useCallback(async (sectionIndex: number, data: any) => {
    try {
      // Update variable context with new data
      variableEngine.updateContext({
        leadData: { ...campaignState.userInputs, ...data }
      })
      
      // Complete the section
      await campaignState.completeSection(sectionIndex, data)
      
    } catch (error) {
      errorHandler.handleError(error as Error, `section_${sectionIndex}_completion`)
    }
  }, [variableEngine, campaignState.userInputs, campaignState.completeSection, errorHandler.handleError])

  // Enhanced response update handler
  const handleResponseUpdate = useCallback((
    sectionId: string, 
    fieldId: string, 
    value: any, 
    metadata?: any
  ) => {
    try {
      // Update campaign state with campaignId in metadata for file uploads
      campaignState.updateResponse(sectionId, fieldId, value, {
        ...metadata,
        campaignId
      })
      
      // Update variable context immediately for real-time interpolation
      const updatedData = {
        ...campaignState.userInputs,
        [sectionId]: {
          ...campaignState.userInputs[sectionId],
          [fieldId]: value
        }
      }
      
      variableEngine.updateContext({
        leadData: updatedData
      })
      
    } catch (error) {
      errorHandler.handleError(error as Error, `response_update_${sectionId}_${fieldId}`)
    }
  }, [campaignState.updateResponse, campaignState.userInputs, variableEngine, errorHandler.handleError, campaignId])

  // Get current section with processed content
  const getCurrentSection = useCallback(async () => {
    if (!sections[campaignState.currentSection]) return null
    
    const section = sections[campaignState.currentSection]
    
    try {
      // Process title and description with variables
      const processedTitle = section.title ? 
        await variableEngine.interpolateText(section.title) : ''
      const processedDescription = section.description ? 
        await variableEngine.interpolateText(section.description) : ''
      
      return {
        ...section,
        title: processedTitle,
        description: processedDescription
      }
    } catch (error) {
      errorHandler.handleError(error as Error, 'section_content_processing')
      return section // Return original on error
    }
  }, [sections, campaignState.currentSection, variableEngine, errorHandler.handleError])

  // Memoize the return value to prevent unnecessary re-creation
  return useMemo(() => ({
    // Campaign state
    ...campaignState,
    
    // Environment info
    deviceInfo,
    networkState,
    
    // Error handling
    error: errorHandler.error,
    clearError: errorHandler.clearError,
    
    // Variable processing
    processVariables: variableEngine.processVariables,
    variableContext: variableEngine.context,
    
    // Enhanced handlers
    handleSectionComplete,
    handleResponseUpdate,
    getCurrentSection,
    
    // Utilities
    isReady: sections.length > 0 && !errorHandler.error,
    hasNetworkIssues: !networkState.isOnline,
    isMobile: deviceInfo.type === 'mobile'
  }), [
    campaignState,
    deviceInfo,
    networkState,
    errorHandler.error,
    errorHandler.clearError,
    variableEngine.processVariables,
    variableEngine.context,
    handleSectionComplete,
    handleResponseUpdate,
    getCurrentSection,
    sections.length,
    networkState.isOnline
  ])
} 