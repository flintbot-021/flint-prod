'use client'

import React from 'react'
import { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface CampaignHeaderProps {
  campaign: Campaign
  className?: string
  showPoweredBy?: boolean
}

export function CampaignHeader({ campaign, className, showPoweredBy = true }: CampaignHeaderProps) {
  const logoUrl = campaign.settings?.branding?.logo_url
  const companyName = campaign.settings?.branding?.company_name
  const shouldShowPoweredBy = campaign.settings?.branding?.show_powered_by !== false && showPoweredBy
  const campaignName = campaign.name

  // Always render header if there's a campaign name, logo, or powered by branding
  if (!logoUrl && !shouldShowPoweredBy && !campaignName) {
    return null
  }

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

          {/* Powered By Branding */}
          <div className="flex items-center justify-end min-w-0 flex-1">
            {shouldShowPoweredBy && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Powered by</span>
                <span className="font-semibold text-primary">Flint</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 