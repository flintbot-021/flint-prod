'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Lock, ArrowLeft, CreditCard } from 'lucide-react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface InitialSetupInlineProps {
  onSuccess: () => void
}

// Step 1: Credit Selection
function CreditSelectionStep({ 
  selectedCredits, 
  onCreditsChange, 
  onNext 
}: { 
  selectedCredits: number
  onCreditsChange: (credits: number) => void
  onNext: () => void
}) {
  const creditOptions = [1, 2, 3, 4, 5, 10, 15, 20]
  const monthlyAmount = selectedCredits * 99

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Flint</CardTitle>
        <CardDescription>
          Choose your hosting credits to get started. Each credit lets you host one campaign for $99/month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-4 gap-3">
          {creditOptions.map((credits) => (
            <button
              key={credits}
              onClick={() => onCreditsChange(credits)}
              className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                selectedCredits === credits
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-semibold">{credits}</div>
              <div className="text-xs text-gray-500">credit{credits !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>

        <div className="max-w-sm mx-auto">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              ${monthlyAmount.toLocaleString()}/month
            </div>
            <div className="text-sm text-blue-700">
              {selectedCredits} credit{selectedCredits !== 1 ? 's' : ''} × $99 each
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={onNext} 
            size="lg"
            className="px-8"
            disabled={selectedCredits === 0}
          >
            Continue to Payment Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Step 2: Payment Method Setup
function PaymentSetupStep({
  selectedCredits,
  onBack,
  onComplete
}: {
  selectedCredits: number
  onBack: () => void
  onComplete: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const monthlyAmount = selectedCredits * 99

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

      // Purchase initial credits
      const creditResponse = await fetch('/api/billing/subscription-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade',
          new_credit_amount: selectedCredits
        })
      })

      const creditResult = await creditResponse.json()
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Failed to setup subscription')
      }

      toast({
        title: 'Welcome to Flint! 🎉',
        description: `Successfully setup ${selectedCredits} credit${selectedCredits !== 1 ? 's' : ''} for $${monthlyAmount}/month`,
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Add Your Payment Method</CardTitle>
            <CardDescription>
              Complete setup for {selectedCredits} credit{selectedCredits !== 1 ? 's' : ''} at ${monthlyAmount}/month
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="max-w-md mx-auto">
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

          <div className="max-w-md mx-auto p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm font-medium text-green-800 mb-2">
                🚀 Your Subscription Setup
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <div>• {selectedCredits} hosting credit{selectedCredits !== 1 ? 's' : ''}</div>
                <div>• ${monthlyAmount}/month recurring</div>
                <div>• Cancel anytime, no commitment</div>
                <div>• Start publishing campaigns immediately</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              type="submit" 
              size="lg"
              className="px-8"
              disabled={!stripe || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up your subscription...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Setup - ${monthlyAmount}/month
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function InitialSetupInline({ onSuccess }: InitialSetupInlineProps) {
  const [step, setStep] = useState<'credits' | 'payment'>('credits')
  const [selectedCredits, setSelectedCredits] = useState(1)

  const handleSuccess = () => {
    onSuccess()
    // Reset for next time
    setStep('credits')
    setSelectedCredits(1)
  }

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  }

  return (
    <div className="max-w-2xl mx-auto">
      {step === 'credits' ? (
        <CreditSelectionStep
          selectedCredits={selectedCredits}
          onCreditsChange={setSelectedCredits}
          onNext={() => setStep('payment')}
        />
      ) : (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <PaymentSetupStep
            selectedCredits={selectedCredits}
            onBack={() => setStep('credits')}
            onComplete={handleSuccess}
          />
        </Elements>
      )}
    </div>
  )
} 