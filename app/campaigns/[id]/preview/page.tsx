'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Campaign } from '@/lib/types/database'
import { getCampaignById, getCampaignSections } from '@/lib/data-access'
import { cn, applySectionOrdering } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  AlertCircle,
  Eye,
  TestTube,
  Monitor,
  Tablet,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

// Import NEW shared components
import { SectionRenderer as SharedSectionRenderer, CampaignHeader } from '@/components/campaign-renderer'
import { useCampaignRenderer } from '@/hooks'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PreviewPageProps {}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface DeviceConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  width: number
  height: number
  maxWidth?: string
  description: string
}

// =============================================================================
// DEVICE CONFIGURATIONS
// =============================================================================

const DEVICE_CONFIGS: Record<PreviewDevice, DeviceConfig> = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    description: 'Desktop and laptop screens'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    maxWidth: '90%',
    description: 'iPad and tablet devices'
  },
  mobile: {
    name: 'Mobile',
    icon: Smartphone,
    width: 375,
    height: 667,
    maxWidth: '95%',
    description: 'Mobile phones'
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CampaignPreviewPage({}: PreviewPageProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const campaignId = params?.id as string
  
  // Parse URL parameters
  const initialSection = parseInt(searchParams?.get('section') || '0')
  const deviceType = (searchParams?.get('device') || 'desktop') as PreviewDevice

  // Campaign data state
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sectionsData, setSectionsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDevice, setCurrentDevice] = useState<PreviewDevice>(deviceType)
  
  // Use shared campaign renderer hook (always call it, never conditionally)
  const campaignRenderer = useCampaignRenderer({
    sections: sectionsData,
    initialSection,
    onProgressUpdate: (progress, sectionIndex) => {
      // Progress updated
    }
  })

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  useEffect(() => {
    if (sectionsData.length > 0) {
      campaignRenderer.goToSection(initialSection)
    }
  }, [initialSection, sectionsData.length])

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const loadCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getCampaignById(campaignId)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Campaign not found')
      }

      setCampaign(result.data)
      
      const sectionsResult = await getCampaignSections(campaignId)
      if (!sectionsResult.success) {
        throw new Error(sectionsResult.error || 'Failed to load campaign sections')
      }

      const sectionsData = sectionsResult.data || []
      // Filter out hidden sections for preview mode
      const visibleSections = sectionsData.filter(section => {
        // Check if isVisible property exists in configuration and is not false
        const config = (section.configuration as any) || {}
        return config.isVisible !== false
      })
      setSectionsData(applySectionOrdering(visibleSections))

    } catch (err) {
      console.error('Error loading campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleSectionComplete = (sectionIndex: number, data: any) => {
    if (sectionsData.length > 0) {
      campaignRenderer.handleSectionComplete(sectionIndex, data)
    }
  }

  const handleNext = () => {
    if (sectionsData.length > 0) {
      campaignRenderer.goNext()
    }
  }

  const handlePrevious = () => {
    if (sectionsData.length > 0) {
      campaignRenderer.goPrevious()
    }
  }

  const handleDeviceChange = (device: PreviewDevice) => {
    setCurrentDevice(device)
    const url = new URL(window.location.href)
    url.searchParams.set('device', device)
    window.history.replaceState({}, '', url.toString())
  }

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderDeviceFrame = (content: React.ReactNode) => {
    const config = DEVICE_CONFIGS[currentDevice]

    if (currentDevice === 'desktop') {
      return <div className="w-full h-full overflow-auto">{content}</div>
    }

    const frameStyles = {
      width: `${config.width}px`,
      height: `${config.height}px`,
      maxWidth: config.maxWidth || '100%'
    }

    return (
      <div className="flex items-center justify-center p-4 h-full">
        <div
          className={cn(
            "relative bg-slate-800 rounded-[2rem] p-2 shadow-2xl",
            currentDevice === 'mobile' && "rounded-[2.5rem]",
            currentDevice === 'tablet' && "rounded-[1.5rem]"
          )}
          style={frameStyles}
        >
          <div className={cn(
            "bg-background rounded-[1.5rem] w-full h-full overflow-auto relative",
            currentDevice === 'mobile' && "rounded-[2rem]",
            currentDevice === 'tablet' && "rounded-[1rem]"
            )}>
              {content}
          </div>
        </div>
      </div>
    )
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Ghosted Top Bar */}
        <div className="h-16 bg-gray-200 animate-pulse"></div>
        
        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
                         {/* Ghosted Headline */}
             <div className="h-12 bg-gray-200 rounded animate-pulse mx-auto w-[640px]"></div>
            
            {/* Ghosted Subheading */}
            <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-1/2"></div>
            
            {/* Ghosted Button */}
            <div className="h-12 bg-gray-200 rounded animate-pulse mx-auto w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preview Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!campaign || sectionsData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground">No sections found for this campaign.</p>
        </div>
      </div>
    )
  }

  const currentSectionIndex = campaignRenderer.currentSection
  const currentSection = sectionsData[currentSectionIndex]
  const canGoPrevious = currentSectionIndex > 0
  const canGoNext = currentSectionIndex < sectionsData.length - 1

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Consolidated Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Campaign Info */}
            <div className="flex items-center space-x-4">
  
              
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h1 className="text-lg font-semibold">
                    Preview: {campaign.name}
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Right: Navigation Controls & Device Selector */}
            <div className="flex items-center space-x-4">
              {/* Navigation Controls */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                  {currentSectionIndex + 1} / {sectionsData.length}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Device Selector */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                {Object.entries(DEVICE_CONFIGS).map(([key, config]) => {
                  const IconComponent = config.icon
                  const isActive = currentDevice === key
                  
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleDeviceChange(key as PreviewDevice)}
                      className={cn(
                        "h-8 w-8 p-0",
                        isActive 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                      title={config.description}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="h-[calc(100vh-4rem)] overflow-hidden">
        {renderDeviceFrame(
          <div className="h-full bg-background flex flex-col">
            {/* Campaign Header with Logo for Preview */}
            <CampaignHeader campaign={campaign} showPoweredBy={false} />
            
            {/* Show current section using shared renderer */}
            {sectionsData.length > 0 && currentSectionIndex < sectionsData.length && (
              <div className="flex-1">
                <SharedSectionRenderer
                  section={currentSection}
                  index={currentSectionIndex}
                  isActive={true}
                  isPreview={true}
                  campaignId={campaignId}
                  campaign={campaign}
                  userInputs={campaignRenderer.userInputs}
                  sections={sectionsData}
                  deviceInfo={{
                    type: currentDevice,
                    screenSize: { 
                      width: DEVICE_CONFIGS[currentDevice].width, 
                      height: DEVICE_CONFIGS[currentDevice].height 
                    },
                    orientation: 'portrait',
                    touchCapable: currentDevice !== 'desktop',
                    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
                    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
                  }}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onNavigateToSection={(index: number) => {
                    if (sectionsData.length > 0) {
                      campaignRenderer.goToSection(index)
                    }
                  }}
                  onSectionComplete={handleSectionComplete}
                  onResponseUpdate={(sectionId: string, fieldId: string, value: any, metadata?: any) => {
                    // Store response in campaignRenderer for AI processing
                    campaignRenderer.handleResponseUpdate(sectionId, fieldId, value, metadata)
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 