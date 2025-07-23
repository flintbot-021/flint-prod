import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Stripe Price IDs
const PRICE_IDS = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, prorationAmount } = body

    console.log('Creating upgrade checkout for:', { tier, prorationAmount })

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

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Determine the success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard/account?upgrade=success&tier=${tier}`
    const cancelUrl = `${baseUrl}/dashboard/account?upgrade=cancelled`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: profile.stripe_customer_id || undefined,
      customer_email: !profile.stripe_customer_id ? profile.email : undefined,
      mode: 'payment', // One-time payment for proration
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              description: `Prorated upgrade charge for remaining billing period`,
            },
            unit_amount: Math.round(prorationAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        target_tier: tier,
        upgrade_type: 'proration',
        original_tier: profile.subscription_tier || 'free',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    console.log('Checkout session created:', session.id)

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Error creating upgrade checkout session:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 