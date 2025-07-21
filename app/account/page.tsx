'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft,
  User,
  CreditCard,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react'
import { StripePaymentForm } from '@/components/ui/stripe-payment-form'

interface BillingSummary {
  credit_balance: number
  total_credits_owned: number
  currently_published: number
  available_credits: number
  active_slots: PublishedCampaign[]
  monthly_cost_cents: number
  next_billing_date: string | null
  billing_history: any[]
}

interface PublishedCampaign {
  id: string
  name: string
  published_url: string
  published_at: string
  created_at: string
}

export default function AccountSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'payment'>('overview')
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [showCreditPurchase, setShowCreditPurchase] = useState(false)
  const [creditQuantity, setCreditQuantity] = useState(1)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadBillingSummary()
  }, [user, router])

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
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ] as const

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account, billing, and payment information.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Credits Owned</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          {loadingBilling ? '...' : billingSummary?.total_credits_owned || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Credits in your account</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Currently Published</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          {loadingBilling ? '...' : billingSummary?.currently_published || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Active campaigns</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Available Credits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {loadingBilling ? '...' : billingSummary?.available_credits || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ready to use</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email Address</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Account Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 text-sm">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Hosting Slots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Active Hosting Slots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingBilling ? (
                      <p className="text-gray-500">Loading active slots...</p>
                    ) : billingSummary?.active_slots?.length ? (
                      <div className="space-y-3">
                        {billingSummary.active_slots.map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Globe className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{campaign.name}</p>
                                <p className="text-sm text-gray-500">Web Development</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-green-600 font-medium">Live</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">1 credit used</p>
                              </div>
                                                             <Button
                                 variant="outline"
                                 size="sm"
                                 className="text-red-600 border-red-200 hover:bg-red-50"
                                 onClick={async () => {
                                   try {
                                     const response = await fetch(`/api/campaigns/${campaign.id}/publish`, {
                                       method: 'DELETE',
                                     });

                                     const result = await response.json();

                                     if (!result.success) {
                                       throw new Error(result.error || 'Failed to unpublish campaign');
                                     }

                                     // Refresh billing summary
                                     await loadBillingSummary();

                                     toast({
                                       title: 'Campaign Unpublished',
                                       description: result.message || 'Campaign unpublished and 1 credit refunded.',
                                       duration: 5000
                                     });
                                   } catch (error) {
                                     console.error('Error unpublishing campaign:', error);
                                     toast({
                                       title: 'Error',
                                       description: error instanceof Error ? error.message : 'Failed to unpublish campaign',
                                       variant: 'destructive'
                                     });
                                   }
                                 }}
                               >
                                 Cancel Slot
                               </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No active hosting slots</p>
                        <p className="text-sm text-gray-400 mt-1">Publish a campaign to see it here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Current Monthly Bill</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          ${loadingBilling ? '...' : ((billingSummary?.monthly_cost_cents || 0) / 100).toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Based on active slots</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Next Billing Date</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-semibold text-gray-900">
                          {loadingBilling ? '...' : billingSummary?.next_billing_date || 'Not set'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Automatic billing</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Billing History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingBilling ? (
                        <p className="text-gray-500">Loading billing history...</p>
                      ) : billingSummary?.billing_history?.length ? (
                        <div className="space-y-3">
                          {billingSummary.billing_history.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                              <div>
                                <p className="font-medium text-gray-900">Hosting Credits Purchase</p>
                                <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">${(item.amount_cents / 100).toFixed(2)}</p>
                                <p className="text-sm text-green-600">Paid</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No billing history yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Subscription Management */}
                  {(billingSummary?.total_credits_owned || 0) > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-5 w-5" />
                          Subscription Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Cancel Subscription</h4>
                          <p className="text-sm text-red-700 mb-4">
                            Canceling your subscription will:
                          </p>
                          <ul className="text-sm text-red-700 space-y-1 mb-4 ml-4">
                            <li>• Unpublish all active campaigns immediately</li>
                            <li>• Remove all {billingSummary?.total_credits_owned || 0} hosting credits from your account</li>
                            <li>• Stop future billing (${((billingSummary?.monthly_cost_cents || 0) / 100).toFixed(2)}/month)</li>
                            <li>• Cannot be undone - you'll need to repurchase credits</li>
                          </ul>
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={async () => {
                              const confirmed = window.confirm(
                                `Are you sure you want to cancel your subscription?\n\n` +
                                `This will:\n` +
                                `• Unpublish all active campaigns\n` +
                                `• Remove all ${billingSummary?.total_credits_owned || 0} credits\n` +
                                `• Stop $${((billingSummary?.monthly_cost_cents || 0) / 100).toFixed(2)}/month billing\n\n` +
                                `This action cannot be undone.`
                              );
                              
                              if (confirmed) {
                                try {
                                  const response = await fetch('/api/billing/cancel-subscription', {
                                    method: 'POST',
                                  });
                                  
                                  const result = await response.json();
                                  
                                  if (!result.success) {
                                    throw new Error(result.error || 'Failed to cancel subscription');
                                  }
                                  
                                  // Refresh billing summary
                                  await loadBillingSummary();
                                  
                                  toast({
                                    title: 'Subscription Canceled',
                                    description: 'Your subscription has been canceled and all campaigns unpublished.',
                                    duration: 5000
                                  });
                                } catch (error) {
                                  console.error('Error canceling subscription:', error);
                                  toast({
                                    title: 'Error',
                                    description: error instanceof Error ? error.message : 'Failed to cancel subscription',
                                    variant: 'destructive'
                                  });
                                }
                              }
                            }}
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
                  
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Stored Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 01/26</p>
                        </div>
                        <div className="ml-auto">
                          <Button variant="outline" size="sm" disabled>
                            Update
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Buy Additional Credits
                      </CardTitle>
                      <CardDescription>
                        Purchase more hosting credits for your campaigns ($10 per credit)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!showCreditPurchase ? (
                        <Button 
                          onClick={() => setShowCreditPurchase(true)}
                          className="w-full sm:w-auto"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Purchase Credits
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="credit-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                              Number of Credits ($10 each)
                            </label>
                            <input
                              id="credit-quantity"
                              type="number"
                              min="1"
                              max="50"
                              value={creditQuantity}
                              onChange={(e) => setCreditQuantity(parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Total: ${(creditQuantity * 10).toFixed(2)}
                            </p>
                          </div>

                          <StripePaymentForm
                            quantity={creditQuantity}
                            onSuccess={async () => {
                              await loadBillingSummary()
                              setShowCreditPurchase(false)
                              toast({
                                title: 'Credits Purchased!',
                                description: `Successfully added ${creditQuantity} credit${creditQuantity > 1 ? 's' : ''} to your account.`,
                                duration: 5000
                              })
                            }}
                            onCancel={() => setShowCreditPurchase(false)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 