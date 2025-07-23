import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    if (profile.subscription_tier === 'free') {
      return NextResponse.json({ error: 'No subscription to cancel' }, { status: 400 })
    }

    // Get subscription details to determine period end
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    
    // Get period end from subscription items (not from subscription directly)
    const subscriptionItems = (subscription as any).items?.data
    if (!subscriptionItems || subscriptionItems.length === 0) {
      return NextResponse.json({ 
        error: 'No subscription items found' 
      }, { status: 500 })
    }
    
    const subscriptionItem = subscriptionItems[0]
    const periodEndTimestamp = subscriptionItem.current_period_end
    
    if (!periodEndTimestamp) {
      return NextResponse.json({ 
        error: 'Invalid billing period data from Stripe' 
      }, { status: 500 })
    }
    
    const periodEnd = new Date(periodEndTimestamp * 1000)
    
    // Validate the date
    if (isNaN(periodEnd.getTime())) {
      console.error('Invalid period end timestamp:', periodEndTimestamp)
      return NextResponse.json({ 
        error: 'Invalid billing period date from Stripe' 
      }, { status: 500 })
    }

    console.log('Period end date:', periodEnd.toISOString())

    // Cancel the subscription at period end
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Schedule tier change to free at period end (consistent with other downgrades)
    const serviceSupabase = createServiceRoleClient()
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({
        scheduled_tier_change: 'free',
        scheduled_change_date: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error scheduling tier change:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule downgrade' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Downgrade to Free scheduled for ${periodEnd.toLocaleDateString()}. You'll retain access until then.`,
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
} 