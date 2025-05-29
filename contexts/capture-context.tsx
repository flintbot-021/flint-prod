'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface CaptureState {
  isCompleted: boolean
  leadId?: string
  campaignId?: string
}

interface CaptureContextType {
  captureState: CaptureState
  markCaptureCompleted: (leadId: string) => void
  resetCapture: () => void
  isCaptureRequired: boolean
  setCaptureRequired: (required: boolean) => void
}

const CaptureContext = createContext<CaptureContextType | undefined>(undefined)

interface CaptureProviderProps {
  children: React.ReactNode
  campaignId?: string
  persistToStorage?: boolean
}

export function CaptureProvider({ 
  children, 
  campaignId,
  persistToStorage = true 
}: CaptureProviderProps) {
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCompleted: false,
    leadId: undefined,
    campaignId
  })
  
  const [isCaptureRequired, setCaptureRequired] = useState(false)
  
  // Load state from localStorage on mount if persistence is enabled
  useEffect(() => {
    if (!persistToStorage || !campaignId) return
    
    const storageKey = `flint-capture-${campaignId}`
    const savedState = localStorage.getItem(storageKey)
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setCaptureState(parsed)
      } catch (error) {
        console.warn('Failed to parse saved capture state:', error)
      }
    }
  }, [campaignId, persistToStorage])
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!persistToStorage || !campaignId) return
    
    const storageKey = `flint-capture-${campaignId}`
    localStorage.setItem(storageKey, JSON.stringify(captureState))
  }, [captureState, campaignId, persistToStorage])

  const markCaptureCompleted = (leadId: string) => {
    setCaptureState(prev => ({
      ...prev,
      isCompleted: true,
      leadId
    }))
  }

  const resetCapture = () => {
    setCaptureState(prev => ({
      ...prev,
      isCompleted: false,
      leadId: undefined
    }))
    
    // Clear from localStorage if persistence is enabled
    if (persistToStorage && campaignId) {
      const storageKey = `flint-capture-${campaignId}`
      localStorage.removeItem(storageKey)
    }
  }

  const value: CaptureContextType = {
    captureState,
    markCaptureCompleted,
    resetCapture,
    isCaptureRequired,
    setCaptureRequired
  }

  return (
    <CaptureContext.Provider value={value}>
      {children}
    </CaptureContext.Provider>
  )
}

export function useCapture() {
  const context = useContext(CaptureContext)
  if (!context) {
    throw new Error('useCapture must be used within a CaptureProvider')
  }
  return context
}

// Hook for checking if results should be gated
export function useResultsGating() {
  const { captureState, isCaptureRequired } = useCapture()
  
  const isResultsLocked = isCaptureRequired && !captureState.isCompleted
  const canAccessResults = !isCaptureRequired || captureState.isCompleted
  
  return {
    isResultsLocked,
    canAccessResults,
    captureCompleted: captureState.isCompleted,
    leadId: captureState.leadId
  }
} 