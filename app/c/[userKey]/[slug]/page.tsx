'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Campaign, Section, SectionWithOptions } from '@/lib/types/database'
import { getPublishedCampaignWithSectionsByUserKey } from '@/lib/data-access/public-campaigns'
import { cn, applySectionOrdering } from '@/lib/utils'
import { getCampaignTheme } from '@/components/campaign-renderer/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Brain, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Globe
} from 'lucide-react'

// Import Variable Interpolation Engine
import { 
  CachedRuntimeExecutionEngine,
  createCachedRuntimeEngine,
  RealTimeUpdateSystem,
  createRealTimeUpdateSystem,
  logger,
  globalErrorHandler,
  ErrorCategory,
  LogLevel,
  UpdateEventType
} from '@/lib/variable-system'

// Import NEW shared components and hooks
import { SectionRenderer as SharedSectionRenderer, CampaignHeader } from '@/components/campaign-renderer'
import { useCampaignRenderer } from '@/hooks/useCampaignRenderer'
import { 
  useDeviceInfo, 
  useNetworkState, 
  useErrorHandler, 
  useVariableEngine 
} from '@/hooks'

// Import NEW session data access functions
import {
  createSession,
  getSession,
  updateSession,
  addResponse,
  getLeadBySession,
  getResponseForSection,
  isSectionCompleted,
  generateSessionId
} from '@/lib/data-access/sessions'

import { createPublicLeadSecure } from '@/lib/data-access/leads'
import { usePostHog } from 'posthog-js/react'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PublicCampaignPageProps {}

interface CampaignState {
  currentSection: number
  userInputs: Record<string, any>
  completedSections: Set<number>
  startTime: Date
  sessionId: string
  leadId?: string // Lead ID if user has converted
}

interface VariableContext {
  sessionData: Record<string, any>
  campaignData: Record<string, any>
}

// Enhanced Error Types
interface ErrorState {
  message: string
  type: 'network' | 'api' | 'validation' | 'system' | 'user'
  retryable: boolean
  retryCount?: number
  lastRetryAt?: Date
  details?: any
  recovered?: boolean
}

// Network State
interface NetworkState {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  lastOnline?: Date
  lastOffline?: Date
}

// Device Info
interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  screenSize: { width: number; height: number }
  orientation: 'portrait' | 'landscape'
  touchCapable: boolean
  userAgent: string
  pixelRatio: number
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PublicCampaignPage({}: PublicCampaignPageProps) {
  const params = useParams()
  const userKey = params?.userKey as string
  const slug = params?.slug as string
  
  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<SectionWithOptions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Use shared hooks for common functionality
  const deviceInfo = useDeviceInfo()
  const networkState = useNetworkState()
  const errorHandler = useErrorHandler()
  const variableEngine = useVariableEngine()
  const posthog = usePostHog()
  
  // Get campaign theme colors
  const theme = getCampaignTheme(campaign || undefined)
  
  // Restore missing state variables
  const [runtimeEngine, setRuntimeEngine] = useState<CachedRuntimeExecutionEngine | null>(null)
  const [updateSystem, setUpdateSystem] = useState<RealTimeUpdateSystem | null>(null)
  
  // Navigation state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  
  // Simplified session state - response collection handled by campaignRenderer hook
  const [isSessionRecovered, setIsSessionRecovered] = useState(false)

  // Temporary compatibility bridge for legacy error handling
  const [errorState, setErrorState] = useState<ErrorState | null>(null)

  // Generate or recover session ID with persistence
  // Initialize session ID only once
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return generateSessionId()
    
    const storageKey = `flint_session_${slug}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored)
        const age = Date.now() - timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        // Check if session ID is in old format (contains underscores)
        // New format is UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
        const isOldFormat = sessionId.includes('session_') || sessionId.includes('_')
        
        // Use existing session if less than 24 hours old AND in new UUID format
        if (age < maxAge && !isOldFormat) {
          return sessionId
        } else {
          // Clear old session (expired or old format)
          localStorage.removeItem(storageKey)
        }
      } catch (err) {
        localStorage.removeItem(storageKey)
      }
    }
    
    // Create new session with proper UUID format
    const newSessionId = generateSessionId()
    localStorage.setItem(storageKey, JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now()
    }))
    
    return newSessionId
  })

  // Identify anonymous user in PostHog with stable session ID
  useEffect(() => {
    if (posthog && sessionId && campaign) {
      // Create a stable anonymous identifier for this session
      // This allows PostHog to link events across page views while staying cookieless
      const anonymousId = `anon_${sessionId}`
      
      console.log('🔍 [PostHog] Identifying anonymous user:', {
        anonymousId,
        sessionId,
        campaignSlug: slug,
        campaignId: campaign.id
      })
      
      // Identify the user with session-based properties (no PII)
      posthog.identify(anonymousId, {
        // Session metadata (non-PII)
        session_id: sessionId,
        campaign_slug: slug,
        campaign_id: campaign.id,
        user_type: 'anonymous',
        session_start: new Date().toISOString(),
        // Device context (non-PII)
        device_type: deviceInfo?.type || 'unknown',
        screen_size: deviceInfo?.screenSize ? `${deviceInfo.screenSize.width}x${deviceInfo.screenSize.height}` : 'unknown',
        // Campaign context
        campaign_name: campaign.name,
        total_sections: sections.length
      })
      
      // Track initial campaign view
      posthog.capture('campaign_viewed', {
        campaign_id: campaign.id,
        campaign_slug: slug,
        campaign_name: campaign.name,
        session_id: sessionId,
        total_sections: sections.length,
        user_type: 'anonymous',
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        // UTM parameters if available
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        utm_term: new URLSearchParams(window.location.search).get('utm_term'),
        utm_content: new URLSearchParams(window.location.search).get('utm_content')
      })
    }
  }, [posthog, sessionId, campaign, slug, sections.length, deviceInfo])

  // Use campaign renderer hook for clean response handling (like preview page)
  const campaignRenderer = useCampaignRenderer({
    sections: sections,
    initialSection: 0, // Start at 0 like preview page
    campaignId: campaign?.id,  // Pass campaign ID for file uploads
    onLeadCreate: async (leadData: any) => {
      // Create lead when capture section is completed
      if (!campaign) {
        console.error('❌ Cannot create lead: campaign not loaded')
        return undefined
      }

      try {
        // Extract email and name from the lead data
        // leadData could be in format: { name: "John", email: "john@example.com", sectionId: { name: "John", email: "john@example.com" } }
        let email = leadData.email
        let name = leadData.name
        let phone = leadData.phone || null

        // If not found at top level, check if it's nested under a section ID
        if (!email || !name) {
          const sectionKeys = Object.keys(leadData).filter(key => key !== 'name' && key !== 'email' && key !== 'phone')
          if (sectionKeys.length > 0) {
            const sectionData = leadData[sectionKeys[0]]
            if (sectionData && typeof sectionData === 'object') {
              email = email || sectionData.email
              name = name || sectionData.name
              phone = phone || sectionData.phone || null
            }
          }
        }

        if (!email) {
          console.error('❌ Cannot create lead: email is required')
          return undefined
        }

        // Check if lead already exists for this session
        const existingLeadResult = await getLeadBySession(sessionId)
        if (existingLeadResult.success && existingLeadResult.data) {
          console.log('✅ Lead already exists for this session')
          return existingLeadResult.data.id
        }

        // Find the capture section ID
        const captureSection = sections.find(section => section.type === 'capture')
        
        // Create the lead
        console.log('[Lead Capture] Payload to createPublicLead:', {
          session_id: sessionId,
          campaign_id: campaign.id,
          email: email,
          name: name || null,
          phone: phone,
          converted_at: new Date().toISOString(),
          conversion_section_id: captureSection?.id || null,
          metadata: leadData
        })
        const leadResult = await createPublicLeadSecure({
          session_id: sessionId,
          campaign_id: campaign.id,
          email: email,
          name: name || null,
          phone: phone,
          converted_at: new Date().toISOString(),
          conversion_section_id: captureSection?.id || null,
          metadata: leadData
        })

        if (leadResult.success) {
          console.log('✅ Lead created successfully')
          
          // Track lead conversion in PostHog
          if (posthog && campaign) {
            posthog.capture('lead_converted', {
              campaign_id: campaign.id,
              campaign_slug: slug,
              campaign_name: campaign.name,
              session_id: sessionId,
              conversion_section_id: captureSection?.id,
              conversion_section_type: 'capture',
              user_type: 'anonymous',
              has_name: !!name,
              has_phone: !!phone,
              conversion_timestamp: new Date().toISOString()
            })
            
            // Update user properties to mark as converted
            posthog.setPersonProperties({
              has_converted: true,
              last_conversion_campaign: campaign.id,
              last_conversion_date: new Date().toISOString()
            })
          }
          
          // Generate a mock ID since we can't get the real one back for security
          return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        } else {
          console.error('❌ Failed to create lead:', leadResult.error)
          
          // Track failed conversion attempt
          if (posthog && campaign) {
            posthog.capture('lead_conversion_failed', {
              campaign_id: campaign.id,
              session_id: sessionId,
              error: leadResult.error,
              user_type: 'anonymous'
            })
          }
          
          return undefined
        }
      } catch (error) {
        console.error('❌ Error in onLeadCreate:', error)
        return undefined
      }
    },
    onProgressUpdate: (progress, sectionIndex) => {
      // Update session progress in database
      if (campaign) {
        updateSessionProgress(sectionIndex)
      }
    }
  })

  // Helper function to detect if current section is a hero section
  const isCurrentSectionHero = useMemo(() => {
    if (!sections.length || campaignRenderer.currentSection >= sections.length) return false
    
    const currentSection = sections[campaignRenderer.currentSection]
    const config = currentSection.configuration as any || {}
    
    // Check for direct hero section type
    if (currentSection.type === 'content-hero') return true
    
    // Check for legacy info sections that are actually hero sections
    if (currentSection.type === 'info') {
      return !!(
        config.overlayColor || 
        config.overlayOpacity !== undefined || 
        config.showButton !== undefined || 
        config.buttonText ||
        // Only consider image as hero indicator if it has overlay properties
        (config.image && (config.overlayColor || config.overlayOpacity !== undefined))
      )
    }
    
    return false
  }, [sections, campaignRenderer.currentSection])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Network state detection
  useEffect(() => {
    const updateNetworkState = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      const newNetworkState: NetworkState = {
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0
      }

      if (!navigator.onLine && networkState.isOnline) {
        newNetworkState.lastOffline = new Date()
      } else if (navigator.onLine && !networkState.isOnline) {
        newNetworkState.lastOnline = new Date()
      }

      // Network state now managed by useNetworkState hook
    }

    // Initial check
    updateNetworkState()

    // Network change listeners
    window.addEventListener('online', updateNetworkState)
    window.addEventListener('offline', updateNetworkState)
    
    // Connection change listener
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkState)
    }

    return () => {
      window.removeEventListener('online', updateNetworkState)
      window.removeEventListener('offline', updateNetworkState)
      if (connection) {
        connection.removeEventListener('change', updateNetworkState)
      }
    }
  }, [networkState.isOnline])

  // Device detection and responsive optimization
  useEffect(() => {
    const updateDeviceInfo = () => {
      if (typeof window === 'undefined') return

      const width = window.innerWidth
      const height = window.innerHeight
      
      const deviceType: DeviceInfo['type'] = 
        width < 768 ? 'mobile' : 
        width < 1024 ? 'tablet' : 
        'desktop'

      const newDeviceInfo: DeviceInfo = {
        type: deviceType,
        screenSize: { width, height },
        orientation: width > height ? 'landscape' : 'portrait',
        touchCapable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        userAgent: navigator.userAgent,
        pixelRatio: window.devicePixelRatio || 1
      }

      // Device info now managed by useDeviceInfo hook
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  // Auto-recovery for transient errors
  useEffect(() => {
    if (errorHandler.error?.type === 'network' && networkState.isOnline && errorHandler.error.retryCount === 0) {
      // Auto-retry when network comes back online
      const timer = setTimeout(() => {
        recoverFromError()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [errorHandler.error, networkState.isOnline])

  // Mobile-optimized touch targets
  const getMobileClasses = (baseClasses: string): string => {
    if (!deviceInfo) return baseClasses
    
    const mobileEnhancements = deviceInfo.type === 'mobile' 
      ? 'min-h-[44px] touch-manipulation select-none' 
      : ''
    
    return cn(baseClasses, mobileEnhancements)
  }

  // Enhanced mobile navigation with better touch feedback
  const handleTouchNavigation = (direction: 'next' | 'previous') => {
    if (isTransitioning) return
    
    // Haptic feedback for mobile devices
    if (deviceInfo?.touchCapable && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    if (direction === 'next') {
      handleNext()
    } else {
      handlePrevious()
    }
  }

  useEffect(() => {
    if (slug) {
      loadPublicCampaign()
    }
  }, [slug])

  useEffect(() => {
    // Initialize Variable Interpolation Engine when campaign loads
    if (campaign && sections.length > 0) {
      initializeVariableEngine()
    }
  }, [campaign, sections])

  // Simplified session initialization - just get or create session
  useEffect(() => {
    const initializeSession = async () => {
      if (!campaign || isSessionRecovered) return

      try {
        // Try to get existing session first
        const sessionResult = await getSession(sessionId)

        if (sessionResult.success && sessionResult.data && sessionResult.data.campaign_id === campaign.id) {
          // Found existing session - restore state
          const session = sessionResult.data

          // Restore session state using individual updates
          const responses = session.responses || {}
          for (const [key, responseData] of Object.entries(responses)) {
            // Handle both object format and direct value format
            if (responseData && typeof responseData === 'object' && 'value' in responseData) {
              const data = responseData as any
              // Extract sectionId and fieldId from key format "sectionId_fieldId"
              const parts = key.split('_')
              if (parts.length >= 2) {
                const sectionId = parts[0]
                const fieldId = parts.slice(1).join('_')
                campaignRenderer.handleResponseUpdate(sectionId, fieldId, data.value, data.metadata)
              } else {
                // Direct key format
                campaignRenderer.handleResponseUpdate('global', key, data.value, data.metadata)
              }
            } else {
              // Direct value format - treat as global response
              campaignRenderer.handleResponseUpdate('global', key, responseData)
            }
          }
           
          // Set current section if available
          if (session.current_section_index !== undefined) {
            campaignRenderer.goToSection(session.current_section_index)
          }
        } else {
          // No existing session found - create new one
          const createResult = await createSession({
            session_id: sessionId,
            campaign_id: campaign.id,
            current_section_index: 0,
            completed_sections: [],
            start_time: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            is_completed: false,
            responses: {},
            metadata: {
              initial_referrer: typeof document !== 'undefined' ? document.referrer : null,
              user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
            }
          })

          if (!createResult.success) {
            console.error('❌ [SESSION] Failed to create session:', createResult.error)
            return
          }
        }

        setIsSessionRecovered(true)
      } catch (error) {
        console.error('❌ [SESSION] Error initializing session:', error)
      }
    }

    initializeSession()
  }, [campaign?.id, isSessionRecovered]) // Only run when campaign loads and not yet recovered

  // Use refs to avoid stale closure issues
  const campaignRef = useRef(campaign)
  // NOTE: pendingUpdatesRef removed - handled by campaignRenderer hook
  
  // Update refs when values change
  useEffect(() => {
    campaignRef.current = campaign
  }, [campaign])
  
  // NOTE: pendingUpdates useEffect removed - handled by campaignRenderer hook

  // Auto-save responses when they change
  useEffect(() => {
    if (!campaign || !isSessionRecovered) return

    const saveResponses = async () => {
      try {
        // Convert userInputs to the format expected by the database
        const responses: Record<string, any> = {}
        
        Object.entries(campaignRenderer.userInputs).forEach(([key, value]) => {
          responses[key] = {
            value: value,
            timestamp: new Date().toISOString()
          }
        })

        const result = await updateSession(sessionId, {
          responses: responses,
          current_section_index: campaignRenderer.currentSection,
          completed_sections: Array.from(campaignRenderer.completedSections),
          is_completed: campaignRenderer.isComplete
        })

        if (result.success) {
          console.log('💾 Session responses auto-saved:', Object.keys(responses).length, 'responses')
        }
      } catch (error) {
        console.error('❌ Error auto-saving responses:', error)
      }
    }

    // Debounce the save operation
    const timeoutId = setTimeout(saveResponses, 1000)
    return () => clearTimeout(timeoutId)
  }, [campaignRenderer.userInputs, campaignRenderer.currentSection, campaignRenderer.completedSections, campaignRenderer.isComplete, campaign, isSessionRecovered])

  // Track campaign completion
  useEffect(() => {
    if (posthog && campaign && campaignRenderer.isComplete && sections.length > 0) {
      posthog.capture('campaign_completed', {
        campaign_id: campaign.id,
        campaign_slug: slug,
        campaign_name: campaign.name,
        session_id: sessionId,
        total_sections: sections.length,
        completion_timestamp: new Date().toISOString(),
        user_type: 'anonymous',
        has_lead: !!campaignRenderer.leadId
      })
      
      // Update user properties
      posthog.setPersonProperties({
        has_completed_campaign: true,
        last_completed_campaign: campaign.id,
        last_completion_date: new Date().toISOString(),
        campaigns_completed: 1 // This would need to be incremented if tracking multiple campaigns
      })
    }
  }, [posthog, campaign, campaignRenderer.isComplete, sections.length, sessionId, slug, campaignRenderer.leadId])

  // Save individual response to session
  const saveResponseToSession = async (sectionId: string, fieldId: string, value: any, metadata?: any) => {
    try {
      if (!campaign) return

      const responseKey = `${sectionId}_${fieldId}`
      const responseData = {
        value: value,
        sectionId: sectionId,
        fieldId: fieldId,
        metadata: metadata,
        timestamp: new Date().toISOString()
      }

      // Get current responses and add the new one
      const currentResponses = { ...campaignRenderer.userInputs }
      currentResponses[responseKey] = responseData

      const result = await updateSession(sessionId, {
        responses: currentResponses,
        current_section_index: campaignRenderer.currentSection,
        completed_sections: Array.from(campaignRenderer.completedSections)
      })

      if (result.success) {
        console.log('💾 Individual response saved:', responseKey)
      }
    } catch (error) {
      console.error('❌ Error saving individual response:', error)
    }
  }

  // Touch gesture handling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null)
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      })
    }

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return
      
      const deltaX = touchStart.x - touchEnd.x
      const deltaY = touchStart.y - touchEnd.y
      const minSwipeDistance = 50
      
      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swiped left - go to next section
          handleNext()
        } else {
          // Swiped right - go to previous section
          handlePrevious()
        }
      }
      
      setTouchStart(null)
      setTouchEnd(null)
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [touchStart, touchEnd])

  // Browser history management
  useEffect(() => {
    if (!campaign) return

    const currentUrl = new URL(window.location.href)
    const sectionParam = campaignRenderer.currentSection + 1
    
    // Preserve shared data parameters when updating URL
    const urlParams = new URLSearchParams(currentUrl.search)
    const hasSharedData = urlParams.get('shared')
    const viewParam = urlParams.get('view')
    
    let newUrl: string
    if (hasSharedData) {
      // Keep shared parameters intact for shareable URLs
      newUrl = currentUrl.href
    } else {
      // Normal URL update for regular navigation
      newUrl = `${currentUrl.pathname}?section=${sectionParam}${currentUrl.hash}`
    }
    
    window.history.replaceState(
      { 
        sectionIndex: campaignRenderer.currentSection,
        campaignSlug: campaign.published_url 
      },
      `${campaign.name} - Section ${sectionParam}`,
      newUrl
    )

    // Handle browser back/forward
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.sectionIndex !== undefined) {
        handleNavigateToSection(event.state.sectionIndex)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [campaign, campaignRenderer.currentSection])

  // Handle shared data restoration (runs immediately, independent of session recovery)
  useEffect(() => {
    console.log('🔗 [SHARE] Checking for shared data')
    console.log('🔗 [SHARE] Current URL:', window.location.href)
    
    const urlParams = new URLSearchParams(window.location.search)
    const sharedData = urlParams.get('shared')
    const viewParam = urlParams.get('view')
    
    console.log('🔗 [SHARE] URL parameters:', {
      shared: sharedData ? 'Found (length: ' + sharedData.length + ')' : 'Not found',
      view: viewParam || 'Not found'
    })
    
    if (sharedData) {
      console.log('📥 [SHARE] Detected shared data, restoring...')
      try {
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(sharedData))))
        console.log('📥 [SHARE] Decoded shared data:', decodedData)
        
        // Restore user inputs
        if (decodedData.userInputs) {
          campaignRenderer.restoreUserInputs(decodedData.userInputs)
        }
        
        // Restore AI results to localStorage if campaign ID matches
        if (decodedData.aiResults && campaign?.id && decodedData.campaignId === campaign.id) {
          const key = `aiTestResults_${campaign.id}`
          localStorage.setItem(key, JSON.stringify(decodedData.aiResults))
          console.log('📥 [SHARE] AI results restored to localStorage')
        }
        
        // Set a flag to indicate we have shared data (for navigation logic)
        sessionStorage.setItem('hasSharedData', 'true')
        
      } catch (error) {
        console.error('📥 [SHARE] Error restoring shared data:', error)
      }
    } else {
      // Clear the flag if no shared data
      sessionStorage.removeItem('hasSharedData')
    }
  }, [campaign?.id]) // Removed isSessionRecovered dependency

  // Handle URL section navigation (runs after sections are loaded)
  useEffect(() => {
    if (sections.length === 0) return
    
    console.log('🔗 [URL] Checking URL section parameters')
    
    const urlParams = new URLSearchParams(window.location.search)
    const hasSharedData = sessionStorage.getItem('hasSharedData') === 'true'
    
    // Priority 1: Handle view=results parameter (from shared URLs)
    const viewParam = urlParams.get('view')
    if (viewParam === 'results') {
      const lastSectionIndex = sections.length - 1
      console.log(`📥 [SHARE] Jumping to results section: ${lastSectionIndex} (view=results)`)
      campaignRenderer.goToSection(lastSectionIndex)
      return
    }
    
    // Priority 2: If we have shared data but no view=results, still go to results
    if (hasSharedData) {
      const lastSectionIndex = sections.length - 1
      console.log(`📥 [SHARE] Jumping to results section: ${lastSectionIndex} (shared data detected)`)
      campaignRenderer.goToSection(lastSectionIndex)
      return
    }
    
    // Priority 3: Handle normal section parameter (only if no shared data and session recovered)
    if (isSessionRecovered) {
      const sectionParam = urlParams.get('section')
      if (sectionParam) {
        const sectionIndex = parseInt(sectionParam) - 1
        if (sectionIndex >= 0 && sectionIndex < sections.length) {
          console.log(`🔗 [URL] Setting section from URL: ${sectionIndex}`)
          campaignRenderer.goToSection(sectionIndex)
        }
      } else {
        console.log('🔗 [URL] No section parameter found, staying at section 0')
      }
    }
  }, [sections.length, isSessionRecovered])

  // =============================================================================
  // VARIABLE ENGINE INITIALIZATION
  // =============================================================================

  const initializeVariableEngine = async () => {
    try {
      // Create execution context for the variable engine
      const executionContext: any = {
        variables: {
          getAllVariables: () => [],
          getValue: (id: string) => {
            return campaignRenderer.userInputs[id] || 
                   getCampaignVariable(id) || 
                   getSessionVariable(id)
          },
                      setValue: async (id: string, value: any) => {
              // Use handleResponseUpdate for updating values
              campaignRenderer.handleResponseUpdate('global', id, value)
            }
        },
        session: {
          responses: campaignRenderer.userInputs,
          metadata: {
            sessionId: sessionId,
            startTime: new Date(),
            currentSection: campaignRenderer.currentSection
          }
        },
        cache: {
          invalidate: (variableId: string) => {
            logger.debug('Variable cache invalidated')
          }
        }
      }

      // Create runtime engine with caching
      const engine = createCachedRuntimeEngine(executionContext)

      setRuntimeEngine(engine)

      // Simplified real-time updates for now
      // TODO: Integrate full real-time update system in next iteration

    } catch (err) {
      console.error('Failed to initialize variable engine:', err)
      globalErrorHandler.handleError(
        globalErrorHandler.createError(
          err as Error,
          ErrorCategory.SYSTEM,
          { location: { function: 'initializeVariableEngine' } }
        )
      )
    }
  }

  // =============================================================================
  // ENHANCED RESPONSE COLLECTION SYSTEM  
  // =============================================================================

  // Enhanced device info collection
  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return {}

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      screen: { width: window.screen.width, height: window.screen.height },
      deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    }
  }

  // Real-time response collection with auto-save using new session-based approach
  // NOTE: Removed complex collectResponse function - now using clean campaignRenderer.handleResponseUpdate approach like preview page
  // All file upload handling, auto-save logic, and response collection is now handled elegantly by the useCampaignRenderer hook

  // NOTE: Manual save and batch flush functions removed - handled by campaignRenderer hook

  // Simple session-based response saving (no more fake leads!)
  const saveBatchResponsesToSession = async (responses: any[]) => {
    try {
      if (!campaign) {
        console.error('❌ Campaign not loaded, cannot save responses')
        return
      }

      // Build responses object for JSONB field
      const responseUpdates: Record<string, any> = {}
      
      responses.forEach(response => {
        // Use sectionId_fieldId as key for unique identification
        const responseKey = `${response.sectionId}_${response.fieldId}`
        responseUpdates[responseKey] = {
          value: response.value,
          sectionId: response.sectionId,
          fieldId: response.fieldId,
          metadata: response.metadata,
          timestamp: response.metadata.timestamp
        }
      })

      console.log('💾 Saving responses to session JSONB:', Object.keys(responseUpdates).length, 'responses')

      // Update session responses using new data access layer
      const result = await updateSession(sessionId, {
        responses: {
          ...responseUpdates // Use new responses format
        },
        current_section_index: campaignRenderer.currentSection,
        completed_sections: Array.from(campaignRenderer.completedSections)
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update session')
      }

      console.log('✅ Session responses saved successfully')

    } catch (err) {
      console.error('Error saving responses to session:', err)
      throw err
    }
  }

  // Update session progress tracking
  const updateSessionProgress = async (sectionIndex?: number) => {
    try {
      if (!campaign) {
        console.warn('⚠️ Campaign not loaded, cannot update session progress')
        return
      }

      const currentSection = sectionIndex !== undefined ? sectionIndex : campaignRenderer.currentSection
      
      const result = await updateSession(sessionId, {
        current_section_index: currentSection,
        completed_sections: Array.from(campaignRenderer.completedSections),
        is_completed: campaignRenderer.isComplete
      })

      if (result.success) {
        console.log('📍 Session progress updated:', { 
          section: currentSection, 
          completedSections: campaignRenderer.completedSections.size,
          totalSections: sections.length
        })
      }
    } catch (err) {
      console.error('Error updating session progress:', err)
    }
  }

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getCampaignVariable = (id: string): any => {
    // Default campaign variables
    const campaignVars: Record<string, any> = {
      campaign_name: campaign?.name || '',
      campaign_id: campaign?.id || '',
      user_session: sessionId,
      current_section: campaignRenderer.currentSection + 1,
      total_sections: sections.length,
      start_time: new Date().toISOString()
    }
    return campaignVars[id]
  }

  const getSessionVariable = (id: string): any => {
    // Session-specific variables
    const sessionVars: Record<string, any> = {
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
      screen_height: typeof window !== 'undefined' ? window.screen.height : 0
    }
    return sessionVars[id]
  }

  // Enhanced variable interpolation using Runtime Execution Engine
  const processVariableContent = async (content: string, context: Record<string, any> = {}): Promise<string> => {
    if (!content || !runtimeEngine) {
      return content || ''
    }

    try {
      // Use runtime engine for advanced variable interpolation
      const result = await runtimeEngine.processInterpolatedText(content)
      return result || content
    } catch (err) {
      console.error('Variable interpolation error:', err)
      // Fallback to simple interpolation if engine fails
      return interpolateTextSimple(content, context)
    }
  }

  // Enhanced variable context providers
  const getCampaignVariableContext = (): Record<string, any> => {
    return {
      campaign_name: campaign?.name || '',
      campaign_id: campaign?.id || '',
      campaign_description: campaign?.description || '',
      user_session: sessionId,
      current_section: campaignRenderer.currentSection + 1,
      total_sections: sections.length,
      start_time: new Date().toISOString(),
      completion_rate: Math.round((campaignRenderer.completedSections.size / sections.length) * 100),
      time_elapsed: Math.round((new Date().getTime() - new Date().getTime()) / 1000)
    }
  }

  const getSessionVariableContext = (): Record<string, any> => {
    return {
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screen_width: typeof window !== 'undefined' ? window.screen.width : 0,
      screen_height: typeof window !== 'undefined' ? window.screen.height : 0,
      device_type: typeof window !== 'undefined' ? 
        (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop') : 'unknown',
      is_mobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      browser_language: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
    }
  }

  // Fallback simple interpolation for error scenarios
  const interpolateTextSimple = (content: string, context: Record<string, any> = {}): string => {
    if (!content) return content
    
    let result = content
    
    // Replace user input variables
    Object.entries(campaignRenderer.userInputs).forEach(([key, value]) => {
      result = result.replace(new RegExp(`@${key}`, 'g'), String(value))
    })
    
    // Replace campaign variables
    Object.entries(getCampaignVariableContext()).forEach(([key, value]) => {
      result = result.replace(new RegExp(`@${key}`, 'g'), String(value))
    })

    // Replace context variables
    Object.entries(context).forEach(([key, value]) => {
      result = result.replace(new RegExp(`@${key}`, 'g'), String(value))
    })
    
    return result
  }

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadPublicCampaign = async () => {
    console.log('🔍 Starting loadPublicCampaign for userKey:', userKey, 'slug:', slug)
    
    if (!userKey || typeof userKey !== 'string' || !slug || typeof slug !== 'string') {
      console.error('❌ Invalid userKey or slug:', { userKey, slug })
      errorHandler.handleError('Invalid campaign URL. Please check the link.', 'validation')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      errorHandler.clearError()
      
      console.log('🔍 Loading published campaign with userKey:', userKey, 'slug:', slug)
      
      // Use new public data access function that doesn't require auth
      const result = await getPublishedCampaignWithSectionsByUserKey(userKey, slug)

      if (!result.success || !result.data) {
        console.error('❌ Failed to load campaign:', result.error)
        throw new Error(result.error || 'Campaign not available')
        }

      const { campaign, sections: sectionsData } = result.data

      console.log('✅ Campaign found:', {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        published_url: campaign.published_url
      })
      
      setCampaign(campaign)
      
      console.log('📊 Sections loaded:', { 
        sectionsData: sectionsData?.map((s: any) => ({ 
          id: s.id, 
          title: s.title, 
          type: s.type, 
          order_index: s.order_index 
        }))
      })

      if (!sectionsData || sectionsData.length === 0) {
        throw new Error('This campaign has no content to display')
      }

      // Filter out hidden sections for public campaign view
      const visibleSections = sectionsData.filter(section => {
        // Check if isVisible property exists in configuration and is not false
        const config = (section.configuration as any) || {}
        return config.isVisible !== false
      })
      setSections(applySectionOrdering(visibleSections))
      
              // Initialize campaign state - renderer starts with empty state by default
        console.log('✅ Campaign renderer initialized with empty state')

      console.log('✅ Campaign loaded successfully with', sectionsData.length, 'sections')
    } catch (error) {
      console.error('💥 Error loading campaign:', error)
      handleError(error as Error, { function: 'loadPublicCampaign', slug: slug })
    } finally {
      setIsLoading(false)
      console.log('🏁 loadPublicCampaign completed')
    }
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSectionComplete = (sectionIndex: number, data: any) => {
    if (sections.length > 0) {
      // Track section completion
      if (posthog && campaign && sections[sectionIndex]) {
        const section = sections[sectionIndex]
        posthog.capture('section_completed', {
          campaign_id: campaign.id,
          campaign_slug: slug,
          session_id: sessionId,
          section_index: sectionIndex,
          section_id: section.id,
          section_type: section.type,
          section_title: section.title,
          user_type: 'anonymous',
          completion_timestamp: new Date().toISOString(),
          // Track progress
          progress_percentage: Math.round(((sectionIndex + 1) / sections.length) * 100),
          sections_completed: sectionIndex + 1,
          total_sections: sections.length
        })
      }
      
      campaignRenderer.handleSectionComplete(sectionIndex, data)
    }
  }

  const handleNext = () => {
    if (sections.length > 0) {
      const currentIndex = campaignRenderer.currentSection
      const nextIndex = currentIndex + 1
      
      // Track section navigation
      if (posthog && campaign) {
        posthog.capture('section_navigation', {
          campaign_id: campaign.id,
          session_id: sessionId,
          from_section: currentIndex,
          to_section: nextIndex,
          direction: 'next',
          section_type: sections[currentIndex]?.type,
          user_type: 'anonymous'
        })
      }
      
      campaignRenderer.goNext()
    }
  }

  const handlePrevious = () => {
    if (sections.length > 0) {
      const currentIndex = campaignRenderer.currentSection
      const previousIndex = currentIndex - 1
      
      // Track section navigation
      if (posthog && campaign) {
        posthog.capture('section_navigation', {
          campaign_id: campaign.id,
          session_id: sessionId,
          from_section: currentIndex,
          to_section: previousIndex,
          direction: 'previous',
          section_type: sections[currentIndex]?.type,
          user_type: 'anonymous'
        })
      }
      
      campaignRenderer.goPrevious()
    }
  }

  const handleNavigateToSection = (index: number) => {
    if (sections.length > 0) {
      const currentIndex = campaignRenderer.currentSection
      
      // Track section navigation
      if (posthog && campaign && index !== currentIndex) {
        posthog.capture('section_navigation', {
          campaign_id: campaign.id,
          session_id: sessionId,
          from_section: currentIndex,
          to_section: index,
          direction: index > currentIndex ? 'forward_jump' : 'backward_jump',
          section_type: sections[currentIndex]?.type,
          target_section_type: sections[index]?.type,
          user_type: 'anonymous'
        })
      }
      
      campaignRenderer.goToSection(index)
    }
  }

  // =============================================================================
  // SECTION RENDERING - Now handled by SharedSectionRenderer
  // =============================================================================

  // Note: Individual section rendering functions have been removed and replaced
  // with the SharedSectionRenderer component for consistency and maintainability

  // =============================================================================
  // LEGACY RENDERING FUNCTIONS REMOVED
  // =============================================================================

  // These functions have been replaced by SharedSectionRenderer components

  // =============================================================================
  // ENHANCED ERROR HANDLING SYSTEM
  // =============================================================================

  // Create error with context
  const createError = (
    message: string, 
    type: ErrorState['type'], 
    retryable: boolean = true, 
    details?: any
  ): ErrorState => ({
    message,
    type,
    retryable,
    retryCount: 0,
    details,
    lastRetryAt: undefined,
    recovered: false
  })

  // Enhanced error handler with recovery options
  const handleError = (error: Error | ErrorState, context?: any) => {
    let errorState: ErrorState

    if ('type' in error) {
      errorState = error
    } else {
      // Convert Error to ErrorState
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorState = createError(
          'Network connection issue. Please check your internet connection.',
          'network',
          true,
          { originalError: error.message, context }
        )
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorState = createError(
          'This campaign is no longer available or access is restricted.',
          'api',
          false,
          { originalError: error.message, context }
        )
      } else if (error.message.includes('404')) {
        errorState = createError(
          'Campaign not found. Please check the URL.',
          'api',
          false,
          { originalError: error.message, context }
        )
      } else {
        errorState = createError(
          'An unexpected error occurred. Please try again.',
          'system',
          true,
          { originalError: error.message, context }
        )
      }
    }

    errorHandler.handleError(errorState.message, 'campaign')
    
    // Log error for analytics
    console.error('Campaign Error:', errorState)
    
    // Report to global error handler
    if (typeof error === 'object' && 'stack' in error) {
      globalErrorHandler.handleError(
        globalErrorHandler.createError(
          error as Error,
          ErrorCategory.API,
          { 
            location: { function: context?.function || 'unknown' },
            metadata: { errorState, context }
          }
        )
      )
    }
  }

  // Retry mechanism with exponential backoff
  const retryOperation = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    context?: string
  ): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // Clear error state on success
        if (errorHandler.error?.retryable) {
          errorHandler.clearError()
        }
        
        return result
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        // Update retry count
        if (errorState?.retryable) {
          setErrorState(prev => prev ? {
            ...prev,
            retryCount: (prev.retryCount || 0) + 1,
            lastRetryAt: new Date()
          } : null)
        }
        
        // Exponential backoff
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} for ${context} in ${delay}ms`)
      }
    }
  }

  // Recovery actions for different error types
  const recoverFromError = async () => {
    if (!errorState) return

    try {
      setIsLoading(true)
      
      switch (errorState.type) {
        case 'network':
          // Check network and retry
          if (networkState.isOnline) {
            await retryOperation(() => loadPublicCampaign(), 2, 1000, 'network recovery')
          } else {
            setErrorState(createError(
              'No internet connection. Please check your network and try again.',
              'network',
              true
            ))
          }
          break
          
        case 'api':
          if (errorState.retryable) {
            await retryOperation(() => loadPublicCampaign(), 1, 2000, 'api recovery')
          }
          break
          
        case 'system':
          // Force reload campaign data
          await retryOperation(() => loadPublicCampaign(), 1, 1000, 'system recovery')
          break
          
        default:
          // Generic retry
          await retryOperation(() => loadPublicCampaign(), 1, 1000, 'generic recovery')
      }
    } catch (err) {
      handleError(err as Error, { function: 'recoverFromError' })
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // RENDER STATES
  // =============================================================================

  // Enhanced loading guard - prevent interaction until campaign and sections are ready
  if (isLoading || !campaign || sections.length === 0) {
    return (
      <div className="min-h-screen bg-muted">
        {/* Ghosted Top Bar */}
        <div className="h-16 bg-gray-200 animate-pulse"></div>
        
        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
                         {/* Ghosted Headline */}
             <div className="h-12 bg-gray-200 rounded animate-pulse mx-auto w-[160px]"></div>
            
            {/* Ghosted Subheading */}
            <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-1/2"></div>
            
            {/* Ghosted Button */}
            <div className="h-12 bg-gray-200 rounded animate-pulse mx-auto w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (errorState) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Error Icon based on type */}
          {errorState.type === 'network' ? (
            <div className="relative">
              {networkState.isOnline ? (
                <Wifi className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              ) : (
                <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
              )}
              {errorState.retryCount && errorState.retryCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {errorState.retryCount}
                </div>
              )}
            </div>
          ) : errorState.type === 'validation' ? (
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          )}
          
          {/* Error Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {errorState.type === 'network' ? 'Connection Issue' :
             errorState.type === 'validation' ? 'Access Required' :
             errorState.type === 'api' ? 'Campaign Unavailable' :
             'Something went wrong'}
          </h1>
          
          {/* Error Message */}
          <p className="text-muted-foreground mb-6">
            {errorState.message}
          </p>
          
          {/* Network Status Indicator */}
          {errorState.type === 'network' && (
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm mb-4",
              networkState.isOnline 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            )}>
              {networkState.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </div>
          )}
          
          {/* Recovery Progress */}
          {errorState.recovered && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">Connection restored</span>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {errorState.retryable && (
              <Button 
                onClick={recoverFromError}
                disabled={isLoading}
                className={getMobileClasses("bg-blue-600 hover:bg-blue-700 w-full")}
                size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            
            {/* Validation-specific actions */}
            {errorState.type === 'validation' && sections.length > 0 && (
              <Button 
                onClick={() => {
                  setErrorState(null)
                  // Navigate to first incomplete capture section
                  const captureSection = sections.findIndex(s => s.type === 'capture')
                  if (captureSection >= 0) {
                    handleNavigateToSection(captureSection)
                  }
                }}
                className={getMobileClasses("bg-green-600 hover:bg-green-700 w-full")}
                size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
              >
                Complete Required Information
              </Button>
            )}
            
            {/* Alternative action */}
            {!errorState.retryable && errorState.type !== 'validation' && (
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className={getMobileClasses("w-full")}
                size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
              >
                Reload Page
              </Button>
            )}
            
            {errorState.type === 'validation' && (
              <Button 
                variant="outline"
                onClick={() => setErrorState(null)}
                className={getMobileClasses("w-full")}
                size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
              >
                Continue Where I Left Off
              </Button>
            )}
          </div>
          
          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && errorState.details && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer">Technical Details</summary>
              <pre className="text-xs text-gray-400 mt-2 p-2 bg-accent rounded overflow-auto">
                {JSON.stringify(errorState.details, null, 2)}
              </pre>
            </details>
          )}
          
          {/* Device Info for Development */}
          {process.env.NODE_ENV === 'development' && deviceInfo && (
            <div className="mt-4 text-xs text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                {deviceInfo.type === 'mobile' && <Smartphone className="h-3 w-3" />}
                {deviceInfo.type === 'tablet' && <Tablet className="h-3 w-3" />}
                {deviceInfo.type === 'desktop' && <Monitor className="h-3 w-3" />}
                <span>{deviceInfo.type} • {deviceInfo.orientation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="h-screen bg-muted flex flex-col relative overflow-hidden">
      {/* Powered by Flint - Top Right Pill */}
      {campaign && campaign.settings?.branding?.show_powered_by !== false && (
        <div className="absolute top-4 right-4 z-40">
          <a 
            href="https://launch.useflint.co/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={isCurrentSectionHero ? {
              // Hero section: white background with black text
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            } : {
              // Other sections: use theme colors
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <span 
              className="text-xs font-medium"
              style={isCurrentSectionHero ? {
                // Hero section: black text
                color: '#000000',
                opacity: 0.8
              } : {
                // Other sections: use theme color
                color: getCampaignTheme(campaign).textColor,
                opacity: 0.8
              }}
            >
              Powered by
            </span>
            <span 
              className="text-xs font-bold"
              style={isCurrentSectionHero ? {
                // Hero section: black text
                color: '#000000'
              } : {
                // Other sections: use theme color
                color: getCampaignTheme(campaign).textColor
              }}
            >
              Flint
            </span>
          </a>
        </div>
      )}
      
      {/* Section Content */}
      {campaignRenderer.currentSection < sections.length && (
        <div key={campaignRenderer.currentSection} className={cn(
          "flex-1 overflow-hidden transition-all duration-300 ease-in-out",
          isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
        )}>
          {/* Scrollable content container - matches preview page structure */}
          <div className="w-full h-full overflow-auto">
            <div className="h-full bg-background flex flex-col">
              <div className="flex-1">
                {/* Use SharedSectionRenderer for consistent experience */}
                <SharedSectionRenderer
                  section={sections[campaignRenderer.currentSection]}
                  index={campaignRenderer.currentSection}
                  isActive={true}
                  isPreview={false}
                  campaignId={campaign?.id}
                  campaign={campaign}
                  userInputs={campaignRenderer.userInputs}
                  sections={sections}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onNavigateToSection={handleNavigateToSection}
                  onSectionComplete={handleSectionComplete}
                  onResponseUpdate={(sectionId: string, fieldId: string, value: any, metadata?: any) => {
                    // Use clean campaignRenderer approach like preview page
                    campaignRenderer.handleResponseUpdate(sectionId, fieldId, value, metadata)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer - Powered by Flint (only visible on mobile) */}
      {campaign && campaign.settings?.branding?.show_powered_by !== false && (
        <div className="sm:hidden border-t border-border/20 bg-background/20 backdrop-blur-md shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div 
              className="flex items-center justify-center text-xs"
              style={{ color: theme.textColor }}
            >
              <span>Powered by</span>
              <a 
                href="https://launch.useflint.co/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 font-semibold hover:opacity-80 transition-opacity"
                style={{ color: theme.textColor }}
              >
                Flint
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 