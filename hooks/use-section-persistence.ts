import { useState, useEffect, useCallback } from 'react'

interface SectionState {
  isCollapsed: boolean
}

interface SectionStates {
  [sectionId: string]: SectionState
}

interface CampaignSectionStates {
  [campaignId: string]: SectionStates
}

export function useSectionPersistence(campaignId: string) {
  const [sectionStates, setSectionStates] = useState<SectionStates>({})

  // Get storage key for the campaign
  const getStorageKey = useCallback((cId: string) => `campaign-sections-${cId}`, [])

  // Load states from localStorage on mount
  useEffect(() => {
    if (!campaignId) return

    try {
      const stored = localStorage.getItem(getStorageKey(campaignId))
      if (stored) {
        const parsedStates = JSON.parse(stored) as SectionStates
        setSectionStates(parsedStates)
      }
    } catch (error) {
      console.warn('Failed to load section states from localStorage:', error)
    }
  }, [campaignId, getStorageKey])

  // Save states to localStorage whenever they change
  const saveStates = useCallback((states: SectionStates) => {
    if (!campaignId) return

    try {
      localStorage.setItem(getStorageKey(campaignId), JSON.stringify(states))
    } catch (error) {
      console.warn('Failed to save section states to localStorage:', error)
    }
  }, [campaignId, getStorageKey])

  // Get collapse state for a specific section
  const getSectionState = useCallback((sectionId: string): SectionState => {
    return sectionStates[sectionId] || { isCollapsed: false }
  }, [sectionStates])

  // Update collapse state for a specific section
  const setSectionState = useCallback((sectionId: string, state: Partial<SectionState>) => {
    setSectionStates(prevStates => {
      const newStates = {
        ...prevStates,
        [sectionId]: {
          ...prevStates[sectionId],
          ...state
        }
      }
      saveStates(newStates)
      return newStates
    })
  }, [saveStates])

  // Update collapse state specifically
  const setSectionCollapsed = useCallback((sectionId: string, isCollapsed: boolean) => {
    setSectionState(sectionId, { isCollapsed })
  }, [setSectionState])

  // Get collapse state specifically
  const isSectionCollapsed = useCallback((sectionId: string): boolean => {
    return getSectionState(sectionId).isCollapsed
  }, [getSectionState])

  // Clear all states for the campaign
  const clearStates = useCallback(() => {
    if (!campaignId) return

    setSectionStates({})
    try {
      localStorage.removeItem(getStorageKey(campaignId))
    } catch (error) {
      console.warn('Failed to clear section states from localStorage:', error)
    }
  }, [campaignId, getStorageKey])

  return {
    getSectionState,
    setSectionState,
    setSectionCollapsed,
    isSectionCollapsed,
    clearStates
  }
} 