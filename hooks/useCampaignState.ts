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
  
  // Generate session ID once
  const sessionIdRef = useRef<string>(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
  const updateResponse = useCallback((
    sectionId: string, 
    fieldId: string, 
    value: any, 
    metadata?: any
  ) => {
    setUserInputs(prev => {
      // Prevent unnecessary updates if value hasn't changed
      const currentValue = prev[sectionId]?.[fieldId]
      if (currentValue === value) return prev
      
      return {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: value,
          [`${fieldId}_metadata`]: metadata
        }
      }
    })
  }, [])

  const completeSection = useCallback(async (sectionIndex: number, data: any) => {
    console.log('🎯 COMPLETE SECTION CALLED:')
    console.log('  Section Index:', sectionIndex)
    console.log('  Data received:', data)
    console.log('  Current userInputs before update:', userInputs)
    console.log('  Section already completed?', completedSections.has(sectionIndex))
    
    // Prevent duplicate completion
    if (completedSections.has(sectionIndex)) {
      console.log(`Section ${sectionIndex} already completed, skipping`)
      return
    }
    
    // Update user inputs with section data
    setUserInputs(prev => {
      const newUserInputs = { ...prev, ...data }
      console.log('  UserInputs updated to:', newUserInputs)
      return newUserInputs
    })
    
    // Mark section as completed using array update
    setCompletedSectionsArray(prev => 
      prev.includes(sectionIndex) ? prev : [...prev, sectionIndex]
    )
    
    // Handle lead creation for capture sections
    if (sections[sectionIndex]?.type === 'capture' && !leadId && onLeadCreate) {
      try {
        const newLeadId = await onLeadCreate(data)
        if (newLeadId) {
          setLeadId(newLeadId)
        }
      } catch (error) {
        console.error('Failed to create lead:', error)
      }
    }
    
    // Calculate progress
    const newCompletedCount = completedSections.has(sectionIndex) 
      ? completedSections.size 
      : completedSections.size + 1
    const progress = Math.round((newCompletedCount / sections.length) * 100)
    onProgressUpdate?.(progress, sectionIndex)
    
    // Auto-advance to next section
    if (sectionIndex < sections.length - 1) {
      setTimeout(() => {
        setCurrentSection(sectionIndex + 1)
      }, 300) // Small delay for better UX
    }
  }, [sections, leadId, onLeadCreate, onProgressUpdate, completedSections, userInputs])

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