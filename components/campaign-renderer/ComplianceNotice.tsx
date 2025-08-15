'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PrivacyNoticeModal } from '@/components/ui/privacy-notice-modal'
import { getCampaignTextColor, isFirstQuestionScreen } from './utils'
import type { Campaign } from '@/lib/types/database'

interface ComplianceNoticeProps {
  campaign: Campaign
  isFirstQuestion?: boolean
  currentIndex?: number
  sections?: any[]
}

export function ComplianceNotice({ campaign, isFirstQuestion = false, currentIndex, sections }: ComplianceNoticeProps) {
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
  
  // Get theme-aware text colors
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')

  return (
    <>
      <div className="fixed bottom-24 left-0 right-0 z-50 px-6">
        <p className="text-sm text-center" style={mutedTextStyle}>
          By proceeding, you agree to{' '}
          <span className="font-medium" style={primaryTextStyle}>{organization_name}</span>{' '}
          processing your answers using Flint to generate your results.{' '}
          <button
            className="text-sm underline hover:opacity-80"
            style={primaryTextStyle}
            onClick={() => setIsPrivacyModalOpen(true)}
          >
            Learn more.
          </button>
        </p>
      </div>

      <PrivacyNoticeModal
        campaign={campaign}
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </>
  )
}
