import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'
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
  console.log('Session metadata:', session.metadata)
  console.log('Session mode:', session.mode)
  console.log('Session customer:', session.customer)
  
  const customerId = session.customer as string
  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier || session.metadata?.target_tier as 'standard' | 'premium'
  const upgradeType = session.metadata?.upgrade_type
  
  if (!userId || !tier) {
    console.error('Missing required metadata in checkout session:', { userId, tier, upgradeType, metadata: session.metadata })
    return
  }

  if (!customerId) {
    console.error('Missing customer ID in checkout session')
    return
  }

  const supabase = createServiceRoleClient()
  
  try {
    if (upgradeType === 'proration') {
      // Handle upgrade checkout - need to update existing subscription
      console.log('Processing upgrade checkout for user:', userId, 'to tier:', tier)
      
      // Get current profile to find existing subscription
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single()
        
      if (profileError || !profile?.stripe_subscription_id) {
        console.error('Could not find existing subscription for upgrade:', profileError)
        return
      }
      
      // Update the Stripe subscription to new tier
      const priceId = tier === 'standard' ? process.env.STRIPE_STANDARD_PRICE_ID : process.env.STRIPE_PREMIUM_PRICE_ID
      const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{
          id: (await stripe.subscriptions.retrieve(profile.stripe_subscription_id)).items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'none', // We already charged for proration
      })
      
      console.log('Updated subscription for upgrade:', subscription.id)
    }
    
    // Get subscription details if this is a subscription checkout
    let subscriptionId = null
    if (session.mode === 'subscription' && session.subscription) {
      subscriptionId = session.subscription as string
      console.log('Subscription ID from session:', subscriptionId)
    } else if (upgradeType === 'proration') {
      // For upgrade checkouts, keep the existing subscription ID
      const { data: profile } = await supabase
        .from('profiles')  
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single()
      subscriptionId = profile?.stripe_subscription_id
    }

    // Update user's subscription tier
    const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
    
    const updateData = {
      subscription_tier: tier,
      max_published_campaigns: tierConfig.max_campaigns,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
      ...(subscriptionId && { stripe_subscription_id: subscriptionId })
    }

    console.log('Updating user with data:', updateData)
    
    const { error, data } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error updating user subscription:', error)
      throw error
    }

    console.log(`Successfully updated user ${userId} to ${tier} tier:`, data)
    
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    throw error // Re-throw to ensure webhook fails if there's an issue
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id)
  
  const customerId = subscription.customer as string
  const supabase = createServiceRoleClient()
  
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
  const supabase = createServiceRoleClient()
  
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
  const supabase = createServiceRoleClient()
  
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
  const supabase = createServiceRoleClient()
  
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