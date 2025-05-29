'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, publishCampaign } from '@/lib/data-access'
import { Campaign } from '@/lib/types/database'
import { CampaignBuilderTopBar } from '@/components/campaign-builder/top-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Palette, Type, Layout, Settings } from 'lucide-react'

export default function CampaignBuilderPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && campaignId) {
      loadCampaign()
    }
  }, [user, campaignId])

  const loadCampaign = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getCampaignById(campaignId)

      if (!result.success) {
        throw new Error(result.error || 'Failed to load campaign')
      }

      if (!result.data) {
        throw new Error('Campaign not found')
      }

      setCampaign(result.data)
    } catch (err) {
      console.error('Error loading campaign:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCampaignNameChange = async (newName: string) => {
    if (!campaign) return

    try {
      setIsSaving(true)
      const result = await updateCampaign(campaign.id, { name: newName })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update campaign name')
      }

      setCampaign(prev => prev ? { ...prev, name: newName } : null)
    } catch (err) {
      console.error('Error updating campaign name:', err)
      setError(err instanceof Error ? err.message : 'Failed to update campaign name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!campaign) return

    try {
      setIsSaving(true)
      setError(null)

      // Here you would save any changes to the campaign
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Campaign saved:', campaign.id)
    } catch (err) {
      console.error('Error saving campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (!campaign) return
    
    // Open preview in new tab/window
    const previewUrl = `/campaigns/${campaign.id}/preview`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePublish = async () => {
    if (!campaign) return

    try {
      setIsSaving(true)
      setError(null)

      if (campaign.status === 'published') {
        // Unpublish - change status to draft
        const result = await updateCampaign(campaign.id, { status: 'draft' })
        if (!result.success) {
          throw new Error(result.error || 'Failed to unpublish campaign')
        }
        setCampaign(prev => prev ? { ...prev, status: 'draft', published_at: null } : null)
      } else {
        // Publish
        const result = await publishCampaign(campaign.id)
        if (!result.success) {
          throw new Error(result.error || 'Failed to publish campaign')
        }
        setCampaign(prev => prev ? { 
          ...prev, 
          status: 'published', 
          published_at: new Date().toISOString()
        } : null)
      }
    } catch (err) {
      console.error('Error publishing/unpublishing campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to update campaign status')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading campaign builder...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error loading campaign</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                      onClick={loadCampaign}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-600">Campaign not found</p>
                  <button
                    onClick={() => router.push('/dashboard/campaigns')}
                    className="mt-2 text-blue-600 underline hover:no-underline"
                  >
                    Back to Campaigns
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Campaign Builder Top Bar */}
      <CampaignBuilderTopBar
        campaignName={campaign.name}
        campaignStatus={campaign.status}
        isPublished={campaign.status === 'published'}
        isSaving={isSaving}
        canPublish={true}
        onCampaignNameChange={handleCampaignNameChange}
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-sm underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Builder Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Builder Tools */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Builder Tools</CardTitle>
                  <CardDescription>
                    Customize your campaign sections and design
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Layout className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Sections</p>
                        <p className="text-sm text-gray-500">Add & organize content</p>
                      </div>
                    </button>

                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Palette className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Design</p>
                        <p className="text-sm text-gray-500">Colors & styling</p>
                      </div>
                    </button>

                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Type className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Typography</p>
                        <p className="text-sm text-gray-500">Fonts & text styles</p>
                      </div>
                    </button>

                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Settings</p>
                        <p className="text-sm text-gray-500">Campaign options</p>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Campaign Preview */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Preview</CardTitle>
                  <CardDescription>
                    This is how your campaign will appear to visitors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Campaign Preview Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                    <div className="text-gray-500">
                      <Layout className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Start Building Your Campaign</h3>
                      <p className="text-sm">
                        Select a tool from the sidebar to begin customizing your campaign.
                        Add sections, customize the design, and create an engaging experience for your visitors.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 