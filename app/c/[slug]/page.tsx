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
  Target, 
  MessageSquare, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  Clock,
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
  leadId?: string
}

interface VariableContext {
  leadData: Record<string, any>
  campaignData: Record<string, any>
  sessionData: Record<string, any>
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

  // Completion celebration state
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')

  const [campaignState, setCampaignState] = useState<CampaignState>({
    currentSection: 0,
    userInputs: {},
    completedSections: new Set(),
    startTime: new Date(),
    sessionId: crypto.randomUUID()
  })

  // =============================================================================
  // ENHANCED PROGRESS TRACKING AND COMPLETION FLOW SYSTEM
  // =============================================================================

  // Progress calculation state
  const [progressMetrics, setProgressMetrics] = useState({
    totalProgress: 0,
    weightedProgress: 0,
    captureProgress: 0,
    timeEstimate: 0,
    completionForecast: '',
    milestones: [] as string[]
  })

  // Section weights for progress calculation
  const getSectionWeight = (section: SectionWithOptions): number => {
    const weights = {
      'capture': 3,      // High weight - critical for completion
      'text_question': 2, // Medium weight - important data
      'multiple_choice': 2, // Medium weight - important data
      'slider': 2,       // Medium weight - important data
      'logic': 1,        // Low weight - automated processing
      'info': 1,         // Low weight - informational
      'output': 4        // Highest weight - final result
    }
    return weights[section.type as keyof typeof weights] || 1
  }

  // Calculate comprehensive progress metrics
  const calculateProgressMetrics = (): typeof progressMetrics => {
    if (sections.length === 0) {
      return {
        totalProgress: 0,
        weightedProgress: 0,
        captureProgress: 0,
        timeEstimate: 0,
        completionForecast: '',
        milestones: []
      }
    }

    // Calculate section-based progress
    const totalSections = sections.length
    const completedCount = campaignState.completedSections.size
    const totalProgress = Math.round((completedCount / totalSections) * 100)

    // Calculate weighted progress
    const totalWeight = sections.reduce((sum, section) => sum + getSectionWeight(section), 0)
    const completedWeight = sections
      .filter((_, index) => campaignState.completedSections.has(index))
      .reduce((sum, section) => sum + getSectionWeight(section), 0)
    const weightedProgress = Math.round((completedWeight / totalWeight) * 100)

    // Calculate capture section progress
    const captureSections = sections.filter(s => s.type === 'capture')
    const completedCaptureSections = captureSections.filter((_, originalIndex) => {
      const sectionIndex = sections.findIndex(s => s.id === captureSections[originalIndex].id)
      return campaignState.completedSections.has(sectionIndex)
    })
    const captureProgress = captureSections.length > 0 
      ? Math.round((completedCaptureSections.length / captureSections.length) * 100)
      : 100

    // Time estimation (average 45 seconds per section)
    const remainingSections = totalSections - completedCount
    const timeEstimate = remainingSections * 45 // seconds

    // Completion forecast
    const now = new Date()
    const forecastTime = new Date(now.getTime() + (timeEstimate * 1000))
    const completionForecast = forecastTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    // Milestones
    const milestones: string[] = []
    if (captureProgress === 100) milestones.push('Contact info collected')
    if (totalProgress >= 25) milestones.push('Getting started')
    if (totalProgress >= 50) milestones.push('Halfway there')
    if (totalProgress >= 75) milestones.push('Almost finished')
    if (totalProgress === 100) milestones.push('Campaign complete!')

    return {
      totalProgress,
      weightedProgress,
      captureProgress,
      timeEstimate,
      completionForecast,
      milestones
    }
  }

  // Update progress metrics when sections change
  useEffect(() => {
    const metrics = calculateProgressMetrics()
    setProgressMetrics(metrics)
  }, [campaignState.completedSections, sections.length, campaignState.currentSection])

  // Completion flow validation
  const canAccessSection = (sectionIndex: number): { canAccess: boolean; reason?: string } => {
    const section = sections[sectionIndex]
    if (!section) return { canAccess: false, reason: 'Section not found' }

    // Check if this is an output/result section that requires capture completion
    if (section.type === 'output') {
      const hasCompletedCapture = progressMetrics.captureProgress === 100
      if (!hasCompletedCapture) {
        return { 
          canAccess: false, 
          reason: 'Please complete the contact information section first' 
        }
      }
    }

    return { canAccess: true }
  }

  // Enhanced navigation with completion validation
  const navigateToSectionWithValidation = (sectionIndex: number): boolean => {
    const validation = canAccessSection(sectionIndex)
    
    if (!validation.canAccess) {
      // Show user-friendly error message
      errorHandler.handleError(validation.reason || 'Cannot access this section yet', 'section_navigation')
      
      return false
    }

    navigateToSection(sectionIndex)
    return true
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

  // Trigger completion celebration
  const triggerCompletionCelebration = async () => {
    if (progressMetrics.totalProgress === 100 && !showCompletionCelebration) {
      const totalTime = Math.round((new Date().getTime() - campaignState.startTime.getTime()) / 1000)
      const minutes = Math.floor(totalTime / 60)
      const seconds = totalTime % 60
      
      const message = `🎉 Congratulations! You completed this campaign in ${minutes}m ${seconds}s. Thank you for your participation!`
      
      setCelebrationMessage(message)
      setShowCompletionCelebration(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowCompletionCelebration(false)
      }, 5000)

      // Update session with completion status
      await updateSessionProgress()
    }
  }

  // Monitor for completion
  useEffect(() => {
    if (progressMetrics.totalProgress === 100) {
      triggerCompletionCelebration()
    }
  }, [progressMetrics.totalProgress])

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

  // Session recovery and initialization
  useEffect(() => {
    const initializeSession = async () => {
      if (campaign && !isSessionRecovered) {
        // Create lead record immediately for RLS policy compliance
        await createInitialLead()
        await recoverSession()
      }
    }
    
    initializeSession()
  }, [campaign, isSessionRecovered])

  // Auto-save on unmount and visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdates.size > 0) {
        flushPendingUpdates()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && pendingUpdates.size > 0) {
        flushPendingUpdates()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      handleBeforeUnload()
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

  // Parse URL section parameter on load
  useEffect(() => {
    if (sections.length === 0) return
    
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get('section')
    
    if (sectionParam) {
      const sectionIndex = parseInt(sectionParam) - 1
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        setCampaignState(prev => ({
          ...prev,
          currentSection: sectionIndex
        }))
      }
    }
  }, [sections.length])

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

  // Real-time response collection with auto-save
  const collectResponse = async (sectionId: string, fieldId: string, value: any, metadata: any = {}) => {
    try {
      // Update local state immediately
      setCampaignState(prev => ({
        ...prev,
        userInputs: { 
          ...prev.userInputs, 
          [fieldId]: value,
          [`${sectionId}_${fieldId}`]: value 
        }
      }))

      // Add to pending updates queue
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

      // Debounced auto-save
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

  // Batch flush pending updates to database
  const flushPendingUpdates = async () => {
    if (pendingUpdates.size === 0) return

    try {
      const updates = Array.from(pendingUpdates.values())
      await saveBatchResponses(updates)
      setPendingUpdates(new Map())
      
      logger.info('Batch responses saved successfully')

    } catch (err) {
      console.error('Error flushing pending updates:', err)
      // Keep updates in queue for retry
    }
  }

  // Enhanced batch response saving
  const saveBatchResponses = async (responses: any[]) => {
    try {
      // Ensure we have a lead ID before saving responses
      if (!campaignState.leadId) {
        console.log('⚠️ No lead ID available, creating lead first...')
        await createInitialLead()
        
        // Wait for state to update, then check again
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // If still no lead ID, skip saving responses
        if (!campaignState.leadId) {
          console.error('❌ Failed to create lead, skipping response save')
          return
        }
      }

      const supabase = await getSupabaseClient()

      // Prepare batch data - map to correct lead_responses schema
      const responseRecords = responses.map(response => ({
        lead_id: campaignState.leadId, // Required for lead_responses table
        section_id: response.sectionId,
        response_value: String(response.value),
        response_type: typeof response.value === 'number' ? 'number' : 
                       typeof response.value === 'boolean' ? 'boolean' : 'text',
        response_data: {
          originalValue: response.value,
          fieldId: response.fieldId, // Store field_id in response_data instead
          metadata: response.metadata,
          sectionIndex: response.metadata.sectionIndex,
          sessionId: response.metadata.sessionId
        }
      }))

      console.log('💾 Saving responses with lead_id:', campaignState.leadId)

      // Batch upsert responses
      const { error: responsesError } = await supabase
        .from('lead_responses')
        .upsert(responseRecords, {
          onConflict: 'lead_id,section_id'
        })

      if (responsesError) {
        throw responsesError
      }

      // Update session progress
      await updateSessionProgress()

    } catch (err) {
      console.error('Error saving batch responses:', err)
      throw err
    }
  }

  // Update session progress tracking
  const updateSessionProgress = async () => {
    try {
      const supabase = await getSupabaseClient()

      const progressData = {
        session_id: campaignState.sessionId,
        campaign_id: campaign?.id,
        last_section_index: campaignState.currentSection,
        completion_percentage: Math.round((campaignState.completedSections.size / sections.length) * 100),
        total_sections: sections.length,
        completed_sections: campaignState.completedSections.size,
        last_activity: new Date().toISOString(),
        is_completed: campaignState.completedSections.size >= sections.length
      }

      const { error } = await supabase
        .from('campaign_sessions')
        .upsert(progressData, {
          onConflict: 'session_id,campaign_id'
        })

      if (error) {
        throw error
      }

    } catch (err) {
      console.error('Error updating session progress:', err)
    }
  }

  // Session recovery from database
  const recoverSession = async (): Promise<boolean> => {
    if (isSessionRecovered) return true

    try {
      const supabase = await getSupabaseClient()
      
      // Try to find existing session
      const { data: existingSession, error } = await supabase
        .from('campaign_sessions')
        .select(`
          *,
          lead_responses (*)
        `)
        .eq('session_id', campaignState.sessionId)
        .eq('campaign_id', campaign?.id)
        .single()

      if (error || !existingSession) {
        // No existing session, create new one
        await createSession()
        setIsSessionRecovered(true)
        return false
      }

      // Restore session state
      const recoveredInputs: Record<string, any> = {}
      const completedSections = new Set<number>()

      if (existingSession.lead_responses) {
        existingSession.lead_responses.forEach((response: any) => {
          // Use section_id as key since field_id doesn't exist in lead_responses table
          recoveredInputs[response.section_id] = response.response_value
          // Get section_index from response_data if available
          const sectionIndex = response.response_data?.sectionIndex || 0
          completedSections.add(sectionIndex)
        })
      }

      setCampaignState(prev => ({
        ...prev,
        userInputs: recoveredInputs,
        completedSections,
        currentSection: existingSession.last_section_index || 0,
        leadId: existingSession.lead_id
      }))

      setIsSessionRecovered(true)
      logger.info('Session recovered successfully')

      return true

    } catch (err) {
      console.error('Error recovering session:', err)
      setIsSessionRecovered(true) // Prevent retry loops
      return false
    }
  }

  // Create initial lead record for RLS policy compliance
  const createInitialLead = async () => {
    try {
      if (!campaign || campaignState.leadId) return // Already has a lead
      
      const supabase = await getSupabaseClient()
      
      // Create anonymous lead record with minimal data
      const leadData = {
        campaign_id: campaign.id,
        email: `anonymous_${campaignState.sessionId}@temp.local`, // Temporary email
        name: null,
        phone: null,
        ip_address: null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        metadata: {
          session_id: campaignState.sessionId,
          start_time: campaignState.startTime.toISOString(),
          is_anonymous: true,
          initial_referrer: typeof document !== 'undefined' ? document.referrer : null
        }
      }

      const { data: lead, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Store lead ID for future use
      setCampaignState(prev => ({
        ...prev,
        leadId: lead.id
      }))

      console.log('✅ Initial lead created:', lead.id)

    } catch (err) {
      console.error('Error creating initial lead:', err)
      // Don't throw - allow campaign to continue even if lead creation fails
    }
  }

  // Create new session record
  const createSession = async () => {
    try {
      const supabase = await getSupabaseClient()
      
      const sessionData = {
        session_id: campaignState.sessionId,
        campaign_id: campaign?.id,
        lead_id: campaignState.leadId, // Link to lead if available
        start_time: campaignState.startTime.toISOString(),
        last_section_index: campaignState.currentSection,
        device_info: getDeviceInfo(),
        metadata: {
          initial_referrer: typeof document !== 'undefined' ? document.referrer : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          screen_resolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : null
        }
      }

      const { error } = await supabase
        .from('campaign_sessions')
        .upsert(sessionData)

      if (error) {
        throw error
      }

      logger.info('New session created')

    } catch (err) {
      console.error('Error creating session:', err)
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
        .select(`
          *,
          section_options (*)
        `)
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
      
      // Initialize campaign state
      setCampaignState(prev => ({
        ...prev,
        startTime: new Date(),
        sessionId: crypto.randomUUID()
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
        // Update existing lead record (created during initialization)
        const updateData = {
          name: data.name || data.full_name || null,
          email: data.email,
          phone: data.phone || null,
          metadata: {
            session_id: campaignState.sessionId,
            completed_sections: Array.from(campaignState.completedSections),
            start_time: campaignState.startTime.toISOString(),
            is_anonymous: false, // No longer anonymous since they provided real data
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
        // Fallback: create new lead if none exists
        const leadData = {
          campaign_id: campaign.id,
          name: data.name || data.full_name || null,
          email: data.email,
          phone: data.phone || null,
          ip_address: null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          metadata: {
            session_id: campaignState.sessionId,
            completed_sections: Array.from(campaignState.completedSections),
            start_time: campaignState.startTime.toISOString(),
            is_anonymous: false
          }
        }

        const { data: lead, error } = await supabase
          .from('leads')
          .insert(leadData)
          .select()
          .single()

        if (error) {
          throw error
        }

        setCampaignState(prev => ({
          ...prev,
          leadId: lead.id
        }))

        console.log('✅ New lead created:', lead.id)
      }

    } catch (err) {
      console.error('Error saving lead data:', err)
      // Don't throw - allow campaign to continue even if lead saving fails
    }
  }

  const saveResponse = async (sectionId: string, responseData: any) => {
    try {
      if (!campaignState.leadId) return

      const supabase = await getSupabaseClient()

      // Determine response type and value
      let responseType: string
      let responseValue: string
      let additionalData = {}

      if (typeof responseData === 'object') {
        // Multiple fields or complex data
        responseType = 'multiple_choice'
        responseValue = JSON.stringify(responseData)
        additionalData = responseData
      } else {
        // Single value
        responseType = typeof responseData === 'number' ? 'number' : 'text'
        responseValue = String(responseData)
      }

      const { error } = await supabase
        .from('lead_responses')
        .upsert({
          lead_id: campaignState.leadId,
          section_id: sectionId,
          response_type: responseType,
          response_value: responseValue,
          response_data: additionalData
        }, {
          onConflict: 'lead_id,section_id'
        })

      if (error) {
        throw error
      }

    } catch (err) {
      console.error('Error saving response:', err)
      // Don't throw - allow campaign to continue
    }
  }

  const handlePrevious = () => {
    if (isTransitioning || campaignState.currentSection <= 0) return

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: Math.max(0, prev.currentSection - 1)
    }))

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleNext = () => {
    if (isTransitioning || campaignState.currentSection >= sections.length - 1) return

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: Math.min(sections.length - 1, prev.currentSection + 1)
    }))

    // Reset transition state after animation
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const navigateToSection = (sectionIndex: number) => {
    if (isTransitioning || sectionIndex === campaignState.currentSection) return
    if (sectionIndex < 0 || sectionIndex >= sections.length) return

    setIsTransitioning(true)
    setCampaignState(prev => ({
      ...prev,
      currentSection: sectionIndex
    }))

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

  if (isLoading) {
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

  if (!campaign || sections.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Content</h3>
          <p className="text-muted-foreground">This campaign doesn't have any content to display.</p>
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-muted">
      {/* Completion Celebration Modal */}
      {showCompletionCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Campaign Complete!</h2>
            <p className="text-muted-foreground mb-6">{celebrationMessage}</p>
            <div className="flex justify-center space-x-2 mb-4">
              {progressMetrics.milestones.map((milestone, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {milestone}
                </Badge>
              ))}
            </div>
            <Button 
              onClick={() => setShowCompletionCelebration(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Campaign Info Header with Enhanced Progress */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-foreground">{campaign.name}</h2>
            </div>
            
            {/* Enhanced Progress Indicator */}
            <div className="flex items-center space-x-4">
              {/* Real-time Save Status */}
              {pendingUpdates.size > 0 && (
                <div className="flex items-center text-sm text-amber-600">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  <span>Saving...</span>
                </div>
              )}
              
              {pendingUpdates.size === 0 && isSessionRecovered && campaignState.userInputs && Object.keys(campaignState.userInputs).length > 0 && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>Saved</span>
                </div>
              )}
              
              {/* Progress Details */}
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-muted-foreground">
                    {campaignState.currentSection + 1} of {sections.length}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {progressMetrics.weightedProgress}%
                  </span>
                </div>
                
                {/* Time Estimate */}
                {progressMetrics.timeEstimate > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ~{Math.ceil(progressMetrics.timeEstimate / 60)}min remaining • Est. {progressMetrics.completionForecast}
                  </div>
                )}
                
                {/* Progress Bar */}
                <div className="w-32 h-1 bg-gray-200 rounded-full mt-1">
                  <div 
                    className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressMetrics.weightedProgress}%` }}
                  />
                </div>
              </div>
              
              {/* Section Dots */}
              <div className="flex space-x-1">
                {sections.map((section, index) => {
                  const canAccess = canAccessSection(index).canAccess
                  return (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors cursor-pointer",
                        index === campaignState.currentSection
                          ? "bg-blue-600 ring-2 ring-blue-200"
                          : campaignState.completedSections.has(index)
                          ? "bg-green-500"
                          : canAccess
                          ? "bg-gray-300 hover:bg-gray-400"
                          : "bg-gray-200"
                      )}
                      onClick={() => {
                        if (canAccess && index !== campaignState.currentSection) {
                          navigateToSectionWithValidation(index)
                        }
                      }}
                      title={`${section.title || `Section ${index + 1}`}${
                        !canAccess ? ' (Locked)' : ''
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Milestones Banner */}
          {progressMetrics.milestones.length > 0 && (
            <div className="mt-3 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-600" />
                <div className="flex space-x-1">
                  {progressMetrics.milestones.slice(-2).map((milestone, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-50 text-green-700">
                      {milestone}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {campaignState.currentSection < sections.length && (
            <div key={campaignState.currentSection} className={cn(
              "transition-all duration-300 ease-in-out",
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
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isTransitioning || campaignState.currentSection <= 0}
              className={cn(
                getMobileClasses("transition-all duration-200"),
                isTransitioning && "opacity-50 cursor-not-allowed",
                deviceInfo?.type === 'mobile' && "px-6 py-3"
              )}
              size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
            >
              <ArrowLeft className={cn(
                "mr-1",
                deviceInfo?.type === 'mobile' ? "h-5 w-5" : "h-4 w-4"
              )} />
              Previous
            </Button>
            
            {/* Enhanced Progress Indicator with Navigation Hints */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {campaignState.currentSection + 1} of {sections.length}
                </span>
                {isTransitioning && (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600 mr-1" />
                    <span className="text-xs text-blue-600">Transitioning...</span>
                  </div>
                )}
              </div>
              
              {/* Device-specific Navigation Hints */}
              <div className="text-xs text-gray-400 text-center max-w-xs">
                {deviceInfo?.touchCapable 
                  ? "Swipe left/right or use buttons to navigate"
                  : "Use arrow keys or buttons to navigate"
                }
              </div>
              
              {/* Network Status in Navigation */}
              {!networkState.isOnline && (
                <div className="flex items-center text-xs text-red-500">
                  <WifiOff className="h-3 w-3 mr-1" />
                  <span>Offline</span>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={isTransitioning || campaignState.currentSection >= sections.length - 1}
              className={cn(
                getMobileClasses("transition-all duration-200"),
                isTransitioning && "opacity-50 cursor-not-allowed",
                deviceInfo?.type === 'mobile' && "px-6 py-3"
              )}
              size={deviceInfo?.type === 'mobile' ? 'lg' : 'default'}
            >
              Next
              <ArrowRight className={cn(
                "ml-1",
                deviceInfo?.type === 'mobile' ? "h-5 w-5" : "h-4 w-4"
              )} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 