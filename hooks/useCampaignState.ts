'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { SectionWithOptions } from '@/lib/types/database'

// =============================================================================
// CAMPAIGN STATE HOOK
// =============================================================================

interface CampaignStateHookReturn {
  // State
  currentSection: number
  userInputs: Record<string, any>
  completedSections: Set<number>
  sessionId: string
  leadId?: string
  startTime: Date
  
  // Navigation
  goToSection: (index: number) => void
  goNext: () => void
  goPrevious: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  
  // Data management
  updateResponse: (sectionId: string, fieldId: string, value: any, metadata?: any) => void
  completeSection: (sectionIndex: number, data: any) => void
  resetCampaign: () => void
  
  // Progress
  progress: number
  totalSections: number
  isComplete: boolean
}

export function useCampaignState(
  sections: SectionWithOptions[],
  initialSection: number = 0,
  onLeadCreate?: (leadData: any) => Promise<string | undefined>,
  onProgressUpdate?: (progress: number, sectionIndex: number) => void
): CampaignStateHookReturn {
  
  // Generate session ID once using proper UUID format
  const sessionIdRef = useRef<string>(
    // Generate a proper UUID v4 format for database compatibility
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  )

  // Core state
  const [currentSection, setCurrentSection] = useState(initialSection)
  const [userInputs, setUserInputs] = useState<Record<string, any>>({})
  const [completedSectionsArray, setCompletedSectionsArray] = useState<number[]>([])
  const [leadId, setLeadId] = useState<string | undefined>()
  const [startTime] = useState(new Date())

  // Create stable Set reference - only recreate when array actually changes
  const completedSections = useMemo(() => 
    new Set(completedSectionsArray), 
    [completedSectionsArray]
  )

  // Stable navigation functions with consistent dependencies
  const goToSection = useCallback((index: number) => {
    if (index >= 0 && index < sections.length && index !== currentSection) {
      setCurrentSection(index)
    }
  }, [sections.length, currentSection])

  const goNext = useCallback(() => {
    setCurrentSection(prev => prev < sections.length - 1 ? prev + 1 : prev)
  }, [sections.length])

  const goPrevious = useCallback(() => {
    setCurrentSection(prev => prev > 0 ? prev - 1 : prev)
  }, [])

  // Memoize navigation state to prevent unnecessary re-renders
  const navigationState = useMemo(() => ({
    canGoNext: currentSection < sections.length - 1,
    canGoPrevious: currentSection > 0
  }), [currentSection, sections.length])

  // Stable data management functions
  const updateResponse = useCallback(async (
    sectionId: string, 
    fieldId: string, 
    value: any, 
    metadata?: any
  ) => {
    // Handle file uploads to Supabase storage
    let processedValue = value
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      console.log('📁 File upload detected in useCampaignState, uploading to Supabase storage...')
      try {
        // Import upload function dynamically
        const { uploadFiles } = await import('@/lib/supabase/storage')
        
        // Get campaignId from metadata or default for preview mode  
        const campaignId = metadata?.campaignId || 'preview-campaign'
        
        // Upload files to storage
        const uploadedFileInfos = await uploadFiles(
          value as File[],
          campaignId,
          sectionId,
          sessionIdRef.current // Use session ID as lead ID for now
        )
        
        processedValue = uploadedFileInfos
        console.log('✅ Files uploaded successfully:', uploadedFileInfos.length, 'files')
        
      } catch (error) {
        console.error('❌ File upload failed:', error)
        // Fall back to raw files if upload fails
        processedValue = value
      }
    }
    
    setUserInputs(prev => {
      // Prevent unnecessary updates if value hasn't changed
      const currentValue = prev[sectionId]?.[fieldId]
      if (currentValue === processedValue) return prev
      
      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: processedValue,
          [`${fieldId}_metadata`]: metadata
        }
      }
    })
  }, [])

  const completeSection = useCallback(async (sectionIndex: number, data: any) => {
    // Allow re-completion of sections - don't prevent users from going forward after going back
    // The old logic prevented navigation when users modified responses in completed sections
    
    // Always update user inputs with the latest section data
    const updatedInputs = { ...userInputs, ...data }
    setUserInputs(updatedInputs)
    
    // Mark section as completed (will be a no-op if already completed)
    const newCompletedSections = new Set(completedSections)
    newCompletedSections.add(sectionIndex)
    setCompletedSectionsArray(Array.from(newCompletedSections))
    
    // Handle lead creation for capture sections (only if not already created)
    if (sections[sectionIndex]?.type === 'capture' && !leadId && onLeadCreate) {
      try {
        const newLeadId = await onLeadCreate(data)
        if (newLeadId) {
          setLeadId(newLeadId)
        }
      } catch (error) {
        console.error('Error creating lead:', error)
      }
    }
    
    // Always allow navigation to the next section when user clicks continue
    // This ensures users can move forward after modifying responses in completed sections
    if (sectionIndex === currentSection) {
      const nextIndex = sectionIndex + 1
      if (nextIndex < sections.length) {
        setCurrentSection(nextIndex)
      }
    }
  }, [sections, userInputs, completedSections, currentSection, leadId, onLeadCreate])

  const resetCampaign = useCallback(() => {
    setCurrentSection(0)
    setUserInputs({})
    setCompletedSectionsArray([])
    setLeadId(undefined)
  }, [])

  // Memoize progress calculations to prevent unnecessary re-renders
  const progressState = useMemo(() => ({
    progress: Math.round((completedSections.size / sections.length) * 100),
    totalSections: sections.length,
    isComplete: completedSections.size === sections.length
  }), [completedSections.size, sections.length])

  // Auto-save functionality (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Could implement auto-save logic here
      // For now, just store in localStorage as backup
      try {
        localStorage.setItem(`campaign_state_${sessionIdRef.current}`, JSON.stringify({
          currentSection,
          userInputs,
          completedSections: completedSectionsArray,
          leadId,
          startTime,
          lastUpdated: new Date()
        }))
      } catch (error) {
        console.warn('Failed to save campaign state to localStorage:', error)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentSection, userInputs, completedSectionsArray, leadId, startTime])

  // Return stable object references
  return useMemo(() => ({
    // State
    currentSection,
    userInputs,
    completedSections,
    sessionId: sessionIdRef.current,
    leadId,
    startTime,
    
    // Navigation
    goToSection,
    goNext,
    goPrevious,
    canGoNext: navigationState.canGoNext,
    canGoPrevious: navigationState.canGoPrevious,
    
    // Data management
    updateResponse,
    completeSection,
    resetCampaign,
    
    // Progress
    progress: progressState.progress,
    totalSections: progressState.totalSections,
    isComplete: progressState.isComplete
  }), [
    currentSection,
    userInputs,
    completedSections,
    leadId,
    startTime,
    goToSection,
    goNext,
    goPrevious,
    navigationState.canGoNext,
    navigationState.canGoPrevious,
    updateResponse,
    completeSection,
    resetCampaign,
    progressState.progress,
    progressState.totalSections,
    progressState.isComplete
  ])
} 