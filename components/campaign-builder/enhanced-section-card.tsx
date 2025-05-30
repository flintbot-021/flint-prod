'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  GripVertical,
  MoreVertical,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Loader2
} from 'lucide-react'

interface EnhancedSectionCardProps {
  section: CampaignSection
  onUpdate: (sectionId: string, updates: Partial<CampaignSection>) => Promise<void>
  onDelete: (sectionId: string) => void
  onDuplicate: (sectionId: string) => void
  onConfigure?: (sectionId: string) => void
  className?: string
  showConfiguration?: boolean
}

export function EnhancedSectionCard({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onConfigure,
  className,
  showConfiguration = true
}: EnhancedSectionCardProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: section.id,
    data: {
      type: 'campaign-section',
      section
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get section type information
  const sectionType = getSectionTypeById(section.type)
  const IconComponent = sectionType ? 
    Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> : 
    Icons.FileText

  // Handle title updates
  const handleTitleUpdate = async (newTitle: string) => {
    if (newTitle.trim() === section.title) return
    
    setIsSaving(true)
    try {
      await onUpdate(section.id, { title: newTitle.trim() })
    } catch (error) {
      throw error // Let the inline editor handle the error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    setIsSaving(true)
    try {
      await onUpdate(section.id, { isVisible: !section.isVisible })
    } catch (error) {
      console.error('Failed to update visibility:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete with confirmation
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${section.title}"?`)) {
      onDelete(section.id)
    }
  }

  // Handle duplicate
  const handleDuplicate = () => {
    onDuplicate(section.id)
  }

  // Handle configure
  const handleConfigure = () => {
    onConfigure?.(section.id)
  }

  // Title validation
  const validateTitle = (title: string): string | null => {
    if (!title.trim()) {
      return 'Section title is required'
    }
    if (title.length > 100) {
      return 'Title must be 100 characters or less'
    }
    return null
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg scale-105 rotate-2',
        !section.isVisible && 'opacity-60',
        'hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-2 p-1 text-gray-400 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isSaving}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Section Icon */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-1',
            sectionType?.color || 'bg-accent text-muted-foreground',
            !section.isVisible && 'opacity-60'
          )}>
            {IconComponent && (
              <IconComponent className="h-5 w-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Editable Title */}
            <div className="flex items-center space-x-2 mb-2">
              <InlineEditableText
                value={section.title}
                onSave={handleTitleUpdate}
                variant="subheading"
                placeholder="Enter section title..."
                className={cn(
                  'font-medium',
                  section.isVisible ? 'text-foreground' : 'text-muted-foreground'
                )}
                showEditIcon={false}
                showSaveStatus={true}
                validation={validateTitle}
                maxLength={100}
                required={true}
                disabled={isSaving}
              />
              
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>

            {/* Section Type & Order */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className="font-medium">{sectionType?.name || section.type}</span>
                <span>•</span>
                <span>Order {section.order}</span>
                <span>•</span>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  sectionType?.category === 'input' && 'bg-blue-100 text-blue-700',
                  sectionType?.category === 'content' && 'bg-green-100 text-green-700',
                  sectionType?.category === 'logic' && 'bg-purple-100 text-purple-700',
                  sectionType?.category === 'output' && 'bg-orange-100 text-orange-700'
                )}>
                  {sectionType?.category}
                </span>
              </div>
              
              {/* Visibility Indicator */}
              {!section.isVisible && (
                <div className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <EyeOff className="h-3 w-3" />
                  <span>Hidden</span>
                </div>
              )}
            </div>

            {/* Section Description */}
            {sectionType?.description && (
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {sectionType.description}
              </p>
            )}

            {/* Settings Preview */}
            {section.settings && Object.keys(section.settings).length > 0 && (
              <div className="bg-muted rounded-md p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-2 font-medium">Configuration:</div>
                <div className="space-y-1">
                  {Object.entries(section.settings).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-foreground font-medium truncate ml-2 max-w-32">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(section.settings).length > 3 && (
                    <div className="text-xs text-gray-400 pt-1 border-t border-border">
                      +{Object.keys(section.settings).length - 3} more settings
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVisibilityToggle}
                disabled={isSaving}
                className="h-7 px-2 text-xs"
              >
                {section.isVisible ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </>
                )}
              </Button>
              
              {showConfiguration && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConfigure}
                  disabled={isSaving}
                  className="h-7 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isSaving}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {showConfiguration && (
                <DropdownMenuItem onClick={handleConfigure}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Section
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleVisibilityToggle}>
                {section.isVisible ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Section
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Section
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
} 