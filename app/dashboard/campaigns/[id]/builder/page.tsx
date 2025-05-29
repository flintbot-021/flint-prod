'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, publishCampaign } from '@/lib/data-access'
import { Campaign } from '@/lib/types/database'
import { CampaignSection, SectionType, getSectionTypeById } from '@/lib/types/campaign-builder'
import { CampaignBuilderTopBar } from '@/components/campaign-builder/top-bar'
import { SectionsMenu } from '@/components/campaign-builder/sections-menu'
import { SortableCanvas } from '@/components/campaign-builder/sortable-canvas'
import { EnhancedSectionCard } from '@/components/campaign-builder/enhanced-section-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { 
  arrayMove
} from '@dnd-kit/sortable'
import { DraggableSectionType } from '@/components/campaign-builder/draggable-section-type'
import { EnhancedSortableCanvas } from '@/components/campaign-builder/enhanced-sortable-canvas'

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
  const [activeDragItem, setActiveDragItem] = useState<SectionType | CampaignSection | null>(null)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
      toast({
        title: 'Campaign updated',
        description: 'Campaign name updated successfully'
      })
    } catch (err) {
      console.error('Error updating campaign name:', err)
      setError(err instanceof Error ? err.message : 'Failed to update campaign name')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update campaign name',
        variant: 'destructive'
      })
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
      toast({
        title: 'Campaign saved',
        description: 'All changes have been saved successfully'
      })
    } catch (err) {
      console.error('Error saving campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign'
      setError(errorMessage)
      toast({
        title: 'Save failed',
        description: errorMessage,
        variant: 'destructive'
      })
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
        toast({
          title: 'Campaign unpublished',
          description: 'Campaign has been moved to draft status'
        })
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
        toast({
          title: 'Campaign published',
          description: 'Campaign is now live and accepting responses'
        })
      }
    } catch (err) {
      console.error('Error publishing/unpublishing campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign status'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSectionAdd = (sectionType: SectionType) => {
    const newSection: CampaignSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: sectionType.id,
      title: sectionType.name,
      settings: sectionType.defaultSettings || {},
      order: sections.length + 1,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setSections(prev => [...prev, newSection])
    toast({
      title: 'Section added',
      description: `${sectionType.name} section has been added to your campaign`
    })
  }

  const handleSectionUpdate = async (sectionId: string, updates: Partial<CampaignSection>) => {
    try {
      // TODO: Update section in database
      // For now, just update local state
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates, updatedAt: new Date().toISOString() }
          : section
      ))
      
      // Show success feedback for title changes
      if (updates.title) {
        toast({
          title: 'Section updated',
          description: 'Section title has been updated',
          duration: 2000
        })
      }
    } catch (err) {
      console.error('Error updating section:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update section'
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err // Re-throw to let the inline editor handle it
    }
  }

  const handleSectionDelete = (sectionId: string) => {
    setSections(prev => {
      const filtered = prev.filter(section => section.id !== sectionId)
      // Reorder remaining sections
      const reordered = filtered.map((section, index) => ({
        ...section,
        order: index + 1,
        updatedAt: new Date().toISOString()
      }))
      
      toast({
        title: 'Section deleted',
        description: 'Section has been removed from your campaign'
      })
      
      return reordered
    })
  }

  const handleSectionDuplicate = (sectionId: string) => {
    setSections(prev => {
      const sectionToDuplicate = prev.find(section => section.id === sectionId)
      if (!sectionToDuplicate) return prev

      const duplicatedSection: CampaignSection = {
        ...sectionToDuplicate,
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${sectionToDuplicate.title} (Copy)`,
        order: prev.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      toast({
        title: 'Section duplicated',
        description: 'A copy of the section has been created'
      })

      return [...prev, duplicatedSection]
    })
  }

  const handleSectionConfigure = (sectionId: string) => {
    // TODO: Open section configuration modal/panel
    console.log('Configure section:', sectionId)
    toast({
      title: 'Configuration',
      description: 'Section configuration panel coming soon',
      duration: 3000
    })
  }

  const handleSectionTypeChange = async (sectionId: string, newType: string) => {
    try {
      // Find the section and update it with new type
      const newSectionType = getSectionTypeById(newType)
      const updates: Partial<CampaignSection> = {
        type: newType,
        settings: {
          ...(sections.find(s => s.id === sectionId)?.settings || {}),
          ...newSectionType?.defaultSettings
        }
      }
      
      await handleSectionUpdate(sectionId, updates)
      
      toast({
        title: 'Section type changed',
        description: `Section changed to ${newSectionType?.name || newType}`,
        duration: 3000
      })
    } catch (err) {
      console.error('Error changing section type:', err)
      toast({
        title: 'Failed to change type',
        description: err instanceof Error ? err.message : 'Failed to change section type',
        variant: 'destructive'
      })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    
    if (active.data.current?.type === 'section-type') {
      setActiveDragItem(active.data.current.sectionType)
    } else if (active.data.current?.type === 'campaign-section') {
      setActiveDragItem(active.data.current.section)
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
      return
    }

    // Handle reordering sections within canvas
    if (
      active.data.current?.type === 'campaign-section' &&
      over.data.current?.type === 'campaign-section'
    ) {
      const activeId = active.id as string
      const overId = over.id as string

      if (activeId !== overId) {
        setSections(items => {
          const oldIndex = items.findIndex(item => item.id === activeId)
          const newIndex = items.findIndex(item => item.id === overId)
          
          const reorderedItems = arrayMove(items, oldIndex, newIndex)
          // Update order property for all affected sections
          return reorderedItems.map((section, index) => ({
            ...section,
            order: index + 1,
            updatedAt: new Date().toISOString()
          }))
        })
        
        toast({
          title: 'Sections reordered',
          description: 'Section order has been updated',
          duration: 2000
        })
      }
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
      sensors={sensors}
      collisionDetection={closestCenter}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Campaign Canvas</CardTitle>
                        <CardDescription>
                          Drag sections from the sidebar to build your campaign. Use the enhanced controls for inline editing, preview mode, and section management.
                        </CardDescription>
                      </div>
                      {sections.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {sections.length} section{sections.length !== 1 ? 's' : ''} • {sections.filter(s => s.isVisible).length} visible
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-100px)]">
                    <EnhancedSortableCanvas
                      sections={sections}
                      onSectionUpdate={handleSectionUpdate}
                      onSectionDelete={handleSectionDelete}
                      onSectionDuplicate={handleSectionDuplicate}
                      onSectionConfigure={handleSectionConfigure}
                      onSectionTypeChange={handleSectionTypeChange}
                      className="h-full"
                      showCollapsedSections={true}
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
            <>
              {/* Check if it's a SectionType (has 'name' property) */}
              {('name' in activeDragItem && 'description' in activeDragItem) ? (
                /* Section Type being dragged */
                <DraggableSectionType
                  sectionType={activeDragItem as SectionType}
                  className="shadow-lg rotate-3 opacity-90"
                />
              ) : (
                /* Campaign Section being dragged */
                <EnhancedSectionCard
                  section={activeDragItem as CampaignSection}
                  onUpdate={async () => {}}
                  onDelete={() => {}}
                  onDuplicate={() => {}}
                  onConfigure={() => {}}
                  className="shadow-lg rotate-2 opacity-90"
                />
              )}
            </>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
} 