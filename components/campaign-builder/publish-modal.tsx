'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  ExternalLink,
  Loader2,
  X
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

interface BillingInfo {
  can_publish: boolean
  requires_upgrade: boolean
  tier_name: string
  error_message?: string
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
  
  // Detect if campaign is already published
  const isPublished = campaign.status === 'published'
  
  // State
  const [isProcessing, setIsProcessing] = useState(false)
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [isLoadingBilling, setIsLoadingBilling] = useState(true)

  // Generate URL preview
  const generateUrlSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
  }

  const previewUrl = useCustomUrl && customUrl.trim() 
    ? customUrl.trim() 
    : generateUrlSlug(campaign.name || 'untitled-campaign')
  
  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : 'yoursite.com'}/c/[user-key]/${previewUrl}`

  // Load billing information and validation errors
  useEffect(() => {
    if (isOpen) {
      loadBillingInfo()
      loadValidationErrors()
      
      // If campaign is published, populate the custom URL field with existing URL
      if (isPublished && campaign.published_url) {
        setCustomUrl(campaign.published_url)
        setUseCustomUrl(true)
      }
    }
  }, [isOpen, campaign.id, isPublished])

  const loadBillingInfo = async () => {
    try {
      setIsLoadingBilling(true)
      const response = await fetch('/api/billing/summary')
      const result = await response.json()

      if (result.data) {
        const summary = result.data
        const billingInfo: BillingInfo = {
          can_publish: summary.current_tier !== 'free' && 
                      (summary.max_campaigns === -1 || summary.currently_published < summary.max_campaigns),
          requires_upgrade: summary.current_tier === 'free' || 
                           (summary.max_campaigns > 0 && summary.currently_published >= summary.max_campaigns),
          tier_name: summary.tier_name,
          error_message: summary.current_tier === 'free' 
            ? 'Publishing requires a paid plan with credits.'
            : summary.max_campaigns > 0 && summary.currently_published >= summary.max_campaigns
              ? `You've reached your ${summary.tier_name} plan limit.`
              : undefined
        }
        setBillingInfo(billingInfo)
      }
    } catch (error) {
      console.error('Failed to load billing info:', error)
      setBillingInfo({
        can_publish: false,
        requires_upgrade: true,
        tier_name: 'Unknown',
        error_message: 'Unable to verify billing status. Please try again.'
      })
    } finally {
      setIsLoadingBilling(false)
    }
  }

  const loadValidationErrors = async () => {
    const errors: string[] = []
    
    if (!campaign.name || campaign.name.trim() === '') {
      errors.push('Campaign must have a name')
    }

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

    if (!billingInfo?.can_publish) {
      toast({
        title: 'Upgrade Required',
        description: billingInfo?.error_message || 'Publishing requires a paid plan.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsProcessing(true)

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
      setIsProcessing(false)
    }
  }

  const handleUnpublish = async () => {
    try {
      setIsProcessing(true)

      const response = await fetch(`/api/campaigns/${campaign.id}/publish`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to unpublish campaign')
      }

      // Success
      toast({
        title: 'Campaign Unpublished!',
        description: result.message || 'Your campaign is now offline.',
      })

      onPublishSuccess(result.data)
      onClose()

    } catch (error) {
      console.error('Error unpublishing campaign:', error)
      toast({
        title: 'Unpublishing Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/dashboard/account')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <div>
                <h2 className="text-xl font-semibold">
                  {isPublished ? 'Manage Published Campaign' : 'Publish Campaign'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isPublished 
                    ? 'Update your campaign URL or take it offline' 
                    : 'Make your campaign live and accessible to visitors'
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Please fix these issues:</p>
                    <ul className="list-disc list-inside text-red-700 text-sm mt-1 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Status */}
            {isLoadingBilling ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Checking account status...</span>
              </div>
            ) : isPublished ? (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-blue-800 font-medium">Campaign is live</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Published on {campaign.published_at ? new Date(campaign.published_at).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            ) : billingInfo && !billingInfo.can_publish ? (
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Upgrade Required</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {billingInfo.error_message}
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
            ) : (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-green-800 font-medium">Ready to publish</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your {billingInfo?.tier_name} plan allows publishing campaigns.
                </p>
              </div>
            )}

            {/* URL Section */}
            {isPublished ? (
              <div className="border rounded-lg p-4">
                <div className="space-y-3">
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">
                    Your campaign is currently live at:
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <code className="text-sm text-gray-700 break-all">
                      {fullUrl}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentUrl = `${window.location.origin}/c/${campaign.user_key}/${campaign.published_url}`
                        window.open(currentUrl, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit Live Campaign
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentUrl = `${window.location.origin}/c/${campaign.user_key}/${campaign.published_url}`
                        navigator.clipboard.writeText(currentUrl)
                        toast({
                          title: 'Copied!',
                          description: 'Campaign URL copied to clipboard',
                        })
                      }}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="useCustomUrl" className="text-sm font-medium">
                    Use custom URL slug
                  </Label>
                  <Switch
                    id="useCustomUrl"
                    checked={useCustomUrl}
                    onCheckedChange={setUseCustomUrl}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">
                      Your campaign will be published at:
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                      <code className="text-sm text-gray-700 break-all">
                        {fullUrl}
                      </code>
                    </div>
                  </div>

                  {useCustomUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="customUrl" className="text-sm font-medium">
                        Custom URL slug
                      </Label>
                      <Input
                        id="customUrl"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="my-campaign"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Use letters, numbers, and hyphens only. Leave empty to auto-generate from campaign name.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
{isPublished ? (
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Unpublishing...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={isProcessing || validationErrors.length > 0 || !billingInfo?.can_publish}
                className="min-w-[120px]"
              >
                {isProcessing ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 