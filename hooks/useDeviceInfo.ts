'use client'

import { useState, useEffect } from 'react'
import { DeviceInfo } from '@/components/campaign-renderer/types'

// =============================================================================
// DEVICE INFO HOOK
// =============================================================================

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Default values for SSR
    return {
      type: 'desktop',
      screenSize: { width: 1200, height: 800 },
      orientation: 'landscape',
      touchCapable: false,
      userAgent: '',
      pixelRatio: 1
    }
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Determine device type based on screen width
      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
      if (width <= 768) {
        type = 'mobile'
      } else if (width <= 1024) {
        type = 'tablet'
      }

      // Determine orientation
      const orientation = width > height ? 'landscape' : 'portrait'

      // Check touch capability
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Get pixel ratio
      const pixelRatio = window.devicePixelRatio || 1

      const newDeviceInfo: DeviceInfo = {
        type,
        screenSize: { width, height },
        orientation,
        touchCapable,
        userAgent: navigator.userAgent,
        pixelRatio
      }

      setDeviceInfo(newDeviceInfo)
    }

    // Initial update
    updateDeviceInfo()

    // Listen for resize events
    const handleResize = () => {
      updateDeviceInfo()
    }

    // Listen for orientation change
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateDeviceInfo, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return deviceInfo
} 