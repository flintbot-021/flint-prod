'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Monitor, 
  Tablet, 
  Smartphone,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  RefreshCcw,
  ExternalLink,
  Settings,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Campaign } from '@/lib/types/database'
import { CampaignSection } from '@/lib/types/campaign-builder'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CampaignPreviewProps {
  campaign: Campaign
  sections: CampaignSection[]
  className?: string
  enableDeviceToggle?: boolean
  enableFullscreen?: boolean
  onSectionChange?: (sectionIndex: number) => void
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'
export type PreviewMode = 'sequence' | 'realtime' | 'interactive'

interface PreviewConfig {
  device: PreviewDevice
  mode: PreviewMode
  showNavigation: boolean
  autoAdvance: boolean
  autoAdvanceDelay: number
  bypassDisplayRules: boolean
}

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
    maxWidth: '100%',
    description: 'Full desktop experience'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    maxWidth: '768px',
    description: 'iPad and tablet devices'
  },
  mobile: {
    name: 'Mobile',
    icon: Smartphone,
    width: 375,
    height: 667,
    maxWidth: '375px',
    description: 'iPhone and mobile devices'
  }
}

// =============================================================================
// PREVIEW FRAME COMPONENT
// =============================================================================

function PreviewFrame({
  src,
  device,
  isLoading,
  onLoad,
  onError
}: {
  src: string
  device: PreviewDevice
  isLoading: boolean
  onLoad: () => void
  onError: (error: string) => void
}) {
  const config = DEVICE_CONFIGS[device]
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const frameStyles = {
    width: device === 'desktop' ? '100%' : `${config.width}px`,
    height: device === 'desktop' ? '600px' : `${config.height}px`,
    maxWidth: config.maxWidth || '100%'
  }

  const handleIframeLoad = useCallback(() => {
    onLoad()
  }, [onLoad])

  const handleIframeError = useCallback(() => {
    onError('Failed to load preview')
  }, [onError])

  if (device === 'desktop') {
    return (
      <div className="w-full relative">
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full border rounded-lg shadow-sm"
          style={frameStyles}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Campaign Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        {isLoading && (
          <div className="absolute inset-0 bg-background bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <RefreshCcw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Mobile/Tablet frame with device appearance
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={cn(
          "relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl",
          device === 'mobile' && "rounded-[2.5rem]",
          device === 'tablet' && "rounded-[1.5rem]"
        )}
        style={frameStyles}
      >
        {/* Device Screen */}
        <div className={cn(
          "bg-background rounded-[1.5rem] w-full h-full overflow-hidden relative",
          device === 'mobile' && "rounded-[2rem]",
          device === 'tablet' && "rounded-[1rem]"
        )}>
          {/* Status Bar (Mobile only) */}
          {device === 'mobile' && (
            <div className="h-6 bg-muted flex items-center justify-between px-4 text-xs">
              <span className="font-medium">9:41</span>
              <div className="flex space-x-1">
                <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                <div className="w-6 h-2 bg-green-500 rounded-sm"></div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className={cn(
            "w-full h-full overflow-hidden relative",
            device === 'mobile' && "h-[calc(100%-1.5rem)]"
          )}>
            <iframe
              ref={iframeRef}
              src={src}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Campaign Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
            
            {isLoading && (
              <div className="absolute inset-0 bg-background bg-opacity-75 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Home Button (Mobile only) */}
        {device === 'mobile' && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// PREVIEW NAVIGATION COMPONENT
// =============================================================================

function PreviewNavigation({
  currentSection,
  totalSections,
  isPlaying,
  onPrevious,
  onNext,
  onPlay,
  onPause,
  onStop,
  onSectionSelect
}: {
  currentSection: number
  totalSections: number
  isPlaying: boolean
  onPrevious: () => void
  onNext: () => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSectionSelect: (index: number) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted border-b">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentSection <= 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentSection >= totalSections - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-xs">
          Section {currentSection + 1} of {totalSections}
        </Badge>
        
        <select
          value={currentSection}
          onChange={(e) => onSectionSelect(parseInt(e.target.value))}
          className="text-xs border rounded px-2 py-1"
        >
          {Array.from({ length: totalSections }, (_, i) => (
            <option key={i} value={i}>
              Section {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CampaignPreview({
  campaign,
  sections,
  className,
  enableDeviceToggle = true,
  enableFullscreen = true,
  onSectionChange
}: CampaignPreviewProps) {
  const [config, setConfig] = useState<PreviewConfig>({
    device: 'desktop',
    mode: 'sequence',
    showNavigation: true,
    autoAdvance: false,
    autoAdvanceDelay: 3000,
    bypassDisplayRules: true
  })
  
  const [currentSection, setCurrentSection] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)

  // Generate preview URL for iframe
  const previewUrl = `/campaigns/${campaign.id}/preview?section=${currentSection}&mode=${config.mode}&device=${config.device}&bypass=${config.bypassDisplayRules}`

  // =============================================================================
  // NAVIGATION HANDLERS
  // =============================================================================

  const handlePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentSection - 1)
    setCurrentSection(newIndex)
    onSectionChange?.(newIndex)
  }, [currentSection, onSectionChange])

  const handleNext = useCallback(() => {
    const newIndex = Math.min(sections.length - 1, currentSection + 1)
    setCurrentSection(newIndex)
    onSectionChange?.(newIndex)
  }, [currentSection, sections.length, onSectionChange])

  const handleSectionSelect = useCallback((index: number) => {
    setCurrentSection(index)
    onSectionChange?.(index)
  }, [onSectionChange])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (config.autoAdvance) {
      autoAdvanceRef.current = setInterval(() => {
        setCurrentSection(prev => {
          const next = prev + 1
          if (next >= sections.length) {
            setIsPlaying(false)
            return 0 // Loop back to start
          }
          return next
        })
      }, config.autoAdvanceDelay)
    }
  }, [config.autoAdvance, config.autoAdvanceDelay, sections.length])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentSection(0)
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  // =============================================================================
  // CONFIG HANDLERS
  // =============================================================================

  const handleDeviceChange = (device: PreviewDevice) => {
    setConfig(prev => ({ ...prev, device }))
    setIsLoading(true)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleExternalPreview = () => {
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current)
      }
    }
  }, [])

  // =============================================================================
  // RENDER CONTROLS
  // =============================================================================

  const renderControls = () => (
    <div className="flex items-center justify-between p-3 bg-muted border-b">
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Campaign Preview</span>
        <Badge variant="outline" className="text-xs">
          {DEVICE_CONFIGS[config.device].name}
        </Badge>
        {config.bypassDisplayRules && (
          <Badge variant="secondary" className="text-xs">
            All Sections
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Device Toggle */}
        {enableDeviceToggle && (
          <div className="flex border rounded-lg overflow-hidden">
            {Object.entries(DEVICE_CONFIGS).map(([key, deviceConfig]) => {
              const IconComponent = deviceConfig.icon
              return (
                <Button
                  key={key}
                  variant={config.device === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDeviceChange(key as PreviewDevice)}
                  className="h-8 px-3 rounded-none border-0"
                  title={deviceConfig.description}
                >
                  <IconComponent className="h-3 w-3" />
                </Button>
              )
            })}
          </div>
        )}

        {/* Control Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          title="Refresh preview"
        >
          <RefreshCcw className="h-3 w-3" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExternalPreview}
          title="Open in new window"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>

        {enableFullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreenToggle}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="h-full flex flex-col">
          {renderControls()}
          
          {config.showNavigation && (
            <PreviewNavigation
              currentSection={currentSection}
              totalSections={sections.length}
              isPlaying={isPlaying}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSectionSelect={handleSectionSelect}
            />
          )}
          
          <div className="flex-1 overflow-auto bg-accent">
            <PreviewFrame
              src={previewUrl}
              device={config.device}
              isLoading={isLoading}
              onLoad={() => setIsLoading(false)}
              onError={setError}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border-t border-red-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-800">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {renderControls()}
      
      {config.showNavigation && (
        <PreviewNavigation
          currentSection={currentSection}
          totalSections={sections.length}
          isPlaying={isPlaying}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSectionSelect={handleSectionSelect}
        />
      )}
      
      <CardContent className="p-0 bg-accent">
        <PreviewFrame
          src={previewUrl}
          device={config.device}
          isLoading={isLoading}
          onLoad={() => setIsLoading(false)}
          onError={setError}
        />
      </CardContent>
      
      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-red-800">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default CampaignPreview 