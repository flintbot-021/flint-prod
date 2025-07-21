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
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Globe,
  Plus,
  Minus,
  Settings
} from 'lucide-react'
import { StripePaymentForm } from '@/components/ui/stripe-payment-form'
import { StoredPaymentPurchase } from '@/components/ui/stored-payment-purchase'

interface BillingSummary {
  credit_balance: number
  total_credits_owned: number
  currently_published: number
  available_credits: number
  active_slots: PublishedCampaign[]
  monthly_cost_cents: number
  next_billing_date: string | null
  billing_anchor_date: string | null
  payment_method_last_four: string | null
  payment_method_brand: string | null
  billing_history: any[]
  cancellation_scheduled_at: string | null
  subscription_ends_at: string | null
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
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showDowngrade, setShowDowngrade] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [newCreditAmount, setNewCreditAmount] = useState(1)

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUpgrade(false)
        setShowDowngrade(false)
        setShowCancelModal(false)
      }
    }

    if (showUpgrade || showDowngrade || showCancelModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showUpgrade, showDowngrade, showCancelModal])

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
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load billing summary')
      }
      
      setBillingSummary(result.data)
    } catch (error) {
      console.error('Error loading billing summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to load account information',
        variant: 'destructive'
      })
    } finally {
      setLoadingBilling(false)
    }
  }

  const handleCancelSlot = async (campaignId: string, campaignName: string) => {
    const confirmed = window.confirm(
      `Cancel hosting for "${campaignName}"?\n\n` +
      `This will:\n` +
      `• Unpublish the campaign\n` +
      `• Free up 1 credit for other campaigns\n` +
      `• Keep your subscription active`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel slot');
      }
      
      // Refresh billing summary
      await loadBillingSummary();
      
      toast({
        title: 'Slot Canceled',
        description: `"${campaignName}" has been unpublished and 1 credit is now available.`,
      });
    } catch (error) {
      console.error('Error canceling slot:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel slot',
        variant: 'destructive'
      });
    }
  }

  const handleSubscriptionChange = async (action: 'cancel' | 'reactivate' | 'upgrade' | 'downgrade', newAmount?: number, skipConfirm = false) => {
    if (!billingSummary) return;

    let confirmMessage = '';
    let title = '';
    let description = '';

    switch (action) {
      case 'cancel':
        // Don't show native confirm for cancel - use custom modal instead
        if (!skipConfirm) {
          setShowCancelModal(true);
          return;
        }
        title = 'Cancellation Scheduled';
        description = 'Your subscription will end at the next billing cycle.';
        break;
      case 'reactivate':
        confirmMessage = `Reactivate your subscription?\n\n` +
          `This will cancel the scheduled cancellation and your subscription will continue renewing normally.`;
        title = 'Subscription Reactivated';
        description = 'Your subscription will continue renewing.';
        break;
      case 'upgrade':
        confirmMessage = `Upgrade to ${newAmount} credits?\n\n` +
          `This will add ${(newAmount || 0) - billingSummary.total_credits_owned} credits immediately.\n` +
          `Your next bill will be $${((newAmount || 0) * 99).toFixed(2)}/month.`;
        title = 'Subscription Upgraded';
        description = `Added ${(newAmount || 0) - billingSummary.total_credits_owned} credits to your account.`;
        break;
      case 'downgrade':
        if (newAmount === 0) {
          confirmMessage = `Cancel subscription at end of billing period?\n\n` +
            `Your subscription will remain active until ${billingSummary.next_billing_date ? new Date(billingSummary.next_billing_date).toLocaleDateString() : 'the next billing date'}.\n` +
            `After that, all campaigns will be unpublished.`;
          title = 'Cancellation Scheduled';
          description = 'Your subscription will end at the next billing cycle.';
        } else {
          confirmMessage = `Downgrade to ${newAmount} credit${newAmount !== 1 ? 's' : ''}?\n\n` +
            `This change will take effect at your next billing cycle (${billingSummary.next_billing_date ? new Date(billingSummary.next_billing_date).toLocaleDateString() : 'next billing date'}).\n` +
            `Your next bill will be $${((newAmount || 0) * 99).toFixed(2)}/month.`;
          title = 'Downgrade Scheduled';
          description = `Your subscription will change to ${newAmount} credit${newAmount !== 1 ? 's' : ''} next cycle.`;
        }
        break;
    }

    // Only show confirm dialog for non-cancel actions (cancel uses custom modal)
    if (action !== 'cancel' && confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    try {
      const response = await fetch('/api/billing/subscription-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          new_credit_amount: newAmount 
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update subscription');
      }
      
      await loadBillingSummary();
      
      toast({
        title,
        description,
        duration: 5000
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update subscription',
        variant: 'destructive'
      });
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const hasCredits = (billingSummary?.total_credits_owned || 0) > 0;
  const monthlyCredits = billingSummary?.total_credits_owned || 0;
  const monthlyCost = (billingSummary?.monthly_cost_cents || 0) / 100;
  const activeSlots = billingSummary?.active_slots || [];
  const availableSlots = monthlyCredits - activeSlots.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your hosting subscription and active campaigns</p>
        </div>

        {loadingBilling ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading account information...</p>
          </div>
        ) : !hasCredits ? (
          /* No Subscription State */
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">No Active Subscription</CardTitle>
              <CardDescription>
                Purchase hosting credits to start publishing your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Each credit allows you to host one campaign for $99/month
                </p>
                <Button 
                  onClick={() => setShowUpgrade(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Hosting Credits
                </Button>
              </div>
              
              {showUpgrade && (
                                 <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                   <StripePaymentForm 
                     quantity={1}
                     onSuccess={async () => {
                       setShowUpgrade(false);
                       await loadBillingSummary();
                     }}
                     onCancel={() => setShowUpgrade(false)}
                   />
                 </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Active Subscription State */
          <div className="space-y-6">
            {/* Hosting Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Hosting Subscription
                </CardTitle>
                <CardDescription>
                  Your hosting credits and active campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Subscription Overview */}
                <div className="grid grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{monthlyCredits}</div>
                    <p className="text-sm text-gray-600">Total Credits</p>
                    <p className="text-xs text-gray-500">${monthlyCost}/month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{activeSlots.length}</div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-xs text-gray-500">Currently published</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{availableSlots}</div>
                    <p className="text-sm text-gray-600">Available Slots</p>
                    <p className="text-xs text-gray-500">Ready to use</p>
                  </div>
                </div>

                {/* Cancellation Notice */}
                {billingSummary?.cancellation_scheduled_at && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Subscription Ending</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">
                      Your subscription will end on{' '}
                      {billingSummary.subscription_ends_at 
                        ? new Date(billingSummary.subscription_ends_at).toLocaleDateString()
                        : 'your next billing date'
                      }. All campaigns will be unpublished and credits removed.
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => handleSubscriptionChange('reactivate')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Reactivate Subscription
                    </Button>
                  </div>
                )}

                {/* Active Campaigns Section */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Active Campaigns ({activeSlots.length})
                  </h4>
                {activeSlots.length > 0 ? (
                  <div className="space-y-4">
                    {activeSlots.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                            <p className="text-sm text-gray-500">
                              Published {new Date(campaign.published_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">1 credit used</p>
                            <p className="text-xs text-gray-500">$99/month</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSlot(campaign.id, campaign.name)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancel Slot
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns are currently published</p>
                    <p className="text-sm text-gray-500">You have {monthlyCredits} available credits to use</p>
                  </div>
                )}
                </div>

                {/* Subscription Actions */}
                <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
                  <Button 
                    variant="outline"
                    onClick={() => setShowUpgrade(true)}
                    className="flex items-center gap-2"
                    disabled={!!billingSummary?.cancellation_scheduled_at}
                  >
                    <Plus className="h-4 w-4" />
                    {billingSummary?.payment_method_last_four ? 'Add More Credits' : 'Add Credits & Payment Method'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDowngrade(true)}
                    className="flex items-center gap-2"
                    disabled={!!billingSummary?.cancellation_scheduled_at}
                  >
                    <Minus className="h-4 w-4" />
                    Reduce Credits
                  </Button>
                  {!billingSummary?.cancellation_scheduled_at ? (
                    <Button 
                      variant="outline"
                      onClick={() => handleSubscriptionChange('cancel')}
                      className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => handleSubscriptionChange('reactivate')}
                      className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Reactivate Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Next Billing Date</h4>
                    <p className="text-gray-600">
                      {billingSummary?.next_billing_date 
                        ? `${new Date(billingSummary.next_billing_date).toLocaleDateString()} (${billingSummary.next_billing_date.split('T')[0]})`
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Monthly Amount</h4>
                    <p className="text-gray-600">${monthlyCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{monthlyCredits} credits × $99</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </h4>
                  {billingSummary?.payment_method_last_four && billingSummary?.payment_method_brand ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="h-8 w-12 bg-white border rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          •••• •••• •••• {billingSummary.payment_method_last_four}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {billingSummary.payment_method_brand} • On file
                        </p>
                      </div>
                      <div className="text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600 text-sm">
                        No payment method on file. Add credits to set up billing.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

                        {/* Upgrade Modal */}
            {showUpgrade && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={() => setShowUpgrade(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Show stored payment method option if available */}
                  {billingSummary?.billing_anchor_date && 
                   billingSummary?.next_billing_date &&
                   billingSummary?.payment_method_last_four && 
                   billingSummary?.payment_method_brand ? (
                    <StoredPaymentPurchase
                      paymentMethodBrand={billingSummary.payment_method_brand}
                      paymentMethodLastFour={billingSummary.payment_method_last_four}
                      billingAnchorDate={billingSummary.billing_anchor_date}
                      nextBillingDate={billingSummary.next_billing_date}
                      onSuccess={async () => {
                        setShowUpgrade(false);
                        await loadBillingSummary();
                      }}
                      onCancel={() => setShowUpgrade(false)}
                    />
                  ) : (
                    <Card className="border-0 shadow-none">
                      <CardHeader>
                        <CardTitle>Add More Hosting Credits</CardTitle>
                        <CardDescription>
                          Purchase additional credits to host more campaigns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StripePaymentForm 
                          quantity={1}
                          onSuccess={async () => {
                            setShowUpgrade(false);
                            await loadBillingSummary();
                          }}
                          onCancel={() => setShowUpgrade(false)}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Downgrade Modal */}
            {showDowngrade && (
              <Card>
                <CardHeader>
                  <CardTitle>Reduce Hosting Credits</CardTitle>
                  <CardDescription>
                    Changes take effect at your next billing cycle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Credit Amount
                    </label>
                    <select
                      value={newCreditAmount}
                      onChange={(e) => setNewCreditAmount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>0 credits (Cancel subscription)</option>
                      {Array.from({ length: (monthlyCredits - 1) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} credit{num !== 1 ? 's' : ''} (${(num * 99).toFixed(2)}/month)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {activeSlots.length > newCreditAmount && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ You have {activeSlots.length} published campaign{activeSlots.length !== 1 ? 's' : ''} but are downgrading to {newCreditAmount} credit{newCreditAmount !== 1 ? 's' : ''}. 
                        Please unpublish {activeSlots.length - newCreditAmount} campaign{(activeSlots.length - newCreditAmount) !== 1 ? 's' : ''} first.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        handleSubscriptionChange('downgrade', newCreditAmount);
                        setShowDowngrade(false);
                      }}
                      disabled={activeSlots.length > newCreditAmount}
                      className="flex-1"
                    >
                      {newCreditAmount === 0 ? 'Schedule Cancellation' : 'Schedule Downgrade'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDowngrade(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                                 </CardContent>
               </Card>
             )}

            {/* Custom Cancel Subscription Modal */}
            {showCancelModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      Schedule Cancellation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-700">
                      <p className="mb-3">
                        Your subscription will be scheduled for cancellation but will remain active until:
                      </p>
                                             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                         <p className="font-medium text-blue-900">
                           Final Day: {billingSummary?.next_billing_date 
                             ? new Date(billingSummary.next_billing_date).toLocaleDateString('en-US', { 
                                 weekday: 'long',
                                 year: 'numeric', 
                                 month: 'long', 
                                 day: 'numeric' 
                               })
                             : (() => {
                                 // Fallback: calculate next month from now
                                 const nextMonth = new Date();
                                 nextMonth.setMonth(nextMonth.getMonth() + 1);
                                 return nextMonth.toLocaleDateString('en-US', { 
                                   weekday: 'long',
                                   year: 'numeric', 
                                   month: 'long', 
                                   day: 'numeric' 
                                 });
                               })()
                           }
                         </p>
                         <p className="text-sm text-blue-700 mt-1">
                           ({billingSummary?.next_billing_date?.split('T')[0] || (() => {
                             const nextMonth = new Date();
                             nextMonth.setMonth(nextMonth.getMonth() + 1);
                             return nextMonth.toISOString().split('T')[0];
                           })()})
                         </p>
                       </div>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Your subscription stays active until then</li>
                        <li>• All campaigns remain published</li>
                        <li>• You can reactivate anytime before the final day</li>
                        <li>• After that date, campaigns will be unpublished</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          handleSubscriptionChange('cancel', undefined, true);
                          setShowCancelModal(false);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Schedule Cancellation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelModal(false)}
                        className="flex-1"
                      >
                        Keep Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 