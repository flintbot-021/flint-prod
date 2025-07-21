import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createOrGetStripeCustomer, 
  createCreditPurchaseIntent,
  chargeStoredPaymentMethod,
  updateCustomerPaymentMethod,
  getPaymentMethodDetails 
} from '@/lib/services/stripe-service';
import { calculateProratedAmount, getProratedDescription } from '@/lib/utils/billing-calculations';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity, payment_method_id, use_stored_payment_method } = body;

    // Validate input
    if (!quantity || quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Get user profile directly from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    const stripeCustomer = await createOrGetStripeCustomer(profile);

    // Update profile with Stripe customer ID if it's different or not set
    if (!profile.stripe_customer_id || profile.stripe_customer_id !== stripeCustomer.id) {
      await supabase
        .from('profiles')
        .update({ 
          stripe_customer_id: stripeCustomer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    // Calculate prorated amount if user has billing anchor date
    let proratedAmount = quantity * 9900; // Default to full price
    let isProrated = false;
    
    if (profile.billing_anchor_date) {
      proratedAmount = calculateProratedAmount(quantity, profile.billing_anchor_date);
      isProrated = proratedAmount < (quantity * 9900);
    }

    let paymentIntent;

    // Check if using stored payment method
    if (use_stored_payment_method && profile.stripe_payment_method_id) {
      // Use stored payment method for immediate charge
      paymentIntent = await chargeStoredPaymentMethod(
        stripeCustomer.id,
        profile.stripe_payment_method_id,
        quantity,
        proratedAmount
      );
    } else {
      // Handle new payment method
      if (payment_method_id) {
        // Update customer's payment method
        const paymentMethod = await updateCustomerPaymentMethod(
          stripeCustomer.id,
          payment_method_id
        );

        // Get payment method details for storage
        const paymentDetails = await getPaymentMethodDetails(payment_method_id);

        // Update profile with payment method info
        await supabase
          .from('profiles')
          .update({
            stripe_payment_method_id: payment_method_id,
            has_payment_method: true,
            payment_method_last_four: paymentDetails.last4,
            payment_method_brand: paymentDetails.brand,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      // Create payment intent with prorated amount
      paymentIntent = await createCreditPurchaseIntent(
        stripeCustomer.id,
        quantity,
        proratedAmount,
        payment_method_id,
        !profile.stripe_payment_method_id // Save payment method if this is their first
      );
    }

    // In test mode, immediately update credit balance since webhooks may not work locally
    if (paymentIntent.status === 'succeeded') {
      // Update credit balance immediately
      const currentBalance = profile.credit_balance || 0;
      const now = new Date().toISOString();
      
      // Set billing anchor date if this is the first credit purchase
      const updateData: any = {
        credit_balance: currentBalance + quantity,
        updated_at: now
      };
      
      if (!profile.billing_anchor_date) {
        updateData.billing_anchor_date = now;
      }
      
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      // Create credit transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          amount: quantity,
          description: isProrated 
            ? `Purchased ${quantity} hosting credit${quantity > 1 ? 's' : ''} (prorated)`
            : `Purchased ${quantity} hosting credit${quantity > 1 ? 's' : ''}`,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge as string,
          metadata: {
            stripe_customer_id: stripeCustomer.id,
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency,
            is_prorated: isProrated,
            full_price_cents: quantity * 9900,
            stored_payment_method: use_stored_payment_method || false,
          }
        });

      if (transactionError) {
        console.error('Failed to create credit transaction:', transactionError);
      }
    }

    return NextResponse.json({
      success: true,
      payment_intent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      },
      quantity,
      total_amount: paymentIntent.amount,
      is_prorated: isProrated,
      full_price: quantity * 9900,
      prorated_amount: proratedAmount,
      used_stored_payment_method: use_stored_payment_method && !!profile.stripe_payment_method_id,
    });

  } catch (error) {
    console.error('Error creating credit purchase:', error);
    return NextResponse.json(
      { error: 'Failed to process credit purchase' },
      { status: 500 }
    );
  }
} 