'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export default function ShortUrlPage() {
  const params = useParams()
  const router = useRouter()
  const shortId = params?.shortId as string
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortId) {
      setError('Invalid short URL')
      return
    }

    const redirectToSharedResult = async () => {
      try {
        // Fetch the shared result data
        const response = await fetch(`/api/shared-results/${shortId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This shared link was not found or has expired.')
          } else {
            setError('Failed to load shared content.')
          }
          return
        }

        const result = await response.json()
        
        if (!result.success) {
          setError(result.error || 'Failed to load shared content.')
          return
        }

        // Extract campaign info and shared data
        const { campaign, sharedData } = result.data
        
        if (!campaign || !campaign.user_key || !campaign.published_url) {
          setError('Campaign information is incomplete.')
          return
        }

        // Encode the shared data for URL (same format as before, but from database)
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(sharedData))))
        
        // Construct the campaign URL with shared data
        const campaignUrl = `/c/${campaign.user_key}/${campaign.published_url}?shared=${encodedData}&view=results`
        
        // Redirect to the campaign with restored data
        router.replace(campaignUrl)
        
      } catch (error) {
        console.error('Error loading shared result:', error)
        setError('Failed to load shared content. Please try again.')
      }
    }

    redirectToSharedResult()
  }, [shortId, router])

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Link Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Loading Shared Results
        </h1>
        <p className="text-muted-foreground">
          Please wait while we load your personalized content...
        </p>
      </div>
    </div>
  )
}
