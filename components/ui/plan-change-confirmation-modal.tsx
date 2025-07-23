"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CreditCard, Calendar, ArrowRight } from 'lucide-react'

// Simple Modal Component
const Modal: React.FC<{
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

interface ProrationCalculation {
  currentTier: string
  targetTier: string
  currentAmount: number
  targetAmount: number
  immediateCharge: number
  isUpgrade: boolean
  isDowngrade: boolean
  nextBillingDate: string
  nextBillingAmount: number
  formattedImmediateCharge: string
  actionText: string
  changeType: 'upgrade' | 'downgrade'
  daysRemaining: number
  totalDays: number
}

interface CampaignImpact {
  action: 'none' | 'unpublish'
  currentPublished: number
  maxAllowed: number | string
  campaignsToKeep: Array<{
    id: string
    name: string
    published_at: string
  }>
  campaignsToUnpublish: Array<{
    id: string
    name: string
    published_at: string
  }>
}

interface PlanChangeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (method: 'existing' | 'different' | 'new') => Promise<void>
  calculation: ProrationCalculation | null
  campaignImpact?: CampaignImpact | null
  paymentMethod?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  } | null
  isLoading?: boolean
}

export function PlanChangeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  calculation,
  campaignImpact,
  paymentMethod,
  isLoading = false
}: PlanChangeConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async (method: 'existing' | 'different' | 'new') => {
    setIsConfirming(true)
    try {
      await onConfirm(method)
    } finally {
      setIsConfirming(false)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  if (!calculation) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            {calculation.isUpgrade ? (
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            Confirm Plan {calculation.changeType === 'upgrade' ? 'Upgrade' : 'Change'}
          </CardTitle>
          <CardDescription>
            {formatTierName(calculation.currentTier)} → {formatTierName(calculation.targetTier)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Immediate Billing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Immediate Billing
            </h3>
            
            {calculation.isUpgrade && calculation.immediateCharge > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {calculation.actionText} <strong>{calculation.formattedImmediateCharge}</strong> today for the remaining {calculation.daysRemaining} days of your current billing period.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="text-blue-800">
                    💡 <strong>Prorated upgrade:</strong> You get immediate access to {formatTierName(calculation.targetTier)} features and only pay for the time remaining in your billing cycle.
                  </p>
                </div>
                
                {/* Payment method info */}
                {paymentMethod && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Will be charged to •••• •••• •••• {paymentMethod.last4} ({paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)})</span>
                  </div>
                )}
              </div>
            ) : calculation.isDowngrade ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  You will continue to have access to your {formatTierName(calculation.currentTier)} features until <strong>{formatDate(calculation.nextBillingDate)}</strong>.
                </p>
                
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <p className="text-amber-800">
                    📅 <strong>Plan change:</strong> Your plan will automatically change to {formatTierName(calculation.targetTier)} at the end of your current billing period. No immediate charges or credits.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No immediate charge required.
              </p>
            )}
          </div>

          {/* Campaign Impact Warning */}
          {campaignImpact && campaignImpact.action === 'unpublish' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Campaign Impact
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-amber-800">
                  <strong>{campaignImpact.campaignsToUnpublish.length} campaign{campaignImpact.campaignsToUnpublish.length !== 1 ? 's' : ''} will be unpublished</strong> to meet the {campaignImpact.maxAllowed} campaign limit for {formatTierName(calculation.targetTier)} plan.
                </p>
                
                {campaignImpact.campaignsToKeep.length > 0 && (
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">Will remain published (newest {campaignImpact.campaignsToKeep.length}):</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {campaignImpact.campaignsToKeep.map((campaign) => (
                        <li key={campaign.id} className="truncate">
                          {campaign.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {campaignImpact.campaignsToUnpublish.length > 0 && (
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">Will be unpublished (older {campaignImpact.campaignsToUnpublish.length}):</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {campaignImpact.campaignsToUnpublish.slice(0, 3).map((campaign) => (
                        <li key={campaign.id} className="truncate">
                          {campaign.name}
                        </li>
                      ))}
                      {campaignImpact.campaignsToUnpublish.length > 3 && (
                        <li className="text-amber-600 italic">
                          and {campaignImpact.campaignsToUnpublish.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                <p className="text-xs text-amber-600 mt-3">
                  💡 Unpublished campaigns remain as drafts and can be republished later if you upgrade.
                </p>
              </div>
            </div>
          )}

          {/* Next Billing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Billing Cycle
            </h3>
            <p className="text-sm text-gray-600">
              Starting <strong>{formatDate(calculation.nextBillingDate)}</strong>, you'll be billed <strong>${calculation.nextBillingAmount}/month</strong> for your {formatTierName(calculation.targetTier)} plan.
            </p>
          </div>

          {/* Plan Features Reminder */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            You can change or cancel your subscription at any time from your account settings.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConfirming || isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {/* Different button sets based on upgrade vs downgrade and payment method */}
            {calculation.isUpgrade && calculation.immediateCharge > 0 ? (
              paymentMethod ? (
                // Has existing payment method - show both options
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => handleConfirm('existing')}
                    disabled={isConfirming || isLoading}
                    className="w-full sm:w-auto"
                    variant="default"
                  >
                    {isConfirming || isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Confirm with ${paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} ••••${paymentMethod.last4}`
                    )}
                  </Button>
                  <Button
                    onClick={() => handleConfirm('different')}
                    disabled={isConfirming || isLoading}
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    Use Different Card
                  </Button>
                </div>
              ) : (
                // No payment method - direct to checkout
                <Button
                  onClick={() => handleConfirm('new')}
                  disabled={isConfirming || isLoading}
                  className="w-full sm:w-auto"
                  variant="default"
                >
                  {isConfirming || isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Secure Checkout'
                  )}
                </Button>
              )
            ) : (
              // Downgrade or no charge - single confirm button
              <Button
                onClick={() => handleConfirm('existing')}
                disabled={isConfirming || isLoading}
                className="w-full sm:w-auto"
                variant={calculation.isUpgrade ? 'default' : 'outline'}
              >
                {isConfirming || isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  `Confirm ${calculation.changeType === 'upgrade' ? 'Upgrade' : 'Change'}`
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
} 