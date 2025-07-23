import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Stripe Price IDs
const PRICE_IDS = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

// Tier configuration
const TIER_CONFIG = {
  standard: { max_campaigns: 3, price: 99 },
  premium: { max_campaigns: -1, price: 249 }, // -1 = unlimited
}

export async function POST(request: NextRequest) {
  try {
    console.log('Updating existing subscription...')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier } = body

    console.log('Requested tier:', tier)

    // Validate tier
    if (!['standard', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Check if we have the price ID for this tier
    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS]
    if (!priceId) {
      return NextResponse.json({ 
        error: `Price ID not configured for ${tier} tier` 
      }, { status: 500 })
    }

    // Get current profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_subscription_id, subscription_tier, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ 
        error: 'No active subscription found. Please use the upgrade flow instead.' 
      }, { status: 400 })
    }

    if (profile.subscription_tier === tier) {
      return NextResponse.json({ 
        error: `You are already on the ${tier} plan` 
      }, { status: 400 })
    }

    console.log('Updating subscription:', profile.stripe_subscription_id, 'to price:', priceId)

    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ 
        error: 'Subscription is not active' 
      }, { status: 400 })
    }

    // Determine if this is an upgrade or downgrade
    const currentTier = profile.subscription_tier as 'standard' | 'premium'
    const currentPrice = TIER_CONFIG[currentTier]?.price || 0
    const targetPrice = TIER_CONFIG[tier as keyof typeof TIER_CONFIG].price
    
    const isUpgrade = targetPrice > currentPrice
    const isDowngrade = targetPrice < currentPrice
    
    console.log(`Plan change: ${currentTier} (${currentPrice}) → ${tier} (${targetPrice})`, { isUpgrade, isDowngrade })

    // Handle upgrades vs downgrades differently
    const serviceSupabase = createServiceRoleClient()
    const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]
    
    if (isUpgrade) {
      // For upgrades: Update Stripe immediately and change tier right away
      const updatedSubscription = await stripe.subscriptions.update(
        profile.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
          cancel_at_period_end: false, // Clear any scheduled cancellation when upgrading
        }
      )

      console.log('Subscription upgraded successfully:', updatedSubscription.id)

      // Update profile immediately for upgrades
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          max_published_campaigns: tierConfig.max_campaigns,
          stripe_price_id: priceId,
          subscription_status: 'active',
          cancellation_scheduled_at: null, // Clear any previous cancellation when upgrading
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile for upgrade:', updateError)
        return NextResponse.json(
          { error: 'Failed to update subscription in database' }, 
          { status: 500 }
        )
      }

    } else if (isDowngrade) {
      // For downgrades: DON'T change Stripe or tier immediately
      // Schedule the tier change for the end of the billing period
      const subscriptionItem = subscription.items.data[0]
      const currentPeriodEnd = new Date(subscriptionItem.current_period_end * 1000)
      
      console.log('Scheduling downgrade for:', currentPeriodEnd.toISOString())

      // Update profile to schedule the downgrade (keep current tier for now)
      const { error: scheduleError } = await serviceSupabase
        .from('profiles')
        .update({
          scheduled_tier_change: tier,
          scheduled_change_date: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (scheduleError) {
        console.error('Error scheduling downgrade:', scheduleError)
        return NextResponse.json(
          { error: 'Failed to schedule downgrade' }, 
          { status: 500 }
        )
      }

      // Note: Stripe subscription is NOT updated now - it will be updated by a cron job
      // or webhook at the end of the billing period
    }

    console.log(`Successfully updated user ${user.id} to ${tier} tier`)

    // Create appropriate success message based on upgrade vs downgrade
    let successMessage: string
    let subscriptionId: string | null = null
    
    if (isUpgrade) {
      successMessage = `Successfully upgraded to ${tier} plan. Your existing payment method will be charged for the prorated amount.`
      subscriptionId = profile.stripe_subscription_id // Use the existing subscription ID
    } else if (isDowngrade) {
      successMessage = `Successfully scheduled downgrade to ${tier} plan. The change will take effect at the end of your current billing period.`
      subscriptionId = profile.stripe_subscription_id
    } else {
      successMessage = `Successfully updated to ${tier} plan.`
      subscriptionId = profile.stripe_subscription_id
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      subscription_id: subscriptionId,
      change_type: isUpgrade ? 'upgrade' : 'downgrade',
    })

  } catch (error) {
    console.error('Error updating subscription:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: errorMessage
      },
      { status: 500 }
    )
  }
} 