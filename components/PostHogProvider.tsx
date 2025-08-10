"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Initialize PostHog in cookieless mode (memory persistence)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY is not set. PostHog will not initialize.')
      }
      return
    }
    // Lightweight PII sanitizer for event properties (not for person profiles)
    const sanitize = (obj: any, depth = 0): any => {
      if (!obj || typeof obj !== 'object' || depth > 3) return obj
      const result: Record<string, any> = Array.isArray(obj) ? [] as any : {}
      const piiKeys = new Set([
        'email', 'e-mail', 'user_email', 'contact_email',
        'phone', 'phone_number', 'mobile',
        'first_name', 'last_name', 'full_name', 'name',
        'password', 'pass', 'authorization', 'auth',
        'address', 'street', 'postcode', 'postal_code'
      ])
      const requiredKeys = new Set(['token', 'distinct_id', '$device_id'])
      const isEmailLike = (v: any) => typeof v === 'string' && /.+@.+\..+/.test(v)
      const isSensitiveKey = (k: string) => piiKeys.has(k.toLowerCase())

      for (const [key, value] of Object.entries(obj)) {
        if (!requiredKeys.has(key) && (isSensitiveKey(key) || isEmailLike(value))) {
          // drop this property
          continue
        }
        if (value && typeof value === 'object') {
          result[key] = sanitize(value, depth + 1)
        } else {
          result[key] = value
        }
      }
      return result
    }

    posthog.init(apiKey, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      // Cookieless: do not use cookies/localStorage
      persistence: "memory",
      // Only create person profiles once a user is identified
      person_profiles: "identified_only",
      // Strip common PII from event properties using before_send (recommended)
      before_send: (event) => {
        try {
          if (event && event.properties) {
            event.properties = sanitize(event.properties)
          }
        } catch {}
        return event
      },
      // Keep existing options
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    })
  }, [])

  // Toggle session recording based on route
  useEffect(() => {
    if (!pathname) return
    const isPublicCampaign = pathname.startsWith("/c/")

    // Disable session recording on public pages; enable elsewhere
    if (isPublicCampaign) {
      try { posthog.stopSessionRecording?.() } catch {}
    } else {
      try { posthog.startSessionRecording?.() } catch {}
    }
  }, [pathname])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}