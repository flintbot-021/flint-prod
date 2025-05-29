'use client'

import { useState } from 'react'
import { createLeadFromCapture } from '@/lib/data-access'
import type { DatabaseResult, Lead } from '@/lib/types/database'

export interface CaptureFormData {
  name?: string
  email?: string
  phone?: string
  gdprConsent?: boolean
  marketingConsent?: boolean
}

export interface CaptureSubmissionOptions {
  campaignId: string
  onSuccess?: (lead: Lead) => void
  onError?: (error: string) => void
}

export function useCaptureSubmission({ campaignId, onSuccess, onError }: CaptureSubmissionOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const submitCapture = async (data: CaptureFormData): Promise<boolean> => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Gather browser metadata
      const metadata = {
        user_agent: window.navigator.userAgent,
        referrer: document.referrer || undefined,
        // Extract UTM parameters from URL
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
        utm_term: new URLSearchParams(window.location.search).get('utm_term') || undefined,
        utm_content: new URLSearchParams(window.location.search).get('utm_content') || undefined,
      }

      const result: DatabaseResult<Lead> = await createLeadFromCapture(
        campaignId,
        data,
        metadata
      )

      if (result.success && result.data) {
        setIsSubmitted(true)
        onSuccess?.(result.data)
        return true
      } else {
        const errorMessage = result.error || 'Failed to submit form'
        setSubmitError(errorMessage)
        onError?.(errorMessage)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)
      onError?.(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSubmission = () => {
    setIsSubmitted(false)
    setSubmitError(null)
  }

  return {
    submitCapture,
    isSubmitting,
    isSubmitted,
    submitError,
    resetSubmission
  }
} 