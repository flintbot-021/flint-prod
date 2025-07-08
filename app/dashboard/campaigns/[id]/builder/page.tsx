'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, getCampaignSections, createSection, updateSection, deleteSection, reorderSections } from '@/lib/data-access'
import { Campaign, Section, SectionWithOptions } from '@/lib/types/database'
import { CampaignSection, SectionType, getSectionTypeById } from '@/lib/types/campaign-builder'
import { CampaignBuilderTopBar } from '@/components/campaign-builder/top-bar'
import { SectionsMenu } from '@/components/campaign-builder/sections-menu'

import { EnhancedSectionCard } from '@/components/campaign-builder/enhanced-section-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublishModal } from '@/components/campaign-builder/publish-modal'
import { CaptureProvider } from '@/contexts/capture-context'
import { toast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { useSectionPersistence } from '@/hooks/use-section-persistence'
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

import { EnhancedSortableCanvas } from '@/components/campaign-builder/enhanced-sortable-canvas'
import { cn } from '@/lib/utils'

// Helper functions to convert between database and UI types
const mapCampaignBuilderTypeToDatabase = (builderType: string): string => {
  const typeMap: Record<string, string> = {
    // Input & Questions
    'question-text': 'text_question',
    'question-multiple-choice': 'multiple_choice',
    'question-slider': 'slider',
    'question-slider-multiple': 'question-slider-multiple',
    'question-date-time': 'date_time_question',
    'question-upload': 'upload_question',
    
    // Content - Now preserve specific types
    'content-hero': 'content-hero',
    'content-basic': 'content-basic',
    
    // Capture
    'capture-details': 'capture',
    
    // Logic
    'logic-ai': 'logic',
    
    // Output
    'output-results': 'output',
    'output-download': 'output',
    'output-redirect': 'output',
    'output-dynamic-redirect': 'dynamic_redirect',
    'output-html-embed': 'html_embed'
  }
  
  return typeMap[builderType] || 'info' // Default fallback
}

const mapDatabaseTypeToCampaignBuilder = (dbType: string): string => {
  const typeMap: Record<string, string> = {
    'text_question': 'question-text',
    'multiple_choice': 'question-multiple-choice', 
    'slider': 'question-slider',
    'question-slider-multiple': 'question-slider-multiple',
    'date_time_question': 'question-date-time',
    'upload_question': 'question-upload',
    'info': 'content-basic', // Legacy info sections become basic content
    'content-hero': 'content-hero', // Preserve hero sections
    'content-basic': 'content-basic', // Preserve basic sections
    'capture': 'capture-details',
    'logic': 'logic-ai',
    'output': 'output-results',
    'dynamic_redirect': 'output-dynamic-redirect',
    'html_embed': 'output-html-embed'
  }
  
  return typeMap[dbType] || dbType // Return original if no mapping found
}

const convertDatabaseSectionToCampaignSection = (dbSection: SectionWithOptions): CampaignSection => {
  return {
    id: dbSection.id,
    type: mapDatabaseTypeToCampaignBuilder(dbSection.type),
    title: dbSection.title || '',
    settings: (dbSection.configuration as unknown) as Record<string, unknown>,
    order: dbSection.order_index,
    isVisible: true, // This could be stored in configuration if needed
    createdAt: dbSection.created_at,
    updatedAt: dbSection.updated_at
  }
}

const convertCampaignSectionToDatabase = (section: CampaignSection, campaignId: string) => {
  return {
    campaign_id: campaignId,
    type: mapCampaignBuilderTypeToDatabase(section.type) as any,
    title: section.title,
    description: null,
    order_index: section.order,
    configuration: section.settings,
    required: false // This could be determined from settings
  }
}

export default function CampaignBuilderPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  
  // State
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<CampaignSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDragItem, setActiveDragItem] = useState<SectionType | CampaignSection | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Section persistence hook
  const sectionPersistence = useSectionPersistence(params.id as string)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Load campaign data
  useEffect(() => {
    loadCampaign()
  }, [])

  const loadCampaign = async () => {
    if (!params.id || typeof params.id !== 'string') {
      setError('Invalid campaign ID')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await getCampaignById(params.id)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Campaign not found')
      }
      
      setCampaign(result.data)
      
      // Load sections from database
      const sectionsResult = await getCampaignSections(params.id)
      if (sectionsResult.success && sectionsResult.data) {
        const campaignSections = sectionsResult.data.map(convertDatabaseSectionToCampaignSection)
        console.log('Loaded sections from database:', campaignSections.map(s => ({ 
          id: s.id, 
          title: s.title, 
          order: s.order, 
          order_index: sectionsResult.data?.find(ds => ds.id === s.id)?.order_index 
        })))
        setSections(campaignSections)
      } else {
        console.error('Error loading sections:', sectionsResult.error)
        setSections([])
      }
    } catch (err) {
      console.error('Error loading campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }



  const handleCampaignNameChange = async (newName: string) => {
    if (!campaign) return

    try {
      setIsSaving(true)
      setError(null)

      const result = await updateCampaign(campaign.id, { name: newName })
      if (!result.success) {
        throw new Error(result.error || 'Failed to update campaign name')
      }

      setCampaign(prev => prev ? { ...prev, name: newName } : null)
      toast({
        title: 'Campaign name updated',
        description: 'Campaign name has been saved',
        duration: 2000
      })
    } catch (err) {
      console.error('Error updating campaign name:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign name'
      setError(errorMessage)
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err // Re-throw to let the inline editor handle it
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!campaign) return

    try {
      setIsSaving(true)
      setError(null)
      
      // Sections are automatically saved when created/updated/deleted
      // This manual save can be used for other campaign-level changes
      
      toast({
        title: 'Campaign saved',
        description: 'All changes have been saved successfully',
        duration: 3000
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

  // Check if campaign has mandatory sections
  const validateMandatorySections = () => {
    const hasCapture = sections.some(s => s.type === 'capture-details')
    const hasLogic = sections.some(s => s.type === 'logic-ai')
    const hasOutput = sections.some(s => 
      s.type === 'output-results' || 
      s.type === 'output-download' || 
      s.type === 'output-redirect' || 
      s.type === 'output-dynamic-redirect' ||
      s.type === 'output-html-embed'
    )
    
    return {
      isValid: hasCapture && hasLogic && hasOutput,
      missing: [
        ...(!hasCapture ? ['Capture section'] : []),
        ...(!hasLogic ? ['Logic section'] : []),
        ...(!hasOutput ? ['Output section'] : [])
      ]
    }
  }

  const mandatoryValidation = validateMandatorySections()

  const handlePreview = () => {
    if (!campaign) return
    
    // Check if mandatory sections exist
    if (!mandatoryValidation.isValid) {
      toast({
        title: 'Cannot preview campaign',
        description: `Missing required sections: ${mandatoryValidation.missing.join(', ')}`,
        variant: 'destructive'
      })
      return
    }
    
    const previewUrl = `/campaigns/${campaign.id}/preview`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePublish = () => {
    // Check if mandatory sections exist
    if (!mandatoryValidation.isValid) {
      toast({
        title: 'Cannot publish campaign',
        description: `Missing required sections: ${mandatoryValidation.missing.join(', ')}`,
        variant: 'destructive'
      })
      return
    }
    
    setShowPublishModal(true)
  }

  const handlePublishSuccess = (updatedCampaign: Campaign) => {
    setCampaign(updatedCampaign)
    setShowPublishModal(false)
  }

  const handleSectionAdd = async (sectionType: SectionType) => {
    if (!campaign) return

    try {
      setIsSaving(true)
      
      // Determine insert position based on selected section
      let insertIndex = sections.length
      if (selectedSectionId) {
        const selectedIndex = sections.findIndex(s => s.id === selectedSectionId)
        if (selectedIndex !== -1) {
          insertIndex = selectedIndex + 1
        }
      }
      
      // Create section with a high temporary order_index to avoid conflicts
      const sectionData = {
        campaign_id: campaign.id,
        type: mapCampaignBuilderTypeToDatabase(sectionType.id) as any,
        title: sectionType.name,
        description: null,
        order_index: 9999, // Temporary high value to avoid constraint conflicts
        configuration: (sectionType.defaultSettings || {}) as any,
        required: false
      }

      const result = await createSection(sectionData)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create section')
      }

      const newCampaignSection = convertDatabaseSectionToCampaignSection(result.data as SectionWithOptions)
      
      // Update local state immediately
      setSections(prev => {
        const newSections = [...prev]
        // Insert at the calculated position
        newSections.splice(insertIndex, 0, newCampaignSection)
        
        // Update order indices for all sections
        return newSections.map((section, index) => ({
          ...section,
          order: index + 1
        }))
      })

      // Now reorder all sections in the database with correct order_indices
      const allSectionsWithNew = [...sections]
      allSectionsWithNew.splice(insertIndex, 0, newCampaignSection)
      
      const reorderData = allSectionsWithNew.map((section, index) => ({
        id: section.id,
        order_index: index + 1
      }))
      
      // Apply the reordering in database
      if (reorderData.length > 0) {
        const reorderResult = await reorderSections(campaign.id, reorderData)
        if (!reorderResult.success) {
          console.error('Failed to reorder sections:', reorderResult.error)
        }
      }
      
      // Select the newly added section
      setSelectedSectionId(newCampaignSection.id)
      
      toast({
        title: 'Section added',
        description: selectedSectionId 
          ? `${sectionType.name} section has been added below the selected section`
          : `${sectionType.name} section has been added to your campaign`
      })
    } catch (err) {
      console.error('Error adding section:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add section'
      toast({
        title: 'Failed to add section',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSectionUpdate = async (sectionId: string, updates: Partial<CampaignSection>) => {
    try {
      setIsSaving(true)
      
      // Prepare database updates
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.settings !== undefined) dbUpdates.configuration = updates.settings
      if (updates.order !== undefined) dbUpdates.order_index = updates.order
      
      // Update in database
      const result = await updateSection(sectionId, dbUpdates)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update section')
      }
      
      // Update local state
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
    } finally {
      setIsSaving(false)
    }
  }

  const handleSectionDelete = async (sectionId: string) => {
    if (!campaign) return

    try {
      setIsSaving(true)
      
      // Delete from database
      const result = await deleteSection(sectionId)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete section')
      }
      
      setSections(prev => {
        const filtered = prev.filter(section => section.id !== sectionId)
        // Reorder remaining sections
        const reordered = filtered.map((section, index) => ({
          ...section,
          order: index + 1,
          updatedAt: new Date().toISOString()
        }))
        
        // Update order in database for remaining sections
        const reorderData = reordered.map(section => ({
          id: section.id,
          order_index: section.order
        }))
        
        if (reorderData.length > 0) {
          reorderSections(campaign.id, reorderData).catch(console.error)
        }
        
        toast({
          title: 'Section deleted',
          description: 'Section has been removed from your campaign'
        })
        
        return reordered
      })
    } catch (err) {
      console.error('Error deleting section:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete section'
      toast({
        title: 'Delete failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
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
    
    // Only handle campaign section dragging now
    if (active.data.current?.type === 'campaign-section') {
      setActiveDragItem(active.data.current.section)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveDragItem(null)

    if (!over) return

    // Handle reordering sections within canvas
    if (
      active.data.current?.type === 'campaign-section' &&
      over.data.current?.type === 'campaign-section'
    ) {
      const activeId = active.id as string
      const overId = over.id as string

      if (activeId !== overId) {
        console.log('Reordering sections:', { activeId, overId })
        
        setSections(items => {
          const oldIndex = items.findIndex(item => item.id === activeId)
          const newIndex = items.findIndex(item => item.id === overId)
          
          console.log('Current section order:', items.map(i => ({ id: i.id, title: i.title, order: i.order })))
          console.log('Moving from index', oldIndex, 'to index', newIndex)
          
          if (oldIndex === -1 || newIndex === -1) {
            console.error('Could not find section indices:', { oldIndex, newIndex, activeId, overId })
            return items
          }
          
          const reorderedItems = arrayMove(items, oldIndex, newIndex)
          // Update order property for all affected sections
          const updatedItems = reorderedItems.map((section, index) => ({
            ...section,
            order: index + 1,
            updatedAt: new Date().toISOString()
          }))
          
          console.log('New section order:', updatedItems.map(i => ({ id: i.id, title: i.title, order: i.order })))
          
          // Save reorder to database
          if (campaign) {
            const reorderData = updatedItems.map(section => ({
              id: section.id,
              order_index: section.order
            }))
            
            console.log('Saving reorder data to database:', reorderData)
            
            reorderSections(campaign.id, reorderData)
              .then((result) => {
                console.log('Reorder save result:', result)
                if (!result.success) {
                  console.error('Failed to save reorder:', result.error)
                  toast({
                    title: 'Reorder save failed',
                    description: result.error || 'Failed to save section order',
                    variant: 'destructive'
                  })
                }
              })
              .catch((error) => {
                console.error('Reorder save error:', error)
                toast({
                  title: 'Reorder save failed',
                  description: 'Failed to save section order',
                  variant: 'destructive'
                })
              })
          }
          
          return updatedItems
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
          <p className="text-muted-foreground">Loading campaign builder...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted">
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Campaign not found</p>
                  <button
                    onClick={() => router.push('/dashboard')}
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
    <CaptureProvider campaignId={campaign.id}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-background">
          {/* Campaign Builder Top Bar */}
          <CampaignBuilderTopBar
            campaignName={campaign.name}
            campaignStatus={campaign.status}
            isPublished={campaign.status === 'published'}
            isSaving={isSaving}
            canPublish={mandatoryValidation.isValid}
            canPreview={mandatoryValidation.isValid}
            validationErrors={mandatoryValidation.missing}
            onCampaignNameChange={handleCampaignNameChange}
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
                    <SectionsMenu onSectionAdd={handleSectionAdd} />
                  </Card>
                </div>

                {/* Main Content - Builder Canvas */}
                <div className="lg:col-span-3">
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Campaign Canvas</CardTitle>
                          <CardDescription>
                            Every campaign needs a Capture section, Logic section, and Output section. Click the placeholders below to add required sections, or use the sidebar for additional sections.
                          </CardDescription>
                        </div>

                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-140px)]">
                      <EnhancedSortableCanvas
                        sections={sections}
                        onSectionUpdate={handleSectionUpdate}
                        onSectionDelete={handleSectionDelete}
                        onSectionDuplicate={handleSectionDuplicate}
                        onSectionConfigure={handleSectionConfigure}
                        onSectionTypeChange={handleSectionTypeChange}
                        onSectionAdd={handleSectionAdd}
                        selectedSectionId={selectedSectionId}
                        onSectionSelect={setSelectedSectionId}
                        className="h-full"
                        showCollapsedSections={true}
                        campaignId={campaign?.id}
                        sectionPersistence={sectionPersistence}
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
          </DragOverlay>

          {showPublishModal && (
            <PublishModal
              campaign={campaign}
              isOpen={showPublishModal}
              onClose={() => setShowPublishModal(false)}
              onPublishSuccess={handlePublishSuccess}
              mandatoryValidationErrors={mandatoryValidation.missing}
            />
          )}
        </div>
      </DndContext>
    </CaptureProvider>
  )
} 