'use client'

import { useDroppable } from '@dnd-kit/core'
import { SectionType, CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Plus, Layout } from 'lucide-react'

interface CanvasDropZoneProps {
  sections: CampaignSection[]
  className?: string
}

export function CanvasDropZone({ 
  sections,  
  className 
}: CanvasDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'campaign-canvas',
    data: {
      type: 'canvas'
    }
  })

  const isEmpty = sections.length === 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full rounded-lg transition-all duration-200',
        isOver 
          ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
          : 'bg-gray-50 border-2 border-gray-200 border-dashed',
        isEmpty && 'flex items-center justify-center',
        className
      )}
    >
      {isEmpty ? (
        /* Empty State */
        <div className="text-center p-8">
          <div className={cn(
            'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
            isOver ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            {isOver ? (
              <Plus className="h-8 w-8 text-blue-600" />
            ) : (
              <Layout className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <h3 className={cn(
            'text-lg font-medium mb-2 transition-colors',
            isOver ? 'text-blue-900' : 'text-gray-900'
          )}>
            {isOver ? 'Drop section here' : 'Start building your campaign'}
          </h3>
          
          <p className={cn(
            'text-sm max-w-md mx-auto transition-colors',
            isOver ? 'text-blue-700' : 'text-gray-500'
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
        /* Sections Display */
        <div className="p-6 space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{section.title}</h4>
                  <p className="text-sm text-gray-500">Type: {section.type}</p>
                </div>
                <div className="text-xs text-gray-400">
                  Order: {section.order}
                </div>
              </div>
            </div>
          ))}
          
          {/* Drop zone for adding more sections */}
          {isOver && (
            <div className="border-2 border-blue-300 border-dashed rounded-lg p-6 bg-blue-50">
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