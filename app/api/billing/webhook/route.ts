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
  
  if (!customerId || !tier || !['standard', 'premium'].includes(tier)) {
    console.error('Invalid checkout session data:', { customerId, tier })
    return
  }

  const supabase = createServiceRoleClient()
  
  try {
    // Find user profile
    let profile = null
    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      profile = data
    }
    
    if (!profile) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      profile = data
    }

    if (!profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Get subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      console.error('No active subscription found')
      return
    }

    const subscription = subscriptions.data[0]
    const tierConfig = TIER_CONFIG[tier]
    
    // Update profile with new subscription info
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        max_published_campaigns: tierConfig.max_campaigns,
        stripe_subscription_id: subscription.id,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    console.log(`Successfully processed checkout for user ${profile.id}, tier: ${tier}`)
    
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    throw error
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
        subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
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

    // Reset to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        max_published_campaigns: 0,
        stripe_subscription_id: null,
        subscription_status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error resetting to free tier:', error)
      return
    }

    // Unpublish excess campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (campaigns && campaigns.length > 0) {
      // Unpublish all campaigns since free tier allows 0 published campaigns
      await supabase
        .from('campaigns')
        .update({ status: 'draft' })
        .eq('user_id', profile.id)
        .eq('status', 'published')
    }

    console.log(`Successfully processed subscription deletion for user ${profile.id}`)
    
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}