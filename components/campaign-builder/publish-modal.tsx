'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Using a simple modal approach since Dialog component may not be available
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'
import { 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  Crown, 
  Zap, 
  ExternalLink,
  Loader2
} from 'lucide-react'
import type { Campaign } from '@/lib/types/database'

interface PublishModalProps {
  campaign: Campaign
  isOpen: boolean
  onClose: () => void
  onPublishSuccess: (updatedCampaign: Campaign) => void
  mandatoryValidationErrors?: string[]
  className?: string
}

interface TierInfo {
  current_tier: 'free' | 'standard' | 'premium'
  tier_name: string
  max_campaigns: number
  currently_published: number
  can_publish: boolean
  requires_upgrade: boolean
}

const TIER_ICONS = {
  free: Globe,
  standard: Zap,
  premium: Crown,
}

const TIER_COLORS = {
  free: 'text-gray-500',
  standard: 'text-blue-500', 
  premium: 'text-yellow-500',
}

export function PublishModal({
  campaign,
  isOpen,
  onClose,
  onPublishSuccess,
  mandatoryValidationErrors = [],
  className
}: PublishModalProps) {
  const router = useRouter()
  
  // State
  const [isPublishing, setIsPublishing] = useState(false)
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
  const [isLoadingTier, setIsLoadingTier] = useState(true)

  // Load tier information
  useEffect(() => {
    if (isOpen) {
      loadTierInfo()
      loadValidationErrors()
    }
  }, [isOpen, campaign.id])

  const loadTierInfo = async () => {
    try {
      setIsLoadingTier(true)
      const response = await fetch('/api/billing/summary')
      const result = await response.json()

      if (result.data) {
        const summary = result.data
        const tierInfo: TierInfo = {
          current_tier: summary.current_tier,
          tier_name: summary.tier_name,
          max_campaigns: summary.max_campaigns,
          currently_published: summary.currently_published,
          can_publish: summary.max_campaigns === -1 || summary.currently_published < summary.max_campaigns,
          requires_upgrade: summary.current_tier === 'free' || (summary.max_campaigns > 0 && summary.currently_published >= summary.max_campaigns)
        }
        setTierInfo(tierInfo)
      }
    } catch (error) {
      console.error('Failed to load tier info:', error)
      toast({
        title: 'Error',
        description: 'Failed to load account information. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingTier(false)
    }
  }

  const loadValidationErrors = async () => {
    // Basic campaign validation
    const errors: string[] = []
    
    if (!campaign.name || campaign.name.trim() === '') {
      errors.push('Campaign must have a name')
    }

    // Add any other validation logic here
    setValidationErrors([...errors, ...mandatoryValidationErrors])
  }

  const handlePublish = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before publishing.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsPublishing(true)

      const publishData: any = {}
      if (useCustomUrl && customUrl.trim()) {
        publishData.slug = customUrl.trim()
      }

      const response = await fetch(`/api/campaigns/${campaign.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresUpgrade) {
          // Show upgrade message
          toast({
            title: 'Upgrade Required',
            description: result.error,
            variant: 'destructive',
          })
          return
        }
        
        throw new Error(result.error || 'Failed to publish campaign')
      }

      // Success
      toast({
        title: 'Campaign Published!',
        description: result.message || 'Your campaign is now live.',
      })

      onPublishSuccess(result.data)
      onClose()

    } catch (error) {
      console.error('Error publishing campaign:', error)
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/dashboard/account')
    onClose()
  }

  if (!isOpen) return null

  const TierIcon = tierInfo ? TIER_ICONS[tierInfo.current_tier] : Globe
  const tierColor = tierInfo ? TIER_COLORS[tierInfo.current_tier] : 'text-gray-500'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <div>
                <h2 className="text-xl font-semibold">Publish Campaign</h2>
                <p className="text-sm text-gray-600">Make your campaign live and accessible to visitors</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Validation Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tier Information */}
          {isLoadingTier ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading account information...</span>
                </div>
              </CardContent>
            </Card>
          ) : tierInfo && (
            <Card className={tierInfo.can_publish ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TierIcon className={`h-5 w-5 ${tierColor}`} />
                    Current Plan: {tierInfo.tier_name}
                  </div>
                  <Badge variant={tierInfo.current_tier === 'free' ? 'secondary' : 'default'}>
                    {tierInfo.current_tier}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {tierInfo.max_campaigns === -1 
                    ? 'Unlimited published campaigns'
                    : `Up to ${tierInfo.max_campaigns} published campaigns`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Published Campaigns</span>
                  <span className="font-medium">
                    {tierInfo.currently_published} / {tierInfo.max_campaigns === -1 ? '∞' : tierInfo.max_campaigns}
                  </span>
                </div>

                {!tierInfo.can_publish && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Upgrade Required</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {tierInfo.current_tier === 'free' 
                            ? 'Publishing is not available on the Free plan.'
                            : `You've reached your ${tierInfo.tier_name} plan limit. Upgrade or unpublish other campaigns to continue.`
                          }
                        </p>
                        <Button 
                          onClick={handleUpgrade}
                          className="mt-3"
                          size="sm"
                        >
                          View Upgrade Options
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom URL Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign URL</CardTitle>
              <CardDescription>
                Choose how your campaign will be accessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCustomUrl"
                  checked={useCustomUrl}
                  onChange={(e) => setUseCustomUrl(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="useCustomUrl">Use custom URL slug</Label>
              </div>

              {useCustomUrl && (
                <div className="space-y-2">
                  <Label htmlFor="customUrl">Custom URL</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">yoursite.com/c/</span>
                    <Input
                      id="customUrl"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="my-campaign"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use letters, numbers, and hyphens only
                  </p>
                </div>
              )}

              {!useCustomUrl && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    A URL will be automatically generated based on your campaign name
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={isPublishing || validationErrors.length > 0 || !tierInfo?.can_publish}
              className="min-w-[120px]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 