'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, publishCampaign } from '@/lib/data-access'
import { Campaign } from '@/lib/types/database'
import { CampaignSection, SectionType } from '@/lib/types/campaign-builder'
import { CampaignBuilderTopBar } from '@/components/campaign-builder/top-bar'
import { SectionsMenu } from '@/components/campaign-builder/sections-menu'
import { CanvasDropZone } from '@/components/campaign-builder/canvas-drop-zone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { DraggableSectionType } from '@/components/campaign-builder/draggable-section-type'

export default function CampaignBuilderPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<CampaignSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDragItem, setActiveDragItem] = useState<SectionType | null>(null)

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
      
      // TODO: Load actual campaign sections from database
      // For now, initialize with empty sections
      setSections([])
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

      // TODO: Save campaign sections to database
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Campaign saved:', campaign.id, { sections })
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

  const handleSectionAdd = (sectionType: SectionType) => {
    const newSection: CampaignSection = {
      id: `section-${Date.now()}`,
      type: sectionType.id,
      title: sectionType.name,
      settings: sectionType.defaultSettings || {},
      order: sections.length + 1,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setSections(prev => [...prev, newSection])
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'section-type') {
      setActiveDragItem(active.data.current.sectionType)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveDragItem(null)

    if (!over) return

    // Handle dropping section type onto canvas
    if (
      active.data.current?.type === 'section-type' &&
      over.data.current?.type === 'canvas'
    ) {
      const sectionType = active.data.current.sectionType as SectionType
      handleSectionAdd(sectionType)
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
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
              {/* Sidebar - Sections Menu */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <SectionsMenu />
                </Card>
              </div>

              {/* Main Content - Campaign Canvas */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Canvas</CardTitle>
                    <CardDescription>
                      Drag sections from the sidebar to build your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <CanvasDropZone
                      sections={sections}
                      className="h-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <DraggableSectionType
              sectionType={activeDragItem}
              className="shadow-lg rotate-3 opacity-90"
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
} 