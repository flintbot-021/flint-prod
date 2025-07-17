import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Client-side Stripe instance
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing Stripe publishable key')
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}

// Stripe configuration
export const stripeConfig = {
  plans: {
    starter: {
      name: 'Starter',
      description: 'Perfect for getting started',
      price: 29, // $29/month
      features: [
        'Unlimited campaigns',
        'Up to 1,000 leads/month',
        'Basic analytics',
        'Email support'
      ],
      limits: {
        campaigns: -1, // Unlimited
        leads: 1000
      }
    },
    pro: {
      name: 'Pro',
      description: 'For growing businesses',
      price: 79, // $79/month
      features: [
        'Unlimited campaigns',
        'Up to 10,000 leads/month',
        'Advanced analytics',
        'Priority support',
        'Custom branding'
      ],
      limits: {
        campaigns: -1, // Unlimited
        leads: 10000
      }
    }
  },
  // You'll need to create these price IDs in your Stripe dashboard
  priceIds: {
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!
  }
}

export type StripePlan = keyof typeof stripeConfig.plans 