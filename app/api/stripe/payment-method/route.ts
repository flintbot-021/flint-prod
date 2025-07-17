import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { payment_method_id } = await request.json()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id)
    
    if (!paymentMethod.card) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Update profile with payment method info
    await supabase
      .from('profiles')
      .update({
        stripe_payment_method_id: payment_method_id,
        has_payment_method: true,
        payment_method_last_four: paymentMethod.card.last4,
        payment_method_brand: paymentMethod.card.brand,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      card: {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      },
    })
  } catch (error: any) {
    console.error('Payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's payment method info
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_payment_method_id, has_payment_method, payment_method_last_four, payment_method_brand')
      .eq('id', user.id)
      .single()

    if (!profile?.has_payment_method || !profile.stripe_payment_method_id) {
      return NextResponse.json({ has_payment_method: false })
    }

    return NextResponse.json({
      has_payment_method: true,
      card: {
        brand: profile.payment_method_brand,
        last4: profile.payment_method_last_four,
      },
    })
  } catch (error: any) {
    console.error('Get payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment method' },
      { status: 500 }
    )
  }
} 