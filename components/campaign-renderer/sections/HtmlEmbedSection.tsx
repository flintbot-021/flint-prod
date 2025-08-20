'use client'

import React, { useEffect, useMemo } from 'react'
import { Code2 } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getCampaignTheme } from '../utils'
import { buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { getAITestResults } from '@/lib/utils/ai-test-storage'

interface HtmlEmbedConfig {
  htmlContent?: string
  previewTitle?: string
}

export function HtmlEmbedSection({
  section,
  index,
  config,
  title,
  description,
  deviceInfo,
  onSectionComplete,
  userInputs = {},
  sections = [],
  campaign
}: SectionRendererProps) {
  const embedConfig = config as HtmlEmbedConfig
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  
  const settings = {
    htmlContent: embedConfig?.htmlContent || '',
    previewTitle: embedConfig?.previewTitle || title || 'Results'
  }

  // Prepare the HTML with variables replaced
  const processedHtml = useMemo(() => {
    if (!settings.htmlContent) {
      return `
        <div class="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div class="text-center">
            <div style="width: 4rem; height: 4rem; margin: 0 auto 1rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">
              ${settings.previewTitle}
            </h2>
            <p style="color: #6b7280;">
              No HTML content configured for this section
            </p>
          </div>
        </div>
      `
    }

    console.log('🔍 =================================')
    console.log('🔍 HTML EMBED SECTION DEBUG')
    console.log('🔍 =================================')
    console.log('📋 Total sections received:', sections.length)
    console.log('📝 Total user inputs received:', Object.keys(userInputs).length)

    // Build variables from all campaign data
    const inputVariables = buildVariablesFromInputs(sections, userInputs)
    console.log('📊 Input variables result:', inputVariables)
    
    const aiVariables = campaign?.id ? getAITestResults(campaign.id) : {}
    console.log('🤖 AI variables result:', aiVariables)
    
    const allData = {
      ...inputVariables,
      ...aiVariables
    }

    console.log('🚀 Final data for variable replacement:', allData)
    console.log('📊 Available variable keys:', Object.keys(allData))

    // Simple @variable replacement - just like AI prompts!
    let processedContent = settings.htmlContent
    
    Object.entries(allData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Replace @variable with the actual value
        const regex = new RegExp(`@${key}\\b`, 'g')
        const oldContent = processedContent
        processedContent = processedContent.replace(regex, String(value))
        
        if (processedContent !== oldContent) {
          console.log(`✅ Replaced @${key} with: "${value}"`)
        }
      }
    })

    console.log('✅ HTML processing complete')
    return processedContent

  }, [settings.htmlContent, sections, userInputs])

  useEffect(() => {
    // Complete section immediately when component mounts
    onSectionComplete(index, {
      [section.id]: 'html_embed_rendered',
      html_content_length: settings.htmlContent.length,
      has_custom_html: !!settings.htmlContent
    })
  }, [])

  // Render the processed HTML
  return (
    <div className="h-full" style={{ backgroundColor: theme.backgroundColor }}>
      <div 
        className="w-full"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={{
          // Ensure full viewport usage minus header height
          minHeight: 'calc(100vh - 4rem)',
          width: '100%'
        }}
      />
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-sm">
          <details>
            <summary className="cursor-pointer font-medium mb-2">
              🔍 Debug: HTML Embed
            </summary>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify({
                hasContent: !!settings.htmlContent,
                contentLength: settings.htmlContent.length,
                variableCount: Object.keys(buildVariablesFromInputs(sections, userInputs)).length,
                availableVariables: Object.keys(buildVariablesFromInputs(sections, userInputs)).concat(Object.keys(campaign?.id ? getAITestResults(campaign.id) : {}))
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default HtmlEmbedSection 