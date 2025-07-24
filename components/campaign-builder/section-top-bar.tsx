'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CampaignSection, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'
import * as Icons from 'lucide-react'
import { GripVertical, ChevronDown, ChevronUp, MoreVertical, Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SectionTopBarProps {
  section: CampaignSection
  allSections?: CampaignSection[] // For variable name validation
  isPreview?: boolean
  isCollapsed?: boolean
  onNameChange: (name: string) => Promise<void>
  onTypeChange: (type: string) => void
  onPreviewToggle: () => void
  onVisibilityToggle: () => void
  onDuplicate: () => void
  onDelete: () => void
  onConfigure: () => void
  onCollapseToggle: () => void
  className?: string
  dragHandleProps?: Record<string, any>
  showDragHandle?: boolean // Controls whether the drag handle is visible
}

export function SectionTopBar({
  section,
  allSections = [],
  isPreview = false,
  isCollapsed = false,
  onNameChange,
  onTypeChange,
  onPreviewToggle,
  onVisibilityToggle,
  onDuplicate,
  onDelete,
  onConfigure,
  onCollapseToggle,
  className,
  dragHandleProps,
  showDragHandle = true
}: SectionTopBarProps) {
  const [isChangingType, setIsChangingType] = useState(false)
  
  const sectionType = getSectionTypeById(section.type)
  const isAILogicSection = section.type === 'ai-logic'
  
  // Get the icon component
  const IconComponent = sectionType && Icons[sectionType.icon as keyof typeof Icons] 
    ? Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>
    : Icons.FileText

  // Check for duplicate variable names
  const checkVariableNameConflict = (title: string): boolean => {
    if (!isQuestionSection(section.type) || !title) return false
    
    const variableName = titleToVariableName(title)
    return allSections.some(s => 
      s.id !== section.id && 
      isQuestionSection(s.type) && 
      s.title && 
      titleToVariableName(s.title) === variableName
    )
  }

  // Handle name change with space-to-underscore conversion for question sections
  const handleNameChange = async (name: string) => {
    let processedName = name
    
    // For question sections, convert spaces to underscores to maintain valid variable names
    if (isQuestionSection(section.type)) {
      processedName = name.replace(/\s+/g, '_')
    }
    
    await onNameChange(processedName)
  }

  // Validate section name
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Section name is required'
    }
    if (name.length > 50) {
      return 'Name must be 50 characters or less'
    }
    return null
  }

  // Handle preview toggle with auto-expand
  const handlePreviewToggle = () => {
    // If enabling preview and section is collapsed, expand it
    if (!isPreview && isCollapsed) {
      onCollapseToggle()
    }
    onPreviewToggle()
  }

  // Handle clicking anywhere on the header to toggle collapse
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Toggle collapse when clicking anywhere on the header
    // stopPropagation on interactive elements prevents unwanted toggles
    onCollapseToggle()
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-background border-b border-border',
      'hover:bg-gray-100 transition-colors group cursor-pointer',
      className
    )}
    onClick={handleHeaderClick}
    >
      {/* Left Side - Drag Handle, Icon, Name */}
      <div className="flex items-center space-x-3 flex-1 min-w-0" onClick={handleHeaderClick}>
        {/* Drag Handle - Only show if showDragHandle is true */}
        {showDragHandle && (
          <button
            {...dragHandleProps}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Section Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          sectionType?.color || 'bg-accent text-muted-foreground'
        )}>
          {IconComponent && (
            <IconComponent className="h-4 w-4" />
          )}
        </div>

        {/* Section Name (Editable or Static) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {/* @ Symbol for question sections except capture section */}
            {isQuestionSection(section.type) && section.type !== 'capture-details' && (
              <span className={cn(
                "mr-1 font-mono text-sm",
                checkVariableNameConflict(section.title) 
                  ? "text-red-600" 
                  : "text-blue-600"
              )}>
                @
              </span>
            )}
            {section.type === 'capture-details' ? (
              <span className="font-medium text-foreground">Capture Details</span>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <InlineEditableText
                  value={section.title}
                  onSave={handleNameChange}
                  placeholder={isQuestionSection(section.type) ? "use_underscores_for_variables" : "Section name (edit me)"}
                  className={cn(
                    "font-medium",
                    isQuestionSection(section.type) && checkVariableNameConflict(section.title)
                      ? "text-red-600"
                      : "text-foreground"
                  )}
                />
              </div>
            )}
          </div>
          {/* Error message for duplicate variable names */}
          {isQuestionSection(section.type) && checkVariableNameConflict(section.title) && (
            <div className="text-xs text-red-600 mt-1">
              ⚠️ Duplicate variable name
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center space-x-3 ml-4" onClick={(e) => e.stopPropagation()}>
        {/* Preview Toggle - Hidden for AI Logic sections */}
        {!isAILogicSection && (
          <div className="flex items-center space-x-2">
            <Label htmlFor={`preview-${section.id}`} className="text-xs text-muted-foreground">
              Preview
            </Label>
            <Switch
              id={`preview-${section.id}`}
              checked={isPreview}
              onCheckedChange={handlePreviewToggle}
              className="scale-75"
            />
          </div>
        )}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCollapseToggle}
          className="h-7 px-2 text-xs"
        >
          {isCollapsed ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </Button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
                         <DropdownMenuItem onClick={onVisibilityToggle} className="cursor-pointer">
               {!section.isVisible ? (
                 <>
                   <Eye className="h-4 w-4 mr-2" />
                   Show Section
                 </>
               ) : (
                 <>
                   <EyeOff className="h-4 w-4 mr-2" />
                   Hide Section
                 </>
               )}
             </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 