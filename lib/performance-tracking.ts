'use client'

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent?: string
}

export interface WebVitalsData {
  CLS?: number
  FCP?: number
  FID?: number
  LCP?: number
  TTFB?: number
}

class PerformanceTracker {
  private endpoint = '/api/monitoring/performance'
  private isEnabled = true

  constructor() {
    // Disable tracking in development unless explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                     process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_TRACKING === 'true'
  }

  /**
   * Track Core Web Vitals
   */
  async trackWebVitals(metric: {
    name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB'
    value: number
    id: string
    delta: number
  }) {
    if (!this.isEnabled || typeof window === 'undefined') return

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          id: metric.id,
          delta: metric.delta
        } as PerformanceMetric & { id: string; delta: number })
      })
    } catch (error) {
      console.warn('Failed to track web vital:', error)
    }
  }

  /**
   * Track custom performance metrics
   */
  async trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled || typeof window === 'undefined') return

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata
        } as PerformanceMetric & { metadata?: Record<string, any> })
      })
    } catch (error) {
      console.warn('Failed to track custom metric:', error)
    }
  }

  /**
   * Track page load times
   */
  trackPageLoad() {
    if (!this.isEnabled || typeof window === 'undefined') return

    window.addEventListener('load', () => {
      // Use Performance API to get accurate timing
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (perfData) {
        this.trackCustomMetric('page_load_time', perfData.loadEventEnd - perfData.fetchStart)
        this.trackCustomMetric('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart)
        this.trackCustomMetric('first_byte', perfData.responseStart - perfData.fetchStart)
      }
    })
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: string, target?: string, value?: number) {
    if (!this.isEnabled) return

    this.trackCustomMetric('user_interaction', value || 1, {
      action,
      target,
      timestamp: Date.now()
    })
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string) {
    if (!this.isEnabled) return

    this.trackCustomMetric('error_count', 1, {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: Date.now()
    })
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker()

/**
 * Hook for tracking performance in React components
 */
export function usePerformanceTracking() {
  const trackPageView = (pageName: string) => {
    performanceTracker.trackCustomMetric('page_view', 1, { 
      page: pageName,
      timestamp: Date.now()
    })
  }

  const trackUserAction = (action: string, metadata?: Record<string, any>) => {
    performanceTracker.trackCustomMetric('user_action', 1, {
      action,
      ...metadata,
      timestamp: Date.now()
    })
  }

  const trackLoadTime = (componentName: string, loadTime: number) => {
    performanceTracker.trackCustomMetric('component_load_time', loadTime, {
      component: componentName,
      timestamp: Date.now()
    })
  }

  return {
    trackPageView,
    trackUserAction,
    trackLoadTime
  }
} 