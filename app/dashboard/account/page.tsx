'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/components/ui/use-toast'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { 
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Globe,
  Plus,
  Settings,
  Eye,
  LogOut
} from 'lucide-react'
import { CreditAdjustmentModal } from '@/components/ui/credit-adjustment-modal'
import { PaymentMethodModal } from '@/components/ui/payment-method-modal'
import { SimpleSetupModal } from '@/components/ui/simple-setup-modal'


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
  downgrade_scheduled_at: string | null
  downgrade_to_credits: number | null
}

interface PublishedCampaign {
  id: string
  name: string
  published_url: string
  published_at: string
  created_at: string
}

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)
  const [showCreditAdjustment, setShowCreditAdjustment] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showSimpleSetup, setShowSimpleSetup] = useState(false)

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreditAdjustment(false)
        setShowCancelModal(false)
        setShowPaymentMethodModal(false)
        setShowSimpleSetup(false)
      }
    }

    if (showCreditAdjustment || showCancelModal || showPaymentMethodModal || showSimpleSetup) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showCreditAdjustment, showCancelModal, showPaymentMethodModal, showSimpleSetup])

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
  
  // For billing display, show the effective credits (current or scheduled amount)
  const effectiveCredits = billingSummary?.downgrade_to_credits ?? monthlyCredits;

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <PrimaryNavigation currentPage="account" />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your hosting subscription and active campaigns</p>
          </div>

        {loadingBilling ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading account information...</p>
          </div>
        ) : (
          /* Account State - both with and without credits */
          <div className="space-y-6">
            {/* Hosting Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Hosting Subscription
                </CardTitle>
                <CardDescription>
                  Your credits and active campaigns
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

                {/* Downgrade Notice */}
                {billingSummary?.downgrade_scheduled_at && billingSummary?.downgrade_to_credits !== null && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Downgrade Scheduled</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Your subscription will be reduced to {billingSummary.downgrade_to_credits} credit{billingSummary.downgrade_to_credits !== 1 ? 's' : ''} at your next billing cycle ({billingSummary.next_billing_date ? new Date(billingSummary.next_billing_date).toLocaleDateString() : 'next billing date'}). 
                      New monthly charge: ${((billingSummary.downgrade_to_credits * 99)).toFixed(2)}/month.
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => handleSubscriptionChange('reactivate')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Cancel Downgrade
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
                            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/builder`)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasCredits ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No campaigns are currently published</p>
                    <p className="text-sm text-gray-500">You have {monthlyCredits} available credits to use</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">Ready to get started?</p>
                    <p className="text-sm text-gray-600 mb-4">Add credits to start publishing campaigns</p>
                    <Button 
                      onClick={() => setShowSimpleSetup(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add Credits
                    </Button>
                  </div>
                )}
                </div>

                {/* Subscription Actions */}
                <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCreditAdjustment(true)}
                    className="flex items-center gap-2"
                    disabled={!!billingSummary?.cancellation_scheduled_at || !!billingSummary?.downgrade_scheduled_at}
                  >
                    <Settings className="h-4 w-4" />
                    Adjust Credits
                  </Button>
                  {hasCredits && !billingSummary?.cancellation_scheduled_at ? (
                    <Button 
                      variant="outline"
                      onClick={() => handleSubscriptionChange('cancel')}
                      className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Cancel Subscription
                    </Button>
                  ) : hasCredits && billingSummary?.cancellation_scheduled_at ? (
                    <Button 
                      variant="outline"
                      onClick={() => handleSubscriptionChange('reactivate')}
                      className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Reactivate Subscription
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Billing Information - Only show when user has credits */}
            {hasCredits && (
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
                        ? new Date(billingSummary.next_billing_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Monthly Amount</h4>
                    <p className="text-gray-600">${monthlyCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{effectiveCredits} credits × $99</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </h4>
                  {billingSummary?.payment_method_last_four && billingSummary?.payment_method_brand ? (
                    <div className="space-y-3">
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
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPaymentMethodModal(true)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Update Payment Method
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600 text-sm">
                          No payment method on file. Add credits to set up billing.
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPaymentMethodModal(true)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Add Payment Method
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

          </div>
        )}
        </main>
      </div>

      {/* Modals - Rendered at root level */}
      <CreditAdjustmentModal
        isOpen={showCreditAdjustment}
        onClose={() => setShowCreditAdjustment(false)}
        currentCredits={monthlyCredits}
        maxCredits={20}
        activeSlots={activeSlots.length}
        billingAnchorDate={billingSummary?.billing_anchor_date || undefined}
        nextBillingDate={billingSummary?.next_billing_date || undefined}
        paymentMethodBrand={billingSummary?.payment_method_brand || undefined}
        paymentMethodLastFour={billingSummary?.payment_method_last_four || undefined}
        onSuccess={loadBillingSummary}
      />

      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSuccess={loadBillingSummary}
        currentPaymentMethod={{
          last_four: billingSummary?.payment_method_last_four || undefined,
          brand: billingSummary?.payment_method_brand || undefined,
        }}
      />

      <SimpleSetupModal
        isOpen={showSimpleSetup}
        onClose={() => setShowSimpleSetup(false)}
        onSuccess={loadBillingSummary}
      />



      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Cancel Subscription</CardTitle>
                <CardDescription>
                  Your subscription will be cancelled at the end of your current billing cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Cancellation Date:</strong> {billingSummary?.next_billing_date 
                      ? new Date(billingSummary.next_billing_date).toLocaleDateString()
                      : 'End of current period'
                    }
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your campaigns will remain published until then.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      handleSubscriptionChange('cancel');
                      setShowCancelModal(false);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Schedule Cancellation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Cancel Subscription</CardTitle>
                <CardDescription>
                  Your subscription will be cancelled at the end of your current billing cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Cancellation Date:</strong> {billingSummary?.next_billing_date 
                      ? new Date(billingSummary.next_billing_date).toLocaleDateString()
                      : 'End of current period'
                    }
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your campaigns will remain published until then.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      handleSubscriptionChange('cancel');
                      setShowCancelModal(false);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Schedule Cancellation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
} 