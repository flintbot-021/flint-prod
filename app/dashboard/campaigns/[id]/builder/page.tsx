'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getCampaignById, updateCampaign, getCampaignSections, createSection, updateSection, deleteSection, reorderSections } from '@/lib/data-access'
import { Campaign, Section, SectionWithOptions } from '@/lib/types/database'
import { CampaignSection, SectionType, getSectionTypeById } from '@/lib/types/campaign-builder'
import { CampaignBuilderTopBar } from '@/components/campaign-builder/top-bar'
import { SectionsMenu } from '@/components/campaign-builder/sections-menu'
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
import { DragPreview } from '@/components/campaign-builder/drag-preview'
import { cn } from '@/lib/utils'
import { isQuestionSection, titleToVariableName, updateAILogicVariableReferences, updateOutputSectionVariableReferences } from '@/lib/utils/section-variables'
import { updateAITestResultVariableName, updateAITestResultVariableNames } from '@/lib/utils/ai-test-storage'
import { createVariableName } from '@/lib/utils/variable-extractor'
import { OnboardingCarousel } from '@/components/campaign-builder/OnboardingCarousel';

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
  const config = (dbSection.configuration as any) || {}
  
  return {
    id: dbSection.id,
    type: mapDatabaseTypeToCampaignBuilder(dbSection.type),
    title: dbSection.title || '',
    settings: (() => {
      const { isVisible, ...settings } = config
      return settings
    })(),
    order: dbSection.order_index,
    isVisible: config.isVisible !== undefined ? config.isVisible : true, // Read from configuration, default to true
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
    configuration: {
      ...section.settings,
      isVisible: section.isVisible // Store visibility in configuration
    },
    required: false // This could be determined from settings
  }
}

export default function ToolBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useAuth()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<CampaignSection[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [activeDragItem, setActiveDragItem] = useState<CampaignSection | null>(null)
  const [isAutoReordering, setIsAutoReordering] = useState(false) // Track automatic reordering
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only show onboarding if not dismissed
    if (typeof window !== 'undefined' && !localStorage.getItem('flint_builder_onboarding_dismissed')) {
      setShowOnboarding(true);
    }
  }, []);

  const sectionPersistence = useSectionPersistence(params.id as string)

  // DnD sensors for pointer interactions  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (user && params.id) {
      loadCampaign()
    }
  }, [user, params.id])

  const loadCampaign = async () => {
    if (!params.id || typeof params.id !== 'string') {
      setError('Invalid tool ID')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const result = await getCampaignById(params.id)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Tool not found')
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tool'
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
        throw new Error(result.error || 'Failed to update tool name')
      }

      setCampaign(prev => prev ? { ...prev, name: newName } : null)
      toast({
        title: 'Tool name updated',
        description: 'Tool name has been saved',
        duration: 2000
      })
    } catch (err) {
      console.error('Error updating campaign name:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tool name'
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
        title: 'Tool saved',
        description: 'All changes have been saved successfully',
        duration: 3000
      })
    } catch (err) {
      console.error('Error saving campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save tool'
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
        title: 'Cannot preview tool',
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
        title: 'Cannot publish tool',
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

  const handlePause = () => {
    setShowPublishModal(true)
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
      
      // Generate unique title for question sections
      let sectionTitle = sectionType.name
      let wasRenamed = false
      
      if (isQuestionSection(sectionType.id)) {
        const baseVariableName = createVariableName(sectionType.name)
        const existingTitles = sections.map(s => s.title.toLowerCase())
        
        // Check if the base name already exists
        let uniqueTitle = baseVariableName
        let counter = 2
        
        while (existingTitles.includes(uniqueTitle)) {
          uniqueTitle = `${baseVariableName}${counter}`
          counter++
          wasRenamed = true
        }
        
        sectionTitle = uniqueTitle
      }
      
      // Create section with a high temporary order_index to avoid conflicts
      const sectionData = {
        campaign_id: campaign.id,
        type: mapCampaignBuilderTypeToDatabase(sectionType.id) as any,
        title: sectionTitle,
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
      
      // Show appropriate toast message with a slight delay to avoid timing issues
      setTimeout(() => {
        if (wasRenamed) {
          toast({
            title: '💡 Variable name updated',
            description: `Added ${sectionType.name} section with variable name "${sectionTitle}". Consider naming it something more descriptive that reflects this section, so it's easily identifiable.`,
            duration: 8000
          })
        } else {
          toast({
            title: 'Section added',
            description: selectedSectionId 
              ? `${sectionType.name} section has been added below the selected section`
              : `${sectionType.name} section has been added to your campaign`
          })
        }
      }, 100)
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
      
      // Get the current section for variable name comparison
      const currentSection = sections.find(section => section.id === sectionId)
      if (!currentSection) {
        throw new Error('Section not found')
      }
      
      // Check if this is a question section with a title change
      let oldVariableName: string | null = null
      let newVariableName: string | null = null
      let variableNameChanged = false
      
      if (updates.title !== undefined && isQuestionSection(currentSection.type)) {
        oldVariableName = titleToVariableName(currentSection.title)
        newVariableName = titleToVariableName(updates.title)
        variableNameChanged = oldVariableName !== newVariableName
      }
      
      // Check if this is an AI logic section with output variable changes
      let outputVariableNameMap: Record<string, string> = {}
      let outputVariablesChanged = false
      
      if (updates.settings !== undefined && currentSection.type === 'logic-ai') {
        const oldOutputVariables = (currentSection.settings as any)?.outputVariables || []
        const newOutputVariables = (updates.settings as any)?.outputVariables || []
        
        // Create a map of old name -> new name for variables that changed
        if (Array.isArray(oldOutputVariables) && Array.isArray(newOutputVariables)) {
          oldOutputVariables.forEach((oldVar: any) => {
            const matchingNewVar = newOutputVariables.find((newVar: any) => newVar.id === oldVar.id)
            if (matchingNewVar && oldVar.name !== matchingNewVar.name && oldVar.name && matchingNewVar.name) {
              outputVariableNameMap[oldVar.name] = matchingNewVar.name
              outputVariablesChanged = true
            }
          })
        }
      }
      
      // Prepare database updates
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.settings !== undefined) dbUpdates.configuration = updates.settings
      if (updates.order !== undefined) dbUpdates.order_index = updates.order
      if (updates.isVisible !== undefined) {
        // Store isVisible in configuration
        dbUpdates.configuration = {
          ...dbUpdates.configuration,
          isVisible: updates.isVisible
        }
      }
      
      // Update in database
      const result = await updateSection(sectionId, dbUpdates)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update section')
      }
      
      // If variable name changed, update all references in other sections
      if (variableNameChanged && oldVariableName && newVariableName) {
        // Update stored AI test results with new variable name
        updateAITestResultVariableName(oldVariableName, newVariableName)
        
        const sectionsToUpdate: { id: string; updates: Partial<CampaignSection> }[] = []
        
        // Find all sections that might reference the variable
        sections.forEach(section => {
          if (section.id === sectionId) return // Skip the current section
          
          let sectionUpdates: Partial<CampaignSection> = {}
          
          // Check AI logic sections
          if (section.type === 'logic-ai') {
            const updatedSettings = updateAILogicVariableReferences(
              section.settings,
              oldVariableName,
              newVariableName
            )
            // Only update if the function returned a different object reference
            if (updatedSettings !== section.settings) {
              sectionUpdates.settings = updatedSettings
            }
          }
          
          // Check output sections
          if (section.type.startsWith('output-')) {
            const updatedSettings = updateOutputSectionVariableReferences(
              section.settings,
              oldVariableName,
              newVariableName
            )
            // Only update if the function returned a different object reference
            if (updatedSettings !== section.settings) {
              sectionUpdates.settings = updatedSettings
            }
          }
          
          // Check content sections that might reference variables
          if (section.type.startsWith('content-')) {
            const updatedSettings = updateOutputSectionVariableReferences(
              section.settings,
              oldVariableName,
              newVariableName
            )
            // Only update if the function returned a different object reference
            if (updatedSettings !== section.settings) {
              sectionUpdates.settings = updatedSettings
            }
          }
          
          // If there are updates, add to the list
          if (Object.keys(sectionUpdates).length > 0) {
            sectionsToUpdate.push({
              id: section.id,
              updates: sectionUpdates
            })
          }
        })
        
        // Update all sections that reference the variable
        for (const sectionUpdate of sectionsToUpdate) {
          const dbUpdates: any = {}
          if (sectionUpdate.updates.settings) {
            dbUpdates.configuration = sectionUpdate.updates.settings
          }
          
          const updateResult = await updateSection(sectionUpdate.id, dbUpdates)
          if (!updateResult.success) {
            console.error(`Failed to update section ${sectionUpdate.id}:`, updateResult.error)
          }
        }
        
        // Update local state for all affected sections
        setSections(prev => prev.map(section => {
          if (section.id === sectionId) {
            return { ...section, ...updates, updatedAt: new Date().toISOString() }
          }
          
          // Check if this section was updated due to variable reference changes
          const sectionUpdate = sectionsToUpdate.find(su => su.id === section.id)
          if (sectionUpdate) {
            return { ...section, ...sectionUpdate.updates, updatedAt: new Date().toISOString() }
          }
          
          return section
        }))
        
        // Show success feedback for variable name changes
        if (sectionsToUpdate.length > 0) {
          toast({
            title: 'Variable references updated',
            description: `Updated @${oldVariableName} to @${newVariableName} in ${sectionsToUpdate.length} section(s)`,
            duration: 3000
          })
        }
      }
      
      // Handle AI logic output variable changes
      if (outputVariablesChanged && Object.keys(outputVariableNameMap).length > 0) {
        // Update stored AI test results with new output variable names
        updateAITestResultVariableNames(outputVariableNameMap)
        
        const sectionsToUpdate: { id: string; updates: Partial<CampaignSection> }[] = []
        
        // Find all output sections that might reference the changed output variables
        sections.forEach(section => {
          if (section.id === sectionId) return // Skip the current section
          
          let sectionUpdates: Partial<CampaignSection> = {}
          
          // Check output sections for references to the changed output variables
          if (section.type.startsWith('output-')) {
            let settingsUpdated = { ...section.settings }
            let hasUpdates = false
            
            // Update each changed output variable name in the section
            Object.entries(outputVariableNameMap).forEach(([oldName, newName]) => {
              const updatedSettings = updateOutputSectionVariableReferences(
                settingsUpdated,
                oldName,
                newName
              )
              if (updatedSettings !== settingsUpdated) {
                settingsUpdated = updatedSettings
                hasUpdates = true
              }
            })
            
            if (hasUpdates) {
              sectionUpdates.settings = settingsUpdated
            }
          }
          
          // Check content sections that might reference the output variables
          if (section.type.startsWith('content-')) {
            let settingsUpdated = { ...section.settings }
            let hasUpdates = false
            
            // Update each changed output variable name in the section
            Object.entries(outputVariableNameMap).forEach(([oldName, newName]) => {
              const updatedSettings = updateOutputSectionVariableReferences(
                settingsUpdated,
                oldName,
                newName
              )
              if (updatedSettings !== settingsUpdated) {
                settingsUpdated = updatedSettings
                hasUpdates = true
              }
            })
            
            if (hasUpdates) {
              sectionUpdates.settings = settingsUpdated
            }
          }
          
          // If there are updates, add to the list
          if (Object.keys(sectionUpdates).length > 0) {
            sectionsToUpdate.push({
              id: section.id,
              updates: sectionUpdates
            })
          }
        })
        
        // Update all sections that reference the changed output variables
        for (const sectionUpdate of sectionsToUpdate) {
          const dbUpdates: any = {}
          if (sectionUpdate.updates.settings) {
            dbUpdates.configuration = sectionUpdate.updates.settings
          }
          
          const updateResult = await updateSection(sectionUpdate.id, dbUpdates)
          if (!updateResult.success) {
            console.error(`Failed to update section ${sectionUpdate.id}:`, updateResult.error)
          }
        }
        
        // Update local state for all affected sections
        setSections(prev => prev.map(section => {
          if (section.id === sectionId) {
            return { ...section, ...updates, updatedAt: new Date().toISOString() }
          }
          
          // Check if this section was updated due to output variable reference changes
          const sectionUpdate = sectionsToUpdate.find(su => su.id === section.id)
          if (sectionUpdate) {
            return { ...section, ...sectionUpdate.updates, updatedAt: new Date().toISOString() }
          }
          
          return section
        }))
        
        // Show success feedback for output variable name changes
        const changedVariables = Object.entries(outputVariableNameMap)
          .map(([oldName, newName]) => `@${oldName} → @${newName}`)
          .join(', ')
        
        if (sectionsToUpdate.length > 0) {
          toast({
            title: 'Output variable references updated',
            description: `Updated ${changedVariables} in ${sectionsToUpdate.length} section(s)`,
            duration: 3000
          })
        }
      }
      
      // Handle normal updates (when no variable changes occurred)
      if (!variableNameChanged && !outputVariablesChanged) {
        setSections(prev => prev.map(section => 
          section.id === sectionId 
            ? { ...section, ...updates, updatedAt: new Date().toISOString() }
            : section
        ))
      }
      
      // Show success feedback for title changes
      if (updates.title && !variableNameChanged) {
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
      
      // Update local state
      setSections(prev => {
        const filtered = prev.filter(section => section.id !== sectionId)
        // Reorder remaining sections
        return filtered.map((section, index) => ({
          ...section,
          order: index + 1,
          updatedAt: new Date().toISOString()
        }))
      })
      
      // Update order in database for remaining sections (after state update)
      const remainingSections = sections.filter(section => section.id !== sectionId)
      if (remainingSections.length > 0) {
        setIsAutoReordering(true) // Mark as automatic reordering
        const reorderData = remainingSections.map((section, index) => ({
          id: section.id,
          order_index: index + 1
        }))
        
        reorderSections(campaign.id, reorderData)
          .catch(console.error)
          .finally(() => setIsAutoReordering(false)) // Reset flag
      }
      
      // Show success toast (outside of state setter)
      toast({
        title: 'Section deleted',
        description: 'Section has been removed from your campaign'
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

  const handleSectionDuplicate = async (sectionId: string) => {
    if (!campaign) return

    try {
      setIsSaving(true)
      
      const sectionToDuplicate = sections.find(section => section.id === sectionId)
      if (!sectionToDuplicate) {
        throw new Error('Section to duplicate not found')
      }

      // Find the position to insert (right after the original)
      const originalIndex = sections.findIndex(s => s.id === sectionId)
      const insertIndex = originalIndex + 1

      // Generate unique title
      let duplicateTitle = `${sectionToDuplicate.title} (Copy)`
      let counter = 2
      while (sections.some(s => s.title === duplicateTitle)) {
        duplicateTitle = `${sectionToDuplicate.title} (Copy ${counter})`
        counter++
      }

      // Create the duplicated section data for database
      const sectionData = {
        campaign_id: campaign.id,
        type: mapCampaignBuilderTypeToDatabase(sectionToDuplicate.type) as any,
        title: duplicateTitle,
        description: null,
        order_index: 9999, // Temporary high value to avoid constraint conflicts
        configuration: sectionToDuplicate.settings as any,
        required: false
      }

      // Create in database
      const result = await createSection(sectionData)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to duplicate section')
      }

      const newCampaignSection = convertDatabaseSectionToCampaignSection(result.data as SectionWithOptions)
      
      // Update local state - insert at the correct position
      setSections(prev => {
        const newSections = [...prev]
        // Insert the duplicate right after the original
        newSections.splice(insertIndex, 0, newCampaignSection)
        
        // Update order indices for all sections
        return newSections.map((section, index) => ({
          ...section,
          order: index + 1,
          updatedAt: new Date().toISOString()
        }))
      })

      // Reorder all sections in the database with correct order_indices
      const allSectionsWithDuplicate = [...sections]
      allSectionsWithDuplicate.splice(insertIndex, 0, newCampaignSection)
      
      const reorderData = allSectionsWithDuplicate.map((section, index) => ({
        id: section.id,
        order_index: index + 1
      }))
      
      // Apply the reordering in database
      if (reorderData.length > 0) {
        const reorderResult = await reorderSections(campaign.id, reorderData)
        if (!reorderResult.success) {
          console.error('Failed to reorder sections after duplicate:', reorderResult.error)
        }
      }

      // Select the newly duplicated section
      setSelectedSectionId(newCampaignSection.id)

      toast({
        title: 'Section duplicated',
        description: `"${sectionToDuplicate.title}" has been duplicated below the original`
      })

    } catch (err) {
      console.error('Error duplicating section:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate section'
      toast({
        title: 'Duplicate failed',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
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
        
        // Only show reorder toast for user-initiated drag and drop (not automatic reordering after deletion)
        if (!isAutoReordering) {
          toast({
            title: 'Sections reordered',
            description: 'Section order has been updated',
            duration: 2000
          })
        }
      }
    }
  }

  // Helper to create template sections
  const handleCreateTemplate = async () => {
    if (!campaign) return;
    setIsSaving(true);
    try {
      // 1. Text Question: name
      const textType = getSectionTypeById('question-text');
      const textSection = await createSection({
        campaign_id: campaign.id,
        type: 'text_question',
        title: 'name',
        description: null,
        order_index: 1,
        configuration: {
          ...textType?.defaultSettings,
          title: 'What is your name?',
          input_type: 'text',
          placeholder: 'Enter your name',
          required: true,
        },
        required: true,
      });

      // 2. Multiple Choice: business
      const mcType = getSectionTypeById('question-multiple-choice');
      const mcSection = await createSection({
        campaign_id: campaign.id,
        type: 'multiple_choice',
        title: 'business',
        description: null,
        order_index: 2,
        configuration: {
          ...mcType?.defaultSettings,
          title: 'What business are you in?',
          allow_multiple: false,
          display_type: 'radio',
          options: [
            { id: 'option-1', text: 'Design', order: 1 },
            { id: 'option-2', text: 'Marketing Agency', order: 2 },
            { id: 'option-3', text: 'SaaS/Tech', order: 3 },
            { id: 'option-4', text: 'Other', order: 4 },
          ],
          required: true,
        },
        required: true,
      });

      // 3. Slider: size
      const sliderType = getSectionTypeById('question-slider');
      const sliderSection = await createSection({
        campaign_id: campaign.id,
        type: 'slider',
        title: 'size',
        description: null,
        order_index: 3,
        configuration: {
          ...sliderType?.defaultSettings,
          title: 'How big is your audience?',
          min_value: 1,
          max_value: 100000,
          default_value: 1000,
          step: 1,
          labels: { min: '1', max: '100,000' },
          required: true,
        },
        required: true,
      });

      // 4. Logic: prompt
      const logicType = getSectionTypeById('logic-ai');
      const logicSection = await createSection({
        campaign_id: campaign.id,
        type: 'logic',
        title: 'logic',
        description: null,
        order_index: 4,
        configuration: {
          ...logicType?.defaultSettings,
          title: 'AI Marketing Idea',
          variable_access: ['name', 'business', 'size'],
          prompt_template: 'A user named @name has a business that is a @business with an audience of @size. Suggest a marketing idea and next steps.',
          output_variable: 'idea',
          ai_provider: 'openai',
          model: 'gpt-4',
          max_tokens: 500,
          temperature: 0.7,
        },
        required: true,
      });

      // 5. Capture: standard
      const captureType = getSectionTypeById('capture-details');
      const captureSection = await createSection({
        campaign_id: campaign.id,
        type: 'capture',
        title: 'capture',
        description: null,
        order_index: 5,
        configuration: {
          ...captureType?.defaultSettings,
        },
        required: true,
      });

      // 6. Output: uses all variables
      const outputType = getSectionTypeById('output-results');
      const outputSection = await createSection({
        campaign_id: campaign.id,
        type: 'output',
        title: 'output',
        description: null,
        order_index: 6,
        configuration: {
          ...outputType?.defaultSettings,
          title: 'Your Marketing Idea',
          template: `Hi @name! Here’s a marketing idea for your @business with an audience of @size:\n@idea\n\nNext steps:\n@next_steps`,
          variables: ['name', 'business', 'size', 'idea', 'next_steps'],
          format: 'text',
          download_enabled: false,
        },
        required: true,
      });

      // Reload sections from DB
      await loadCampaign();
      setShowOnboarding(false);
      toast({
        title: 'Template added!',
        description: 'A marketing ideas lead magnet template has been added to your campaign.',
        duration: 4000,
      });
    } catch (err) {
      setError('Failed to create template sections.');
      toast({
        title: 'Error',
        description: 'Failed to create template sections.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tool builder...</p>
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
                    <p className="font-medium">Error loading tool</p>
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
                  <p className="text-muted-foreground">Tool not found</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-2 text-blue-600 underline hover:no-underline"
                  >
                    Back to Tools
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
    <>
      {showOnboarding && (
        <OnboardingCarousel
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onTemplateClick={handleCreateTemplate}
        />
      )}
      <CaptureProvider campaignId={campaign.id}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="min-h-screen bg-background">
            {/* Tool Builder Top Bar */}
            <CampaignBuilderTopBar
              campaignName={campaign.name}
              campaignStatus={campaign.status}
              campaignId={campaign.id}
              campaignUserKey={campaign.user_key || undefined}
              campaignPublishedUrl={campaign.published_url || undefined}
              campaign={campaign}
              isPublished={campaign.status === 'published'}
              isSaving={isSaving}
              canPublish={mandatoryValidation.isValid}
              canPreview={mandatoryValidation.isValid}
              validationErrors={mandatoryValidation.missing}
              onCampaignNameChange={handleCampaignNameChange}
              onCampaignUpdate={setCampaign}
              onPreview={handlePreview}
              onPublish={handlePublish}
              onPause={handlePause}
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

                {/* Tool Builder Content */}
                <div className="flex gap-6">
                  {/* Sidebar - Sections Menu (Fixed) */}
                  <div className="w-80 flex-shrink-0 sticky top-28 h-fit">
                    <Card>
                      <SectionsMenu onSectionAdd={handleSectionAdd} />
                    </Card>
                  </div>

                  {/* Main Content - Tool Canvas (Scrollable) */}
                  <div className="flex-1 min-w-0">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Tool Canvas</CardTitle>
                            <CardDescription>
                              Every tool needs a Capture section, Logic section, and Output section. Click the placeholders below to add required sections, or use the sidebar for additional sections.
                            </CardDescription>
                          </div>

                        </div>
                      </CardHeader>
                      <CardContent>
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
                          className=""
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
                <DragPreview
                  section={activeDragItem as CampaignSection}
                  campaignId={campaign.id}
                  allSections={sections}
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
    </>
  )
} 