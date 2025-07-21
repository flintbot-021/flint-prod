'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, DollarSign, X } from 'lucide-react'
import { getProratedDescription } from '@/lib/utils/billing-calculations'

interface StoredPaymentPurchaseProps {
  paymentMethodBrand: string
  paymentMethodLastFour: string
  billingAnchorDate: string
  nextBillingDate: string
  onSuccess: () => void
  onCancel: () => void
}

export function StoredPaymentPurchase({ 
  paymentMethodBrand, 
  paymentMethodLastFour,
  billingAnchorDate,
  nextBillingDate,
  onSuccess, 
  onCancel 
}: StoredPaymentPurchaseProps) {
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    if (quantity < 1 || quantity > 50) {
      setError('Quantity must be between 1 and 50')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          use_stored_payment_method: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      if (result.success && result.payment_intent.status === 'succeeded') {
        toast({
          title: 'Credits Added!',
          description: `Successfully added ${quantity} credit${quantity > 1 ? 's' : ''} to your account.`,
          duration: 5000
        })
        onSuccess()
      } else {
        throw new Error('Payment was not successful')
      }

    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to process payment',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const proratedDescription = getProratedDescription(quantity, billingAnchorDate, nextBillingDate)

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Credits - Card on File
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Your card will be charged immediately at a prorated rate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stored Payment Method Display */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                •••• •••• •••• {paymentMethodLastFour}
              </p>
              <p className="text-sm text-gray-500 capitalize">{paymentMethodBrand}</p>
            </div>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Number of Credits</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="50"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full"
          />
        </div>

        {/* Pricing Display */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">Pricing</span>
          </div>
          <p className="text-sm text-blue-700">
            {proratedDescription}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Next billing cycle: ${(quantity * 99).toFixed(2)}/month added to your subscription
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || quantity < 1 || quantity > 50}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Add ${quantity} Credit${quantity > 1 ? 's' : ''}`
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 