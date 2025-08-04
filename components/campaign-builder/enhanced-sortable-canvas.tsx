'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CampaignSection, SectionType } from '@/lib/types/campaign-builder'
import { SectionBlock } from './section-block'
import { MandatorySectionPlaceholder } from './mandatory-section-placeholder'
import { OptionalSectionPlaceholder, TemplatePlaceholder } from './optional-section-placeholder'
import { cn } from '@/lib/utils'
import { Plus, Layout } from 'lucide-react'
import React from 'react'

interface SectionPersistence {
  getSectionState: (sectionId: string) => { isCollapsed: boolean }
  setSectionState: (sectionId: string, state: Partial<{ isCollapsed: boolean }>) => void
  setSectionCollapsed: (sectionId: string, isCollapsed: boolean) => void
  isSectionCollapsed: (sectionId: string) => boolean
  clearStates: () => void
}

interface EnhancedSortableCanvasProps {
  sections: CampaignSection[]
  onSectionUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  onSectionDelete: (sectionId: string) => void
  onSectionDuplicate: (sectionId: string) => void
  onSectionConfigure: (sectionId: string) => void
  onSectionTypeChange: (sectionId: string, newType: string) => void
  onSectionAdd: (sectionType: SectionType, insertIndex?: number) => void
  onTemplateClick?: () => void
  selectedSectionId: string | null
  onSectionSelect?: (sectionId: string) => void
  className?: string
  showCollapsedSections?: boolean
  campaignId: string
  campaignName?: string
  sectionPersistence?: SectionPersistence
  onPersistenceChange?: () => void
}

export function EnhancedSortableCanvas({ 
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionDuplicate,
  onSectionConfigure,
  onSectionTypeChange,
  onSectionAdd,
  onTemplateClick,
  selectedSectionId,
  onSectionSelect,
  className,
  showCollapsedSections = true,
  campaignId,
  campaignName,
  sectionPersistence,
  onPersistenceChange
}: EnhancedSortableCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'campaign-canvas',
    data: {
      type: 'canvas'
    }
  })

  const isEmpty = sections.length === 0
  
  // Define mandatory section types and their order
  const mandatorySectionTypes = ['capture-details', 'logic-ai', 'output-results', 'output-download', 'output-redirect', 'output-dynamic-redirect']
  const outputSectionTypes = ['output-results', 'output-download', 'output-redirect', 'output-dynamic-redirect']
  
  // Split sections into optional and mandatory
  const optionalSections = sections.filter(s => !mandatorySectionTypes.includes(s.type))
  const mandatorySections = sections.filter(s => mandatorySectionTypes.includes(s.type))
  
  // Sort mandatory sections in the correct order: capture -> logic -> output
  const sortedMandatorySections = mandatorySections.sort((a, b) => {
    const getOrder = (type: string) => {
      if (type === 'capture-details') return 1
      if (type === 'logic-ai') return 2
      if (outputSectionTypes.includes(type)) return 3
      return 999
    }
    return getOrder(a.type) - getOrder(b.type)
  })
  
  // Only optional sections can be sorted
  const sortableSectionIds = optionalSections.map(section => section.id)
  
  // Check which sections exist
  const hasCapture = sections.some(s => s.type === 'capture-details')
  const hasLogic = sections.some(s => s.type === 'logic-ai')
  const hasOutput = sections.some(s => outputSectionTypes.includes(s.type))
  const hasHero = sections.some(s => s.type === 'content-hero' || s.type === 'hero')
  const hasTextQuestion = sections.some(s => s.type === 'question-text')
  
  const showMandatoryPlaceholders = !isEmpty && (!hasCapture || !hasLogic || !hasOutput)

  // Use provided campaign name or fallback
  const displayCampaignName = campaignName || 'New Campaign'

  // Wrapper for collapse change to trigger parent updates
  const handleCollapseChange = (sectionId: string, isCollapsed: boolean) => {
    sectionPersistence?.setSectionCollapsed(sectionId, isCollapsed)
    onPersistenceChange?.()
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full rounded-lg transition-all duration-200',
        isOver 
          ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
          : 'bg-muted border-2 border-border border-dashed',
        isEmpty && 'flex items-center justify-center',
        className
      )}
    >
      {isEmpty ? (
        /* Empty State - Only Optional Sections */
        <div className="text-center p-8 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Your canvas is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-800 mb-6">
            Add a section to get started or use a template.
          </p>

          {/* Optional Section Cards */}
          {!isOver && (
            <div className="w-full mb-6">
              {onTemplateClick && (
                <div className="mb-4">
                  <TemplatePlaceholder 
                    onClick={onTemplateClick} 
                    campaignId={campaignId}
                    campaignName={displayCampaignName}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OptionalSectionPlaceholder
                  type="hero"
                  onAdd={onSectionAdd}
                  campaignId={campaignId}
                  campaignName={displayCampaignName}
                />
                <OptionalSectionPlaceholder
                  type="text-question"
                  onAdd={onSectionAdd}
                  campaignId={campaignId}
                  campaignName={displayCampaignName}
                />
              </div>
            </div>
          )}
            
          <div className="text-center text-gray-500 dark:text-gray-400">
            Drag and drop sections from the menu on the left.
          </div>
        </div>
      ) : (
        /* Sections Display with Sortable Context */
        <div className="p-6">
          <div className="space-y-4">
            {/* Show Hero suggestion above if missing and has text questions */}
            {!hasHero && hasTextQuestion && (
              <OptionalSectionPlaceholder 
                type="hero" 
                onAdd={onSectionAdd} 
                className="suggestion"
                campaignId={campaignId}
                campaignName={displayCampaignName}
              />
            )}
            
            {/* Render optional sections first (sortable) */}
            <SortableContext items={sortableSectionIds} strategy={verticalListSortingStrategy}>
              {optionalSections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  onUpdate={onSectionUpdate}
                  onDelete={onSectionDelete}
                  onDuplicate={onSectionDuplicate}
                  onConfigure={onSectionConfigure}
                  onTypeChange={onSectionTypeChange}
                  isSelected={selectedSectionId === section.id}
                  onSelect={() => onSectionSelect?.(section.id)}
                  isCollapsible={showCollapsedSections}
                  initiallyCollapsed={sectionPersistence?.isSectionCollapsed(section.id) ?? true}
                  onCollapseChange={handleCollapseChange}
                  allSections={sections}
                  campaignId={campaignId}
                  showDragHandle={true}
                />
              ))}
            </SortableContext>
            
            {/* Divider before mandatory sections if there are optional sections */}
            {optionalSections.length > 0 && sortedMandatorySections.length > 0 && (
              <div className="border-t border-dashed border-border my-6" />
            )}
            
            {/* Render mandatory sections at the end (non-sortable, fixed order) */}
            {sortedMandatorySections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                onUpdate={onSectionUpdate}
                onDelete={onSectionDelete}
                onDuplicate={onSectionDuplicate}
                onConfigure={onSectionConfigure}
                onTypeChange={onSectionTypeChange}
                isSelected={selectedSectionId === section.id}
                onSelect={() => onSectionSelect?.(section.id)}
                isCollapsible={showCollapsedSections}
                initiallyCollapsed={sectionPersistence?.isSectionCollapsed(section.id) ?? true}
                onCollapseChange={handleCollapseChange}
                allSections={sections}
                campaignId={campaignId}
                showDragHandle={false}
              />
            ))}

            {/* Show Text Question suggestion below if missing and has hero */}
            {!hasTextQuestion && hasHero && (
              <OptionalSectionPlaceholder 
                type="text-question" 
                onAdd={onSectionAdd} 
                className="suggestion"
                campaignId={campaignId}
                campaignName={displayCampaignName}
              />
            )}
          </div>
          
          {/* Show missing mandatory sections at bottom if any are missing */}
          {showMandatoryPlaceholders && (
            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Missing Required Sections</h3>
              <div className="space-y-2">
                {!hasCapture && (
                  <MandatorySectionPlaceholder type="capture" onAdd={onSectionAdd} className="compact" />
                )}
                {!hasLogic && (
                  <MandatorySectionPlaceholder type="logic" onAdd={onSectionAdd} className="compact" />
                )}
                {!hasOutput && (
                  <MandatorySectionPlaceholder type="output" onAdd={onSectionAdd} className="compact" />
                )}
              </div>
            </div>
          )}
          
          {/* Drop zone for adding more sections */}
          {isOver && (
            <div className="mt-4 border-2 border-blue-300 border-dashed rounded-lg p-6 bg-blue-50">
              <div className="text-center">
                <Plus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-700 font-medium">
                  Drop here to add section
                </p>
              </div>
            </div>
          )}
          

        </div>
      )}
    </div>
  )
} 