import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any, // Use a stable API version
})

// Stripe Price IDs (you'll need to create these in your Stripe dashboard)
const PRICE_IDS = {
  standard: process.env.STRIPE_STANDARD_PRICE_ID || 'price_1234567890', // Replace with actual price ID
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_0987654321', // Replace with actual price ID
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating checkout session...')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const body = await request.json()
    const { tier } = body

    console.log('Requested tier:', tier)

    // Validate tier
    if (!['standard', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Check if we have the price ID for this tier
    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS]
    console.log('Price ID for tier:', priceId)

    if (!priceId || priceId.startsWith('price_123') || priceId.startsWith('price_098')) {
      console.error('Invalid price ID for tier:', tier, priceId)
      return NextResponse.json({ 
        error: `Price ID not configured for ${tier} tier. Please check your environment variables.` 
      }, { status: 500 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('Profile found:', { id: profile.id, email: profile.email, current_tier: profile.subscription_tier })

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      console.log('Creating new Stripe customer...')
      try {
        const customer = await stripe.customers.create({
          email: profile.email || user.email,
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

        console.log('Created Stripe customer:', customerId)
      } catch (customerError) {
        console.error('Error creating Stripe customer:', customerError)
        return NextResponse.json({ 
          error: 'Failed to create customer' 
        }, { status: 500 })
      }
    }

    // Get base URL - handle localhost vs production properly
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (!baseUrl) {
      const host = request.headers.get('host')
      if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
        baseUrl = `http://${host}` // Use HTTP for localhost
      } else {
        baseUrl = `https://${host}` // Use HTTPS for production domains
      }
    }
    
    console.log('Base URL:', baseUrl)

    // Create checkout session
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/dashboard/account?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
        previous_tier: profile.subscription_tier || 'free',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    } as any

    console.log('Creating Stripe checkout session with config:', {
      customer: customerId,
      priceId,
      mode: 'subscription',
      tier
    })

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('Checkout session created:', session.id)

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isStripeError = error && typeof error === 'object' && 'type' in error
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: errorMessage,
        isStripeError
      },
      { status: 500 }
    )
  }
} 