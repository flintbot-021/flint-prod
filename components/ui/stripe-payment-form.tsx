'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, X } from 'lucide-react'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  quantity: number
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ quantity, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (paymentMethodError) {
        setPaymentError(paymentMethodError.message || 'Failed to create payment method')
        setIsProcessing(false)
        return
      }

      // Create payment intent on the server
      const response = await fetch('/api/billing/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          payment_method_id: paymentMethod.id,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to process payment')
      }

      // Payment was successful
      toast({
        title: 'Payment Successful!',
        description: `Successfully purchased ${quantity} credit${quantity > 1 ? 's' : ''}`,
        duration: 5000
      })

      onSuccess()

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Card Information</Label>
        <div className="p-3 border rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{paymentError}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Pay ${(quantity * 99).toFixed(2)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

interface StripePaymentFormProps {
  quantity: number
  onSuccess: () => void
  onCancel: () => void
}

export function StripePaymentForm({ quantity, onSuccess, onCancel }: StripePaymentFormProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Stripe is not configured. Please add your Stripe publishable key to the environment variables.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h3 className="font-medium">Purchase {quantity} Credit{quantity > 1 ? 's' : ''}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Payment Method Storage Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-800 font-medium mb-1">
            💳 Secure Payment & Storage
          </p>
          <p className="text-sm text-blue-700">
            Your card will be securely saved for future credit purchases. 
            Additional credits can be purchased instantly without re-entering card details.
          </p>
        </div>
        
        <PaymentForm
          quantity={quantity}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    </Elements>
  )
} 