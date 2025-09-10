'use client'

import React, { useState } from 'react'
import { X, Share2, Copy, Check, AlertTriangle, ExternalLink, Twitter, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  sectionConfig
}: ShareResultsModalProps) {
  const [shareState, setShareState] = useState<ShareState>({
    step: 'options',
    copied: false
  })
  const [consentGiven, setConsentGiven] = useState(false)

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Share Your Results</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {shareState.step === 'options' && (
            <div className="space-y-6">
              {/* Share Results Link Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Share Results Link</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Create a public link with your personalized results
                    </p>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-2">Privacy Notice</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Anyone with this link can view your results</li>
                        <li>• Only the final results are shared - no personal information or form inputs</li>
                        <li>• Link expires automatically in 30 days</li>
                        <li>• You can delete the shared link at any time</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I understand and want to create a shareable version of my results
                  </span>
                </label>

                {/* Create Button */}
                <Button
                  onClick={handleCreateShareableLink}
                  disabled={!consentGiven}
                  className={cn(
                    "w-full",
                    consentGiven 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Create Shareable Link
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Share Empty Form Section */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Copy className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Share Empty Form</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Share the original tool for others to try from the beginning
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleCopy(originalCampaignUrl)}
                  variant="outline"
                  className="w-full"
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
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Shareable Link</h3>
              <p className="text-gray-600">Please wait while we prepare your results for sharing...</p>
            </div>
          )}

          {shareState.step === 'success' && shareState.shareUrl && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Link Created Successfully!</h3>
                <p className="text-gray-600">Your results are now shareable with this link:</p>
              </div>

              {/* Share URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareState.shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
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
              </div>

              {/* Social Sharing */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Share on social media:</p>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> This link expires on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {shareState.step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{shareState.error}</p>
              <Button
                onClick={() => setShareState({ step: 'options', copied: false })}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {shareState.step === 'success' && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// No sanitization functions needed since we only store AI results
