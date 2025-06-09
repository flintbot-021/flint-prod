'use client'

import { useState, useEffect, useCallback } from 'react'
import { NetworkState } from '@/components/campaign-renderer/types'

// =============================================================================
// NETWORK STATE HOOK
// =============================================================================

export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>(() => {
    // Default values for SSR
    return {
      isOnline: true,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0
    }
  })

  const updateNetworkState = useCallback(() => {
    const isOnline = navigator.onLine
    
    // Type assertion for navigator connection
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    let connectionType = 'unknown'
    let effectiveType = 'unknown'
    let downlink = 0

    if (connection) {
      connectionType = connection.type || connection.connectionType || 'unknown'
      effectiveType = connection.effectiveType || 'unknown'
      downlink = connection.downlink || 0
    }

    setNetworkState(prev => ({
      ...prev,
      isOnline,
      connectionType,
      effectiveType,
      downlink,
      ...(isOnline !== prev.isOnline && {
        [isOnline ? 'lastOnline' : 'lastOffline']: new Date()
      })
    }))
  }, [])

  useEffect(() => {
    // Initial update
    updateNetworkState()

    // Event listeners
    const handleOnline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date()
      }))
    }

    const handleOffline = () => {
      setNetworkState(prev => ({
        ...prev,
        isOnline: false,
        lastOffline: new Date()
      }))
    }

    const handleConnectionChange = () => {
      updateNetworkState()
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [updateNetworkState])

  return networkState
} 