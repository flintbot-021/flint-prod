'use client'

import React, { useState } from 'react'
import { X, Share2, Copy, Check, AlertTriangle, ExternalLink, Twitter, Linkedin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getCampaignTheme, getCampaignButtonStyles } from './utils'
import type { Campaign } from '@/lib/types/campaign'

interface ShareResultsModalProps {
  isOpen: boolean
  onClose: () => void
  campaignSlug: string
  userKey: string
  campaignName: string
  userInputs: Record<string, any>
  aiResults: Record<string, any>
  variables: Record<string, any>
  campaignId: string
  sectionConfig?: Record<string, any>
  campaign?: Campaign
}

interface ShareState {
  step: 'options' | 'creating' | 'success' | 'error'
  shareUrl?: string
  error?: string
  copied: boolean
}

export function ShareResultsModal({
  isOpen,
  onClose,
  campaignSlug,
  userKey,
  campaignName,
  userInputs,
  aiResults,
  variables,
  campaignId,
  sectionConfig,
  campaign
}: ShareResultsModalProps) {
  const [shareState, setShareState] = useState<ShareState>({
    step: 'options',
    copied: false
  })
  const [consentGiven, setConsentGiven] = useState(false)

  // Get campaign theme for consistent styling
  const campaignTheme = getCampaignTheme(campaign)

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setShareState({ step: 'options', copied: false })
      setConsentGiven(false)
    }
  }, [isOpen])

  // Generate the original campaign URL for empty form sharing
  const originalCampaignUrl = `${window.location.origin}/c/${userKey}/${campaignSlug}`

  // Handle creating shareable results link
  const handleCreateShareableLink = async () => {
    if (!consentGiven) return

    setShareState({ step: 'creating', copied: false })

    try {
      // Only store output/results data for sharing (no user inputs)
      const sanitizedData = {
        aiResults, // The AI-generated output/results
        sectionConfig: sectionConfig || {}, // The section configuration for rendering
        campaignId,
        timestamp: Date.now()
        // Note: We deliberately exclude userInputs and variables to protect privacy
        // and only share the final output/results
      }

      const response = await fetch('/api/shared-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          shared_data: sanitizedData,
          metadata: {
            campaign_name: campaignName,
            created_from_url: window.location.href,
            user_agent: navigator.userAgent
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create shareable link')
      }

      const result = await response.json()
      const shareUrl = `${window.location.origin}/s/${result.short_id}`

      setShareState({
        step: 'success',
        shareUrl,
        copied: false
      })
    } catch (error) {
      console.error('Error creating shareable link:', error)
      setShareState({
        step: 'error',
        error: 'Failed to create shareable link. Please try again.',
        copied: false
      })
    }
  }

  // Handle copying to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShareState(prev => ({ ...prev, copied: true }))
      setTimeout(() => {
        setShareState(prev => ({ ...prev, copied: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Handle social sharing
  const handleSocialShare = (platform: 'twitter' | 'linkedin') => {
    if (!shareState.shareUrl) return

    const text = `Check out my results from ${campaignName}!`
    const url = shareState.shareUrl

    let shareUrl = ''
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }

    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: `${campaignTheme.buttonColor}20`,
                color: campaignTheme.buttonColor 
              }}
            >
              <Share2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl" style={{ color: campaignTheme.textColor }}>
              Share Your Results
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
          {shareState.step === 'options' && (
            <div className="space-y-6">
              {/* Share Results Link Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ 
                      backgroundColor: `${campaignTheme.buttonColor}15`,
                      color: campaignTheme.buttonColor 
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: campaignTheme.textColor }}>
                      Share Results Link
                    </h3>
                    <CardDescription>
                      Create a public link with your personalized results
                    </CardDescription>
                  </div>
                </div>

                {/* Privacy Notice */}
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <CardTitle className="text-sm font-medium text-amber-800 mb-2">
                          Privacy Notice
                        </CardTitle>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Anyone with this link can view your results</li>
                          <li>• Only the final results are shared - no personal information or form inputs</li>
                          <li>• Link expires automatically in 30 days</li>
                          <li>• You can delete the shared link at any time</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consent Checkbox */}
                <div 
                  className="flex items-start space-x-3"
                  style={{
                    '--primary': campaignTheme.buttonColor,
                    '--primary-foreground': '#ffffff',
                  } as React.CSSProperties}
                >
                  <Checkbox
                    id="consent-checkbox"
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked === true)}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="consent-checkbox" 
                    className="text-sm cursor-pointer leading-5"
                    style={{ color: campaignTheme.textColor }}
                  >
                    I understand and want to create a shareable version of my results
                  </Label>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateShareableLink}
                  disabled={!consentGiven}
                  className="w-full"
                  style={consentGiven ? getCampaignButtonStyles(campaign, 'primary') : undefined}
                >
                  Create Shareable Link
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Share Empty Form Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ 
                      backgroundColor: `${campaignTheme.buttonColor}15`,
                      color: campaignTheme.buttonColor 
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: campaignTheme.textColor }}>
                      Share Empty Form
                    </h3>
                    <CardDescription>
                      Share the original tool for others to try from the beginning
                    </CardDescription>
                  </div>
                </div>

                <Button
                  onClick={() => handleCopy(originalCampaignUrl)}
                  variant="outline"
                  className="w-full"
                  style={getCampaignButtonStyles(campaign, 'secondary')}
                >
                  {shareState.copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Form Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {shareState.step === 'creating' && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${campaignTheme.buttonColor}20` }}
              >
                <Loader2 
                  className="h-8 w-8 animate-spin"
                  style={{ color: campaignTheme.buttonColor }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: campaignTheme.textColor }}>
                Creating Shareable Link
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your results for sharing...
              </p>
            </div>
          )}

          {shareState.step === 'success' && shareState.shareUrl && (
            <div className="space-y-6">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    backgroundColor: `${campaignTheme.buttonColor}20`,
                    color: campaignTheme.buttonColor 
                  }}
                >
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: campaignTheme.textColor }}>
                  Link Created Successfully!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your results are now shareable with this link:
                </p>
              </div>

              {/* Share URL */}
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={shareState.shareUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={() => handleCopy(shareState.shareUrl!)}
                  size="sm"
                  variant="outline"
                >
                  {shareState.copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Social Sharing */}
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: campaignTheme.textColor }}>
                  Share on social media:
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleSocialShare('twitter')}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => handleSocialShare('linkedin')}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>

              {/* Expiration Notice */}
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> This link expires on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          )}

          {shareState.step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: campaignTheme.textColor }}>
                Something went wrong
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{shareState.error}</p>
              <Button
                onClick={() => setShareState({ step: 'options', copied: false })}
                variant="outline"
                style={getCampaignButtonStyles(campaign, 'secondary')}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {shareState.step === 'success' && (
          <div className="pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              style={getCampaignButtonStyles(campaign, 'secondary')}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// No sanitization functions needed since we only store AI results
