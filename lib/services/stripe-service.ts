/**
 * Stripe Service
 * 
 * This service handles all Stripe-related operations including customer creation,
 * payment processing, and subscription management for the credit-based billing system.
 */

import Stripe from 'stripe';
import type { 
  Profile, 
  CreditPurchaseRequest,
  CreateBillingHistory,
  CreateCreditTransaction 
} from '@/lib/types/database';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// Constants
const CREDIT_PRICE_CENTS = 1000; // $10.00 per credit
const CURRENCY = 'usd';

// =============================================================================
// CUSTOMER MANAGEMENT
// =============================================================================

/**
 * Create or retrieve Stripe customer
 */
export async function createOrGetStripeCustomer(profile: any): Promise<Stripe.Customer> {
  // If customer already exists, return it
  if (profile.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch (error) {
      console.error('Error retrieving existing customer:', error);
      // Continue to create new customer
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.full_name || undefined,
    metadata: {
      user_id: profile.id,
      company_name: profile.company_name || '',
    }
  });

  return customer;
}

/**
 * Update customer payment method
 */
export async function updateCustomerPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // Get payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  return paymentMethod;
}

// =============================================================================
// PAYMENT PROCESSING
// =============================================================================

/**
 * Create payment intent for credit purchase
 */
export async function createCreditPurchaseIntent(
  customerId: string,
  quantity: number,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  const amount = quantity * CREDIT_PRICE_CENTS;

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount,
    currency: CURRENCY,
    customer: customerId,
    description: `Purchase ${quantity} hosting credit${quantity > 1 ? 's' : ''}`,
    metadata: {
      type: 'credit_purchase',
      quantity: quantity.toString(),
      price_per_credit: CREDIT_PRICE_CENTS.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  };

  // Use specific payment method if provided
  if (paymentMethodId) {
    paymentIntentData.payment_method = paymentMethodId;
    paymentIntentData.confirm = true;
    paymentIntentData.return_url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
  }

  return await stripe.paymentIntents.create(paymentIntentData);
}

/**
 * Confirm payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  const confirmData: Stripe.PaymentIntentConfirmParams = {
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
  };

  if (paymentMethodId) {
    confirmData.payment_method = paymentMethodId;
  }

  return await stripe.paymentIntents.confirm(paymentIntentId, confirmData);
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Create or update subscription for active slots
 */
export async function createOrUpdateSubscription(
  customerId: string,
  activeSlots: number,
  billingCycleAnchor?: Date
): Promise<Stripe.Subscription | null> {
  if (activeSlots === 0) {
    return null;
  }

  // Check if customer already has a subscription
  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  const priceId = process.env.STRIPE_HOSTING_SLOT_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_HOSTING_SLOT_PRICE_ID environment variable is required');
  }

  if (existingSubscriptions.data.length > 0) {
    // Update existing subscription
    const subscription = existingSubscriptions.data[0];
    
    return await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
        quantity: activeSlots,
      }],
      proration_behavior: 'create_prorations',
    });
  } else {
    // Create new subscription
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{
        price: priceId,
        quantity: activeSlots,
      }],
      metadata: {
        type: 'hosting_slots',
      },
    };

    // Set billing cycle anchor if this is the first subscription
    if (billingCycleAnchor) {
      subscriptionData.billing_cycle_anchor = Math.floor(billingCycleAnchor.getTime() / 1000);
    }

    return await stripe.subscriptions.create(subscriptionData);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// =============================================================================
// WEBHOOK PROCESSING
// =============================================================================

/**
 * Process Stripe webhook events
 */
export async function processWebhookEvent(
  event: Stripe.Event,
  signature: string,
  rawBody: string
): Promise<{ success: boolean; message: string }> {
  // Verify webhook signature
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  try {
    stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return { success: false, message: 'Invalid signature' };
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true, message: 'Event processed successfully' };
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    return { success: false, message: `Error processing ${event.type}` };
  }
}

// =============================================================================
// WEBHOOK EVENT HANDLERS
// =============================================================================

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata.type === 'credit_purchase') {
    const quantity = parseInt(paymentIntent.metadata.quantity || '1');
    const customerId = paymentIntent.customer as string;
    
    // Import billing functions dynamically to avoid circular dependencies
    const { createCreditTransaction, createBillingHistory, updateCreditBalance } = 
      await import('../data-access/billing');
    const { getSupabaseClient } = await import('../data-access/base');

    // Get user ID from customer
    const supabase = await getSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Add credits to user balance
    await updateCreditBalance(quantity, 'add');

    // Create credit transaction record
    await createCreditTransaction({
      user_id: profile.id,
      transaction_type: 'purchase',
      amount: quantity,
      description: `Purchased ${quantity} hosting credit${quantity > 1 ? 's' : ''}`,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge as string,
      metadata: {
        stripe_customer_id: customerId,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    });

    // Create billing history record
    await createBillingHistory({
      user_id: profile.id,
      billing_type: 'credit_purchase',
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge as string,
      description: `Purchased ${quantity} hosting credit${quantity > 1 ? 's' : ''}`,
      metadata: {
        quantity,
        price_per_credit: CREDIT_PRICE_CENTS,
      }
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  if (paymentIntent.metadata.type === 'credit_purchase') {
    const customerId = paymentIntent.customer as string;
    const quantity = parseInt(paymentIntent.metadata.quantity || '1');
    
    const { createBillingHistory } = await import('../data-access/billing');
    const { getSupabaseClient } = await import('../data-access/base');

    // Get user ID from customer
    const supabase = await getSupabaseClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('Profile not found for customer:', customerId);
      return;
    }

    // Create failed billing history record
    await createBillingHistory({
      user_id: profile.id,
      billing_type: 'credit_purchase',
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
      description: `Failed purchase of ${quantity} hosting credit${quantity > 1 ? 's' : ''}`,
      metadata: {
        quantity,
        price_per_credit: CREDIT_PRICE_CENTS,
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      }
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle subscription billing
  const customerId = invoice.customer as string;
  
  const { createBillingHistory } = await import('../data-access/billing');
  const { getSupabaseClient } = await import('../data-access/base');

  // Get user ID from customer
  const supabase = await getSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Create billing history record for subscription payment
  await createBillingHistory({
    user_id: profile.id,
    billing_type: 'subscription_charge',
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    stripe_invoice_id: invoice.id,
    description: 'Monthly hosting subscription charge',
    billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
    billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
    metadata: {
      subscription_id: (invoice as any).subscription,
      invoice_number: invoice.number,
    }
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed subscription billing
  const customerId = invoice.customer as string;
  
  const { createBillingHistory } = await import('../data-access/billing');
  const { getSupabaseClient } = await import('../data-access/base');

  // Get user ID from customer
  const supabase = await getSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Create failed billing history record
  await createBillingHistory({
    user_id: profile.id,
    billing_type: 'subscription_charge',
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    stripe_invoice_id: invoice.id,
    description: 'Failed monthly hosting subscription charge',
    billing_period_start: new Date(invoice.period_start * 1000).toISOString(),
    billing_period_end: new Date(invoice.period_end * 1000).toISOString(),
    metadata: {
      subscription_id: (invoice as any).subscription,
      invoice_number: invoice.number,
      failure_reason: 'Payment failed',
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update user subscription record
  const customerId = subscription.customer as string;
  
  const { upsertUserSubscription } = await import('../data-access/billing');
  const { getSupabaseClient } = await import('../data-access/base');

  // Get user ID from customer
  const supabase = await getSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  const activeSlots = subscription.items.data[0]?.quantity || 0;
  const monthlyCostCents = subscription.items.data.reduce(
    (total, item) => total + (item.price.unit_amount || 0) * (item.quantity || 0),
    0
  );

  await upsertUserSubscription({
    user_id: profile.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status === 'active' ? 'active' : 'inactive',
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    billing_cycle_anchor: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
    active_slots: activeSlots,
    monthly_cost_cents: monthlyCostCents,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Mark subscription as cancelled
  const customerId = subscription.customer as string;
  
  const { upsertUserSubscription } = await import('../data-access/billing');
  const { getSupabaseClient } = await import('../data-access/base');

  // Get user ID from customer
  const supabase = await getSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  await upsertUserSubscription({
    user_id: profile.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: 'cancelled',
    active_slots: 0,
    monthly_cost_cents: 0,
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format amount from cents to dollars
 */
export function formatCurrency(amountCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

/**
 * Get payment method details for display
 */
export async function getPaymentMethodDetails(paymentMethodId: string): Promise<{
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}> {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    throw new Error('Payment method is not a card');
  }

  return {
    last4: paymentMethod.card.last4,
    brand: paymentMethod.card.brand,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year,
  };
} 