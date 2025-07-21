'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import {
  Globe,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Settings,
  Lock,
  Unlock,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { StripePaymentForm } from '@/components/ui/stripe-payment-form'

interface UrlCheck {
  available: boolean
  checking: boolean
}

interface PublishModalProps {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
  onPublishSuccess: (updatedCampaign: Campaign) => void
  mandatoryValidationErrors?: string[]
  className?: string
}

interface BillingSummary {
  credit_balance: number
  total_credits_owned: number
  currently_published: number
  available_credits: number
}

export function PublishModal({
  campaign,
  isOpen,
  onClose,
  onPublishSuccess,
  mandatoryValidationErrors = [],
  className
}: PublishModalProps) {
  // Form state
  const [isPublishing, setIsPublishing] = useState(false)
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Billing state
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)
  const [creditQuantity, setCreditQuantity] = useState(1)
  
  // UI state
  const [urlCheck, setUrlCheck] = useState<UrlCheck>({
    available: true,
    checking: false
  })
  
  // Load billing summary when modal opens
  useEffect(() => {
    if (isOpen) {
      loadBillingSummary()
    }
  }, [isOpen])
  
  const loadBillingSummary = async () => {
    try {
      setLoadingBilling(true)
      const response = await fetch('/api/billing/summary')
      
      if (!response.ok) {
        throw new Error('Failed to load billing information')
      }
      
      const result = await response.json()
      if (result.success) {
        setBillingSummary(result.data)
      }
    } catch (error) {
      console.error('Error loading billing summary:', error)
      toast({
        title: 'Billing Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      })
    } finally {
      setLoadingBilling(false)
    }
  }
  
  // Reset form when modal opens/closes or campaign changes
  useEffect(() => {
    if (isOpen && campaign) {
      setCustomUrl('')
      setUseCustomUrl(false)
      setValidationErrors([])
      setUrlCheck({ available: true, checking: false })
      setShowCreditPurchase(false)
      
      // Pre-populate with existing URL if published
      if (campaign.status === 'published' && campaign.published_url) {
        setCustomUrl(campaign.published_url)
        setUseCustomUrl(true)
      }
    }
  }, [isOpen, campaign])

  // Validate campaign when modal opens
  useEffect(() => {
    const validateCampaign = async () => {
      if (!isOpen || !campaign) return
      
      // Simple validation - check if campaign has at least one section
      const errors: string[] = []
      
      if (!campaign.name || campaign.name.trim() === '') {
        errors.push('Campaign must have a name')
      }
      
      setValidationErrors(errors)
    }

    validateCampaign()
  }, [isOpen, campaign])

  // Generate final URL
  const finalUrl = useMemo(() => {
    if (!campaign) return ''
    
    if (useCustomUrl && customUrl.trim()) {
      return customUrl.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    }
    
    // Generate from campaign name
    const baseSlug = campaign.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    return baseSlug || 'my-tool'
  }, [campaign, useCustomUrl, customUrl])

  // Generate full URL for preview
  const fullUrl = finalUrl && typeof window !== 'undefined' && campaign?.user_key 
    ? `${window.location.origin}/c/${campaign.user_key}/${finalUrl}` 
    : ''

  const canPublish = campaign && 
    validationErrors.length === 0 && 
    mandatoryValidationErrors.length === 0 &&
    (!useCustomUrl || (urlCheck.available && !urlCheck.checking)) &&
    finalUrl.length >= 3 &&
    billingSummary &&
    billingSummary.credit_balance >= 1



  const handlePublish = async () => {
    if (!campaign || !canPublish) return

    try {
      setIsPublishing(true)
      
      const response = await fetch(`/api/campaigns/${campaign.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: useCustomUrl ? customUrl.trim() : undefined
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to publish campaign')
      }

      onPublishSuccess(result.data)
      
      toast({
        title: 'Tool launched!',
        description: result.message || 'Your tool is now live!',
        duration: 5000
      })
      
      onClose()
    } catch (error) {
      console.error('Error publishing campaign:', error)
      const message = error instanceof Error ? error.message : 'Failed to launch tool'
      toast({
        title: 'Launch failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!campaign) return

    try {
      setIsPublishing(true)
      
      const response = await fetch(`/api/campaigns/${campaign.id}/publish`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to unpublish campaign')
      }

      onPublishSuccess(result.data)
      
      toast({
        title: 'Tool unpublished',
        description: result.message || 'Tool unpublished successfully!',
        duration: 5000
      })
      
      onClose()
    } catch (error) {
      console.error('Error unpublishing campaign:', error)
      const message = error instanceof Error ? error.message : 'Failed to unpublish tool'
      toast({
        title: 'Unpublish failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const copyUrlToClipboard = async () => {
    if (!fullUrl) return
    
    try {
      await navigator.clipboard.writeText(fullUrl)
      toast({
        title: 'URL copied!',
        description: 'The tool URL has been copied to your clipboard',
        duration: 3000
      })
    } catch (error) {
      console.error('Error copying URL:', error)
      toast({
        title: 'Copy failed',
        description: 'Unable to copy URL to clipboard',
        variant: 'destructive'
      })
    }
  }

  if (!isOpen || !campaign) return null

  const isPublished = campaign.status === 'published'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={cn(
        "bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto",
        className
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isPublished ? 'Manage Tool' : 'Launch Tool'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {campaign.name}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Loading State */}
          {loadingBilling && (
            <div className="mb-6 p-4 bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading billing information...</span>
            </div>
          )}

          {/* Credit Purchase Flow */}
          {!loadingBilling && !isPublished && billingSummary && billingSummary.credit_balance < 1 && !showCreditPurchase && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-800 font-medium">No hosting credits available</span>
                </div>
                <Button 
                  onClick={() => setShowCreditPurchase(true)}
                  size="sm"
                  variant="outline"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
              </div>
            </div>
          )}

          {/* Credit Purchase Modal */}
          {showCreditPurchase && (
            <div className="mb-6 p-4 border rounded-lg">
              <div className="space-y-3 mb-4">
                <div>
                  <Label htmlFor="credit-quantity">Number of Credits ($99 each)</Label>
                  <Input
                    id="credit-quantity"
                    type="number"
                    min="1"
                    max="50"
                    value={creditQuantity}
                    onChange={(e) => setCreditQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: ${(creditQuantity * 99).toFixed(2)}
                </div>
              </div>
              
              <StripePaymentForm
                quantity={creditQuantity}
                onSuccess={async () => {
                  await loadBillingSummary()
                  setShowCreditPurchase(false)
                }}
                onCancel={() => setShowCreditPurchase(false)}
              />
            </div>
          )}

          {/* Validation Errors */}
          {(validationErrors.length > 0 || mandatoryValidationErrors.length > 0) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-800 font-medium">Cannot publish tool</p>
                  <ul className="mt-1 list-disc list-inside text-red-700">
                    {mandatoryValidationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* URL Configuration */}
          <div className="mb-6 space-y-4">
            <div>
              <Label className="text-sm font-medium">Tool URL</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Your tool will be available at:
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-background px-2 py-1 rounded flex-1 truncate">
                    {fullUrl || 'Loading...'}
                  </code>
                  {fullUrl && (
                    <Button size="sm" variant="outline" onClick={copyUrlToClipboard}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="custom-url"
                checked={useCustomUrl}
                onCheckedChange={setUseCustomUrl}
              />
              <Label htmlFor="custom-url" className="text-sm">
                Customize URL
              </Label>
            </div>

            {useCustomUrl && (
              <div>
                <Label htmlFor="custom-url-input" className="text-sm">
                  Custom URL slug
                </Label>
                <Input
                  id="custom-url-input"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="my-awesome-tool"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only letters, numbers, and hyphens allowed
                </p>
              </div>
            )}
          </div>

          {/* Unpublish Notice */}
          {isPublished && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-800 font-medium">Tool is Live</p>
                  <p className="text-green-700">
                    Unpublishing will return 1 credit to your account and make the tool inaccessible to visitors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isPublished ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="flex-1"
                >
                  {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Unpublish Tool
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            ) : (
              <>
                {!showCreditPurchase && billingSummary && billingSummary.credit_balance >= 1 && (
                  <Button
                    onClick={handlePublish}
                    disabled={!canPublish || isPublishing}
                    className="flex-1"
                    size="lg"
                  >
                    {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isPublishing ? 'Publishing...' : 'Use 1 Credit & Publish'}
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  {showCreditPurchase ? 'Cancel' : 'Close'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 