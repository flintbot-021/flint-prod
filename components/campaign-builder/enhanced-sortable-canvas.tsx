'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CampaignSection, SectionType } from '@/lib/types/campaign-builder'
import { SectionBlock } from './section-block'
import { MandatorySectionPlaceholder } from './mandatory-section-placeholder'
import { cn } from '@/lib/utils'
import { Plus, Layout } from 'lucide-react'

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
  onSectionConfigure?: (sectionId: string) => void
  onSectionTypeChange?: (sectionId: string, newType: string) => void
  onSectionAdd: (sectionType: SectionType) => Promise<void>
  className?: string
  showCollapsedSections?: boolean
  campaignId: string
  sectionPersistence?: SectionPersistence
}

export function EnhancedSortableCanvas({ 
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionDuplicate,
  onSectionConfigure,
  onSectionTypeChange,
  onSectionAdd,
  className,
  showCollapsedSections = true,
  campaignId,
  sectionPersistence
}: EnhancedSortableCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'campaign-canvas',
    data: {
      type: 'canvas'
    }
  })

  const isEmpty = sections.length === 0
  const sectionIds = sections.map(section => section.id)
  
  // Check which mandatory sections are missing
  const hasCapture = sections.some(s => s.type === 'capture-details')
  const hasLogic = sections.some(s => s.type === 'logic-ai')
  const hasOutput = sections.some(s => s.type === 'output-results' || s.type === 'output-download' || s.type === 'output-redirect' || s.type === 'output-dynamic-redirect')
  
  const showMandatoryPlaceholders = !hasCapture || !hasLogic || !hasOutput

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
        /* Empty State with Mandatory Sections */
        <div className="p-8">
          <div className="text-center mb-8">
            <div className={cn(
              'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
              isOver ? 'bg-blue-100' : 'bg-accent'
            )}>
              {isOver ? (
                <Plus className="h-8 w-8 text-blue-600" />
              ) : (
                <Layout className="h-8 w-8 text-gray-400" />
              )}
            </div>
            
            <h3 className={cn(
              'text-lg font-medium mb-2 transition-colors',
              isOver ? 'text-blue-900' : 'text-foreground'
            )}>
              {isOver ? 'Drop section here' : 'Build your campaign'}
            </h3>
            
            <p className={cn(
              'text-sm max-w-lg mx-auto transition-colors',
              isOver ? 'text-blue-700' : 'text-muted-foreground'
            )}>
              {isOver 
                ? 'Release to add this section to your campaign'
                : 'Every campaign needs these essential sections. Click to add each one in order:'
              }
            </p>
          </div>
          
          {/* Mandatory Section Placeholders */}
          <div className="grid gap-4 max-w-4xl mx-auto">
            <MandatorySectionPlaceholder type="capture" onAdd={onSectionAdd} />
            <div className="flex justify-center">
              <div className="w-px h-8 bg-border"></div>
            </div>
            <MandatorySectionPlaceholder type="logic" onAdd={onSectionAdd} />
            <div className="flex justify-center">
              <div className="w-px h-8 bg-border"></div>
            </div>
            <MandatorySectionPlaceholder type="output" onAdd={onSectionAdd} />
          </div>
          
          {/* Visual drop indicators */}
          {isOver && (
            <div className="mt-6 flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Sections Display with Sortable Context */
        <div className="p-6">
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  onUpdate={onSectionUpdate}
                  onDelete={onSectionDelete}
                  onDuplicate={onSectionDuplicate}
                  onConfigure={onSectionConfigure}
                  onTypeChange={onSectionTypeChange}
                  isCollapsible={showCollapsedSections}
                  initiallyCollapsed={sectionPersistence?.isSectionCollapsed(section.id) || false}
                  onCollapseChange={sectionPersistence?.setSectionCollapsed}
                  allSections={sections}
                  campaignId={campaignId}
                />
              ))}
            </div>
          </SortableContext>
          
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