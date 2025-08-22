'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PrivacyNoticeModal } from '@/components/ui/privacy-notice-modal'
import { getCampaignTextColor, getCampaignTheme, isFirstQuestionScreen } from './utils'
import type { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface ComplianceNoticeProps {
  campaign: Campaign
  isFirstQuestion?: boolean
  currentIndex?: number
  sections?: any[]
  deviceInfo?: { type: 'mobile' | 'tablet' | 'desktop' }
}

export function ComplianceNotice({ campaign, isFirstQuestion = false, currentIndex, sections, deviceInfo }: ComplianceNoticeProps) {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)

  // Determine if this is the first question screen
  const isFirstQuestionScr = currentIndex !== undefined && sections 
    ? isFirstQuestionScreen(currentIndex, sections) 
    : isFirstQuestion

  // Only show on first question screen and if privacy is configured
  if (!isFirstQuestionScr || !campaign.settings?.privacy?.configured) {
    return null
  }

  const { organization_name } = campaign.settings.privacy
  
  // Get theme-aware colors
  const theme = getCampaignTheme(campaign)
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')

  return (
    <>
      <div className={cn(
        "fixed left-0 right-0 z-50 px-6 flex justify-center",
        deviceInfo?.type === 'mobile' ? "bottom-16" : "bottom-24"
      )}>
        <div 
          className="px-4 py-3 rounded-2xl backdrop-blur-md border shadow-lg"
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <p className="text-sm text-center" style={mutedTextStyle}>
            By proceeding, you agree to{' '}
            <span className="font-medium" style={primaryTextStyle}>{organization_name}</span>{' '}
            processing your answers using Flint to generate your results.{' '}
            <button
              className="text-sm underline hover:opacity-80 transition-opacity"
              style={primaryTextStyle}
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              Learn more.
            </button>
          </p>
        </div>
      </div>

      <PrivacyNoticeModal
        campaign={campaign}
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </>
  )
}
