import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    const campaignId = formData.get('campaignId') as string

    if (!file || !campaignId) {
      return NextResponse.json(
        { error: 'Missing file or campaign ID' }, 
        { status: 400 }
      )
    }

    // Verify the campaign belongs to the user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' }, 
        { status: 403 }
      )
    }

    // Upload to storage
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `campaigns/${campaignId}/branding/${timestamp}_${sanitizedFileName}`

    const { data, error } = await supabase.storage
      .from('campaign-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload failed:', error)
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` }, 
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-uploads')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl 
    })

  } catch (error) {
    console.error('Logo upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 