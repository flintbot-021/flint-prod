'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PrivacyNoticeModal } from '@/components/ui/privacy-notice-modal'
import { getCampaignTextColor } from './utils'
import type { Campaign } from '@/lib/types/database'

interface ComplianceNoticeProps {
  campaign: Campaign
  isFirstQuestion?: boolean
}

export function ComplianceNotice({ campaign, isFirstQuestion = false }: ComplianceNoticeProps) {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)

  // Only show on first question and if privacy is configured
  if (!isFirstQuestion || !campaign.settings?.privacy?.configured) {
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
