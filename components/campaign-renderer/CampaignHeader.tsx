'use client'

import React from 'react'
import { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, ChevronLeft, ChevronRight, Monitor, Tablet, Smartphone } from 'lucide-react'

// Preview-specific types
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface DeviceConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  width: number
  height: number
  maxWidth?: string
  description: string
}

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

interface PreviewControls {
  currentSection: number
  totalSections: number
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  currentDevice: PreviewDevice
  onDeviceChange: (device: PreviewDevice) => void
}

interface CampaignHeaderProps {
  campaign: Campaign
  className?: string
  showPoweredBy?: boolean
  // Preview-specific props (only used in preview mode)
  isPreview?: boolean
  previewControls?: PreviewControls
}

export function CampaignHeader({ 
  campaign, 
  className, 
  showPoweredBy = true, 
  isPreview = false, 
  previewControls 
}: CampaignHeaderProps) {
  const logoUrl = campaign.settings?.branding?.logo_url
  const companyName = campaign.settings?.branding?.company_name
  const shouldShowPoweredBy = campaign.settings?.branding?.show_powered_by !== false && showPoweredBy
  const campaignName = campaign.name

  // Always render header if there's a campaign name, logo, powered by branding, or preview mode
  if (!logoUrl && !shouldShowPoweredBy && !campaignName && !isPreview) {
    return null
  }

  // Preview mode layout
  if (isPreview && previewControls) {
    return (
      <header className={cn(
        "sticky top-0 z-50 bg-card border-b border-border",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Preview Label + Campaign Info */}
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              {/* Logo if available */}
              {logoUrl && (
                <img 
                  src={logoUrl}
                  alt={companyName || campaign.name || 'Logo'}
                  className="h-8 w-auto max-w-24 object-contain flex-shrink-0"
                />
              )}
              
              {/* Preview Label + Campaign Name */}
              <div className="flex items-center min-w-0">
                <Eye className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold truncate">
                    Preview: {campaignName}
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
                  onClick={previewControls.onPrevious}
                  disabled={!previewControls.canGoPrevious}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                  {previewControls.currentSection + 1} / {previewControls.totalSections}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previewControls.onNext}
                  disabled={!previewControls.canGoNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Device Selector */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                {Object.entries(DEVICE_CONFIGS).map(([key, config]) => {
                  const IconComponent = config.icon
                  const isActive = previewControls.currentDevice === key
                  
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => previewControls.onDeviceChange(key as PreviewDevice)}
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
      </header>
    )
  }

  // Standard (public) mode layout
  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border/40",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center min-w-0 flex-1">
            {logoUrl && (
              <img 
                src={logoUrl}
                alt={companyName || campaign.name || 'Logo'}
                className="h-8 w-auto max-w-32 object-contain flex-shrink-0"
              />
            )}
          </div>

          {/* Campaign Name Section */}
          {campaignName && (
            <div className="flex-1 text-center px-4">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {campaignName}
              </h1>
            </div>
          )}

          {/* Powered By Branding - Hidden on mobile */}
          <div className="flex items-center justify-end min-w-0 flex-1">
            {shouldShowPoweredBy && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Powered by</span>
                <a 
                  href="https://launch.useflint.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Flint
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 