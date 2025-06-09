'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set<number>())
  const [leadId, setLeadId] = useState<string | undefined>()
  const [startTime] = useState(new Date())

  // Navigation functions
  const goToSection = useCallback((index: number) => {
    if (index >= 0 && index < sections.length) {
      setCurrentSection(index)
    }
  }, [sections.length])

  const goNext = useCallback(() => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }, [currentSection, sections.length])

  const goPrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }, [currentSection])

  // Navigation state
  const canGoNext = currentSection < sections.length - 1
  const canGoPrevious = currentSection > 0

  // Data management
  const updateResponse = useCallback((
    sectionId: string, 
    fieldId: string, 
    value: any, 
    metadata?: any
  ) => {
    setUserInputs(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldId]: value,
        [`${fieldId}_metadata`]: metadata
      }
    }))
  }, [])

  const completeSection = useCallback(async (sectionIndex: number, data: any) => {
    // Update user inputs with section data
    setUserInputs(prev => ({ ...prev, ...data }))
    
    // Mark section as completed
    setCompletedSections(prev => new Set([...prev, sectionIndex]))
    
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
    const progress = Math.round(((sectionIndex + 1) / sections.length) * 100)
    onProgressUpdate?.(progress, sectionIndex)
    
    // Auto-advance to next section
    if (sectionIndex < sections.length - 1) {
      setTimeout(() => {
        setCurrentSection(sectionIndex + 1)
      }, 300) // Small delay for better UX
    }
  }, [sections, leadId, onLeadCreate, onProgressUpdate])

  const resetCampaign = useCallback(() => {
    setCurrentSection(0)
    setUserInputs({})
    setCompletedSections(new Set())
    setLeadId(undefined)
  }, [])

  // Progress calculations
  const progress = Math.round((completedSections.size / sections.length) * 100)
  const totalSections = sections.length
  const isComplete = completedSections.size === sections.length

  // Auto-save functionality (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Could implement auto-save logic here
      // For now, just store in localStorage as backup
      try {
        localStorage.setItem(`campaign_state_${sessionIdRef.current}`, JSON.stringify({
          currentSection,
          userInputs,
          completedSections: Array.from(completedSections),
          leadId,
          startTime,
          lastUpdated: new Date()
        }))
      } catch (error) {
        console.warn('Failed to save campaign state to localStorage:', error)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentSection, userInputs, completedSections, leadId, startTime])

  return {
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
    canGoNext,
    canGoPrevious,
    
    // Data management
    updateResponse,
    completeSection,
    resetCampaign,
    
    // Progress
    progress,
    totalSections,
    isComplete
  }
} 