'use client'

import { useState } from 'react'
import { InlineEditableText } from '@/components/ui/inline-editable-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CampaignSection, SECTION_TYPES, getSectionTypeById } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'
import * as Icons from 'lucide-react'
import {
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface SectionTopBarProps {
  section: CampaignSection
  allSections?: CampaignSection[] // For variable name validation
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
  allSections = [],
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

  // Check if this is an AI Logic section (configuration only, never shown to end users)
  const isAILogicSection = section.type === 'logic-ai' || sectionType?.category === 'logic'

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
    return null
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-background border-b border-border',
      'hover:bg-gray-100 transition-colors group',
      className
    )}>
      {/* Left Side - Drag Handle, Icon, Name, Order Badge, Type */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <button
          {...dragHandleProps}
          className="text-white hover:text-gray-200 cursor-grab active:cursor-grabbing transition-colors"
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
          <div className="flex items-center">
            {/* @ Symbol for question sections */}
            {isQuestionSection(section.type) && (
              <span className={cn(
                "mr-1 font-mono text-sm",
                checkVariableNameConflict(section.title) 
                  ? "text-red-600" 
                  : "text-blue-600"
              )}>
                @
              </span>
            )}
            
            <InlineEditableText
              value={section.title}
              onSave={onNameChange}
              variant="body"
              placeholder={isQuestionSection(section.type) ? "variable_name" : "Section name (edit me)"}
              className={cn(
                "font-medium",
                isQuestionSection(section.type) && checkVariableNameConflict(section.title)
                  ? "text-red-600"
                  : "text-foreground"
              )}
              showEditIcon={false}
              showSaveStatus={true}
              validation={validateName}
              maxLength={50}
              required={true}
              autoSave={false}
            />
          </div>
          
          {/* Error message for duplicate variable names */}
          {isQuestionSection(section.type) && checkVariableNameConflict(section.title) && (
            <div className="text-xs text-red-600 mt-1">
              ⚠️ Duplicate variable name
            </div>
          )}
        </div>

        {/* Section Order Badge */}
        <Badge variant="outline" className="text-xs font-mono">
          #{section.order}
        </Badge>

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
      <div className="flex items-center space-x-3 ml-4">
        {/* Preview Toggle - Hidden for AI Logic sections */}
        {!isAILogicSection && (
          <div className="flex items-center space-x-2">
            <Label htmlFor={`preview-${section.id}`} className="text-xs text-muted-foreground">
              Preview
            </Label>
            <Switch
              id={`preview-${section.id}`}
              checked={isPreview}
              onCheckedChange={onPreviewToggle}
              className="scale-75"
            />
          </div>
        )}

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

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 