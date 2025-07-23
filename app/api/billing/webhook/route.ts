import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Tier mapping from Stripe price IDs
const TIER_FROM_PRICE_ID: Record<string, 'standard' | 'premium'> = {
  [process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard_99']: 'standard',
  [process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_249']: 'premium',
}

const TIER_CONFIG = {
  free: { max_campaigns: 0, price: 0 },
  standard: { max_campaigns: 3, price: 99 },
  premium: { max_campaigns: -1, price: 249 }, // -1 = unlimited
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required')
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Process the webhook event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completion:', session.id)
  
  const customerId = session.customer as string
  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier as 'standard' | 'premium'
  
  if (!userId || !tier) {
    console.error('Missing required metadata in checkout session')
    return
  }

  const supabase = await createClient()
  
  try {
    // Update user's subscription tier
    const tierConfig = TIER_CONFIG[tier]
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        max_published_campaigns: tierConfig.max_campaigns,
        subscription_status: 'active',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user subscription:', error)
      return
    }

    console.log(`Successfully updated user ${userId} to ${tier} tier`)
    
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id)
  
  const customerId = subscription.customer as string
  const supabase = await createClient()
  
  try {
    // Get user by Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Determine tier from subscription
    const priceId = subscription.items.data[0]?.price.id
    const tier = priceId ? TIER_FROM_PRICE_ID[priceId] : null
    
    if (!tier) {
      console.error('Could not determine tier from price ID:', priceId)
      return
    }

    const tierConfig = TIER_CONFIG[tier]
    
    // Update subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        max_published_campaigns: tierConfig.max_campaigns,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancellation_scheduled_at: subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000).toISOString() 
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating subscription:', error)
      return
    }

    console.log(`Successfully updated subscription for user ${profile.id}`)
    
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id)
  
  const customerId = subscription.customer as string
  const supabase = await createClient()
  
  try {
    // Get user by Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Downgrade to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        max_published_campaigns: 0,
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancellation_scheduled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error downgrading to free tier:', error)
      return
    }

    // Unpublish excess campaigns (free tier allows 0 published campaigns)
    const { error: unpublishError } = await supabase
      .from('campaigns')
      .update({ status: 'draft' })
      .eq('user_id', profile.id)
      .eq('status', 'published')

    if (unpublishError) {
      console.error('Error unpublishing campaigns:', unpublishError)
    }

    console.log(`Successfully downgraded user ${profile.id} to free tier`)
    
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing successful payment:', invoice.id)
  
  // This is mainly for logging/analytics purposes
  // The subscription update webhook handles the actual subscription changes
  
  const customerId = invoice.customer as string
  const supabase = await createClient()
  
  try {
    // Get user by Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Could add billing history logging here
    console.log(`Payment succeeded for user ${profile.id}, amount: ${invoice.amount_paid}`)
    
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing failed payment:', invoice.id)
  
  const customerId = invoice.customer as string
  const supabase = await createClient()
  
  try {
    // Get user by Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Update subscription status to indicate payment issues
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating subscription status:', error)
    }

    console.log(`Payment failed for user ${profile.id}`)
    
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error)
  }
} 