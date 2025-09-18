import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AssetGenerationRequest {
  campaignId: string
  testInputs: Record<string, any>
  templateId: string
  backgroundId: string
  screenType: 'questions' | 'output'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access (useflint.co email)
    if (!user.email?.endsWith('@useflint.co')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const body: AssetGenerationRequest = await request.json()
    const { campaignId, testInputs, templateId, backgroundId, screenType } = body

    // Validate required fields
    if (!campaignId || !templateId || !screenType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: campaignId, templateId, screenType' 
      }, { status: 400 })
    }

    // Get campaign sections directly using server-side client
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index', { ascending: true })

    if (sectionsError || !sections) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to load campaign sections' 
      }, { status: 404 })
    }

    // Filter sections based on screen type
    let relevantSections
    if (screenType === 'questions') {
      // Get question sections
      relevantSections = sections.filter(section => 
        section.type === 'text_question' ||
        section.type === 'multiple_choice' ||
        section.type === 'slider' ||
        section.type === 'date_time_question' ||
        section.type === 'upload_question' ||
        section.type === 'info' ||
        section.type === 'content-hero' ||
        section.type === 'content-basic'
      )
    } else {
      // Get output sections
      relevantSections = sections.filter(section => 
        section.type === 'output' ||
        section.type === 'dynamic_redirect' ||
        section.type === 'html_embed'
      )
    }

    // Generate the asset (this would be where we integrate with a screenshot service)
    // For now, we'll return a mock response
    const assetData = {
      sections: relevantSections,
      testInputs,
      templateId,
      backgroundId,
      screenType,
      timestamp: new Date().toISOString()
    }

    // In a real implementation, this would:
    // 1. Render the campaign with test data
    // 2. Take a screenshot of the specified screen type
    // 3. Apply it to the selected mockup template
    // 4. Apply the background
    // 5. Return the generated asset URL

    // Mock asset generation
    const mockAssetUrl = `/api/generated-assets/${campaignId}-${templateId}-${screenType}-${Date.now()}.png`

    return NextResponse.json({
      success: true,
      assetUrl: mockAssetUrl,
      metadata: {
        campaignId,
        templateId,
        backgroundId,
        screenType,
        sectionsCount: relevantSections.length,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating marketing asset:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
