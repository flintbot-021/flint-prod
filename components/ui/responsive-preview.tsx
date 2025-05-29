'use client'

import React, { useState, useMemo } from 'react'
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
  Settings
} from 'lucide-react'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ResponsivePreviewProps {
  children: React.ReactNode
  className?: string
  enableDeviceToggle?: boolean
  enableOrientationToggle?: boolean
  showDeviceFrame?: boolean
  defaultDevice?: DeviceType
  onDeviceChange?: (device: DeviceType) => void
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile'
export type Orientation = 'portrait' | 'landscape'

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

const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
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
// DEVICE FRAME COMPONENT
// =============================================================================

function DeviceFrame({
  device,
  orientation,
  children,
  showFrame = true
}: {
  device: DeviceType
  orientation: Orientation
  children: React.ReactNode
  showFrame?: boolean
}) {
  const config = DEVICE_CONFIGS[device]
  
  const frameStyles = useMemo(() => {
    if (!showFrame || device === 'desktop') {
      return {
        width: '100%',
        maxWidth: config.maxWidth,
        minHeight: device === 'desktop' ? '600px' : '400px'
      }
    }

    const isLandscape = orientation === 'landscape'
    const width = isLandscape ? Math.max(config.width, config.height) : config.width
    const height = isLandscape ? Math.min(config.width, config.height) : config.height

    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: '100%'
    }
  }, [device, orientation, config, showFrame])

  if (!showFrame || device === 'desktop') {
    return (
      <div className="w-full" style={frameStyles}>
        {children}
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
          "bg-white rounded-[1.5rem] w-full h-full overflow-hidden relative",
          device === 'mobile' && "rounded-[2rem]",
          device === 'tablet' && "rounded-[1rem]"
        )}>
          {/* Status Bar (Mobile only) */}
          {device === 'mobile' && (
            <div className="h-6 bg-gray-50 flex items-center justify-between px-4 text-xs">
              <span className="font-medium">9:41</span>
              <div className="flex space-x-1">
                <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                <div className="w-6 h-2 bg-green-500 rounded-sm"></div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className={cn(
            "w-full overflow-auto",
            device === 'mobile' ? "h-[calc(100%-1.5rem)]" : "h-full"
          )}>
            {children}
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
// MAIN COMPONENT
// =============================================================================

export function ResponsivePreview({
  children,
  className,
  enableDeviceToggle = true,
  enableOrientationToggle = true,
  showDeviceFrame = true,
  defaultDevice = 'desktop',
  onDeviceChange
}: ResponsivePreviewProps) {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>(defaultDevice)
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleDeviceChange = (device: DeviceType) => {
    setCurrentDevice(device)
    onDeviceChange?.(device)
    
    // Reset orientation for desktop
    if (device === 'desktop') {
      setOrientation('portrait')
    }
  }

  const handleOrientationToggle = () => {
    if (currentDevice !== 'desktop') {
      setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')
    }
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  // =============================================================================
  // RENDER CONTROLS
  // =============================================================================

  const renderControls = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Preview</span>
        <Badge variant="outline" className="text-xs">
          {DEVICE_CONFIGS[currentDevice].name}
          {currentDevice !== 'desktop' && orientation === 'landscape' && ' (Landscape)'}
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        {/* Device Toggle */}
        {enableDeviceToggle && (
          <div className="flex border rounded-lg overflow-hidden">
            {Object.entries(DEVICE_CONFIGS).map(([key, config]) => {
              const IconComponent = config.icon
              return (
                <Button
                  key={key}
                  variant={currentDevice === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleDeviceChange(key as DeviceType)}
                  className="h-8 px-3 rounded-none border-0"
                  title={config.description}
                >
                  <IconComponent className="h-3 w-3" />
                </Button>
              )
            })}
          </div>
        )}

        {/* Orientation Toggle */}
        {enableOrientationToggle && currentDevice !== 'desktop' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOrientationToggle}
            className="h-8 px-2"
            title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}

        {/* Fullscreen Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreenToggle}
          className="h-8 px-2"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {renderControls()}
          
          <div className="flex-1 overflow-auto bg-gray-100">
            <DeviceFrame
              device={currentDevice}
              orientation={orientation}
              showFrame={showDeviceFrame}
            >
              {children}
            </DeviceFrame>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {renderControls()}
      
      <CardContent className="p-0 bg-gray-100">
        <DeviceFrame
          device={currentDevice}
          orientation={orientation}
          showFrame={showDeviceFrame}
        >
          {children}
        </DeviceFrame>
      </CardContent>
    </Card>
  )
}

export default ResponsivePreview 