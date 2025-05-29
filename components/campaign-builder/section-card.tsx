'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  Edit3,
  Check,
  X,
  MoreVertical,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react'

interface SectionCardProps {
  section: CampaignSection
  onUpdate: (sectionId: string, updates: Partial<CampaignSection>) => void
  onDelete: (sectionId: string) => void
  onDuplicate: (sectionId: string) => void
  className?: string
}

export function SectionCard({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  className
}: SectionCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(section.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

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

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleEdit = () => {
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== section.title) {
      onUpdate(section.id, { title: editedTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setEditedTitle(section.title)
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  const handleVisibilityToggle = () => {
    onUpdate(section.id, { isVisible: !section.isVisible })
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${section.title}"?`)) {
      onDelete(section.id)
    }
  }

  const handleDuplicate = () => {
    onDuplicate(section.id)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg scale-105 rotate-2',
        !section.isVisible && 'opacity-60',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 text-gray-400 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Section Icon */}
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mt-1',
            sectionType?.color || 'bg-accent text-muted-foreground'
          )}>
            {IconComponent && (
              <IconComponent className="h-4 w-4" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center space-x-2">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleTitleSave}
                    className="h-7 text-sm font-medium"
                    placeholder="Section title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTitleSave}
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTitleCancel}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-1">
                  <h4 className={cn(
                    'text-sm font-medium truncate',
                    section.isVisible ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {section.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTitleEdit}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Section Type & Order */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{sectionType?.name || section.type}</span>
                <span>•</span>
                <span>Order {section.order}</span>
              </div>
              
              {/* Visibility Indicator */}
              {!section.isVisible && (
                <div className="flex items-center space-x-1 text-xs text-orange-600">
                  <EyeOff className="h-3 w-3" />
                  <span>Hidden</span>
                </div>
              )}
            </div>

            {/* Settings Preview */}
            {section.settings && Object.keys(section.settings).length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {Object.entries(section.settings).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
                {Object.keys(section.settings).length > 2 && (
                  <div className="text-gray-400">
                    +{Object.keys(section.settings).length - 2} more settings
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleTitleEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Title
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {}}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Section
              </DropdownMenuItem>
              
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