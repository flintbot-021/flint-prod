'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, X, Lock } from 'lucide-react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentPaymentMethod?: {
    last_four?: string
    brand?: string
  }
}

// Card form component that uses Stripe Elements
function PaymentMethodForm({ onSuccess, onClose }: {
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to create payment method')
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method')
      }

      // Update payment method via our API
      const response = await fetch('/api/billing/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment method')
      }

      toast({
        title: 'Payment Method Updated',
        description: 'Your payment method has been successfully updated.',
      })

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update payment method',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4" />
        <span>Your payment information is secured with bank-level encryption</span>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Payment Method'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  currentPaymentMethod
}: PaymentMethodModalProps) {
  if (!isOpen) return null

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      }
    },
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
                Update Payment Method
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
              {currentPaymentMethod?.last_four 
                ? `Replace your current ${currentPaymentMethod.brand} ending in ${currentPaymentMethod.last_four}`
                : 'Add a new payment method to your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={elementsOptions}>
              <PaymentMethodForm onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 