'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Campaign, Section, SectionWithOptions } from '@/lib/types/database'
import { getSupabaseClient } from '@/lib/data-access/base'
import { cn } from '@/lib/utils'
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
import { SectionRenderer as SharedSectionRenderer } from '@/components/campaign-renderer'
import { 
  useCampaignRenderer, 
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
  createLead,
  getLeadBySession,
  getResponseForSection,
  isSectionCompleted,
  generateSessionId
} from '@/lib/data-access/sessions'

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
  
  // Restore missing state variables
  const [runtimeEngine, setRuntimeEngine] = useState<CachedRuntimeExecutionEngine | null>(null)
  const [updateSystem, setUpdateSystem] = useState<RealTimeUpdateSystem | null>(null)
  
  // Navigation state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  
  // Enhanced response collection state
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(new Map())
  const [isSessionRecovered, setIsSessionRecovered] = useState(false)

  // Temporary compatibility bridge for legacy error handling
  const [errorState, setErrorState] = useState<ErrorState | null>(null)

  // Generate or recover session ID with persistence
  const getOrCreateSessionId = (): string => {
    if (typeof window === 'undefined') return generateSessionId()
    
    const storageKey = `flint_session_${slug}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      try {
        const { sessionId, timestamp } = JSON.parse(stored)
        const age = Date.now() - timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        // Use existing session if less than 24 hours old
        if (age < maxAge) {
          console.log('🔄 Recovered existing session:', sessionId)
          return sessionId
        } else {
          console.log('⏰ Session expired, creating new one')
          localStorage.removeItem(storageKey)
        }
      } catch (err) {
        console.warn('Failed to parse stored session, creating new one')
        localStorage.removeItem(storageKey)
      }
    }
    
    // Create new session
    const newSessionId = generateSessionId()
    localStorage.setItem(storageKey, JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now()
    }))
    
    console.log('✨ Created new session:', newSessionId)
    return newSessionId
  }

  const [campaignState, setCampaignState] = useState<CampaignState>({
    currentSection: 0,
    userInputs: {},
    completedSections: new Set(),
    startTime: new Date(),
    sessionId: getOrCreateSessionId()
  })

  // Simplified navigation 
  const navigateToSection = async (sectionIndex: number) => {
    if (isTransitioning || sectionIndex === campaignState.currentSection) return
    if (sectionIndex < 0 || sectionIndex >= sections.length) return

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: sectionIndex
    }))

    // Update session progress in database
    try {
      if (campaign) {
        await updateSession(campaignState.sessionId, {
          current_section_index: sectionIndex
        })
      }
    } catch (err) {
      console.error('Error updating session progress:', err)
    }

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300)
  }

  // AI Content Generation for Output Sections
  const generateDynamicContent = async (section: SectionWithOptions): Promise<string> => {
    try {
      if (!runtimeEngine) {
        return section.description || 'Thank you for completing this campaign.'
      }

      // Prepare context for AI generation
      const responseContext = {
        userResponses: campaignState.userInputs,
        campaignInfo: {
          name: campaign?.name,
          id: campaign?.id,
          type: 'lead_magnet'
        },
        sessionInfo: {
          completedSections: Array.from(campaignState.completedSections),
          totalSections: sections.length,
          timeSpent: Math.round((new Date().getTime() - campaignState.startTime.getTime()) / 1000)
        }
      }

      // Use the Variable Interpolation Engine for dynamic content
      const template = section.description || section.title || 'Thank you for completing this campaign.'
      const generatedContent = await processVariableContent(template, responseContext)

      return generatedContent

    } catch (err) {
      console.error('Error generating dynamic content:', err)
      return interpolateTextSimple(
        section.description || 'Thank you for completing this campaign.',
        campaignState.userInputs
      )
    }
  }

  // Enhanced loading states for AI processing
  const [aiProcessingState, setAiProcessingState] = useState<{
    isProcessing: boolean
    stage: string
    progress: number
    message: string
  }>({
    isProcessing: false,
    stage: '',
    progress: 0,
    message: ''
  })

  // AI processing flow for output sections
  const processAIOutputSection = async (section: SectionWithOptions): Promise<void> => {
    setAiProcessingState({
      isProcessing: true,
      stage: 'analyzing',
      progress: 20,
      message: 'Analyzing your responses...'
    })

    try {
      // Stage 1: Analyze responses
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAiProcessingState(prev => ({
        ...prev,
        stage: 'generating',
        progress: 60,
        message: 'Generating personalized content...'
      }))

      // Stage 2: Generate content
      const dynamicContent = await generateDynamicContent(section)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setAiProcessingState(prev => ({
        ...prev,
        stage: 'finalizing',
        progress: 90,
        message: 'Finalizing your results...'
      }))

      // Stage 3: Finalize
      await new Promise(resolve => setTimeout(resolve, 500))

      setAiProcessingState(prev => ({
        ...prev,
        progress: 100,
        message: 'Complete!'
      }))

      // Update section content with generated content
      // (This would normally update the section state or trigger a re-render)
      
      setTimeout(() => {
        setAiProcessingState({
          isProcessing: false,
          stage: '',
          progress: 0,
          message: ''
        })
      }, 500)

    } catch (err) {
      console.error('AI processing error:', err)
      setAiProcessingState({
        isProcessing: false,
        stage: 'error',
        progress: 0,
        message: 'Processing failed. Showing standard content.'
      })
    }
  }

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

      console.log('🚀 [SESSION] Initializing session for campaign:', campaign.id)

      try {
        // Try to get existing session first
        const sessionResult = await getSession(campaignState.sessionId)

        if (sessionResult.success && sessionResult.data && sessionResult.data.campaign_id === campaign.id) {
          // Found existing session - restore state
          const session = sessionResult.data
          console.log('✅ [SESSION] Found existing session, restoring state')

          setCampaignState(prev => ({
            ...prev,
            userInputs: session.responses || {},
            completedSections: new Set(session.completed_sections || []),
            currentSection: session.current_section_index || 0,
            leadId: undefined // Will be set by lead check below
          }))

          // Check for associated lead
          const leadResult = await getLeadBySession(campaignState.sessionId)
          if (leadResult.success && leadResult.data) {
            setCampaignState(prev => ({ ...prev, leadId: leadResult.data!.id }))
          }
        } else {
          // No existing session found - create new one
          console.log('💾 [SESSION] Creating new session')
          
          const createResult = await createSession({
            session_id: campaignState.sessionId,
            campaign_id: campaign.id,
            current_section_index: 0,
            completed_sections: [],
            start_time: campaignState.startTime.toISOString(),
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

          console.log('✅ [SESSION] New session created successfully')
        }

        setIsSessionRecovered(true)
      } catch (error) {
        console.error('❌ [SESSION] Error initializing session:', error)
      }
    }

    initializeSession()
  }, [campaign?.id, isSessionRecovered]) // Only run when campaign loads and not yet recovered

  // Auto-save on unmount and visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdates.size > 0 && campaign) {
        console.log('📤 [BEFOREUNLOAD] Flushing pending updates before page unload')
        flushPendingUpdates()
      } else if (pendingUpdates.size > 0) {
        console.warn('⚠️ [BEFOREUNLOAD] Campaign not loaded, skipping flush before unload')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && pendingUpdates.size > 0 && campaign) {
        console.log('👁️ [VISIBILITY] Flushing pending updates on page hide')
        flushPendingUpdates()
      } else if (document.hidden && pendingUpdates.size > 0) {
        console.warn('⚠️ [VISIBILITY] Campaign not loaded, skipping flush on page hide')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Only flush if campaign is still loaded during cleanup
      if (pendingUpdates.size > 0 && campaign) {
        console.log('🧹 [CLEANUP] Flushing pending updates during component cleanup')
        handleBeforeUnload()
      } else if (pendingUpdates.size > 0) {
        console.warn('⚠️ [CLEANUP] Campaign not loaded during cleanup, skipping flush')
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pendingUpdates])

  // Update session progress when section changes
  useEffect(() => {
    if (campaign && isSessionRecovered) {
      updateSessionProgress()
    }
  }, [campaignState.currentSection, campaignState.completedSections, campaign, isSessionRecovered])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTransitioning) return
      
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
          event.preventDefault()
          handleNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          handlePrevious()
          break
        case 'Home':
          event.preventDefault()
          navigateToSection(0)
          break
        case 'End':
          event.preventDefault()
          navigateToSection(sections.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTransitioning, sections.length])

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
    const sectionParam = campaignState.currentSection + 1
    
    // Update URL without triggering navigation
    const newUrl = `${currentUrl.pathname}?section=${sectionParam}${currentUrl.hash}`
    window.history.replaceState(
      { 
        sectionIndex: campaignState.currentSection,
        campaignSlug: campaign.published_url 
      },
      `${campaign.name} - Section ${sectionParam}`,
      newUrl
    )

    // Handle browser back/forward
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.sectionIndex !== undefined) {
        navigateToSection(event.state.sectionIndex)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [campaign, campaignState.currentSection])

  // Parse URL section parameter on load (only if no session recovery happened)
  useEffect(() => {
    if (sections.length === 0 || isSessionRecovered) return
    
    console.log('🔗 [URL] Checking URL section parameter')
    
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get('section')
    
    if (sectionParam) {
      const sectionIndex = parseInt(sectionParam) - 1
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        console.log(`🔗 [URL] Setting section from URL: ${sectionIndex}`)
        setCampaignState(prev => ({
          ...prev,
          currentSection: sectionIndex
        }))
      }
    } else {
      console.log('🔗 [URL] No section parameter found, staying at section 0')
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
            return campaignState.userInputs[id] || 
                   getCampaignVariable(id) || 
                   getSessionVariable(id)
          },
          setValue: async (id: string, value: any) => {
            setCampaignState(prev => ({
              ...prev,
              userInputs: { ...prev.userInputs, [id]: value }
            }))
          }
        },
        session: {
          responses: campaignState.userInputs,
          metadata: {
            sessionId: campaignState.sessionId,
            startTime: campaignState.startTime,
            currentSection: campaignState.currentSection
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
  const collectResponse = async (sectionId: string, fieldId: string, value: any, metadata: any = {}) => {
    try {
      // Guard against race conditions - don't allow responses until campaign is loaded
      if (!campaign) {
        console.warn('⚠️ Campaign not loaded yet, deferring response collection')
        return
      }
      
      // Refresh session timestamp on activity
      if (typeof window !== 'undefined') {
        const storageKey = `flint_session_${slug}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          try {
            const sessionData = JSON.parse(stored)
            sessionData.timestamp = Date.now()
            localStorage.setItem(storageKey, JSON.stringify(sessionData))
          } catch (err) {
            // Ignore storage errors
          }
        }
      }
      
      // Update local state immediately
      setCampaignState(prev => ({
        ...prev,
        userInputs: { 
          ...prev.userInputs, 
          [fieldId]: value,
          [`${sectionId}_${fieldId}`]: value 
        }
      }))

      // Add to pending updates queue for batch saving
      const updateKey = `${sectionId}_${fieldId}`
      const updateData = {
        sectionId,
        fieldId,
        value,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          sessionId: campaignState.sessionId,
          sectionIndex: campaignState.currentSection,
          deviceInfo: getDeviceInfo(),
          interactionType: 'input_change'
        }
      }

      setPendingUpdates(prev => new Map(prev.set(updateKey, updateData)))

      // Debounced auto-save using new session data access
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      const newTimeout = setTimeout(() => {
        flushPendingUpdates()
      }, 1000) // Save after 1 second of inactivity

      setAutoSaveTimeout(newTimeout)

      // Update variable system in real-time
      if (updateSystem) {
        await updateSystem.updateVariable(fieldId, value, {
          source: 'user_input',
          propagate: true
        })
      }

    } catch (err) {
      console.error('Error collecting response:', err)
      globalErrorHandler.handleError(
        globalErrorHandler.createError(
          err as Error,
          ErrorCategory.VARIABLE,
          { 
            location: { function: 'collectResponse' },
            metadata: { sectionId, fieldId, value }
          }
        )
      )
    }
  }

  // Batch flush pending updates to database using new session approach
  const flushPendingUpdates = async () => {
    if (pendingUpdates.size === 0) return

    // Guard against flushing when campaign is not loaded (e.g., during unmount)
    if (!campaign) {
      console.warn('⚠️ [FLUSH] Campaign not loaded during flush, clearing pending updates to prevent memory leaks')
      setPendingUpdates(new Map()) // Clear to prevent memory leaks
      return
    }

    try {
      const updates = Array.from(pendingUpdates.values())
      await saveBatchResponsesToSession(updates)
      setPendingUpdates(new Map())
      
      logger.info('Batch responses saved to session successfully')

    } catch (err) {
      console.error('Error flushing pending updates:', err)
      // Keep updates in queue for retry
    }
  }

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
      const result = await updateSession(campaignState.sessionId, {
        responses: {
          ...campaignState.userInputs, // Keep existing responses
          ...responseUpdates // Add new responses
        },
        current_section_index: campaignState.currentSection,
        completed_sections: Array.from(campaignState.completedSections)
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
  const updateSessionProgress = async (overrideSectionIndex?: number) => {
    try {
      if (!campaign) {
        console.warn('⚠️ Campaign not loaded, cannot update session progress')
        return
      }

      const currentSectionIndex = overrideSectionIndex !== undefined ? overrideSectionIndex : campaignState.currentSection

      // Use new session data access layer
      const result = await updateSession(campaignState.sessionId, {
        current_section_index: currentSectionIndex,
        completed_sections: Array.from(campaignState.completedSections),
        is_completed: campaignState.completedSections.size >= sections.length
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update session progress')
      }

      console.log('📍 Session progress updated:', { 
        section: currentSectionIndex, 
        completedSections: campaignState.completedSections.size,
        totalSections: sections.length
      })

    } catch (err) {
      console.error('Error updating session progress:', err)
    }
  }

  // Session management functions removed - now handled directly in useEffect above

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const getCampaignVariable = (id: string): any => {
    // Default campaign variables
    const campaignVars: Record<string, any> = {
      campaign_name: campaign?.name || '',
      campaign_id: campaign?.id || '',
      user_session: campaignState.sessionId,
      current_section: campaignState.currentSection + 1,
      total_sections: sections.length,
      start_time: campaignState.startTime.toISOString()
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
      user_session: campaignState.sessionId,
      current_section: campaignState.currentSection + 1,
      total_sections: sections.length,
      start_time: campaignState.startTime.toISOString(),
      completion_rate: Math.round((campaignState.completedSections.size / sections.length) * 100),
      time_elapsed: Math.round((new Date().getTime() - campaignState.startTime.getTime()) / 1000)
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
    Object.entries(campaignState.userInputs).forEach(([key, value]) => {
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
    console.log('🔍 Starting loadPublicCampaign for slug:', slug)
    
    if (!slug || typeof slug !== 'string') {
      console.error('❌ Invalid slug:', slug)
      errorHandler.handleError('Invalid campaign URL. Please check the link.', 'validation')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      errorHandler.clearError()
      
      console.log('🌐 Getting Supabase client...')
      const supabase = await getSupabaseClient()
      
      console.log('🔍 Querying campaign with slug:', slug)
      // Get campaign by published_url with debug info
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('published_url', slug)
        .eq('status', 'published')
        .eq('is_active', true)
        .single()

      console.log('📊 Campaign query result:', { campaign, error: campaignError })

      if (campaignError || !campaign) {
        console.error('❌ Campaign not found. Error:', campaignError)
        if (campaignError?.code === 'PGRST116') {
          throw new Error('Campaign not found')
        }
        throw new Error(campaignError?.message || 'Campaign not available')
      }

      console.log('✅ Campaign found:', {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        slug: campaign.slug
      })
      
      setCampaign(campaign)
      
      console.log('📋 Loading sections for campaign:', campaign.id)
      // Load real campaign sections from database
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('order_index', { ascending: true })

      console.log('📊 Sections query result:', { 
        sectionsData: sectionsData?.map((s: any) => ({ 
          id: s.id, 
          title: s.title, 
          type: s.type, 
          order_index: s.order_index 
        })), 
        error: sectionsError 
      })

      if (sectionsError) {
        throw new Error(`Failed to load campaign sections: ${sectionsError.message}`)
      }

      if (!sectionsData || sectionsData.length === 0) {
        throw new Error('This campaign has no content to display')
      }

      setSections(sectionsData)
      
      // Initialize campaign state (keep existing sessionId)
      setCampaignState(prev => ({
        ...prev,
        startTime: new Date()
        // sessionId already set in initial state, don't regenerate
      }))

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

  const handleSectionComplete = async (sectionIndex: number, data: any) => {
    try {
      const section = sections[sectionIndex]
      
      // Store response data
      setCampaignState(prev => ({
        ...prev,
        userInputs: { ...prev.userInputs, ...data },
        completedSections: new Set([...prev.completedSections, sectionIndex])
      }))

      // Update variables in the runtime engine
      if (updateSystem) {
        for (const [key, value] of Object.entries(data)) {
          await updateSystem.updateVariable(key, value, {
            source: 'user_input',
            propagate: true
          })
        }
      }

      // Save to database for capture sections
      if (section.type === 'capture') {
        await saveLeadData(data)
      }

      // Save response to database
      await saveResponse(section.id, data)

      // Auto-advance to next section after a brief delay
      if (sectionIndex < sections.length - 1) {
        setTimeout(() => {
          setCampaignState(prev => ({
            ...prev,
            currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
          }))
        }, 1000)
      }

    } catch (err) {
      console.error('Error completing section:', err)
      globalErrorHandler.handleError(
        globalErrorHandler.createError(
          err as Error,
          ErrorCategory.VARIABLE,
          { 
            location: { function: 'handleSectionComplete' },
            metadata: { sectionIndex, data }
          }
        )
      )
    }
  }

  const saveLeadData = async (data: any) => {
    try {
      if (!campaign) return

      const supabase = await getSupabaseClient()

      if (campaignState.leadId) {
        // Update existing lead record
        const updateData = {
          name: data.name || data.full_name || null,
          email: data.email,
          phone: data.phone || null,
          metadata: {
            session_id: campaignState.sessionId,
            converted_at: new Date().toISOString(),
            capture_time: new Date().toISOString()
          }
        }

        const { error } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', campaignState.leadId)

        if (error) {
          throw error
        }

        console.log('✅ Lead data updated for existing lead:', campaignState.leadId)
      } else {
        // Create new real lead (no more fake emails!)
        const leadData = {
          session_id: campaignState.sessionId,
          campaign_id: campaign.id,
          name: data.name || data.full_name || null,
          email: data.email,
          phone: data.phone || null,
          converted_at: new Date().toISOString(),
          conversion_section_id: null, // Could be set if we know which section captured them
          metadata: {
            session_id: campaignState.sessionId,
            capture_time: new Date().toISOString()
          }
        }

        // Use new data access layer to create lead
        const result = await createLead(leadData)

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create lead')
        }

        setCampaignState(prev => ({
          ...prev,
          leadId: result.data!.id
        }))

        console.log('✅ New real lead created:', result.data!.id)
      }

    } catch (err) {
      console.error('Error saving lead data:', err)
      // Don't throw - allow campaign to continue even if lead saving fails
    }
  }

  const saveResponse = async (sectionId: string, responseData: any) => {
    try {
      // Responses are now saved automatically via collectResponse -> session JSONB
      // This function is kept for compatibility but responses go through the session system
      console.log('📝 Response saved to session for section:', sectionId)

      // Use the new session-based response collection
      await addResponse(campaignState.sessionId, sectionId, responseData)

    } catch (err) {
      console.error('Error saving response to session:', err)
      // Don't throw - allow campaign to continue
    }
  }

  const handlePrevious = () => {
    if (isTransitioning || campaignState.currentSection <= 0) return

    const newSectionIndex = Math.max(0, campaignState.currentSection - 1)

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: newSectionIndex
    }))

    // Update session progress in database with the new section index
    updateSessionProgress(newSectionIndex)

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleNext = () => {
    if (isTransitioning || campaignState.currentSection >= sections.length - 1) return

    const newSectionIndex = Math.min(sections.length - 1, campaignState.currentSection + 1)

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: newSectionIndex
    }))

    // Update session progress in database with the new section index
    updateSessionProgress(newSectionIndex)

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300)
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Loading Campaign</h3>
          <p className="text-muted-foreground">Please wait while we prepare your experience...</p>
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
                    navigateToSection(captureSection)
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
    <div className="h-screen bg-muted">
      {/* Section Content */}
      {campaignState.currentSection < sections.length && (
        <div key={campaignState.currentSection} className={cn(
          "h-full transition-all duration-300 ease-in-out",
          isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
        )}>
          {/* Use SharedSectionRenderer for consistent experience */}
          <SharedSectionRenderer
            section={sections[campaignState.currentSection]}
            index={campaignState.currentSection}
            isActive={true}
            isPreview={false}
            campaignId={campaign?.id}
            userInputs={campaignState.userInputs}
            sections={sections}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onNavigateToSection={navigateToSection}
            onSectionComplete={handleSectionComplete}
            onResponseUpdate={collectResponse}
          />
        </div>
      )}
    </div>
  )
} 