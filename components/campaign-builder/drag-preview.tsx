'use client'

import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { GripVertical } from 'lucide-react'

interface DragPreviewProps {
  section: CampaignSection
  campaignId: string
  allSections?: CampaignSection[]
}

export function DragPreview({
  section,
  campaignId,
  allSections = []
}: DragPreviewProps) {
  const sectionType = getSectionTypeById(section.type)
  const IconComponent = sectionType ? 
    Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> : 
    Icons.FileText

  return (
    <Card className={cn(
      'transition-all duration-200 shadow-lg opacity-80 rotate-2 scale-105',
      'border-2 border-black bg-background rounded-lg overflow-hidden',
      'pointer-events-none select-none'
    )}>
      <div className="flex items-center justify-between p-3 bg-background border-b border-border">
        {/* Left Side - Drag Handle, Icon, Name */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <div className="text-gray-400">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Section Icon */}
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
            sectionType?.color || 'bg-accent text-muted-foreground'
          )}>
            {IconComponent && (
              <IconComponent className="h-4 w-4" />
            )}
          </div>

          {/* Section Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate text-sm">
              {section.title || 'Untitled Section'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {sectionType?.name || section.type}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 