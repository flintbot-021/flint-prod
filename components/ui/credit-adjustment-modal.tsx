'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, DollarSign, TrendingUp, TrendingDown, AlertCircle, X } from 'lucide-react'
import { getProratedDescription, calculateProratedAmount } from '@/lib/utils/billing-calculations'

interface CreditAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  currentCredits: number
  maxCredits?: number
  activeSlots: number
  billingAnchorDate?: string
  nextBillingDate?: string
  paymentMethodBrand?: string
  paymentMethodLastFour?: string
  onSuccess: () => void
}

export function CreditAdjustmentModal({
  isOpen,
  onClose,
  currentCredits,
  maxCredits = 10,
  activeSlots,
  billingAnchorDate,
  nextBillingDate,
  paymentMethodBrand,
  paymentMethodLastFour,
  onSuccess
}: CreditAdjustmentModalProps) {
  const [newCredits, setNewCredits] = useState(currentCredits)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset slider when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewCredits(currentCredits)
      setError(null)
    }
  }, [isOpen, currentCredits])

  if (!isOpen) return null

  const creditDifference = newCredits - currentCredits
  const isIncrease = creditDifference > 0
  const isDecrease = creditDifference < 0
  const noChange = creditDifference === 0

  const currentMonthlyCost = currentCredits * 99
  const newMonthlyCost = newCredits * 99
  const monthlyCostDifference = newMonthlyCost - currentMonthlyCost

  // Check if user needs to unpublish campaigns for decrease
  const needsUnpublish = isDecrease && activeSlots > newCredits

  const handleConfirm = async () => {
    if (noChange) {
      onClose()
      return
    }

    if (needsUnpublish) {
      setError(`You need to unpublish ${activeSlots - newCredits} campaign(s) before reducing to ${newCredits} credit(s)`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      if (isIncrease) {
        // Handle credit purchase (immediate)
        const response = await fetch('/api/billing/purchase-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: creditDifference,
            use_stored_payment_method: !!(paymentMethodBrand && paymentMethodLastFour),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to purchase credits')
        }

        toast({
          title: 'Credits Added Successfully',
          description: `Added ${creditDifference} credit${creditDifference > 1 ? 's' : ''} to your account`,
        })
      } else {
        // Handle credit reduction (scheduled for next billing cycle)
        const action = newCredits === 0 ? 'cancel' : 'downgrade'
        const response = await fetch('/api/billing/subscription-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            new_credit_amount: newCredits,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update subscription')
        }

        toast({
          title: newCredits === 0 ? 'Cancellation Scheduled' : 'Downgrade Scheduled',
          description: `Your subscription will ${newCredits === 0 ? 'be cancelled' : `be reduced to ${newCredits} credit${newCredits !== 1 ? 's' : ''}`} at your next billing cycle`,
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getPricingDescription = () => {
    if (noChange) return null

    if (isIncrease && billingAnchorDate && nextBillingDate) {
      const proratedDescription = getProratedDescription(creditDifference, billingAnchorDate, nextBillingDate)
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Immediate Charge</span>
          </div>
          <p className="text-sm text-green-700">{proratedDescription}</p>
          <p className="text-xs text-green-600 mt-1">
            Next billing cycle: +${Math.abs(monthlyCostDifference).toFixed(2)}/month added to your subscription
          </p>
        </div>
      )
    }

    if (isDecrease) {
      return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="font-medium">
              {newCredits === 0 ? 'Subscription Cancellation' : 'Scheduled Reduction'}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {newCredits === 0 
              ? 'Your subscription will be cancelled at the end of your current billing cycle'
              : `Your subscription will be reduced to ${newCredits} credit${newCredits !== 1 ? 's' : ''} at your next billing cycle`
            }
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Monthly savings: ${Math.abs(monthlyCostDifference).toFixed(2)}/month
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Adjust Hosting Credits
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Adjust your hosting credits up or down to match your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credit Slider */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {newCredits}
                </div>
                <div className="text-sm text-gray-600">
                  {newCredits === 1 ? 'Credit' : 'Credits'}
                </div>
              </div>
              
              <Slider
                value={[newCredits]}
                onValueChange={(value) => setNewCredits(value[0])}
                max={maxCredits}
                min={0}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>{maxCredits}</span>
              </div>
            </div>

            {/* Simple Summary */}
            {!noChange && (
              <div className="text-center space-y-2">
                <div className="text-sm text-gray-600">
                  {currentCredits} → {newCredits} credits
                </div>
                <div className="text-lg font-semibold">
                  {isIncrease ? (
                    <span className="text-green-600">+{creditDifference} credit{Math.abs(creditDifference) !== 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-blue-600">{creditDifference} credit{Math.abs(creditDifference) !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            )}

            {/* Simple Pricing */}
            {!noChange && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                {isIncrease ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Charge today</div>
                    <div className="text-xl font-bold text-green-600">
                      ${billingAnchorDate ? 
                        (calculateProratedAmount(creditDifference, billingAnchorDate) / 100).toFixed(2) : 
                        (creditDifference * 99).toFixed(2)
                      }
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Then ${(creditDifference * 99).toFixed(2)}/month
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {newCredits === 0 ? 'Cancels at next billing' : 'Reduces at next billing'}
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      Save ${Math.abs(monthlyCostDifference).toFixed(2)}/month
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warning for unpublish requirement */}
            {needsUnpublish && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    You have {activeSlots} published campaign{activeSlots !== 1 ? 's' : ''} but are reducing to {newCredits} credit{newCredits !== 1 ? 's' : ''}. 
                    Please unpublish {activeSlots - newCredits} campaign{(activeSlots - newCredits) !== 1 ? 's' : ''} first.
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleConfirm}
                disabled={isProcessing || needsUnpublish}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : noChange ? (
                  'Close'
                ) : isIncrease ? (
                  `Add ${creditDifference} Credit${creditDifference > 1 ? 's' : ''}`
                ) : newCredits === 0 ? (
                  'Schedule Cancellation'
                ) : (
                  'Schedule Reduction'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 