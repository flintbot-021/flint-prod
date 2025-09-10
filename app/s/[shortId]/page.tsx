'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { AlertCircle, Loader2, ExternalLink, RotateCcw } from 'lucide-react'
import { Campaign } from '@/lib/types/database'
import { getCampaignTheme } from '@/components/campaign-renderer/utils'
import { SharedOutputAdvancedSection } from '@/components/campaign-renderer/SharedOutputAdvancedSection'
import { Button } from '@/components/ui/button'

interface SharedResultData {
  short_id: string
  campaign: Campaign
  shared_data: {
    aiResults: Record<string, any>
    sectionConfig?: Record<string, any>
    campaignId: string
    timestamp: number
  }
  view_count: number
  created_at: string
  expires_at: string
}

interface ErrorState {
  message: string
  type: 'not_found' | 'expired' | 'server_error'
}

export default function SharedResultsPage() {
  const params = useParams()
  const shortId = params?.shortId as string
  
  const [sharedResult, setSharedResult] = useState<SharedResultData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)

  useEffect(() => {
    if (shortId) {
      loadSharedResult()
    }
  }, [shortId])

  const loadSharedResult = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/shared-results/${shortId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError({
            message: 'This shared result could not be found. It may have been deleted or the link is incorrect.',
            type: 'not_found'
          })
        } else if (response.status === 410) {
          setError({
            message: 'This shared result has expired. Shared results are automatically deleted after 30 days.',
            type: 'expired'
          })
        } else {
          setError({
            message: 'Unable to load the shared result. Please try again later.',
            type: 'server_error'
          })
        }
        return
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        setError({
          message: 'Invalid shared result data received.',
          type: 'server_error'
        })
        return
      }

      setSharedResult(result.data)
    } catch (err) {
      console.error('Error loading shared result:', err)
      setError({
        message: 'Network error. Please check your connection and try again.',
        type: 'server_error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryThisTool = () => {
    if (!sharedResult?.campaign) return
    
    // Navigate to the original campaign using user_key
    const campaignUrl = `/c/${(sharedResult.campaign as any).user_key}/${sharedResult.campaign.published_url}`
    window.open(campaignUrl, '_blank')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Loading Shared Results</h1>
          <p className="text-muted-foreground">Please wait while we fetch the results...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error.type === 'not_found' ? 'Results Not Found' :
             error.type === 'expired' ? 'Results Expired' :
             'Something Went Wrong'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {error.message}
          </p>
          
          <div className="space-y-3">
            {error.type === 'server_error' && (
              <Button onClick={loadSharedResult} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render the shared results
  if (!sharedResult) {
    return notFound()
  }

  const { campaign, shared_data } = sharedResult
  const theme = getCampaignTheme(campaign)

  // Create a mock section for the OutputAdvancedSection
  const mockSection = {
    id: 'shared-results',
    title: 'Shared Results',
    type: 'output-advanced' as const,
    configuration: shared_data.aiResults || {},
    order_index: 0,
    campaign_id: campaign.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Create mock config that matches what OutputAdvancedSection expects
  // First try to use the stored section configuration, then fall back to aiResults
  let mockConfig = shared_data.sectionConfig || {
    rows: shared_data.aiResults?.rows || [],
    pageSettings: shared_data.aiResults?.pageSettings || {}
  }

  // If we still don't have rows, try to create them from the AI results
  if (!mockConfig.rows || mockConfig.rows.length === 0) {
    if (shared_data.aiResults && Object.keys(shared_data.aiResults).length > 0) {
      // Create a simple row structure from AI results
      mockConfig = {
        rows: [{
          id: 'generated-row',
          backgroundColor: 'transparent',
          blocks: [{
            id: 'generated-block',
            startPosition: 1,
            width: 3,
            content: Object.entries(shared_data.aiResults).map(([key, value], index) => ({
              id: `item-${index}`,
              type: key.includes('score') ? 'h3' : 'paragraph',
              content: typeof value === 'string' ? value : JSON.stringify(value)
            }))
          }]
        }],
        pageSettings: {
          maxColumns: 3,
          gridGap: 16,
          rowSpacing: 24
        }
      }
    }
  }

  console.log('🔍 Shared results debug:', {
    hasSharedData: !!shared_data,
    hasSectionConfig: !!shared_data.sectionConfig,
    hasAiResults: !!shared_data.aiResults,
    aiResultsKeys: shared_data.aiResults ? Object.keys(shared_data.aiResults) : [],
    configRows: mockConfig.rows?.length || 0,
    mockConfig
  })

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header with campaign info and "Try This Tool" button */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Shared Results: {campaign.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Viewed {sharedResult.view_count} times • 
                Created {new Date(sharedResult.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <Button
              onClick={handleTryThisTool}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Try This Tool
            </Button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1">
        <SharedOutputAdvancedSection
          campaign={campaign}
          sharedData={shared_data}
          config={mockConfig}
        />
      </div>

      {/* Footer with branding */}
      <div className="bg-white border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              This is a shared result from <strong>{campaign.name}</strong>
            </div>
            <div className="flex items-center space-x-4">
              <span>Powered by Flint</span>
              <Button
                onClick={handleTryThisTool}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Try it yourself
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
