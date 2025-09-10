import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Generate a cryptographically secure short ID for the shared result
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomBytes = new Uint8Array(16) // 16 bytes = 128 bits of entropy
  crypto.getRandomValues(randomBytes)
  
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(randomBytes[i] % chars.length)
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Basic rate limiting check (simple IP-based)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    const body = await request.json()
    const { campaign_id, shared_data, metadata } = body

    // Validate required fields
    if (!campaign_id || !shared_data) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id and shared_data' },
        { status: 400 }
      )
    }

    // Validate shared_data structure and size
    if (typeof shared_data !== 'object' || shared_data === null) {
      return NextResponse.json(
        { error: 'Invalid shared_data format' },
        { status: 400 }
      )
    }

    // Limit shared_data size (prevent abuse)
    const dataSize = JSON.stringify(shared_data).length
    if (dataSize > 100000) { // 100KB limit
      return NextResponse.json(
        { error: 'Shared data too large' },
        { status: 400 }
      )
    }

    // Verify the campaign exists and is published
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status, name')
      .eq('id', campaign_id)
      .eq('status', 'published')
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or not published' },
        { status: 404 }
      )
    }

    // Generate a unique short ID
    let shortId = generateShortId()
    let attempts = 0
    const maxAttempts = 5

    // Ensure the short ID is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('shared_results')
        .select('id')
        .eq('short_id', shortId)
        .single()

      if (!existing) {
        break // Short ID is unique
      }

      shortId = generateShortId()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique short ID' },
        { status: 500 }
      )
    }

    // Set expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create the shared result
    const { data: sharedResult, error: insertError } = await supabase
      .from('shared_results')
      .insert({
        short_id: shortId,
        campaign_id: campaign_id,
        shared_data: shared_data,
        metadata: {
          ...metadata,
          campaign_name: campaign.name,
          created_at: new Date().toISOString()
        },
        expires_at: expiresAt.toISOString(),
        view_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating shared result:', insertError)
      return NextResponse.json(
        { error: 'Failed to create shared result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      short_id: shortId,
      expires_at: expiresAt.toISOString(),
      share_url: `${request.nextUrl.origin}/s/${shortId}`
    })

  } catch (error) {
    console.error('Error in shared results API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
