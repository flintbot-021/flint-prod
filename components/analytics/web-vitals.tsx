'use client'

import { useEffect, useRef } from 'react'
import { performanceTracker } from '@/lib/performance-tracking'

export function WebVitals() {
  const initialized = useRef(false)
  
  useEffect(() => {
    // Prevent duplicate initialization on tab switches
    if (initialized.current) return
    
    // Initialize performance tracking
    performanceTracker.trackPageLoad()
    initialized.current = true

    // Track Core Web Vitals using the web-vitals library
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric: any) => performanceTracker.trackWebVitals(metric))
      onFCP((metric: any) => performanceTracker.trackWebVitals(metric))
      onLCP((metric: any) => performanceTracker.trackWebVitals(metric))
      onTTFB((metric: any) => performanceTracker.trackWebVitals(metric))
      onINP((metric: any) => performanceTracker.trackWebVitals(metric))
    }).catch(() => {
      // Fallback: web-vitals library not installed
      console.log('Web Vitals library not available, using basic performance tracking')
    })

    // Track unhandled errors
    const handleError = (event: ErrorEvent) => {
      performanceTracker.trackError(new Error(event.message), 'unhandled_error')
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      performanceTracker.trackError(new Error(String(event.reason)), 'unhandled_promise_rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null // This component doesn't render anything
} 