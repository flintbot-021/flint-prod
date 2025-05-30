'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { EnhancedSectionCard } from './enhanced-section-card'
import { cn } from '@/lib/utils'
import { Plus, Layout, MousePointer } from 'lucide-react'

interface SortableCanvasProps {
  sections: CampaignSection[]
  onSectionUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  onSectionDelete: (sectionId: string) => void
  onSectionDuplicate: (sectionId: string) => void
  onSectionConfigure?: (sectionId: string) => void
  className?: string
}

export function SortableCanvas({ 
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionDuplicate,
  onSectionConfigure,
  className 
}: SortableCanvasProps) {
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
                <EnhancedSectionCard
                  key={section.id}
                  section={section}
                  onUpdate={onSectionUpdate}
                  onDelete={onSectionDelete}
                  onDuplicate={onSectionDuplicate}
                  onConfigure={onSectionConfigure}
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
          
          {/* Helpful Instructions */}
          {sections.length > 0 && !isOver && (
            <div className="mt-6 p-4 bg-accent rounded-lg border border-border">
              <div className="flex items-start space-x-3">
                <MousePointer className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Canvas Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Click any text</strong> to edit inline with auto-save</li>
                    <li>• <strong>Drag sections</strong> by the grip handle to reorder</li>
                    <li>• <strong>Use quick actions</strong> to show/hide or configure sections</li>
                    <li>• <strong>Drag new sections</strong> from the sidebar to add them</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 