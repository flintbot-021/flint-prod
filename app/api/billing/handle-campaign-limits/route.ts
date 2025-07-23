import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Tier configuration
const TIER_CONFIG = {
  free: { max_campaigns: 0 },
  standard: { max_campaigns: 3 },
  premium: { max_campaigns: -1 }, // unlimited
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetTier, preview = false, userId } = body

    console.log('Handling campaign limits for downgrade to:', targetTier, 'preview:', preview)

    // For internal calls (scheduled downgrade processing), userId is provided
    // For regular user calls, get from auth
    let targetUserId = userId
    
    if (!targetUserId) {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      targetUserId = user.id
    }

    if (!['free', 'standard', 'premium'].includes(targetTier)) {
      return NextResponse.json({ error: 'Invalid target tier' }, { status: 400 })
    }

    const targetConfig = TIER_CONFIG[targetTier as keyof typeof TIER_CONFIG]
    const maxAllowed = targetConfig.max_campaigns

    // Get all published campaigns for this user
    const serviceSupabase = createServiceRoleClient()
    const { data: publishedCampaigns, error: campaignsError } = await serviceSupabase
      .from('campaigns')
      .select('id, name, published_url, published_at, created_at')
      .eq('user_id', targetUserId)
      .eq('status', 'published')
      .order('published_at', { ascending: false }) // Newest first

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    const currentPublished = publishedCampaigns?.length || 0

    if (maxAllowed === -1 || currentPublished <= maxAllowed) {
      // No action needed - within limits
      return NextResponse.json({
        success: true,
        action: 'none',
        currentPublished,
        maxAllowed: maxAllowed === -1 ? 'unlimited' : maxAllowed,
        campaignsToKeep: publishedCampaigns || [],
        campaignsToUnpublish: [],
      })
    }

    // Determine which campaigns to keep and which to unpublish
    const campaignsToKeep = maxAllowed === 0 ? [] : publishedCampaigns.slice(0, maxAllowed)
    const campaignsToUnpublish = maxAllowed === 0 ? publishedCampaigns : publishedCampaigns.slice(maxAllowed)

    console.log(`Will keep ${campaignsToKeep.length} campaigns, unpublish ${campaignsToUnpublish.length}`)

    if (!preview) {
      // Actually unpublish the excess campaigns
      const campaignIdsToUnpublish = campaignsToUnpublish.map(c => c.id)
      
      if (campaignIdsToUnpublish.length > 0) {
        const { error: unpublishError } = await serviceSupabase
          .from('campaigns')
          .update({ 
            status: 'draft',
            published_at: null,
            published_url: null,
            updated_at: new Date().toISOString()
          })
          .in('id', campaignIdsToUnpublish)

        if (unpublishError) {
          console.error('Error unpublishing campaigns:', unpublishError)
          return NextResponse.json({ error: 'Failed to unpublish campaigns' }, { status: 500 })
        }

        console.log(`Successfully unpublished ${campaignIdsToUnpublish.length} campaigns`)
      }
    }

    return NextResponse.json({
      success: true,
      action: campaignsToUnpublish.length > 0 ? 'unpublish' : 'none',
      currentPublished,
      maxAllowed: maxAllowed === -1 ? 'unlimited' : maxAllowed,
      campaignsToKeep,
      campaignsToUnpublish,
      message: preview 
        ? `${campaignsToUnpublish.length} campaigns will be unpublished` 
        : `${campaignsToUnpublish.length} campaigns were unpublished`
    })

  } catch (error) {
    console.error('Error handling campaign limits:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to handle campaign limits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 