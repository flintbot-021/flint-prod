'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { 
  Eye, 
  EyeOff, 
  Edit3, 
  Check, 
  X, 
  Play, 
  RefreshCw, 
  Type, 
  Hash, 
  ToggleLeft, 
  Code2, 
  List, 
  User,
  Mail,
  Phone,
  Clock,
  AlertCircle
} from 'lucide-react'
import type { VariableValue, VariableStore } from '@/lib/stores/variable-store'
import type { VariableInfo } from '@/lib/utils/variable-extractor'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VariablePreviewProps {
  variableStore: VariableStore
  className?: string
  maxHeight?: number
  showUserInputs?: boolean
  showAIOutputs?: boolean
  showPreviewValues?: boolean
  onPreviewValueChange?: (variableName: string, value: any) => void
}

interface VariablePreviewItemProps {
  variable: VariableInfo | VariableValue
  currentValue?: any
  previewValue?: any
  onPreviewValueChange?: (value: any) => void
  isEditing?: boolean
  onEditToggle?: () => void
}

interface VariableGroupProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  variables: (VariableInfo | VariableValue)[]
  currentValues: Record<string, any>
  previewValues: Record<string, any>
  onPreviewValueChange?: (variableName: string, value: any) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getVariableIcon(type: string) {
  switch (type) {
    case 'text': return Type
    case 'number': return Hash
    case 'boolean': return ToggleLeft
    case 'json': return Code2
    case 'array': return List
    default: return Type
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case 'user_input': return User
    case 'ai_output': return Code2
    case 'system': return AlertCircle
    default: return Type
  }
}

function getFieldIcon(name: string) {
  if (name.includes('email')) return Mail
  if (name.includes('phone')) return Phone
  if (name.includes('name')) return User
  return Type
}

function formatPreviewValue(value: any, type: string): string {
  if (value === null || value === undefined) return ''
  
  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false'
    case 'array':
      return Array.isArray(value) ? JSON.stringify(value) : String(value)
    case 'json':
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    case 'number':
      return String(value)
    default:
      return String(value)
  }
}

function parsePreviewValue(valueStr: string, type: string): any {
  if (!valueStr.trim()) return undefined
  
  try {
    switch (type) {
      case 'boolean':
        return valueStr.toLowerCase() === 'true'
      case 'number':
        const num = parseFloat(valueStr)
        return isNaN(num) ? valueStr : num
      case 'array':
        return JSON.parse(valueStr)
      case 'json':
        return JSON.parse(valueStr)
      default:
        return valueStr
    }
  } catch {
    return valueStr
  }
}

// =============================================================================
// VARIABLE PREVIEW ITEM COMPONENT
// =============================================================================

function VariablePreviewItem({
  variable,
  currentValue,
  previewValue,
  onPreviewValueChange,
  isEditing = false,
  onEditToggle
}: VariablePreviewItemProps) {
  const [editValue, setEditValue] = useState('')
  const [isEditingLocal, setIsEditingLocal] = useState(false)

  const variableType = ('dataType' in variable ? variable.dataType : variable.type) as string
  const variableName = variable.name
  const displayValue = currentValue !== undefined ? currentValue : previewValue
  const hasActualValue = currentValue !== undefined
  
  const Icon = getVariableIcon(variableType)
  const SourceIcon = 'source' in variable ? getSourceIcon(variable.source as string) : getFieldIcon(variableName)

  const handleEdit = () => {
    setEditValue(formatPreviewValue(previewValue, variableType))
    setIsEditingLocal(true)
    onEditToggle?.()
  }

  const handleSave = () => {
    const newValue = parsePreviewValue(editValue, variableType)
    onPreviewValueChange?.(newValue)
    setIsEditingLocal(false)
  }

  const handleCancel = () => {
    setEditValue('')
    setIsEditingLocal(false)
  }

  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
      {/* Variable Icon */}
      <div className="flex-shrink-0">
        <div className="p-1 rounded bg-gray-100">
          <Icon className="h-3 w-3 text-gray-600" />
        </div>
      </div>

      {/* Variable Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <code className="text-sm font-mono font-medium text-gray-900">
            @{variableName}
          </code>
          <Badge variant="outline" className="text-xs">
            {variableType}
          </Badge>
          {'source' in variable && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <SourceIcon className="h-3 w-3" />
              <span>{(variable.source as string).replace('_', ' ')}</span>
            </div>
          )}
          {hasActualValue && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              live
            </Badge>
          )}
        </div>

        {/* Description */}
        {'description' in variable && variable.description && (
          <p className="text-xs text-gray-500 mb-1 line-clamp-1">
            {String(variable.description)}
          </p>
        )}

        {/* Value Display/Edit */}
        {isEditingLocal ? (
          <div className="space-y-2">
            {variableType === 'json' || variableType === 'array' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-xs font-mono"
                rows={3}
                placeholder="Enter JSON value..."
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-xs"
                placeholder={`Enter ${variableType} value...`}
              />
            )}
            <div className="flex space-x-1">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {displayValue !== undefined ? (
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border truncate">
                  {formatPreviewValue(displayValue, variableType)}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">
                  No preview value
                </div>
              )}
            </div>
            
            {/* Edit Button */}
            {onPreviewValueChange && !hasActualValue && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// VARIABLE GROUP COMPONENT
// =============================================================================

function VariableGroup({
  title,
  icon: Icon,
  variables,
  currentValues,
  previewValues,
  onPreviewValueChange,
  isCollapsed = false,
  onToggleCollapse
}: VariableGroupProps) {
  if (variables.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
          <Badge variant="outline" className="text-xs">
            {variables.length}
          </Badge>
        </div>
        {isCollapsed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </div>

      {/* Group Content */}
      {!isCollapsed && (
        <div className="space-y-1 pl-4 border-l-2 border-gray-100">
          {variables.map((variable) => (
            <VariablePreviewItem
              key={variable.id}
              variable={variable}
              currentValue={currentValues[variable.name]}
              previewValue={previewValues[variable.name]}
              onPreviewValueChange={
                onPreviewValueChange 
                  ? (value) => onPreviewValueChange(variable.name, value)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VariablePreview({
  variableStore,
  className,
  maxHeight = 400,
  showUserInputs = true,
  showAIOutputs = true,
  showPreviewValues = true,
  onPreviewValueChange
}: VariablePreviewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [isSimulating, setIsSimulating] = useState(false)

  // Get data from store
  const storeState = variableStore.getState()
  const allVariables = Array.from(storeState.values.values())
  const previewValues = variableStore.getAllPreviewValues()

  // Group variables by source and section
  const groupedVariables = useMemo(() => {
    const groups: Record<string, (VariableInfo | VariableValue)[]> = {
      'User Inputs': [],
      'AI Outputs': [],
      'System Variables': []
    }

    allVariables.forEach(variable => {
      switch (variable.source) {
        case 'user_input':
          if (showUserInputs) groups['User Inputs'].push(variable)
          break
        case 'ai_output':
          if (showAIOutputs) groups['AI Outputs'].push(variable)
          break
        case 'system':
          groups['System Variables'].push(variable)
          break
      }
    })

    return groups
  }, [allVariables, showUserInputs, showAIOutputs])

  const currentValues = useMemo(() => {
    const values: Record<string, any> = {}
    allVariables.forEach(variable => {
      values[variable.name] = variable.value
    })
    return values
  }, [allVariables])

  const handleToggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

  const handlePreviewValueChange = (variableName: string, value: any) => {
    variableStore.setPreviewValue(variableName, value)
    onPreviewValueChange?.(variableName, value)
  }

  const handleSimulateExecution = () => {
    setIsSimulating(true)
    // Simulate a brief execution
    setTimeout(() => {
      setIsSimulating(false)
    }, 1500)
  }

  const handleRefreshPreview = () => {
    // Re-initialize preview values from variable extractor
    variableStore.clear()
    // Force re-initialization would happen here
  }

  const totalVariables = Object.values(groupedVariables).reduce((sum, vars) => sum + vars.length, 0)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Variable Preview</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Preview how variables will be populated during campaign execution
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {totalVariables} variables
            </Badge>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshPreview}
              disabled={isSimulating}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={handleSimulateExecution}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isSimulating ? 'Simulating...' : 'Simulate'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div 
          className="space-y-4 overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {/* Variable Groups */}
          {Object.entries(groupedVariables).map(([groupName, variables]) => (
            <VariableGroup
              key={groupName}
              title={groupName}
              icon={groupName === 'User Inputs' ? User : groupName === 'AI Outputs' ? Code2 : AlertCircle}
              variables={variables}
              currentValues={currentValues}
              previewValues={previewValues}
              onPreviewValueChange={handlePreviewValueChange}
              isCollapsed={collapsedGroups.has(groupName)}
              onToggleCollapse={() => handleToggleGroup(groupName)}
            />
          ))}

          {/* Empty State */}
          {totalVariables === 0 && (
            <div className="text-center py-8">
              <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No variables yet</h3>
              <p className="text-gray-600">
                Variables will appear here as you add questions and logic sections to your campaign
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default VariablePreview 