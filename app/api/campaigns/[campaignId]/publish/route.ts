import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Tier configuration for campaign limits
const TIER_LIMITS = {
  free: 0,
  standard: 3,
  premium: -1, // -1 means unlimited
} as const

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.campaignId

    // Get user's current subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      )
    }

    const currentTier = (profile.subscription_tier as keyof typeof TIER_LIMITS) || 'free'
    const tierLimit = TIER_LIMITS[currentTier]

    // Check if user can publish based on their tier
    if (tierLimit === 0) {
      return NextResponse.json(
        { 
          error: 'Publishing not available on Free tier. Please upgrade to publish campaigns.',
          requiresUpgrade: true,
          currentTier
        },
        { status: 403 }
      )
    }

    // For non-unlimited tiers, check current published count
    if (tierLimit > 0) {
      const { count: publishedCount, error: countError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published')

      if (countError) {
        return NextResponse.json(
          { error: 'Failed to check published campaigns' },
          { status: 500 }
        )
      }

      if ((publishedCount || 0) >= tierLimit) {
        return NextResponse.json(
          { 
            error: `You've reached your ${currentTier} tier limit of ${tierLimit} published campaigns. Please upgrade or unpublish other campaigns.`,
            requiresUpgrade: true,
            currentTier,
            currentCount: publishedCount,
            tierLimit
          },
          { status: 403 }
        )
      }
    }

    // Get the campaign to publish
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status === 'published') {
      return NextResponse.json(
        { error: 'Campaign is already published' },
        { status: 400 }
      )
    }

    // Publish the campaign
    const { data: publishedCampaign, error: publishError } = await supabase
      .from('campaigns')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (publishError) {
      return NextResponse.json(
        { error: 'Failed to publish campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: publishedCampaign,
      message: `Campaign published successfully! You're on the ${currentTier} tier.`
    })

  } catch (error) {
    console.error('Error publishing campaign:', error)
    return NextResponse.json(
      { error: 'Failed to publish campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.campaignId

    // Get the campaign to unpublish
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status !== 'published') {
      return NextResponse.json(
        { error: 'Campaign is not published' },
        { status: 400 }
      )
    }

    // Unpublish the campaign
    const { data: unpublishedCampaign, error: unpublishError } = await supabase
      .from('campaigns')
      .update({
        status: 'draft',
        published_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (unpublishError) {
      return NextResponse.json(
        { error: 'Failed to unpublish campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: unpublishedCampaign,
      message: 'Campaign unpublished successfully!'
    })

  } catch (error) {
    console.error('Error unpublishing campaign:', error)
    return NextResponse.json(
      { error: 'Failed to unpublish campaign' },
      { status: 500 }
    )
  }
} 