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
  // Add the actual price IDs we're seeing in production
  'price_1Ro4sOAlYdaH8MM442131hd5': 'standard',
  'price_1RoMtmAlYdaH8MM4ZwjAteCz': 'premium',
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
    console.log('Event data keys:', Object.keys(event.data.object))
    
    // Log all webhook events to help debug
    if (event.type.includes('subscription')) {
      console.log('Subscription event details:', {
        type: event.type,
        id: event.data.object.id,
        customer: event.data.object.customer,
        status: event.data.object.status,
        cancel_at: event.data.object.cancel_at,
        schedule: event.data.object.schedule
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
        
      case 'subscription_schedule.updated':
      case 'subscription_schedule.created':
      case 'subscription_schedule.canceled':
        await handleSubscriptionScheduleUpdated(event.data.object as Stripe.SubscriptionSchedule)
        break
        
      case 'invoice.upcoming':
        // This might indicate a subscription change is coming
        console.log('Upcoming invoice event - might indicate subscription change')
        break
        
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        console.log(`Subscription ${event.type} event received`)
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
        // Log the full event for debugging
        console.log('Full event object:', JSON.stringify(event, null, 2))
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
    customer: subscription.customer,
    status: subscription.status,
    cancel_at: subscription.cancel_at,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at,
    schedule: subscription.schedule,
    current_period_end: subscription.current_period_end,
    items: subscription.items.data.map(item => ({
      price_id: item.price.id,
      product: item.price.product
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
    
    // Check for scheduled changes (cancellation or downgrades)
    let scheduledTierChange = null
    let scheduledChangeDate = null
    
    console.log('CHECKING FOR SCHEDULED CHANGES:', {
      cancel_at: subscription.cancel_at,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      schedule: subscription.schedule
    })
    
    if (subscription.cancel_at) {
      // Subscription is scheduled for cancellation
      scheduledTierChange = 'free'
      scheduledChangeDate = new Date(subscription.cancel_at * 1000).toISOString()
      console.log(`DETECTED SCHEDULED CANCELLATION: ${scheduledChangeDate}`)
    } else if (subscription.schedule) {
      // Fetch the subscription schedule to see what's planned
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string)
        console.log('Retrieved subscription schedule:', schedule.id)
        
        // Look for future phases that indicate a plan change
        const currentPhase = schedule.phases.find(phase => 
          phase.start_date <= Math.floor(Date.now() / 1000) && 
          (!phase.end_date || phase.end_date > Math.floor(Date.now() / 1000))
        )
        
        const nextPhase = schedule.phases.find(phase => 
          phase.start_date > Math.floor(Date.now() / 1000)
        )
        
        if (nextPhase && nextPhase.items && nextPhase.items.length > 0) {
          const nextPriceId = nextPhase.items[0].price
          const nextTier = TIER_FROM_PRICE_ID[nextPriceId]
          
          console.log('Subscription schedule - Next phase details:', {
            priceId: nextPriceId,
            startDate: nextPhase.start_date,
            mappedTier: nextTier
          })
          
          if (nextTier) {
            scheduledTierChange = nextTier
            scheduledChangeDate = new Date(nextPhase.start_date * 1000).toISOString()
            console.log(`Subscription scheduled to change to ${scheduledTierChange} on ${scheduledChangeDate}`)
          } else {
            console.error('Could not map subscription price ID to tier:', nextPriceId)
            console.log('Available mappings:', TIER_FROM_PRICE_ID)
          }
        } else if (schedule.end_behavior === 'cancel') {
          // Schedule ends with cancellation
          const lastPhase = schedule.phases[schedule.phases.length - 1]
          if (lastPhase.end_date) {
            scheduledTierChange = 'free'
            scheduledChangeDate = new Date(lastPhase.end_date * 1000).toISOString()
            console.log(`Subscription scheduled for cancellation via schedule on ${scheduledChangeDate}`)
          }
        }
      } catch (error) {
        console.error('Error fetching subscription schedule:', error)
      }
    }
    
    // Update subscription info
    const updateData: any = {
      subscription_tier: tier,
      max_published_campaigns: tierConfig.max_campaigns,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
      updated_at: new Date().toISOString(),
    }
    
    // Add scheduled change info if present
    if (scheduledTierChange) {
      updateData.scheduled_tier_change = scheduledTierChange
      updateData.scheduled_change_date = scheduledChangeDate
      console.log('SETTING SCHEDULED CHANGE:', { scheduledTierChange, scheduledChangeDate })
    } else {
      // Clear any existing scheduled changes if subscription is no longer scheduled for changes
      updateData.scheduled_tier_change = null
      updateData.scheduled_change_date = null
      console.log('CLEARING SCHEDULED CHANGE - no future changes detected')
    }

    console.log('FULL UPDATE DATA:', updateData)

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      console.error('ERROR UPDATING SUBSCRIPTION:', error)
      return
    }

    console.log(`Successfully updated subscription for user ${profile.id}`)
    
    // Verify the update worked
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('scheduled_tier_change, scheduled_change_date, updated_at')
      .eq('id', profile.id)
      .single()
    
    console.log('VERIFICATION - Profile after update:', updatedProfile)
    
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
  console.log('Processing subscription schedule update:', schedule.id)
  
  const customerId = schedule.customer as string
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

    // Analyze the schedule to determine what's planned
    let scheduledTierChange = null
    let scheduledChangeDate = null
    
    // Look for future phases that indicate a plan change
    const nextPhase = schedule.phases.find(phase => 
      phase.start_date > Math.floor(Date.now() / 1000)
    )
    
    if (nextPhase && nextPhase.items && nextPhase.items.length > 0) {
      const nextPriceId = nextPhase.items[0].price
      const nextTier = TIER_FROM_PRICE_ID[nextPriceId]
      
      console.log('Next phase details:', {
        priceId: nextPriceId,
        startDate: nextPhase.start_date,
        endDate: nextPhase.end_date,
        mappedTier: nextTier
      })
      
      if (nextTier) {
        scheduledTierChange = nextTier
        scheduledChangeDate = new Date(nextPhase.start_date * 1000).toISOString()
        console.log(`Schedule indicates change to ${scheduledTierChange} on ${scheduledChangeDate}`)
      } else {
        console.error('Could not map price ID to tier:', nextPriceId)
        console.log('Available mappings:', TIER_FROM_PRICE_ID)
      }
    } else if (schedule.end_behavior === 'cancel') {
      // Schedule ends with cancellation
      const lastPhase = schedule.phases[schedule.phases.length - 1]
      if (lastPhase.end_date) {
        scheduledTierChange = 'free'
        scheduledChangeDate = new Date(lastPhase.end_date * 1000).toISOString()
        console.log(`Schedule indicates cancellation on ${scheduledChangeDate}`)
      }
    }
    
    // Update the profile with scheduled change info
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (scheduledTierChange && scheduledChangeDate) {
      updateData.scheduled_tier_change = scheduledTierChange
      updateData.scheduled_change_date = scheduledChangeDate
      console.log('SCHEDULE HANDLER - SETTING SCHEDULED CHANGE:', { scheduledTierChange, scheduledChangeDate })
    } else {
      // Clear scheduled changes if no future changes are planned
      updateData.scheduled_tier_change = null
      updateData.scheduled_change_date = null
      console.log('SCHEDULE HANDLER - CLEARING SCHEDULED CHANGE')
    }

    console.log('SCHEDULE HANDLER - FULL UPDATE DATA:', updateData)

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      console.error('SCHEDULE HANDLER - ERROR UPDATING:', error)
      return
    }

    console.log(`SCHEDULE HANDLER - Successfully updated scheduled changes for user ${profile.id}`)
    
    // Verify the update worked
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('scheduled_tier_change, scheduled_change_date, updated_at')
      .eq('id', profile.id)
      .single()
    
    console.log('SCHEDULE HANDLER - VERIFICATION:', updatedProfile)
    
  } catch (error) {
    console.error('Error in handleSubscriptionScheduleUpdated:', error)
  }
}