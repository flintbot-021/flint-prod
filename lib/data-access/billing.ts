/**
 * Billing Data Access Layer
 * 
 * This module provides CRUD operations for billing, credit transactions, and subscription management.
 */

import type {
  CreditTransaction,
  CreateCreditTransaction,
  UpdateCreditTransaction,
  BillingHistory,
  CreateBillingHistory,
  UpdateBillingHistory,
  UserSubscription,
  CreateUserSubscription,
  UpdateUserSubscription,
  BillingSummary,
  Profile,
  Campaign,
  DatabaseResult
} from '@/lib/types/database';

import {
  getSupabaseClient,
  withErrorHandling,
  validateRequiredFields,
  isValidUUID,
  requireAuth,
  getCurrentUserId
} from './base';

// =============================================================================
// CREDIT TRANSACTION OPERATIONS
// =============================================================================

/**
 * Create a credit transaction
 */
export async function createCreditTransaction(
  transactionData: CreateCreditTransaction
): Promise<DatabaseResult<CreditTransaction>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  const data = {
    ...transactionData,
    user_id: userId
  };

  return withErrorHandling(async () => {
    return await supabase
      .from('credit_transactions')
      .insert(data)
      .select()
      .single();
  });
}

/**
 * Get user's credit transactions
 */
export async function getCreditTransactions(
  limit = 50,
  offset = 0
): Promise<DatabaseResult<CreditTransaction[]>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  });
}

/**
 * Get credit balance for user
 */
export async function getCreditBalance(): Promise<DatabaseResult<number>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: profile.credit_balance || 0, error: null };
  });
}

/**
 * Update credit balance (internal function)
 */
export async function updateCreditBalance(
  amount: number,
  operation: 'add' | 'subtract' = 'add'
): Promise<DatabaseResult<Profile>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get current balance
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    const currentBalance = profile.credit_balance || 0;
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : Math.max(0, currentBalance - amount);

    return await supabase
      .from('profiles')
      .update({ 
        credit_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
  });
}

// =============================================================================
// BILLING HISTORY OPERATIONS
// =============================================================================

/**
 * Create billing history entry
 */
export async function createBillingHistory(
  billingData: CreateBillingHistory
): Promise<DatabaseResult<BillingHistory>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  const data = {
    ...billingData,
    user_id: userId
  };

  return withErrorHandling(async () => {
    return await supabase
      .from('billing_history')
      .insert(data)
      .select()
      .single();
  });
}

/**
 * Get user's billing history
 */
export async function getBillingHistory(
  limit = 50,
  offset = 0
): Promise<DatabaseResult<BillingHistory[]>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    return await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  });
}

/**
 * Update billing history status
 */
export async function updateBillingHistoryStatus(
  billingId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  metadata?: Record<string, any>
): Promise<DatabaseResult<BillingHistory>> {
  if (!isValidUUID(billingId)) {
    return {
      success: false,
      error: 'Invalid billing history ID format'
    };
  }

  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (metadata) {
    updates.metadata = metadata;
  }

  return withErrorHandling(async () => {
    return await supabase
      .from('billing_history')
      .update(updates)
      .eq('id', billingId)
      .eq('user_id', userId) // Ensure user can only update their own records
      .select()
      .single();
  });
}

// =============================================================================
// SUBSCRIPTION OPERATIONS
// =============================================================================

/**
 * Create or update user subscription
 */
export async function upsertUserSubscription(
  subscriptionData: CreateUserSubscription
): Promise<DatabaseResult<UserSubscription>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  const data = {
    ...subscriptionData,
    user_id: userId
  };

  return withErrorHandling(async () => {
    return await supabase
      .from('user_subscriptions')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single();
  });
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(): Promise<DatabaseResult<UserSubscription | null>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no subscription exists, return null without error
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }

    return { data, error };
  });
}

/**
 * Update subscription active slots
 */
export async function updateSubscriptionSlots(
  operation: 'add' | 'subtract',
  costPerSlot = 1000 // $10.00 in cents
): Promise<DatabaseResult<UserSubscription>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get current subscription or create if doesn't exist
    const subscriptionResult = await getUserSubscription();
    const subscription = subscriptionResult.data;
    
    if (!subscription) {
      // Create new subscription
      const newSubscription: CreateUserSubscription = {
        stripe_customer_id: '', // Will be set when Stripe customer is created
        status: 'active',
        active_slots: operation === 'add' ? 1 : 0,
        monthly_cost_cents: operation === 'add' ? costPerSlot : 0,
        billing_cycle_anchor: new Date().toISOString()
      };
      
      const result = await upsertUserSubscription(newSubscription);
      return { data: result.data, error: result.error };
    }

    // Update existing subscription
    const currentSlots = subscription.active_slots || 0;
    const newSlots = operation === 'add' 
      ? currentSlots + 1 
      : Math.max(0, currentSlots - 1);
    
    const newCost = newSlots * costPerSlot;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        active_slots: newSlots,
        monthly_cost_cents: newCost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  });
}

// =============================================================================
// BILLING SUMMARY AND ANALYTICS
// =============================================================================

/**
 * Get comprehensive billing summary for account settings
 */
export async function getBillingSummary(): Promise<DatabaseResult<BillingSummary>> {
  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Get profile with credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    // Get subscription info
    const { data: subscription } = await getUserSubscription();

    // Get published campaigns count
    const { count: publishedCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('slot_status', 'active');

    // Get total credits purchased
    const { data: creditTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'purchase');

    const totalCreditsOwned = creditTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    // Get recent billing history
    const billingHistoryResult = await getBillingHistory(10, 0);
    const billingHistory = billingHistoryResult.data || [];

    const summary: BillingSummary = {
      credit_balance: profile.credit_balance || 0,
      total_credits_owned: totalCreditsOwned,
      currently_published: publishedCount || 0,
      available_credits: profile.credit_balance || 0,
      active_slots: subscription ? [subscription] : [],
      monthly_cost_cents: subscription?.monthly_cost_cents || 0,
      next_billing_date: subscription?.current_period_end || null,
      billing_history: billingHistory
    };

    return { data: summary, error: null };
  });
}

// =============================================================================
// CAMPAIGN PUBLISHING OPERATIONS
// =============================================================================

/**
 * Publish campaign (consume 1 credit)
 */
export async function publishCampaign(campaignId: string): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  try {
    const userId = await requireAuth();
    const supabase = await getSupabaseClient();

    // Check credit balance
    const creditBalanceResult = await getCreditBalance();
    if (!creditBalanceResult.data || creditBalanceResult.data < 1) {
      return {
        success: false,
        error: 'Insufficient credits. Please purchase credits to publish.'
      };
    }

    // Start transaction: update campaign, consume credit, create transaction record
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .update({
        slot_status: 'active',
        slot_created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (campaignError) {
      return { success: false, error: campaignError.message };
    }

    // Consume 1 credit
    await updateCreditBalance(1, 'subtract');

    // Create transaction record
    await createCreditTransaction({
      transaction_type: 'usage',
      amount: -1,
      description: `Published campaign: ${campaign.name}`,
      campaign_id: campaignId
    });

    // Update subscription slots
    await updateSubscriptionSlots('add');

    return { success: true, data: campaign };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish campaign'
    };
  }
}

/**
 * Unpublish campaign (refund 1 credit)
 */
export async function unpublishCampaign(campaignId: string): Promise<DatabaseResult<Campaign>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    };
  }

  const userId = await requireAuth();
  const supabase = await getSupabaseClient();

  return withErrorHandling(async () => {
    // Update campaign status
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .update({
        slot_status: 'inactive',
        slot_cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .eq('slot_status', 'active') // Only allow unpublishing active campaigns
      .select()
      .single();

    if (campaignError) {
      return { data: null, error: campaignError };
    }

    // Refund 1 credit
    await updateCreditBalance(1, 'add');

    // Create transaction record
    await createCreditTransaction({
      transaction_type: 'refund',
      amount: 1,
      description: `Unpublished campaign: ${campaign.name}`,
      campaign_id: campaignId
    });

    // Update subscription slots
    await updateSubscriptionSlots('subtract');

    return { data: campaign, error: null };
  });
}

/**
 * Check if user can publish (has credits)
 */
export async function canPublishCampaign(): Promise<DatabaseResult<boolean>> {
  return withErrorHandling(async () => {
    const { data: creditBalance } = await getCreditBalance();
    return { data: (creditBalance || 0) >= 1, error: null };
  });
} 