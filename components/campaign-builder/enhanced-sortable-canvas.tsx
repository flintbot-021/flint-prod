'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { SectionBlock } from './section-block'
import { cn } from '@/lib/utils'
import { Plus, Layout } from 'lucide-react'

interface EnhancedSortableCanvasProps {
  sections: CampaignSection[]
  onSectionUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  onSectionDelete: (sectionId: string) => void
  onSectionDuplicate: (sectionId: string) => void
  onSectionConfigure?: (sectionId: string) => void
  onSectionTypeChange?: (sectionId: string, newType: string) => void
  className?: string
  showCollapsedSections?: boolean
  campaignId: string
}

export function EnhancedSortableCanvas({ 
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionDuplicate,
  onSectionConfigure,
  onSectionTypeChange,
  className,
  showCollapsedSections = true,
  campaignId
}: EnhancedSortableCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'campaign-canvas',
    data: {
      type: 'canvas'
    }
  })

  const isEmpty = sections.length === 0
  const sectionIds = sections.map(section => section.id)

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
        /* Empty State */
        <div className="text-center p-8">
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
            {isOver ? 'Drop section here' : 'Start building your campaign'}
          </h3>
          
          <p className={cn(
            'text-sm max-w-md mx-auto transition-colors',
            isOver ? 'text-blue-700' : 'text-muted-foreground'
          )}>
            {isOver 
              ? 'Release to add this section to your campaign'
              : 'Drag sections from the left panel to begin creating your lead magnet campaign. Start with questions, add content, and finish with results.'
            }
          </p>
          
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
                  allSections={sections}
                  campaignId={campaignId}
                />
              ))}
            </div>
          </SortableContext>
          
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