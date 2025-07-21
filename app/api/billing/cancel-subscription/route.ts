import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all published campaigns for this user
    const { data: publishedCampaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('status', 'published');

    // Unpublish all campaigns
    if (publishedCampaigns && publishedCampaigns.length > 0) {
      const { error: unpublishError } = await supabase
        .from('campaigns')
        .update({
          status: 'draft',
          published_at: null,
          published_url: null
        })
        .eq('user_id', user.id)
        .eq('status', 'published');

      if (unpublishError) {
        console.error('Failed to unpublish campaigns:', unpublishError);
        return NextResponse.json(
          { error: 'Failed to unpublish campaigns' },
          { status: 500 }
        );
      }
    }

    // Reset user's credits and billing
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        credit_balance: 0,
        billing_anchor_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Failed to reset user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Create cancellation transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'refund',
        amount: 0, // Symbolic transaction
        description: 'Subscription canceled - all credits removed',
        metadata: {
          action: 'subscription_canceled',
          campaigns_unpublished: publishedCampaigns?.length || 0,
        }
      });

    if (transactionError) {
      console.error('Failed to create cancellation transaction:', transactionError);
      // Don't fail the operation, just log the error
    }

    return NextResponse.json({
      success: true,
      message: `Subscription canceled successfully. ${publishedCampaigns?.length || 0} campaigns unpublished.`,
      data: {
        campaigns_unpublished: publishedCampaigns?.length || 0,
        credits_removed: true,
        billing_stopped: true
      }
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 