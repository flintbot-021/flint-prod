'use client'

import React, { useEffect, useMemo } from 'react'
import { Code2 } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
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
  sections = []
}: SectionRendererProps) {
  const embedConfig = config as HtmlEmbedConfig
  
  const settings = {
    htmlContent: embedConfig?.htmlContent || '',
    previewTitle: embedConfig?.previewTitle || title || 'Results'
  }

  // Prepare the HTML with variables replaced
  const processedHtml = useMemo(() => {
    if (!settings.htmlContent) {
      return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
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
    console.log('🔍 Raw sections:', sections.map(s => ({ id: s.id, title: s.title, type: s.type })))
    console.log('🔍 Raw userInputs:', userInputs)

    // Build variables from all campaign data
    const inputVariables = buildVariablesFromInputs(sections, userInputs)
    console.log('📊 Input variables result:', inputVariables)
    
    const aiVariables = getAITestResults() || {}
    console.log('🤖 AI variables result:', aiVariables)
    
    const allData = {
      ...inputVariables,
      ...aiVariables
    }

    console.log('🚀 Final data for variable replacement:', allData)
    console.log('📊 Available variable keys:', Object.keys(allData))

    // Process HTML content to replace variables
    let processedContent = settings.htmlContent

    // Method 1: Replace elements with variable-name attributes
    // We'll use a temporary DOM parser to find and replace elements
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = processedContent
    
    // Find all elements with variable-name attributes
    const variableElements = tempDiv.querySelectorAll('[variable-name]')
    console.log('🔍 Found elements with variable-name attributes:', variableElements.length)
    
    variableElements.forEach(element => {
      const variableName = element.getAttribute('variable-name')
      if (variableName && allData.hasOwnProperty(variableName)) {
        const value = allData[variableName]
        console.log(`✅ Replacing variable-name="${variableName}" with value: "${value}"`)
        element.textContent = String(value)
      } else {
        console.log(`❌ No data found for variable-name="${variableName}"`)
      }
    })

    // Also support legacy data-variable attributes for backwards compatibility
    const legacyElements = tempDiv.querySelectorAll('[data-variable]')
    console.log('🔍 Found elements with data-variable attributes:', legacyElements.length)
    
    legacyElements.forEach(element => {
      const variableName = element.getAttribute('data-variable')
      if (variableName && allData.hasOwnProperty(variableName)) {
        const value = allData[variableName]
        console.log(`✅ Replacing data-variable="${variableName}" with value: "${value}"`)
        element.textContent = String(value)
      } else {
        console.log(`❌ No data found for data-variable="${variableName}"`)
      }
    })

    // Method 2: Replace @variable syntax in text content
    let finalContent = tempDiv.innerHTML
    Object.entries(allData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const regex = new RegExp(`@${key}\\b`, 'g')
        const replaced = finalContent.replace(regex, String(value))
        if (replaced !== finalContent) {
          console.log(`✅ Replaced @${key} with value: "${value}"`)
          finalContent = replaced
        }
      }
    })

    console.log('✅ HTML processing complete')
    return finalContent

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
    <div className="min-h-screen bg-background">
      <div 
        className="w-full"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={{
          // Ensure full viewport usage
          minHeight: '100vh',
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
                variableCount: Object.keys(buildVariablesFromInputs(sections, userInputs)).length
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default HtmlEmbedSection 