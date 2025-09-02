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
    
    // Add extra logging for subscription schedule events
    if (event.type.includes('subscription_schedule')) {
      console.log('🔥 SUBSCRIPTION SCHEDULE EVENT DETECTED:', {
        type: event.type,
        schedule_id: event.data.object.id,
        subscription_id: (event.data.object as any).subscription
      })
    }

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
        
      case 'subscription_schedule.created':
      case 'subscription_schedule.updated':
        await handleSubscriptionScheduleUpdated(event.data.object as Stripe.SubscriptionSchedule)
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
  console.log('Subscription details:', {
    id: subscription.id,
    status: subscription.status,
    cancel_at: subscription.cancel_at,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: (subscription as any).current_period_end,
    items: subscription.items.data.map(item => ({
      price_id: item.price.id,
      quantity: item.quantity
    }))
  })
  
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
    
    // Check for scheduled changes
    let scheduledTierChange = null
    let scheduledChangeDate = null
    
    console.log('Checking for scheduled changes:', {
      cancel_at: subscription.cancel_at,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: (subscription as any).current_period_end,
      schedule: (subscription as any).schedule
    })
    
    // If subscription is scheduled for cancellation
    if (subscription.cancel_at) {
      scheduledTierChange = 'free'
      scheduledChangeDate = new Date(subscription.cancel_at * 1000).toISOString()
      console.log('✅ Detected scheduled cancellation:', scheduledChangeDate)
    }
    // If subscription has a scheduled plan change (cancel_at_period_end or pending updates)
    else if (subscription.cancel_at_period_end) {
      scheduledTierChange = 'free'
      scheduledChangeDate = new Date((subscription as any).current_period_end * 1000).toISOString()
      console.log('✅ Detected scheduled cancellation at period end:', scheduledChangeDate)
    }
    // Check for subscription schedule (used by Customer Portal for plan changes)
    else if ((subscription as any).schedule) {
      console.log('🔍 Subscription has a schedule, fetching schedule details...')
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve((subscription as any).schedule)
        console.log('Schedule details:', {
          id: schedule.id,
          status: schedule.status,
          phases: schedule.phases.map(phase => ({
            start_date: phase.start_date,
            end_date: phase.end_date,
            items: phase.items?.map(item => ({ price: item.price }))
          }))
        })
        
        // Look for future phases that indicate a change
        const currentTime = Math.floor(Date.now() / 1000)
        const futurePhases = schedule.phases.filter(phase => phase.start_date > currentTime)
        
        if (futurePhases.length > 0) {
          const nextPhase = futurePhases[0]
          scheduledChangeDate = new Date(nextPhase.start_date * 1000).toISOString()
          
          // Check if the next phase is a cancellation (no items) or a tier change
          if (!nextPhase.items || nextPhase.items.length === 0) {
            scheduledTierChange = 'free'
            console.log('✅ Detected scheduled cancellation via schedule:', scheduledChangeDate)
          } else {
            // Check if it's a different tier
            const nextPriceId = nextPhase.items[0]?.price
            const nextTier = typeof nextPriceId === 'string' ? TIER_FROM_PRICE_ID[nextPriceId] : null
            if (nextTier && nextTier !== tier) {
              scheduledTierChange = nextTier
              console.log('✅ Detected scheduled tier change via schedule:', { from: tier, to: nextTier, date: scheduledChangeDate })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching subscription schedule:', error)
      }
    }
    else {
      console.log('❌ No scheduled changes detected')
    }
    
    // Update subscription info
    const updateData: any = {
      subscription_tier: tier,
      max_published_campaigns: tierConfig.max_campaigns,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
      scheduled_tier_change: scheduledTierChange,
      scheduled_change_date: scheduledChangeDate,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating subscription:', error)
      return
    }

    console.log(`Successfully updated subscription for user ${profile.id}`, {
      tier,
      scheduledTierChange,
      scheduledChangeDate,
      updateData
    })
    
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

async function handleSubscriptionScheduleUpdated(schedule: Stripe.SubscriptionSchedule) {
  console.log('🚀 ENTERING handleSubscriptionScheduleUpdated:', schedule.id)
  console.log('Schedule details:', {
    id: schedule.id,
    status: schedule.status,
    subscription: schedule.subscription,
    phases: schedule.phases.map(phase => ({
      start_date: phase.start_date,
      end_date: phase.end_date,
      items: phase.items?.map(item => ({ price: item.price }))
    }))
  })
  
  const subscriptionId = schedule.subscription as string
  const supabase = createServiceRoleClient()
  
  try {
    // Get the subscription to find the customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customerId = subscription.customer as string
    
    // Get user by Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_tier')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for customer:', customerId)
      return
    }

    // Determine current tier from current subscription
    const currentPriceId = subscription.items.data[0]?.price.id
    const currentTier = currentPriceId ? TIER_FROM_PRICE_ID[currentPriceId] : null
    
    if (!currentTier) {
      console.error('Could not determine current tier from price ID:', currentPriceId)
      return
    }

    // Look for future phases that indicate a change
    const currentTime = Math.floor(Date.now() / 1000)
    const futurePhases = schedule.phases.filter(phase => phase.start_date > currentTime)
    
    let scheduledTierChange = null
    let scheduledChangeDate = null
    
    if (futurePhases.length > 0) {
      const nextPhase = futurePhases[0]
      scheduledChangeDate = new Date(nextPhase.start_date * 1000).toISOString()
      
      // Check if the next phase is a cancellation (no items) or a tier change
      if (!nextPhase.items || nextPhase.items.length === 0) {
        scheduledTierChange = 'free'
        console.log('✅ Detected scheduled cancellation via schedule:', scheduledChangeDate)
      } else {
        // Check if it's a different tier
        const nextPriceId = nextPhase.items[0]?.price
        const nextTier = typeof nextPriceId === 'string' ? TIER_FROM_PRICE_ID[nextPriceId] : null
        if (nextTier && nextTier !== currentTier) {
          scheduledTierChange = nextTier
          console.log('✅ Detected scheduled tier change via schedule:', { 
            from: currentTier, 
            to: nextTier, 
            date: scheduledChangeDate 
          })
        }
      }
    } else {
      // No future phases - clear any scheduled changes
      console.log('❌ No future phases - clearing scheduled changes')
    }
    
    // Update the scheduled change info (but keep current tier unchanged)
    const updateData = {
      scheduled_tier_change: scheduledTierChange,
      scheduled_change_date: scheduledChangeDate,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating scheduled changes:', error)
      return
    }

    console.log(`Successfully updated scheduled changes for user ${profile.id}`, updateData)
    
  } catch (error) {
    console.error('Error in handleSubscriptionScheduleUpdated:', error)
  }
}