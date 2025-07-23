import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Stripe Price IDs (you'll need to create these in your Stripe dashboard)
const PRICE_IDS = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard_99', // $99/month
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_249', // $249/month
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, mode = 'subscription' } = body

    // Validate tier
    if (!['standard', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Determine if this is an upgrade/downgrade or new subscription
    const currentTier = profile.subscription_tier || 'free'
    const isUpgrade = currentTier === 'free' || (currentTier === 'standard' && tier === 'premium')
    const isDowngrade = currentTier === 'premium' && tier === 'standard'

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[tier as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
        previous_tier: currentTier,
        upgrade: isUpgrade.toString(),
        downgrade: isDowngrade.toString(),
      },
      // For subscription changes, handle proration
      ...(profile.stripe_subscription_id && {
        subscription_data: {
          metadata: {
            user_id: user.id,
            tier,
          },
        },
      }),
      // Allow promotional codes
      allow_promotion_codes: true,
      // Collect billing address for tax calculations
      billing_address_collection: 'auto',
    })

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 