'use client'

import { useDraggable } from '@dnd-kit/core'
import { SectionType } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'

interface DraggableSectionTypeProps {
  sectionType: SectionType
  className?: string
}

export function DraggableSectionType({ 
  sectionType, 
  className 
}: DraggableSectionTypeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `section-type-${sectionType.id}`,
    data: {
      type: 'section-type',
      sectionType: sectionType
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // Get the icon component dynamically
  const IconComponent = Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{
    className?: string
  }>

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group relative cursor-grab active:cursor-grabbing',
        'p-3 rounded-lg border-2 border-dashed border-border',
        'hover:border-input hover:bg-muted',
        'transition-all duration-200',
        'bg-background',
        isDragging && 'opacity-50 scale-95 shadow-lg border-blue-300',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          sectionType.color
        )}>
          {IconComponent && (
            <IconComponent className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {sectionType.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {sectionType.description}
          </p>
        </div>
      </div>

      {/* Drag indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="grid grid-cols-2 gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 h-1 bg-gray-400 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Dragging overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg border-2 border-blue-300 border-dashed" />
      )}
    </div>
  )
} 