'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CreditCard, Check, X, AlertCircle } from 'lucide-react'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PaymentMethodInfo {
  has_payment_method: boolean
  card?: {
    brand: string
    last4: string
  }
}

function PaymentSetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create setup intent
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const { client_secret, error: setupError } = await response.json()

      if (setupError) {
        throw new Error(setupError)
      }

      // Confirm setup intent with card
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (setupIntent && setupIntent.payment_method) {
        // Save payment method info to database
        const saveResponse = await fetch('/api/stripe/payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method_id: setupIntent.payment_method.id,
          }),
        })

        if (!saveResponse.ok) {
          throw new Error('Failed to save payment method')
        }

        toast({
          title: 'Payment method added',
          description: 'Your payment method has been successfully saved.',
        })

        onSuccess()
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      toast({
        title: 'Payment setup failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#374151',
                '::placeholder': {
                  color: '#9CA3AF',
                },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Add Payment Method
          </>
        )}
      </Button>
    </form>
  )
}

function ExistingPaymentMethod({ paymentMethod }: { paymentMethod: PaymentMethodInfo }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-green-50">
        <div className="flex-shrink-0">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {paymentMethod.card?.brand?.toUpperCase()} •••• {paymentMethod.card?.last4}
            </span>
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Your payment method is set up and ready to use.
          </p>
        </div>
      </div>
    </div>
  )
}

export function PaymentSetupModal({ isOpen, onClose, onSuccess }: PaymentSetupModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethod()
    }
  }, [isOpen])

  const fetchPaymentMethod = async () => {
    try {
      const response = await fetch('/api/stripe/payment-method')
      const data = await response.json()
      setPaymentMethod(data)
    } catch (error) {
      console.error('Error fetching payment method:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set up payment method</DialogTitle>
          <DialogDescription>
            Add a payment method to publish your campaign and start collecting leads.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : paymentMethod?.has_payment_method ? (
            <ExistingPaymentMethod paymentMethod={paymentMethod} />
          ) : (
            <Elements stripe={stripePromise}>
              <PaymentSetupForm onSuccess={handleSuccess} />
            </Elements>
          )}
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 