import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RenderAssetRequest {
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

    const body: RenderAssetRequest = await request.json()
    const { campaignId, testInputs, templateId, backgroundId, screenType } = body

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
      relevantSections = sections.filter(section => 
        section.type === 'output' ||
        section.type === 'dynamic_redirect' ||
        section.type === 'html_embed'
      )
    }

    if (relevantSections.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No ${screenType} sections found in this campaign` 
      }, { status: 404 })
    }

    // Generate HTML for the mockup
    const mockupHtml = generateMockupHtml({
      sections: relevantSections,
      testInputs,
      templateId,
      backgroundId,
      screenType
    })

    // In a real implementation, this would use Puppeteer or Playwright to:
    // 1. Create a headless browser
    // 2. Load the HTML
    // 3. Take a screenshot
    // 4. Return the image

    // For now, return the HTML that could be rendered
    return NextResponse.json({
      success: true,
      html: mockupHtml,
      metadata: {
        campaignId,
        templateId,
        backgroundId,
        screenType,
        sectionsCount: relevantSections.length
      }
    })

  } catch (error) {
    console.error('Error rendering asset:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function generateMockupHtml(params: {
  sections: any[]
  testInputs: Record<string, any>
  templateId: string
  backgroundId: string
  screenType: 'questions' | 'output'
}) {
  const { sections, testInputs, templateId, backgroundId, screenType } = params
  
  const backgroundStyles = {
    'gradient-1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'solid-1': '#ffffff',
    'solid-2': '#f8fafc',
    'solid-3': '#1e293b'
  }

  const backgroundStyle = backgroundStyles[backgroundId as keyof typeof backgroundStyles] || backgroundStyles['gradient-1']
  const section = sections[0] // Use first relevant section
  const config = (section?.configuration || {}) as any

  // Generate section content based on type
  let sectionContent = ''
  
  if (section) {
    switch (section.type) {
      case 'text_question':
        sectionContent = `
          <div class="py-12 px-6">
            <div class="max-w-md mx-auto space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-gray-900">${section.title || 'Question'}</h2>
                ${section.description ? `<p class="text-gray-600">${section.description}</p>` : ''}
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700">${config.question || 'Your answer'}</label>
                <input 
                  type="text" 
                  value="${testInputs[section.id] || ''}"
                  placeholder="${config.placeholder || 'Type your answer...'}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readonly
                />
              </div>
              <button class="w-full bg-blue-600 text-white py-2 px-4 rounded-md">Continue</button>
            </div>
          </div>
        `
        break

      case 'multiple_choice':
        const options = config.options || []
        const selectedValue = testInputs[section.id]
        sectionContent = `
          <div class="py-12 px-6">
            <div class="max-w-md mx-auto space-y-6">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-gray-900">${section.title || 'Choose an option'}</h2>
                ${section.description ? `<p class="text-gray-600">${section.description}</p>` : ''}
              </div>
              <div class="space-y-3">
                ${options.map((option: any) => {
                  const optionText = typeof option === 'string' ? option : option.text || option.value
                  const isSelected = selectedValue === optionText
                  return `
                    <button class="w-full p-4 text-left border rounded-lg ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-900' 
                        : 'border-gray-300'
                    }">
                      ${optionText}
                    </button>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        `
        break

      case 'output':
        sectionContent = `
          <div class="py-12 px-6">
            <div class="max-w-2xl mx-auto space-y-8">
              <div class="text-center space-y-2">
                <h2 class="text-3xl font-bold text-gray-900">${config.headline || 'Your Results'}</h2>
                ${config.description ? `<p class="text-gray-600">${config.description}</p>` : ''}
              </div>
              
              <div class="space-y-6">
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="text-lg font-semibold mb-3">Personalized Recommendation</h3>
                  <p class="text-gray-700 leading-relaxed">
                    Based on your responses, we've created a customized plan just for you. 
                    This takes into account your preferences and goals to provide the most 
                    relevant recommendations.
                  </p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="text-lg font-semibold mb-3">Next Steps</h3>
                  <ul class="space-y-2 text-gray-700">
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Review your personalized results
                    </li>
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Download your custom report
                    </li>
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Get started with your plan
                    </li>
                  </ul>
                </div>
              </div>

              <div class="flex space-x-4">
                <button class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md">Download Report</button>
                <button class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md">Share Results</button>
              </div>
            </div>
          </div>
        `
        break

      default:
        sectionContent = `
          <div class="py-12 px-6 text-center">
            <div class="max-w-md mx-auto">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">${section.title || 'Section'}</h2>
              <p class="text-gray-600">${section.description || `${section.type} section`}</p>
            </div>
          </div>
        `
    }
  }

  // Generate mockup frame based on template
  let mockupContent = ''
  
  switch (templateId) {
    case 'phone-1':
      mockupContent = `
        <div style="width: 300px; height: 600px; position: relative; margin: 0 auto;">
          <div style="position: absolute; inset: 0; background: black; border-radius: 3rem; padding: 8px;">
            <div style="width: 100%; height: 100%; background: white; border-radius: 2.5rem; overflow: hidden; position: relative;">
              <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 128px; height: 24px; background: black; border-radius: 0 0 1rem 1rem; z-index: 10;"></div>
              <div style="width: 100%; height: 100%; overflow: hidden;">
                ${sectionContent}
              </div>
            </div>
          </div>
        </div>
      `
      break

    case 'desktop-1':
      mockupContent = `
        <div style="width: 600px; height: 400px; position: relative; margin: 0 auto;">
          <div style="width: 100%; height: 85%; background: black; border-radius: 8px 8px 0 0; padding: 12px;">
            <div style="width: 100%; height: 100%; background: white; border-radius: 6px; overflow: hidden;">
              <div style="height: 32px; background: #f3f4f6; display: flex; align-items: center; padding: 0 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; gap: 8px;">
                  <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
                  <div style="width: 12px; height: 12px; background: #eab308; border-radius: 50%;"></div>
                  <div style="width: 12px; height: 12px; background: #22c55e; border-radius: 50%;"></div>
                </div>
                <div style="flex: 1; margin: 0 16px;">
                  <div style="height: 20px; background: white; border-radius: 4px; border: 1px solid #d1d5db; display: flex; align-items: center; padding: 0 8px; font-size: 12px; color: #6b7280;">
                    https://your-tool.com
                  </div>
                </div>
              </div>
              <div style="height: calc(100% - 32px); overflow: hidden;">
                ${sectionContent}
              </div>
            </div>
          </div>
          <div style="position: absolute; bottom: 0; width: 100%; height: 15%; background: #d1d5db; border-radius: 0 0 8px 8px;"></div>
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 64px; height: 4px; background: #9ca3af; border-radius: 4px 4px 0 0;"></div>
        </div>
      `
      break

    case 'tablet-1':
      mockupContent = `
        <div style="width: 400px; height: 500px; position: relative; margin: 0 auto;">
          <div style="position: absolute; inset: 0; background: black; border-radius: 2rem; padding: 12px;">
            <div style="width: 100%; height: 100%; background: white; border-radius: 1.5rem; overflow: hidden; position: relative;">
              <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 128px; height: 4px; background: #d1d5db; border-radius: 2px;"></div>
              <div style="width: 100%; height: 100%; overflow: hidden; padding-bottom: 24px;">
                ${sectionContent}
              </div>
            </div>
          </div>
        </div>
      `
      break

    default:
      mockupContent = sectionContent
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Marketing Asset</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      </style>
    </head>
    <body>
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 600px; 
        padding: 32px;
        background: ${backgroundStyle};
      ">
        ${mockupContent}
      </div>
    </body>
    </html>
  `
}
