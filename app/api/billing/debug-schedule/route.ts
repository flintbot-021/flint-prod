import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    console.log('=== DEBUGGING SUBSCRIPTION SCHEDULE ===')
    console.log('User ID:', user.id)
    console.log('Customer ID:', profile.stripe_customer_id)
    console.log('Subscription ID:', profile.stripe_subscription_id)

    // Fetch current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    
    console.log('Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at: subscription.cancel_at,
      schedule: subscription.schedule
    })

    let scheduleDetails = null
    let scheduledTierChange = null
    let scheduledChangeDate = null

    // If there's a schedule, fetch it and analyze
    if (subscription.schedule) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string)
        
        console.log('Schedule status:', schedule.status)
        console.log('Schedule phases:', schedule.phases.length)
        
        // Look for future phases
        const currentTime = Math.floor(Date.now() / 1000)
        console.log('Current timestamp:', currentTime)
        
        const nextPhase = schedule.phases.find(phase => 
          phase.start_date > currentTime
        )
        
        console.log('Next phase found:', !!nextPhase)
        
        if (nextPhase) {
          console.log('Next phase details:', {
            start_date: nextPhase.start_date,
            end_date: nextPhase.end_date,
            items: nextPhase.items?.map(item => ({
              price: item.price,
              quantity: item.quantity
            }))
          })
          
          if (nextPhase.items && nextPhase.items.length > 0) {
            const nextPriceId = nextPhase.items[0].price
            const nextTier = TIER_FROM_PRICE_ID[nextPriceId]
            
            console.log('Price ID mapping:', {
              priceId: nextPriceId,
              mappedTier: nextTier,
              allMappings: TIER_FROM_PRICE_ID
            })
            
            if (nextTier) {
              scheduledTierChange = nextTier
              scheduledChangeDate = new Date(nextPhase.start_date * 1000).toISOString()
              console.log('FOUND SCHEDULED CHANGE:', { scheduledTierChange, scheduledChangeDate })
            }
          }
        }
        
        scheduleDetails = {
          id: schedule.id,
          status: schedule.status,
          end_behavior: schedule.end_behavior,
          phases: schedule.phases.map(phase => ({
            start_date: phase.start_date,
            end_date: phase.end_date,
            items: phase.items?.map(item => ({
              price: item.price,
              quantity: item.quantity
            }))
          }))
        }
      } catch (error) {
        console.error('Error fetching schedule:', error)
      }
    }

    // Now try to update the database like the webhook would
    if (scheduledTierChange && scheduledChangeDate) {
      console.log('=== ATTEMPTING DATABASE UPDATE ===')
      
      const serviceSupabase = createServiceRoleClient()
      
      const updateData = {
        scheduled_tier_change: scheduledTierChange,
        scheduled_change_date: scheduledChangeDate,
        updated_at: new Date().toISOString(),
      }
      
      console.log('Update data:', updateData)
      
      const { error, data } = await serviceSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
      
      if (error) {
        console.error('Database update error:', error)
        return NextResponse.json({ error: 'Database update failed', details: error }, { status: 500 })
      }
      
      console.log('Database update successful:', data)
      
      // Verify the update
      const { data: verification } = await serviceSupabase
        .from('profiles')
        .select('scheduled_tier_change, scheduled_change_date, updated_at')
        .eq('id', user.id)
        .single()
      
      console.log('Verification query result:', verification)
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at: subscription.cancel_at,
        schedule: subscription.schedule
      },
      schedule: scheduleDetails,
      scheduledChange: {
        tier: scheduledTierChange,
        date: scheduledChangeDate
      },
      debug: {
        currentTime: Math.floor(Date.now() / 1000),
        priceIdMappings: TIER_FROM_PRICE_ID
      }
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
