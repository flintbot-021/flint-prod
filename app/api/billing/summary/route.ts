import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Tier configuration
const TIER_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    max_campaigns: 0,
    features: ['Create campaigns', 'Preview campaigns'],
  },
  standard: {
    name: 'Standard',
    price: 99,
    max_campaigns: 3,
    features: ['Everything in Free', 'Publish up to 3 campaigns', 'Basic analytics', 'Email support'],
  },
  premium: {
    name: 'Premium', 
    price: 249,
    max_campaigns: -1, // -1 means unlimited
    features: ['Everything in Standard', 'Unlimited published campaigns', 'Advanced analytics', 'Priority support', 'Custom branding'],
  },
} as const

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        subscription_tier,
        max_published_campaigns,
        stripe_subscription_id,
        stripe_price_id,
        subscription_status,
        current_period_start,
        current_period_end,
        cancellation_scheduled_at,
        scheduled_tier_change,
        scheduled_change_date,
        stripe_customer_id
      `)
      .eq('id', user.id)
      .single()

    console.log('Profile data from database:', {
      subscription_tier: profile?.subscription_tier,
      scheduled_tier_change: profile?.scheduled_tier_change,
      scheduled_change_date: profile?.scheduled_change_date
    })

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get published campaigns count
    const { count: publishedCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'published')

    // Get published campaigns details
    const { data: publishedCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, published_url, published_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    const currentTier = profile.subscription_tier || 'free'
    const tierConfig = TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG]
    
    // Calculate available slots
    const maxCampaigns = tierConfig.max_campaigns
    const currentlyPublished = publishedCount || 0
    const availableSlots = maxCampaigns === -1 ? 'unlimited' : Math.max(0, maxCampaigns - currentlyPublished)

    // Get payment method info if user has active subscription
    let paymentMethod = null
    if (profile.stripe_subscription_id && profile.subscription_status === 'active') {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
        if (subscription.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(subscription.default_payment_method as string)
          if (pm.card) {
            paymentMethod = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year
            }
          }
        }
      } catch (error) {
        console.error('Error fetching payment method:', error)
        // Continue without payment method info
      }
    }

    // Create billing summary
    const billingSummary = {
      // Current subscription info
      current_tier: currentTier,
      tier_name: tierConfig.name,
      monthly_price: tierConfig.price,
      max_campaigns: maxCampaigns,
      tier_features: tierConfig.features,
      
      // Usage info
      currently_published: currentlyPublished,
      available_slots: availableSlots,
      published_campaigns: publishedCampaigns || [],
      
      // Billing info
      subscription_status: profile.subscription_status || 'inactive',
      current_period_start: profile.current_period_start,
      current_period_end: profile.current_period_end,
      cancellation_scheduled: !!profile.cancellation_scheduled_at,
      scheduled_tier_change: profile.scheduled_tier_change,
      scheduled_change_date: profile.scheduled_change_date,
      
      // Stripe info
      stripe_subscription_id: profile.stripe_subscription_id,
      has_stripe_customer: !!profile.stripe_customer_id,
      payment_method: paymentMethod,
      
      // Available upgrade options
      available_tiers: {
        standard: currentTier !== 'standard' ? TIER_CONFIG.standard : null,
        premium: currentTier !== 'premium' ? TIER_CONFIG.premium : null,
      },
      
      // Downgrade info (can only downgrade from premium to standard)
      can_downgrade: currentTier === 'premium',
      downgrade_option: currentTier === 'premium' ? TIER_CONFIG.standard : null,
    }

    return NextResponse.json({
      success: true,
      data: billingSummary
    })

  } catch (error) {
    console.error('Error fetching billing summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing summary' },
      { status: 500 }
    )
  }
} 