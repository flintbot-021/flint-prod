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
        subscription_status,
        stripe_customer_id
      `)
      .eq('id', user.id)
      .single()

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

    // Create simplified billing summary
    const billingSummary = {
      current_tier: currentTier,
      tier_name: tierConfig.name,
      monthly_price: tierConfig.price,
      max_campaigns: maxCampaigns,
      currently_published: currentlyPublished,
      subscription_status: profile.subscription_status || 'inactive',
      published_campaigns: (publishedCampaigns || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        slug: campaign.published_url?.split('/').pop() || '',
        published_at: campaign.published_at
      }))
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