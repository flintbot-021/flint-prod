'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CampaignSection, SECTION_TYPES, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import {
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Settings,
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface SectionTopBarProps {
  section: CampaignSection
  isPreview?: boolean
  isCollapsed?: boolean
  onNameChange: (name: string) => Promise<void>
  onTypeChange: (type: string) => void
  onPreviewToggle: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
  onConfigure: () => void
  onCollapseToggle: () => void
  className?: string
  dragHandleProps?: Record<string, any>
}

export function SectionTopBar({
  section,
  isPreview = false,
  isCollapsed = false,
  onNameChange,
  onTypeChange,
  onPreviewToggle,
  onVisibilityToggle,
  onDelete,
  onConfigure,
  onCollapseToggle,
  className,
  dragHandleProps
}: SectionTopBarProps) {
  const [isChangingType, setIsChangingType] = useState(false)

  const sectionType = getSectionTypeById(section.type)
  const IconComponent = sectionType ? 
    Icons[sectionType.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> : 
    Icons.FileText

  // Get available section types for the dropdown
  const availableTypes = SECTION_TYPES.filter(type => type.id !== section.type)

  // Handle type change
  const handleTypeChange = async (newType: string) => {
    setIsChangingType(true)
    try {
      onTypeChange(newType)
    } finally {
      setIsChangingType(false)
    }
  }

  // Validate section name
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Section name is required'
    }
    if (name.length > 50) {
      return 'Name must be 50 characters or less'
    }
    // Check for valid variable name (alphanumeric + underscores)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name.trim())) {
      return 'Name must be a valid variable name (letters, numbers, underscores)'
    }
    return null
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-background border-b border-border',
      'hover:bg-muted transition-colors group',
      className
    )}>
      {/* Left Side - Drag Handle, Icon, Name, Type */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <button
          {...dragHandleProps}
          className="text-gray-400 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Section Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          sectionType?.color || 'bg-accent text-muted-foreground'
        )}>
          {IconComponent && (
            <IconComponent className="h-4 w-4" />
          )}
        </div>

        {/* Section Name (Editable) */}
        <div className="flex-1 min-w-0">
          <InlineEditableText
            value={section.title}
            onSave={onNameChange}
            variant="body"
            placeholder="Enter section name..."
            className="font-medium text-foreground"
            showEditIcon={false}
            showSaveStatus={true}
            validation={validateName}
            maxLength={50}
            required={true}
          />
        </div>

        {/* Section Type Dropdown */}
        <Select
          value={section.type}
          onValueChange={handleTypeChange}
          disabled={isChangingType}
        >
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue>
              <div className="flex items-center space-x-2">
                {IconComponent && <IconComponent className="h-3 w-3" />}
                <span className="truncate">{sectionType?.name || section.type}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={section.type}>
              <div className="flex items-center space-x-2">
                {IconComponent && <IconComponent className="h-3 w-3" />}
                <span>{sectionType?.name || section.type}</span>
                <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
              </div>
            </SelectItem>
            {availableTypes.map((type) => {
              const TypeIcon = Icons[type.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>
              return (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-3 w-3" />
                    <span>{type.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'ml-2 text-xs',
                        type.category === 'input' && 'border-blue-200 text-blue-700',
                        type.category === 'content' && 'border-green-200 text-green-700',
                        type.category === 'logic' && 'border-purple-200 text-purple-700',
                        type.category === 'output' && 'border-orange-200 text-orange-700'
                      )}
                    >
                      {type.category}
                    </Badge>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center space-x-1">
        {/* Section Order Badge */}
        <Badge variant="outline" className="text-xs font-mono">
          #{section.order}
        </Badge>

        {/* Preview Toggle */}
        <Button
          variant={isPreview ? "default" : "ghost"}
          size="sm"
          onClick={onPreviewToggle}
          className="h-7 px-2 text-xs"
        >
          {isPreview ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </>
          ) : (
            <>
              <Settings className="h-3 w-3 mr-1" />
              Edit
            </>
          )}
        </Button>

        {/* Visibility Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onVisibilityToggle}
          className={cn(
            "h-7 px-2 text-xs",
            !section.isVisible && "text-orange-600 bg-orange-50 hover:bg-orange-100"
          )}
        >
          {section.isVisible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>

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

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Section
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onVisibilityToggle}>
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
            
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 