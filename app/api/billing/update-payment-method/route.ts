import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCustomerPaymentMethod, createOrGetStripeCustomer } from '@/lib/services/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { payment_method_id } = body;

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    const stripeCustomer = await createOrGetStripeCustomer(profile);

    // Update payment method in Stripe
    const paymentMethod = await updateCustomerPaymentMethod(
      stripeCustomer.id,
      payment_method_id
    );

    // Update profile with new payment method details
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: stripeCustomer.id,
        stripe_payment_method_id: payment_method_id,
        has_payment_method: true,
        payment_method_last_four: paymentMethod.card?.last4 || null,
        payment_method_brand: paymentMethod.card?.brand || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      payment_method: {
        last_four: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      }
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
} 