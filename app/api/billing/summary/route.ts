import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

            // Get profile with credit balance and billing anchor date
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credit_balance, billing_anchor_date')
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
        if (profile.billing_anchor_date) {
          const anchorDate = new Date(profile.billing_anchor_date);
          const nextDate = new Date(anchorDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextBillingDate = nextDate.toISOString();
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
          billing_history: []
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