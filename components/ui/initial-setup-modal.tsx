'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, X, Lock, ArrowLeft } from 'lucide-react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface InitialSetupModalProps {
  isOpen: boolean
  onClose: () => void
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
    <>
      <CardHeader>
        <CardTitle>Choose Your Credits</CardTitle>
        <CardDescription>
          Each credit lets you host one campaign for $99/month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {creditOptions.map((credits) => (
            <button
              key={credits}
              onClick={() => onCreditsChange(credits)}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedCredits === credits
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">{credits}</div>
              <div className="text-xs text-gray-500">credit{credits !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${monthlyAmount.toLocaleString()}/month
          </div>
          <div className="text-sm text-gray-600">
            {selectedCredits} credit{selectedCredits !== 1 ? 's' : ''} × $99 each
          </div>
        </div>

        <Button onClick={onNext} className="w-full" disabled={selectedCredits === 0}>
          Continue to Payment
        </Button>
      </CardContent>
    </>
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
        title: 'Setup Complete!',
        description: `Successfully setup ${selectedCredits} credit${selectedCredits !== 1 ? 's' : ''} for $${monthlyAmount}/month`
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
    <>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Add Payment Method</CardTitle>
            <CardDescription>
              Setup billing for {selectedCredits} credit{selectedCredits !== 1 ? 's' : ''} at ${monthlyAmount}/month
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Secured by Stripe with bank-level encryption</span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Setup Summary:</strong>
            </div>
            <div className="text-sm text-blue-700 mt-1">
              • {selectedCredits} hosting credit{selectedCredits !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-blue-700">
              • ${monthlyAmount}/month recurring
            </div>
            <div className="text-sm text-blue-700">
              • Cancel anytime
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
                Setting up subscription...
              </>
            ) : (
              `Setup Subscription - $${monthlyAmount}/month`
            )}
          </Button>
        </form>
      </CardContent>
    </>
  )
}

export function InitialSetupModal({ isOpen, onClose, onSuccess }: InitialSetupModalProps) {
  const [step, setStep] = useState<'credits' | 'payment'>('credits')
  const [selectedCredits, setSelectedCredits] = useState(1)

  const handleSuccess = () => {
    onSuccess()
    onClose()
    // Reset for next time
    setStep('credits')
    setSelectedCredits(1)
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
          </Card>
        </div>
      </div>
    </div>
  )
} 