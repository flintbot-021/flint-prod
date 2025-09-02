'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/use-toast'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { 
  ArrowLeft,
  Crown,
  Zap,
  Globe,
  Check,
  Eye,
  BarChart3,
  ExternalLink,
  Loader2,
  Star,
  AlertCircle,
  Settings
} from 'lucide-react'

interface BillingSummary {
  current_tier: 'free' | 'standard' | 'premium'
  tier_name: string
  monthly_price: number
  max_campaigns: number
  currently_published: number
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  scheduled_tier_change?: string | null
  scheduled_change_date?: string | null
  published_campaigns: Array<{
    id: string
    name: string
    slug: string
    published_at: string
  }>
}

// Tier configuration
const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    icon: Globe,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    max_campaigns: 0,
    features: [
      'Create unlimited campaigns',
      'Preview your campaigns',
      'Community support'
    ],
    buttonText: 'Current Plan',
    popular: false
  },
  standard: {
    name: 'Standard',
    price: 99,
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    max_campaigns: 3,
    features: [
      'Everything in Free',
      'Publish up to 3 campaigns',
      'Simple Analytics',
      'Lead lists',
      'Email support',
      'Custom branding'
    ],
    buttonText: 'Upgrade to Standard',
    popular: true
  },
  premium: {
    name: 'Premium',
    price: 249,
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    max_campaigns: -1, // unlimited
    features: [
      'Everything in Standard',
      'Unlimited published campaigns',
      'Priority support',
      'Export leads'
    ],
    buttonText: 'Upgrade to Premium',
    popular: false
  }
} as const

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadBillingSummary()
    
    // Handle success/cancel from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    
    if (success) {
      toast({
        title: 'Subscription Updated!',
        description: 'Your plan has been updated successfully.',
        duration: 5000,
      })
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/dashboard/account')
    } else if (canceled) {
      toast({
        title: 'Checkout Cancelled',
        description: 'Your subscription update was cancelled. No changes were made.',
        variant: 'destructive',
        duration: 5000,
      })
      // Clean up URL parameters  
      window.history.replaceState({}, document.title, '/dashboard/account')
    }
  }, [])

  const loadBillingSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/billing/summary')
      const result = await response.json()
      
      if (result.data) {
        setBillingSummary(result.data)
      }
    } catch (error) {
      console.error('Failed to load billing summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to load account information',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (tier: 'standard' | 'premium') => {
    try {
      setIsProcessing(tier)
      
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout',
        variant: 'destructive',
      })
      setIsProcessing(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setIsProcessing('portal')
      
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create portal session')
      }

      if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open billing portal',
        variant: 'destructive',
      })
      setIsProcessing(null)
    }
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrimaryNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-lg">Loading account information...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!billingSummary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PrimaryNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Account</h2>
            <p className="text-gray-600 mb-4">We couldn't load your account information.</p>
            <Button onClick={loadBillingSummary}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentTier = TIERS[billingSummary.current_tier]
  const CurrentTierIcon = currentTier.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <PrimaryNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

          <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account & Billing</h1>
          <p className="text-gray-600">Manage your subscription and view your campaign usage</p>
          </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CurrentTierIcon className={`h-4 w-4 ${currentTier.color}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{currentTier.name}</div>
              <p className="text-xs text-gray-600 mt-1">
                {currentTier.price === 0 ? 'Free forever' : `$${currentTier.price}/month`}
              </p>
            </CardContent>
          </Card>

          {/* Published Campaigns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Published Campaigns</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{billingSummary.currently_published}</div>
              <p className="text-xs text-gray-600 mt-1">
                of {billingSummary.max_campaigns === -1 ? 'unlimited' : billingSummary.max_campaigns} available
              </p>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                <Badge variant={billingSummary.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {billingSummary.subscription_status}
                </Badge>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Scheduled Change Notification */}
        {billingSummary.scheduled_tier_change && billingSummary.scheduled_change_date && (
          <div className="mb-8">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Scheduled Plan Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-amber-700">
                    Your subscription is scheduled to {billingSummary.scheduled_tier_change === 'free' ? 'be cancelled' : `downgrade to ${billingSummary.scheduled_tier_change}`} on{' '}
                    <strong>
                      {new Date(billingSummary.scheduled_change_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </strong>
                  </p>
                  
                  {billingSummary.scheduled_tier_change === 'free' && billingSummary.currently_published > 0 && (
                    <div className="bg-amber-100 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Important:</strong> When your subscription is cancelled, your {billingSummary.currently_published} published campaign{billingSummary.currently_published > 1 ? 's' : ''} will be automatically unpublished since the Free plan doesn't allow published campaigns.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleManageBilling}
                      disabled={isProcessing === 'portal'}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {isProcessing === 'portal' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Opening...
                        </>
                      ) : (
                        'Manage Subscription'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://support.stripe.com/', '_blank')}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      Need Help?
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600 mb-6">Select the plan that best fits your needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(TIERS).map(([key, tier]) => {
              const TierIcon = tier.icon
              const isCurrentTier = billingSummary.current_tier === key
              
              return (
                <Card 
                  key={key} 
                  className={`relative flex flex-col h-full ${
                    isCurrentTier 
                      ? `${tier.borderColor} ${tier.bgColor} border-2` 
                      : 'border-gray-200 hover:border-gray-300 transition-colors'
                  }`}
                >
                  {isCurrentTier ? (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default">Current Plan</Badge>
                    </div>
                  ) : tier.popular ? (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  ) : null}

                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${tier.bgColor} mb-4`}>
                      <TierIcon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {tier.price === 0 ? '$0' : `$${tier.price}`}
                      {tier.price >= 0 && <span className="text-sm font-normal text-gray-600">/month</span>}
                    </div>
                    <CardDescription>
                      {tier.max_campaigns === 0 
                        ? 'Perfect for trying things out' 
                        : tier.max_campaigns === -1 
                          ? 'For growing businesses' 
                          : `Up to ${tier.max_campaigns} published campaigns`
                      }
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {isCurrentTier ? (
                        <div className="space-y-3">
                          <Button disabled className="w-full">
                            Current Plan
                          </Button>


                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(() => {
                            const currentTier = billingSummary?.current_tier
                            const targetTier = key as 'free' | 'standard' | 'premium'
                            
                            // Current tier logic
                            if (currentTier === targetTier) {
                              if (targetTier === 'free') {
                                return (
                                  <Button 
                                    disabled
                                    className="w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                                    variant="outline"
                                  >
                                    Current Plan
                                  </Button>
                                )
                              } else {
                                return (
                                  <Button 
                                    className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    onClick={handleManageBilling}
                                    disabled={isProcessing === 'portal'}
                                    variant="outline"
                                  >
                                    {isProcessing === 'portal' ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Opening...
                                      </>
                                    ) : (
                                      'Manage Plan'
                                    )}
                                  </Button>
                                )
                              }
                            }
                            
                            // Free user looking at paid tiers
                            if (currentTier === 'free' && (targetTier === 'standard' || targetTier === 'premium')) {
                              return (
                                <Button 
                                  className="w-full bg-black text-white hover:bg-gray-800"
                                  onClick={() => handleUpgrade(targetTier)}
                                  disabled={isProcessing === targetTier}
                                >
                                  {isProcessing === targetTier ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Upgrade'
                                  )}
                                </Button>
                              )
                            }
                            
                            // Paid user looking at free tier (downgrade)
                            if (currentTier !== 'free' && targetTier === 'free') {
                              return (
                                <Button 
                                  className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  onClick={handleManageBilling}
                                  disabled={isProcessing === 'portal'}
                                  variant="outline"
                                >
                                  {isProcessing === 'portal' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Opening...
                                    </>
                                  ) : (
                                    'Downgrade to Free'
                                  )}
                                </Button>
                              )
                            }
                            
                            // Standard user looking at Premium (upgrade via Customer Portal)
                            if (currentTier === 'standard' && targetTier === 'premium') {
                              return (
                                <Button 
                                  className="w-full bg-black text-white hover:bg-gray-800"
                                  onClick={handleManageBilling}
                                  disabled={isProcessing === 'portal'}
                                >
                                  {isProcessing === 'portal' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Opening...
                                    </>
                                  ) : (
                                    'Upgrade'
                                  )}
                                </Button>
                              )
                            }
                            
                            // Premium user looking at Standard (downgrade)
                            if (currentTier === 'premium' && targetTier === 'standard') {
                              return (
                                <Button 
                                  className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  onClick={handleManageBilling}
                                  disabled={isProcessing === 'portal'}
                                  variant="outline"
                                >
                                  {isProcessing === 'portal' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Opening...
                                    </>
                                  ) : (
                                    'Downgrade to Standard'
                                  )}
                                </Button>
                              )
                            }
                            
                            return null
                          })()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          </div>

        {/* Billing Management Card */}
        <div className="mb-8">
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
                <Settings className="h-5 w-5" />
                Billing Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                View invoices, update payment methods, and manage your billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                className="w-full max-w-md mx-auto bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleManageBilling}
                disabled={isProcessing === 'portal'}
              >
                {isProcessing === 'portal' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Opening Billing Portal...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Billing Portal
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-3">
                Securely manage your subscription, payment methods, and download invoices through Stripe's billing portal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Published Campaigns List */}
        {billingSummary.published_campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Published Campaigns ({billingSummary.published_campaigns.length})
                </CardTitle>
              <CardDescription>
                Your currently published campaigns
              </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                {billingSummary.published_campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">
                        Published {new Date(campaign.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Live</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              </CardContent>
            </Card>
            )}
      </div>


        </div>
  )
} 