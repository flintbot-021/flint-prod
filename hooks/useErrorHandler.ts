'use client'

import { useState, useCallback, useRef } from 'react'
import { ErrorState } from '@/components/campaign-renderer/types'

// =============================================================================
// ERROR HANDLER HOOK
// =============================================================================

interface ErrorHandlerReturn {
  error: ErrorState | null
  clearError: () => void
  handleError: (error: Error | string, context?: string) => void
  reportError: (error: Error | string, context?: string, metadata?: any) => void
}

export function useErrorHandler(): ErrorHandlerReturn {
  const [error, setError] = useState<ErrorState | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const clearError = useCallback(() => {
    setError(null)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = undefined
    }
  }, [])

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error

    const errorState: ErrorState = {
      message: errorMessage,
      type: 'system',
      retryable: true,
      retryCount: 0,
      details: { context: context || 'unknown', originalError: error }
    }

    setError(errorState)

    // Auto-clear error after 10 seconds for retryable errors
    if (errorState.retryable) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
      
      errorTimeoutRef.current = setTimeout(() => {
        setError(null)
      }, 10000)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Campaign Error [${context}]:`, error)
    }
  }, [])

  const reportError = useCallback((
    error: Error | string, 
    context?: string, 
    metadata?: any
  ) => {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    // Log the error with metadata
    console.error('Reporting error:', {
      message: errorMessage,
      context: context || 'unknown',
      metadata,
      stack: errorStack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // In a real application, you might send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    
    // For now, just handle it locally
    handleError(error, context)
  }, [handleError])

  return {
    error,
    clearError,
    handleError,
    reportError
  }
} 