'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Campaign } from '@/lib/types/database'
import { 
  publishCampaign, 
  unpublishCampaign, 
  checkUrlAvailability,
  validateCampaignForPublishing,
  generateCampaignSlug,
  activateCampaign,
  deactivateCampaign,
  getCampaignActivationStatus
} from '@/lib/data-access'
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
  Unlock
} from 'lucide-react'

interface PublishModalProps {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
  onPublishSuccess: (updatedCampaign: Campaign) => void
  className?: string
}

interface ValidationError {
  field: string
  message: string
}

interface UrlCheck {
  available: boolean
  suggestions?: string[]
  checking: boolean
  error?: string
}

// Simple modal component since Dialog is not available
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

// Simple alert component since Alert is not available
function Alert({ variant, children }: { variant?: 'default' | 'destructive'; children: React.ReactNode }) {
  return (
    <div className={cn(
      'p-4 rounded-lg border',
      variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
    )}>
      {children}
    </div>
  )
}

// Simple separator component
function Separator() {
  return <div className="h-px bg-gray-200 my-4" />
}

export function PublishModal({
  campaign,
  isOpen,
  onClose,
  onPublishSuccess,
  className
}: PublishModalProps) {
  // Form state
  const [isPublishing, setIsPublishing] = useState(false)
  const [useCustomUrl, setUseCustomUrl] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'url' | 'settings' | 'activation'>('url')
  
  // Activation state
  const [activationStatus, setActivationStatus] = useState<{
    isPublished: boolean
    isActive: boolean
    canActivate: boolean
  }>({
    isPublished: false,
    isActive: false,
    canActivate: false
  })
  const [isTogglingActivation, setIsTogglingActivation] = useState(false)
  
  // UI state
  const [keepUrlOnUnpublish, setKeepUrlOnUnpublish] = useState(true)
  const [urlCheck, setUrlCheck] = useState<UrlCheck>({
    available: true,
    checking: false
  })
  
  // Reset form when modal opens/closes or campaign changes
  useEffect(() => {
    if (isOpen && campaign) {
      setCustomUrl('')
      setUseCustomUrl(false)
      setKeepUrlOnUnpublish(true)
      setValidationErrors([])
      setUrlCheck({ available: true, checking: false })
      
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
      
      try {
        const result = await validateCampaignForPublishing(campaign.id)
        if (result.success && result.data) {
          if (!result.data.isValid) {
            setValidationErrors(
              result.data.errors
            )
          } else {
            setValidationErrors([])
          }
        }
      } catch (error) {
        console.error('Error validating campaign:', error)
        setValidationErrors([
          'Failed to validate campaign'
        ])
      }
    }

    validateCampaign()
  }, [isOpen, campaign])

  // Load activation status when modal opens
  useEffect(() => {
    const loadActivationStatus = async () => {
      if (!isOpen || !campaign) return
      
      try {
        const result = await getCampaignActivationStatus(campaign.id)
        if (result.success && result.data) {
          setActivationStatus(result.data)
        }
      } catch (error) {
        console.error('Error loading activation status:', error)
      }
    }

    loadActivationStatus()
  }, [isOpen, campaign])

  // Check URL availability when custom URL changes
  useEffect(() => {
    const checkUrl = async () => {
      if (!useCustomUrl || !customUrl.trim() || customUrl.length < 3) {
        setUrlCheck({ available: true, checking: false })
        return
      }

      const slug = customUrl.trim().toLowerCase()
      
      // Basic format validation
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        setUrlCheck({
          available: false,
          checking: false,
          error: 'URL can only contain lowercase letters, numbers, and hyphens'
        })
        return
      }

      setUrlCheck(prev => ({ ...prev, checking: true }))

      try {
        const result = await checkUrlAvailability(slug, campaign?.id)
        if (result.success && result.data) {
          setUrlCheck({
            available: result.data.available,
            suggestions: result.data.suggestions,
            checking: false,
            error: result.data.available ? undefined : 'This URL is already taken'
          })
        } else {
          setUrlCheck({
            available: false,
            checking: false,
            error: 'Unable to check URL availability'
          })
        }
      } catch (error) {
        console.error('Error checking URL availability:', error)
        setUrlCheck({
          available: false,
          checking: false,
          error: 'Unable to check URL availability'
        })
      }
    }

    const timeoutId = setTimeout(checkUrl, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [customUrl, useCustomUrl, campaign?.id])

  // Generate suggested URL from campaign name
  const suggestedUrl = useMemo(() => {
    if (!campaign?.name) return ''
    
    return campaign.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
      .replace(/^-+|-+$/g, '')
  }, [campaign?.name])

  const finalUrl = useCustomUrl ? customUrl.trim() : suggestedUrl
  const fullUrl = finalUrl && typeof window !== 'undefined' ? `${window.location.origin}/c/${finalUrl}` : ''

  const canPublish = campaign && 
    validationErrors.length === 0 && 
    (!useCustomUrl || (urlCheck.available && !urlCheck.checking)) &&
    finalUrl.length >= 3

  const handlePublish = async () => {
    if (!campaign || !canPublish) return

    try {
      setIsPublishing(true)
      
      const slug = useCustomUrl ? customUrl.trim() : undefined
      const result = await publishCampaign(campaign.id, slug)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to publish campaign')
      }

      onPublishSuccess(result.data)
      
      toast({
        title: 'Campaign published!',
        description: `Your campaign is now live at ${result.data.published_url}`,
        duration: 5000
      })
      
      onClose()
    } catch (error) {
      console.error('Error publishing campaign:', error)
      const message = error instanceof Error ? error.message : 'Failed to publish campaign'
      toast({
        title: 'Publishing failed',
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
      
      const result = await unpublishCampaign(campaign.id, keepUrlOnUnpublish)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to unpublish campaign')
      }

      onPublishSuccess(result.data)
      
      toast({
        title: 'Campaign unpublished',
        description: keepUrlOnUnpublish 
          ? 'Campaign unpublished (URL preserved)' 
          : 'Campaign unpublished and URL cleared',
        duration: 5000
      })
      
      onClose()
    } catch (error) {
      console.error('Error unpublishing campaign:', error)
      const message = error instanceof Error ? error.message : 'Failed to unpublish campaign'
      toast({
        title: 'Unpublish failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleToggleActivation = async () => {
    if (!campaign || !activationStatus.isPublished) return

    try {
      setIsTogglingActivation(true)
      
      const result = activationStatus.isActive 
        ? await deactivateCampaign(campaign.id)
        : await activateCampaign(campaign.id)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to toggle campaign activation')
      }

      // Update activation status
      setActivationStatus(prev => ({
        ...prev,
        isActive: !prev.isActive
      }))

      // Update the campaign object if needed
      onPublishSuccess(result.data)
      
      toast({
        title: activationStatus.isActive ? 'Campaign deactivated' : 'Campaign activated',
        description: activationStatus.isActive 
          ? 'Your campaign is no longer publicly accessible'
          : 'Your campaign is now live and accessible to visitors',
        duration: 5000
      })
      
    } catch (error) {
      console.error('Error toggling activation:', error)
      const message = error instanceof Error ? error.message : 'Failed to toggle activation'
      toast({
        title: 'Activation toggle failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setIsTogglingActivation(false)
    }
  }

  const copyUrlToClipboard = async () => {
    if (!fullUrl) return
    
    try {
      await navigator.clipboard.writeText(fullUrl)
      toast({
        title: 'URL copied!',
        description: 'The campaign URL has been copied to your clipboard'
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

  const openPreview = () => {
    if (!campaign) return
    const previewUrl = `/campaigns/${campaign.id}/preview`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const isPublished = campaign?.status === 'published'

  if (!campaign) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={cn('p-6', className)}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {isPublished ? (
              <>
                <Globe className="h-5 w-5 text-green-600" />
                Manage Published Campaign
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-blue-600" />
                Publish Campaign
              </>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isPublished 
              ? 'Your campaign is currently live. You can update the URL or unpublish it.'
              : 'Make your campaign public and generate a unique URL for sharing.'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cannot publish campaign:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}

          {/* Campaign Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isPublished ? (
                  <Unlock className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium">
                  {campaign.name}
                </span>
              </div>
              <Badge 
                variant={isPublished ? 'default' : 'secondary'}
                className={isPublished ? 'bg-green-100 text-green-800' : ''}
              >
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openPreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>

          <Separator />

          {/* URL Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-url-toggle" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Custom URL
              </Label>
              <Switch
                id="custom-url-toggle"
                checked={useCustomUrl}
                onCheckedChange={setUseCustomUrl}
              />
            </div>

            {useCustomUrl ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-url">Campaign URL</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md text-sm text-gray-500">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/c/
                    </div>
                    <Input
                      id="custom-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="my-campaign"
                      className="rounded-l-none"
                    />
                  </div>
                  {urlCheck.checking && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking availability...
                    </div>
                  )}
                  {!urlCheck.checking && urlCheck.error && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {urlCheck.error}
                    </div>
                  )}
                  {!urlCheck.checking && urlCheck.available && customUrl.length >= 3 && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      URL is available
                    </div>
                  )}
                </div>

                {/* URL Suggestions */}
                {!urlCheck.available && urlCheck.suggestions && urlCheck.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Suggestions:</Label>
                    <div className="flex flex-wrap gap-2">
                      {urlCheck.suggestions.slice(0, 3).map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomUrl(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Suggested URL</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-mono">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/c/{suggestedUrl || 'campaign'}
                  </span>
                </div>
              </div>
            )}

            {/* Final URL Preview */}
            {fullUrl && (
              <div className="space-y-2">
                <Label>Public Campaign URL</Label>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50 border-green-200">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="flex-1 text-sm font-mono text-green-800 truncate">
                    {fullUrl}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyUrlToClipboard}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {isPublished && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(fullUrl, '_blank')}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unpublish Options */}
          {isPublished && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-medium">Unpublish Options</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="keep-url" className="text-sm">Keep URL reserved</Label>
                    <p className="text-xs text-gray-600">
                      Preserve your URL when unpublishing so you can republish later
                    </p>
                  </div>
                  <Switch
                    id="keep-url"
                    checked={keepUrlOnUnpublish}
                    onCheckedChange={setKeepUrlOnUnpublish}
                  />
                </div>
              </div>
            </>
          )}

          {/* Campaign Activation Controls */}
          {isPublished && activationStatus.canActivate && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-medium">Campaign Activation</Label>
                
                {/* Activation Status Display */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {activationStatus.isActive ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="font-medium">Inactive</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {activationStatus.isActive 
                        ? 'Your campaign is publicly accessible'
                        : 'Your campaign is not accessible to visitors'
                      }
                    </div>
                  </div>
                  
                  <Button
                    variant={activationStatus.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={handleToggleActivation}
                    disabled={isTogglingActivation}
                    className={cn(
                      "flex items-center gap-2",
                      activationStatus.isActive 
                        ? "text-orange-600 border-orange-300 hover:bg-orange-50" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                    {isTogglingActivation && <Loader2 className="h-3 w-3 animate-spin" />}
                    {activationStatus.isActive ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>

                {/* Activation Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p className="font-medium">About Campaign Activation:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Active:</strong> Campaign is publicly accessible via its URL</li>
                        <li>• <strong>Inactive:</strong> Campaign URL returns "not available" message</li>
                        <li>• Deactivating preserves your URL and all campaign data</li>
                        <li>• You can reactivate anytime without losing settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>
          
          {isPublished ? (
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="flex items-center gap-2"
            >
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Unpublish Campaign
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
              className="flex items-center gap-2"
            >
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Share2 className="h-4 w-4" />
              Publish Campaign
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
} 