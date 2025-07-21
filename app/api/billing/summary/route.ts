import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance')
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
      .select('id, name, slug, published_at, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Calculate total credits owned (temporarily using credit_balance until credit_transactions table is created)
    const totalCreditsOwned = profile.credit_balance || 0;

    // Create billing summary
    const billingSummary = {
      credit_balance: profile.credit_balance || 0,
      total_credits_owned: totalCreditsOwned,
      currently_published: publishedCount || 0,
      available_credits: profile.credit_balance || 0,
      active_slots: publishedCampaigns || [],
      monthly_cost_cents: (publishedCount || 0) * 1000, // $10 per published campaign
      next_billing_date: null,
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