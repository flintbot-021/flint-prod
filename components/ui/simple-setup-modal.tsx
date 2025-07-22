'use client'

import React, { useState } from 'react'
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

interface SimpleSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function SetupForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast({
        title: 'Error',
        description: 'Card element not found',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement
      })

      if (pmError) {
        throw new Error(pmError.message || 'Failed to create payment method')
      }

      // Update payment method on backend
      const updateResponse = await fetch('/api/billing/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id
        })
      })

      const updateResult = await updateResponse.json()
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to save payment method')
      }

      // Setup initial subscription with 1 credit
      const creditResponse = await fetch('/api/billing/subscription-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade',
          new_credit_amount: 1
        })
      })

      const creditResult = await creditResponse.json()
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Failed to setup subscription')
      }

      toast({
        title: 'Welcome to Flint! 🎉',
        description: 'You now have 1 credit to host your first campaign. You can adjust credits anytime.',
        duration: 5000
      })

      onComplete()

    } catch (error) {
      console.error('Setup error:', error)
      toast({
        title: 'Setup Failed',
        description: error instanceof Error ? error.message : 'An error occurred during setup',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
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
    hidePostalCode: false,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Card Information
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-blue-500 transition-colors">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe with bank-level encryption</span>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-800 mb-2">
            Start with 1 credit
          </div>
          <div className="space-y-1 text-sm text-blue-700">
            <div>• $99/month for your first credit</div>
            <div>• Use credits to host campaigns</div>
            <div>• Add more credits anytime</div>
            <div>• Cancel anytime, no commitment</div>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding your first credit...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Add 1 Credit - $99/month
          </>
        )}
      </Button>
    </form>
  )
}

export function SimpleSetupModal({ isOpen, onClose, onSuccess }: SimpleSetupModalProps) {
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      },
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
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full z-10"
          >
            <X className="h-4 w-4" />
          </button>
          
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <CardTitle>Add Your First Credit</CardTitle>
              <CardDescription>
                Buy 1 credit that can be used to host a campaign. You can add more anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={elementsOptions}>
                <SetupForm onComplete={handleSuccess} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 