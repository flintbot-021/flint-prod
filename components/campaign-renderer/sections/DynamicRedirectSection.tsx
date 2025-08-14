'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Globe, ExternalLink, Loader2 } from 'lucide-react'
import { SectionRendererProps } from '../types'
import { cn } from '@/lib/utils'
import { getCampaignTheme, getCampaignTextColor, getCampaignButtonStyles } from '../utils'
import { buildVariablesFromInputs } from '@/lib/utils/section-variables'
import { getAITestResults } from '@/lib/utils/ai-test-storage'

interface DynamicRedirectConfig {
  targetUrl?: string
  dataTransmissionMethod?: 'localStorage' | 'sessionStorage' | 'urlParams' | 'postMessage'
  preloaderMessage?: string
  variableMappings?: any[]
}

export function DynamicRedirectSection({
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
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasRedirectedRef = useRef(false)

  const redirectConfig = config as DynamicRedirectConfig
  
  // Theme styles
  const theme = getCampaignTheme(campaign)
  const primaryTextStyle = getCampaignTextColor(campaign, 'primary')
  const mutedTextStyle = getCampaignTextColor(campaign, 'muted')
  const primaryButtonStyle = getCampaignButtonStyles(campaign, 'primary')
  
  const settings = {
    targetUrl: redirectConfig?.targetUrl || '',
    dataTransmissionMethod: redirectConfig?.dataTransmissionMethod || 'postMessage',
    preloaderMessage: redirectConfig?.preloaderMessage || 'Get your personalized results',
    variableMappings: redirectConfig?.variableMappings || []
  }

  // Prepare data for transmission
  const prepareAndRedirect = async () => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      console.log('🛑 Redirect already happened, skipping')
      return
    }
    
    try {
      console.log('🔍 =================================')
      console.log('🔍 DYNAMIC REDIRECT DEBUG SESSION')
      console.log('🔍 =================================')
      console.log('📋 Total sections received:', sections.length)
      console.log('📝 Total user inputs received:', Object.keys(userInputs).length)
      console.log('🔍 Raw sections:', sections.map(s => ({ id: s.id, title: s.title, type: s.type })))
      console.log('🔍 Raw userInputs:', userInputs)
      
      // Build variables from all campaign data
      const inputVariables = buildVariablesFromInputs(sections, userInputs)
      console.log('📊 Input variables result:', inputVariables)
      
      const aiVariables = campaign?.id ? getAITestResults(campaign.id) : {}
      console.log('🤖 AI variables result:', aiVariables)
      
      const allData = {
        ...inputVariables,
        ...aiVariables,
        // Add metadata
        campaignId: section.id,
        timestamp: new Date().toISOString(),
        source: 'flint-campaign'
      }

      console.log('🚀 Final data to store:', allData)
      console.log('📊 Data keys:', Object.keys(allData))
      console.log('📊 Data values:', Object.values(allData))

      // Transmit data based on method
      switch (settings.dataTransmissionMethod) {
        case 'localStorage':
          const dataToStore = JSON.stringify(allData)
          console.log('💾 About to store data:', dataToStore)
          localStorage.setItem('flint_campaign_data', dataToStore)
          const storedData = localStorage.getItem('flint_campaign_data')
          console.log('✅ Verification - Data stored in localStorage:', storedData)
          console.log('🔍 Verification - Parsed stored data:', JSON.parse(storedData || '{}'))
          
          // Open window for localStorage
          console.log('🚀 Opening Webflow page for localStorage method...')
          window.open(settings.targetUrl, '_blank')
          hasRedirectedRef.current = true
          return
          
        case 'sessionStorage':
          sessionStorage.setItem('flint_campaign_data', JSON.stringify(allData))
          
          // Open window for sessionStorage
          console.log('🚀 Opening Webflow page for sessionStorage method...')
          window.open(settings.targetUrl, '_blank')
          hasRedirectedRef.current = true
          return
          
        case 'urlParams':
          // For URL params, we need to be careful about URL length limits
          const urlParams = new URLSearchParams()
          
          // Only include essential data for URL params due to length limits
          Object.entries(allData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              const stringValue = String(value)
              // Skip very long values to prevent URL overflow
              if (stringValue.length < 100) {
                urlParams.set(key, stringValue)
              }
            }
          })
          
          const separator = settings.targetUrl.includes('?') ? '&' : '?'
          const finalUrl = `${settings.targetUrl}${separator}${urlParams.toString()}`
          
          // Check URL length (most browsers support ~2000 chars)
          if (finalUrl.length > 1900) {
            console.warn('URL too long, falling back to postMessage method')
            // Store data temporarily in sessionStorage with a unique key
            const transferKey = `flint_transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            sessionStorage.setItem(transferKey, JSON.stringify(allData))
            
            // Open target window with transfer key
            const keyParam = settings.targetUrl.includes('?') ? '&' : '?'
            const transferUrl = `${settings.targetUrl}${keyParam}flint_key=${transferKey}`
            
            console.log('🚀 Opening Webflow page with postMessage transfer (URL fallback)...')
            const targetWindow = window.open(transferUrl, '_blank')
            
            // Send data via postMessage after a short delay (let page load)
            setTimeout(() => {
              if (targetWindow && !targetWindow.closed) {
                console.log('📤 Sending data via postMessage (URL fallback)...')
                targetWindow.postMessage({
                  type: 'FLINT_CAMPAIGN_DATA',
                  data: allData,
                  transferKey: transferKey
                }, '*')
                
                // Clean up after sending
                setTimeout(() => {
                  sessionStorage.removeItem(transferKey)
                }, 5000)
              }
            }, 1000)
            
            hasRedirectedRef.current = true
            return
          } else {
            // For URL params, open in new window for debugging
            console.log('🚀 Opening Webflow page with URL params in new window for debugging...')
            window.open(finalUrl, '_blank')
            hasRedirectedRef.current = true
            return
          }
          break
          
        case 'postMessage':
        default:
          // Use postMessage API for cross-origin data transfer (best approach)
          // Store data temporarily in sessionStorage with a unique key
          const transferKey = `flint_transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          sessionStorage.setItem(transferKey, JSON.stringify(allData))
          
          // Open target window with transfer key
          const keyParam = settings.targetUrl.includes('?') ? '&' : '?'
          const transferUrl = `${settings.targetUrl}${keyParam}flint_key=${transferKey}`
          
          console.log('🚀 Opening Webflow page with postMessage transfer...')
          const targetWindow = window.open(transferUrl, '_blank')
          
          // Send data via postMessage after a short delay (let page load)
          setTimeout(() => {
            if (targetWindow && !targetWindow.closed) {
              console.log('📤 Sending data via postMessage...')
              targetWindow.postMessage({
                type: 'FLINT_CAMPAIGN_DATA',
                data: allData,
                transferKey: transferKey
              }, '*') // In production, specify exact origin for security
              
              // Clean up after sending
              setTimeout(() => {
                sessionStorage.removeItem(transferKey)
              }, 5000)
            }
          }, 1000)
          
          hasRedirectedRef.current = true
          return
      }

    } catch (error) {
      console.error('Error preparing redirect data:', error)
      setError('Failed to prepare data for redirect')
    }
  }

  useEffect(() => {
    // Validate URL on mount
    if (!settings.targetUrl) {
      setError('No target URL configured')
      return
    }

    try {
      new URL(settings.targetUrl)
    } catch {
      setError('Invalid target URL')
      return
    }

    // Complete section immediately when component mounts
    onSectionComplete(index, {
      [section.id]: 'redirect_ready',
      redirect_target: settings.targetUrl,
      data_method: settings.dataTransmissionMethod
    })
  }, [])

  const handleRedirect = () => {
    if (!hasRedirectedRef.current && settings.targetUrl) {
      console.log('🚀 Opening personalized page...')
      setIsRedirecting(true)
      prepareAndRedirect()
    }
  }

  if (error) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 
                className={cn(
                  "font-bold",
                  deviceInfo?.type === 'mobile' ? "text-xl" : "text-2xl"
                )}
                style={primaryTextStyle}
              >
                Redirect Error
              </h1>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs" style={mutedTextStyle}>
                Please contact support or try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg mx-auto text-center space-y-8">
          
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {isRedirecting ? (
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            ) : (
              <Globe className="h-10 w-10 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 
              className={cn(
                "font-bold",
                deviceInfo?.type === 'mobile' ? "text-2xl" : "text-3xl"
              )}
              style={primaryTextStyle}
            >
              {title || settings.preloaderMessage}
            </h1>
            
            {description && (
              <p style={mutedTextStyle}>{description}</p>
            )}

            {isRedirecting && (
              <p className="text-sm" style={mutedTextStyle}>
                Taking you to your personalized page...
              </p>
            )}
          </div>

          {/* Redirect button */}
          {!isRedirecting && (
            <button
              onClick={handleRedirect}
              className={cn(
                "px-8 py-4 rounded-lg font-semibold transition-all duration-200",
                "flex items-center space-x-3 mx-auto text-lg",
                "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                "text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              )}
            >
              <span>View Your Results</span>
              <ExternalLink className="h-5 w-5" />
            </button>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                🔍 Debug: Redirect Configuration
              </summary>
              <pre className="text-gray-600 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify({
                  targetUrl: settings.targetUrl,
                  method: settings.dataTransmissionMethod,
                  mappingsCount: settings.variableMappings.length
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export default DynamicRedirectSection 