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

  useEffect(() => {
    loadBillingSummary()
    
    // Handle success/cancel from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const canceled = urlParams.get('canceled')
    const sessionId = urlParams.get('session_id')
    
    if (success && sessionId) {
      toast({
        title: 'Subscription Successful!',
        description: 'Your plan has been upgraded successfully. Welcome to your new tier!',
        duration: 5000,
      })
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/dashboard/account')
    } else if (canceled) {
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
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start upgrade process',
        variant: 'destructive',
      })
    } finally {
      setIsUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You can continue using your current plan until the end of your billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription has been cancelled. You can continue using your current plan until the end of your billing period.',
        })
        await loadBillingSummary()
      } else {
        throw new Error(result.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: 'destructive',
      })
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
              const isUpgradingThis = isUpgrading === key
              
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
                        {billingSummary.current_tier !== 'free' && !billingSummary.cancellation_scheduled && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-red-600 hover:text-red-700"
                            onClick={handleCancelSubscription}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                        {billingSummary.cancellation_scheduled && (
                          <div className="text-center">
                            <Badge variant="secondary" className="text-yellow-700">
                              Cancellation Scheduled
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">
                              Access until {billingSummary.current_period_end 
                                ? new Date(billingSummary.current_period_end).toLocaleDateString()
                                : 'end of period'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleUpgrade(key as 'standard' | 'premium')}
                        disabled={isUpgradingThis || key === 'free'}
                        variant={tier.popular ? 'default' : 'outline'}
                      >
                        {isUpgradingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {tier.buttonText}
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
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
    </div>
  )
} 