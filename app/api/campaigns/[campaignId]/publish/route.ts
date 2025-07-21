import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


interface PublishParams {
  params: {
    campaignId: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: PublishParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await params;

    // Check if user can publish (has credits)
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.credit_balance || 0) < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient credits. Please purchase credits to publish.' 
        },
        { status: 400 }
      );
    }

    // Start transaction: update campaign status and consume credit
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to publish campaign' 
        },
        { status: 500 }
      );
    }

    // Consume 1 credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({
        credit_balance: (profile.credit_balance || 0) - 1
      })
      .eq('id', user.id);

    if (creditError) {
      // Rollback campaign status
      await supabase
        .from('campaigns')
        .update({ status: 'draft', published_at: null })
        .eq('id', campaignId);

      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to consume credit' 
        },
        { status: 500 }
      );
    }

    // Create credit usage transaction record
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'usage',
        amount: -1, // Negative for usage
        description: `Published campaign: ${campaign.name}`,
        campaign_id: campaignId,
        metadata: {
          campaign_name: campaign.name,
          action: 'publish'
        }
      });

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign published successfully! 1 credit has been consumed.'
    });

  } catch (error) {
    console.error('Error publishing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to publish campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: PublishParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await params;

    // Get current campaign to check if it's published
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campaign not found' 
        },
        { status: 404 }
      );
    }

    if (campaign.status !== 'published') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campaign is not published' 
        },
        { status: 400 }
      );
    }

    // Unpublish the campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'draft',
        published_at: null
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to unpublish campaign' 
        },
        { status: 500 }
      );
    }

    // Refund 1 credit
    const { data: profile } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', user.id)
      .single();

    const { error: creditError } = await supabase
      .from('profiles')
      .update({
        credit_balance: (profile?.credit_balance || 0) + 1
      })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to refund credit:', creditError);
      // Don't fail the unpublish operation, just log the error
    } else {
      // Create credit refund transaction record
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'refund',
          amount: 1, // Positive for refund
          description: `Unpublished campaign: ${campaign.name}`,
          campaign_id: campaignId,
          metadata: {
            campaign_name: campaign.name,
            action: 'unpublish'
          }
        });
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
      message: 'Campaign unpublished successfully! 1 credit has been refunded.'
    });

  } catch (error) {
    console.error('Error unpublishing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish campaign' },
      { status: 500 }
    );
  }
} 