'use client'

import { SectionType } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface SectionTypeCardProps {
  sectionType: SectionType
  className?: string
  onAdd?: (sectionType: SectionType) => void
}

export function SectionTypeCard({ 
  sectionType, 
  className,
  onAdd
}: SectionTypeCardProps) {

  // Get the icon component dynamically
  const IconComponent = Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{
    className?: string
  }>

  return (
    <div
      className={cn(
        'group relative',
        'p-3 rounded-lg border border-border',
        'hover:border-input hover:bg-muted',
        'transition-all duration-200',
        'bg-background',
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

        {/* Add Button */}
        {onAdd && (
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation()
                onAdd(sectionType)
              }}
              title={`Add ${sectionType.name}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>


    </div>
  )
} 