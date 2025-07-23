'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/use-toast'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { PlanChangeConfirmationModal } from '@/components/ui/plan-change-confirmation-modal'
import { 
  ArrowLeft,
  Crown,
  Zap,
  Globe,
  Check,
  Eye,
  BarChart3,
  Calendar,
  CreditCard,
  ExternalLink,
  Loader2,
  Star,
  AlertCircle
} from 'lucide-react'

interface BillingSummary {
  current_tier: 'free' | 'standard' | 'premium'
  tier_name: string
  monthly_price: number
  max_campaigns: number
  tier_features: string[]
  currently_published: number
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  current_period_start?: string
  current_period_end?: string
  cancellation_scheduled: boolean
  scheduled_tier_change?: string
  scheduled_change_date?: string
  can_downgrade: boolean
  published_campaigns: Array<{
  id: string
  name: string
    slug: string
  published_at: string
  }>
  available_tiers: {
    standard: boolean
    premium: boolean
  }
  payment_method?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  } | null
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
      'Preview campaigns',
      'Basic analytics',
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
      'Advanced analytics',
      'Email support',
      'Custom domains'
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
      'Advanced integrations',
      'Custom branding',
      'API access'
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
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)
  const [isReactivating, setIsReactivating] = useState(false)
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  
  // Proration modal state
  const [showProrationModal, setShowProrationModal] = useState(false)
  const [prorationCalculation, setProrationCalculation] = useState<any>(null)
  const [pendingTier, setPendingTier] = useState<string | null>(null)
  const [campaignImpact, setCampaignImpact] = useState<any>(null)
  const [scheduledCampaignImpact, setScheduledCampaignImpact] = useState<any>(null)

  useEffect(() => {
    loadBillingSummary()
    
    // Handle success/cancel from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    const sessionId = urlParams.get('session_id')
    const upgrade = urlParams.get('upgrade')
    const tier = urlParams.get('tier')
    
    if (success && sessionId) {
      toast({
        title: 'Subscription Successful!',
        description: 'Your plan has been upgraded successfully. Welcome to your new tier!',
        duration: 5000,
      })
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/dashboard/account')
    } else if (upgrade === 'success' && tier) {
      toast({
        title: 'Upgrade Successful!',
        description: `Your plan has been upgraded to ${tier}. The new features are now available!`,
        duration: 5000,
      })
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/dashboard/account')
    } else if (canceled || upgrade === 'cancelled') {
      toast({
        title: 'Checkout Cancelled',
        description: 'Your subscription upgrade was cancelled. No charges were made.',
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
        
        // Check if there's a scheduled downgrade that will affect campaigns
        if (result.data.scheduled_tier_change) {
          await checkScheduledCampaignImpact(result.data.scheduled_tier_change)
        }
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
      setIsUpgrading(tier)
      
      // Check if user has an active subscription (not free tier)
      const hasActiveSubscription = billingSummary?.current_tier !== 'free' && 
                                   billingSummary?.subscription_status === 'active'

      if (hasActiveSubscription) {
        // Calculate proration and show confirmation modal
        console.log('Calculating proration for:', tier)
        const prorationResponse = await fetch('/api/billing/calculate-proration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetTier: tier }),
        })

        const prorationResult = await prorationResponse.json()

        if (!prorationResponse.ok) {
          throw new Error(prorationResult.error || 'Failed to calculate proration')
        }

        // For downgrades, also check campaign impact
        let campaignImpactResult = null
        if (prorationResult.calculation.isDowngrade) {
          console.log('Checking campaign impact for downgrade to:', tier)
          const campaignResponse = await fetch('/api/billing/handle-campaign-limits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetTier: tier, preview: true }),
          })

          if (campaignResponse.ok) {
            campaignImpactResult = await campaignResponse.json()
          } else {
            console.error('Failed to check campaign impact')
            // Continue without campaign impact info
          }
        }

        // Store the calculation and show confirmation modal
        setProrationCalculation(prorationResult.calculation)
        setCampaignImpact(campaignImpactResult)
        setPendingTier(tier)
        setShowProrationModal(true)
        setIsUpgrading(null) // Reset loading state since we're showing modal
      } else {
        // Create new checkout session (requires payment details)
        console.log('Creating new checkout session for:', tier)
        const response = await fetch('/api/billing/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Show more detailed error information
          const errorMsg = result.details ? `${result.error}: ${result.details}` : result.error
          throw new Error(errorMsg || 'Failed to create checkout session')
        }

        if (result.checkout_url) {
          window.location.href = result.checkout_url
        } else {
          throw new Error(result.error || 'Failed to create checkout session')
        }
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upgrade subscription',
        variant: 'destructive',
      })
      setIsUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      // Calculate proration for Free tier (should show no charge)
      console.log('Calculating proration for Free tier')
      const prorationResponse = await fetch('/api/billing/calculate-proration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetTier: 'free' }),
      })

      const prorationResult = await prorationResponse.json()

      if (!prorationResponse.ok) {
        throw new Error(prorationResult.error || 'Failed to calculate proration')
      }

      // Check campaign impact for Free tier
      console.log('Checking campaign impact for downgrade to Free')
      const campaignResponse = await fetch('/api/billing/handle-campaign-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetTier: 'free', preview: true }),
      })

      let campaignImpactResult = null
      if (campaignResponse.ok) {
        campaignImpactResult = await campaignResponse.json()
      } else {
        console.error('Failed to check campaign impact')
        // Continue without campaign impact info
      }

      // Store data and show confirmation modal
      setProrationCalculation(prorationResult.calculation)
      setCampaignImpact(campaignImpactResult)
      setPendingTier('free')
      setShowProrationModal(true)
    } catch (error) {
      console.error('Error preparing Free downgrade:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to prepare downgrade',
        variant: 'destructive',
      })
    }
  }

  const handleCancelDowngrade = async () => {
    try {
      const response = await fetch('/api/billing/cancel-downgrade', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Downgrade Cancelled',
          description: 'Your scheduled downgrade has been cancelled. You will continue on your current plan.',
        })
        await loadBillingSummary()
      } else {
        throw new Error(result.error || 'Failed to cancel downgrade')
      }
    } catch (error) {
      console.error('Error cancelling downgrade:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel downgrade',
        variant: 'destructive',
      })
    }
  }

  const handleConfirmPlanChange = async (method: 'existing' | 'different' | 'new') => {
    if (!pendingTier) return

    try {
      if (method === 'existing') {
        // For free tier downgrades, use cancel subscription endpoint
        if (pendingTier === 'free') {
          console.log('Cancelling subscription (downgrade to free)')
          const response = await fetch('/api/billing/cancel-subscription', {
            method: 'POST',
          })

          const result = await response.json()

          if (response.ok) {
            toast({
              title: 'Downgrade Scheduled!',
              description: result.message || 'Successfully scheduled downgrade to Free plan.',
              duration: 5000,
            })
            await loadBillingSummary()
          } else {
            throw new Error(result.error || 'Failed to schedule downgrade')
          }
        } else {
          // Update existing subscription (uses existing payment method)
          console.log('Updating existing subscription to:', pendingTier)
          const response = await fetch('/api/billing/update-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier: pendingTier }),
          })

          const result = await response.json()

          if (response.ok) {
            toast({
              title: 'Subscription Updated!',
              description: result.message || `Successfully updated to ${pendingTier} plan.`,
              duration: 5000,
            })
            await loadBillingSummary()
          } else {
            throw new Error(result.error || 'Failed to update subscription')
          }
        }
              } else {
          // For free tier downgrades, different/new card methods don't make sense
          if (pendingTier === 'free') {
            throw new Error('Free tier downgrades should use existing payment method flow')
          }
          
          // Create checkout session for different/new card
          console.log('Creating checkout session for different card:', pendingTier)
        const response = await fetch('/api/billing/create-upgrade-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tier: pendingTier,
            prorationAmount: prorationCalculation?.immediateCharge || 0
          }),
        })

        const result = await response.json()

        if (response.ok) {
          // Redirect to Stripe checkout
          window.location.href = result.checkoutUrl
          return // Don't reset modal state yet - user will return from checkout
        } else {
          throw new Error(result.error || 'Failed to create checkout session')
        }
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subscription',
        variant: 'destructive',
      })
    } finally {
      // Only reset modal state for existing payment method flow
      if (method === 'existing') {
        setShowProrationModal(false)
        setProrationCalculation(null)
        setPendingTier(null)
        setCampaignImpact(null)
      }
    }
  }

  const handleReactivateSubscription = async () => {
    setIsReactivating(true)
    try {
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Subscription Reactivated',
          description: 'Your subscription has been reactivated successfully. Your plan will continue as normal.',
        })
        await loadBillingSummary()
      } else {
        throw new Error(result.error || 'Failed to reactivate subscription')
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reactivate subscription',
        variant: 'destructive',
      })
    } finally {
      setIsReactivating(false)
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CurrentTierIcon className={`h-4 w-4 ${currentTier.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentTier.name}</div>
              <p className="text-xs text-gray-600">
                {currentTier.price === 0 ? 'Free forever' : `$${currentTier.price}/month`}
              </p>

            </CardContent>
          </Card>

          {/* Published Campaigns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Campaigns</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billingSummary.currently_published}</div>
              <p className="text-xs text-gray-600">
                of {billingSummary.max_campaigns === -1 ? 'unlimited' : billingSummary.max_campaigns} available
              </p>
            </CardContent>
          </Card>

          {/* Subscription Status */}
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={billingSummary.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {billingSummary.subscription_status}
                </Badge>
                  </div>
              {billingSummary.current_period_end && (
                <p className="text-xs text-gray-600">
                  Renews {new Date(billingSummary.current_period_end).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
                </div>

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
                  className={`relative ${
                    isCurrentTier 
                      ? `${tier.borderColor} ${tier.bgColor} border-2` 
                      : 'border-gray-200 hover:border-gray-300 transition-colors'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {isCurrentTier && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="default">Current Plan</Badge>
                  </div>
                )}

                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${tier.bgColor} mb-4`}>
                      <TierIcon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {tier.price === 0 ? 'Free' : `$${tier.price}`}
                      {tier.price > 0 && <span className="text-sm font-normal text-gray-600">/month</span>}
                    </div>
                    <CardDescription>
                      {tier.max_campaigns === 0 
                        ? 'Perfect for trying out' 
                        : tier.max_campaigns === -1 
                          ? 'For growing businesses' 
                          : `Up to ${tier.max_campaigns} published campaigns`
                      }
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentTier ? (
                      <div className="space-y-3">
                        <Button disabled className="w-full">
                          Current Plan
                        </Button>
                        
                        {/* Scheduled downgrades - consistent display for all types */}
                        {billingSummary.cancellation_scheduled && (
                          <div className="text-center space-y-2">
                            <Badge variant="secondary" className="text-red-700">
                              Downgrade to Free Scheduled
                            </Badge>
                            <p className="text-xs text-gray-600">
                              Will change to free on {billingSummary.current_period_end 
                                ? new Date(billingSummary.current_period_end).toLocaleDateString()
                                : 'end of period'
                              }
                    </p>
                    <Button 
                              variant="outline" 
                      size="sm"
                              className="w-full text-red-600 hover:text-red-700"
                              onClick={() => handleReactivateSubscription()}
                    >
                      Cancel Downgrade
                    </Button>
                  </div>
                )}

                        {billingSummary.scheduled_tier_change && (
                          <div className="text-center space-y-2">
                            <Badge variant="secondary" className="text-blue-700">
                              Downgrade to {billingSummary.scheduled_tier_change.charAt(0).toUpperCase() + billingSummary.scheduled_tier_change.slice(1)} Scheduled
                            </Badge>
                            <p className="text-xs text-gray-600">
                              Will change to {billingSummary.scheduled_tier_change} on {
                                billingSummary.scheduled_change_date 
                                  ? new Date(billingSummary.scheduled_change_date).toLocaleDateString()
                                  : 'next billing date'
                              }
                            </p>
                          <Button
                            variant="outline"
                            size="sm"
                              className="w-full text-blue-600 hover:text-blue-700"
                              onClick={() => handleCancelDowngrade()}
                          >
                              Cancel Downgrade
                          </Button>
                        </div>
                        )}
                  </div>
                ) : (
                      <div className="space-y-2">
                        {/* Determine button text and action based on current tier and target tier */}
                        {(() => {
                          const currentTier = billingSummary?.current_tier
                          const targetTier = key
                          
                          // Free card logic
                          if (targetTier === 'free') {
                            if (currentTier !== 'free' && !billingSummary?.cancellation_scheduled && !billingSummary?.scheduled_tier_change) {
                              return (
                    <Button 
                                  className="w-full text-red-600 hover:text-red-700"
                                  onClick={handleCancelSubscription}
                                  variant="outline"
                    >
                                  Downgrade to Free
                    </Button>
                              )
                            }
                            return null // Free users can't "upgrade" to free
                          }
                          
                          // Standard card logic
                          if (targetTier === 'standard') {
                            if (currentTier === 'premium' && !billingSummary?.cancellation_scheduled && !billingSummary?.scheduled_tier_change) {
                              return (
                  <Button 
                                  className="w-full"
                                  onClick={() => handleUpgrade('standard')}
                                  disabled={isUpgrading === 'standard'}
                    variant="outline"
                                >
                                  {isUpgrading === 'standard' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Downgrade to Standard'
                                  )}
                  </Button>
                              )
                            } else if (currentTier === 'free') {
                              return (
                    <Button 
                                  className="w-full"
                                  onClick={() => handleUpgrade('standard')}
                                  disabled={isUpgrading === 'standard'}
                                  variant={tier.popular ? 'default' : 'outline'}
                                >
                                  {isUpgrading === 'standard' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      Upgrade to Standard
                                      <ExternalLink className="h-4 w-4 ml-2" />
                                    </>
                                  )}
                    </Button>
                              )
                            }
                            return null
                          }
                          
                          // Premium card logic
                          if (targetTier === 'premium') {
                            if (currentTier !== 'premium') {
                              return (
                    <Button 
                                  className="w-full"
                                  onClick={() => handleUpgrade('premium')}
                                  disabled={isUpgrading === 'premium'}
                                  variant={tier.popular ? 'default' : 'outline'}
                                >
                                  {isUpgrading === 'premium' ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      Upgrade to Premium
                                      {currentTier !== 'free' && billingSummary?.subscription_status === 'active' ? (
                                        <CreditCard className="h-4 w-4 ml-2" />
                                      ) : (
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                      )}
                                    </>
                                  )}
                    </Button>
                              )
                            }
                            return null
                          }
                          
                          return null
                        })()}

                </div>
                    )}
              </CardContent>
            </Card>
              )
            })}
          </div>
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
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
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

      {/* Confirmation Dialog */}
      {ConfirmationDialog}
      
      {/* Plan Change Confirmation Modal */}
      <PlanChangeConfirmationModal
        isOpen={showProrationModal}
        onClose={() => {
          setShowProrationModal(false)
          setProrationCalculation(null)
          setPendingTier(null)
          setCampaignImpact(null)
        }}
        onConfirm={handleConfirmPlanChange}
        calculation={prorationCalculation}
        campaignImpact={campaignImpact}
        paymentMethod={billingSummary?.payment_method}
      />
        </div>
  )
} 