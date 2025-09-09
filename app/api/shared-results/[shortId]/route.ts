import { NextRequest, NextResponse } from 'next/server'
import { getSharedResultByShortId, incrementViewCount } from '@/lib/data-access/shared-results'

export async function GET(
  request: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    const { shortId } = params

    if (!shortId) {
      return NextResponse.json(
        { error: 'Short ID is required' },
        { status: 400 }
      )
    }

    // Get the shared result
    const result = await getSharedResultByShortId(shortId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Shared result not found' ? 404 : 500 }
      )
    }

    // Increment view count (fire and forget - don't wait for it)
    incrementViewCount(shortId).catch(error => {
      console.error('Error incrementing view count:', error)
    })

    return NextResponse.json({
      success: true,
      data: {
        shortId: result.data.short_id,
        campaignId: result.data.campaign_id,
        sharedData: result.data.shared_data,
        metadata: result.data.metadata,
        viewCount: result.data.view_count,
        createdAt: result.data.created_at,
        campaign: result.data.campaigns
      }
    })

  } catch (error) {
    console.error('Error in GET /api/shared-results/[shortId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
