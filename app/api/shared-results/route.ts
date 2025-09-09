import { NextRequest, NextResponse } from 'next/server'
import { createSharedResult } from '@/lib/data-access/shared-results'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.campaign_id || !body.shared_data) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id and shared_data' },
        { status: 400 }
      )
    }

    // Optional: Set expiration (default to 1 year from now)
    const expiresAt = body.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const result = await createSharedResult({
      campaign_id: body.campaign_id,
      session_id: body.session_id,
      shared_data: body.shared_data,
      metadata: body.metadata || {},
      expires_at: expiresAt
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shortId: result.data.shortId,
      id: result.data.id,
      createdAt: result.data.createdAt
    })

  } catch (error) {
    console.error('Error in POST /api/shared-results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
