import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

                // Get profile with credit balance, billing anchor date, payment method, and cancellation info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance, billing_anchor_date, cancellation_scheduled_at, payment_method_last_four, payment_method_brand')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get published campaigns with details
    const { data: publishedCampaigns, count: publishedCount } = await supabase
      .from('campaigns')
      .select('id, name, published_url, published_at, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

            // Calculate total credits owned from credit_transactions
        const { data: creditTransactions } = await supabase
          .from('credit_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('transaction_type', 'purchase');

        const totalCreditsOwned = creditTransactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

        // Calculate next billing date (1 month from billing anchor date)
        let nextBillingDate = null;
        let subscriptionEndsAt = null;
        
        if (profile.billing_anchor_date) {
          const anchorDate = new Date(profile.billing_anchor_date);
          const nextDate = new Date(anchorDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextBillingDate = nextDate.toISOString();
          
          // If cancellation is scheduled, subscription ends at next billing date
          if (profile.cancellation_scheduled_at) {
            subscriptionEndsAt = nextBillingDate;
          }
        } else if (totalCreditsOwned > 0) {
          // If user has credits but no billing anchor date, set it to next month from now
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextBillingDate = nextMonth.toISOString();
          
          // Update the billing anchor date in the database for future consistency
          await supabase
            .from('profiles')
            .update({ billing_anchor_date: now.toISOString() })
            .eq('id', user.id);
          
          // If cancellation is scheduled, subscription ends at next billing date
          if (profile.cancellation_scheduled_at) {
            subscriptionEndsAt = nextBillingDate;
          }
        }

        // Create billing summary
        const billingSummary = {
          credit_balance: profile.credit_balance || 0,
          total_credits_owned: totalCreditsOwned,
          currently_published: publishedCount || 0,
          available_credits: profile.credit_balance || 0,
          active_slots: publishedCampaigns || [],
          monthly_cost_cents: totalCreditsOwned * 9900, // $99 per credit owned
          next_billing_date: nextBillingDate,
          billing_anchor_date: profile.billing_anchor_date,
          payment_method_last_four: profile.payment_method_last_four,
          payment_method_brand: profile.payment_method_brand,
          billing_history: [],
          cancellation_scheduled_at: profile.cancellation_scheduled_at,
          subscription_ends_at: subscriptionEndsAt
        };

    return NextResponse.json({
      success: true,
      data: billingSummary
    });

  } catch (error) {
    console.error('Error fetching billing summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing summary' },
      { status: 500 }
    );
  }
} 