// =============================================================================
// EXPORT DIALOG - COMPREHENSIVE EXPORT CONTROL UI COMPONENT
// =============================================================================

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Settings, 
  Filter,
  Calendar,
  Users,
  Target,
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  ExportConfig, 
  ExportFieldConfig, 
  ExportProgress, 
  ExportFormat,
  ExportScope,
  DASHBOARD_EXPORT_FIELDS,
  LEADS_EXPORT_FIELDS
} from '@/lib/export/export-types'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (config: ExportConfig) => Promise<void>
  data: any[]
  source: 'dashboard' | 'leads'
  title?: string
  defaultFields?: ExportFieldConfig[]
  filters?: ExportFilter[]
  isLoading?: boolean
  progress?: ExportProgress | null
}

export interface ExportFilter {
  key: string
  label: string
  type: 'date-range' | 'select' | 'multi-select' | 'text'
  options?: Array<{ value: string; label: string }>
  value?: any
  placeholder?: string
}

interface DateRange {
  startDate: string
  endDate: string
}

// Simple Modal Component
const Modal: React.FC<{
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Simple Separator Component
const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("border-b border-gray-200", className)} />
)

// =============================================================================
// EXPORT DIALOG COMPONENT
// =============================================================================

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  data,
  source,
  title,
  defaultFields,
  filters = [],
  isLoading = false,
  progress = null
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [format, setFormat] = useState<ExportFormat>('csv')
  const [scope, setScope] = useState<ExportScope>('all')
  const [selectedFields, setSelectedFields] = useState<ExportFieldConfig[]>([])
  const [customFilename, setCustomFilename] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' })
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const availableFields = useMemo(() => {
    if (defaultFields) return defaultFields
    return source === 'dashboard' ? DASHBOARD_EXPORT_FIELDS : LEADS_EXPORT_FIELDS
  }, [defaultFields, source])

  const estimatedFileSize = useMemo(() => {
    if (!data || data.length === 0) return 0
    
    // Rough estimation based on selected fields and data length
    const avgFieldSize = 20 // Average characters per field
    const selectedFieldCount = selectedFields.filter((f: ExportFieldConfig) => f.include !== false).length
    const headerSize = selectedFieldCount * 15
    const dataSize = data.length * selectedFieldCount * avgFieldSize
    const totalSize = headerSize + dataSize
    
    // Excel files are larger
    return format === 'excel' ? Math.round(totalSize * 1.5) : totalSize
  }, [data, selectedFields, format])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredDataCount = useMemo(() => {
    // In a real implementation, this would apply the actual filters
    // For now, return the full data count or a filtered subset based on scope
    if (scope === 'all') return data.length
    if (scope === 'filtered') {
      // Apply date range and other filters
      let filtered = data
      
      if (dateRange.startDate || dateRange.endDate) {
        // Filter by date range (this would need actual date field logic)
        filtered = filtered.filter(() => true) // Placeholder
      }
      
      return filtered.length
    }
    return 0 // 'selected' scope would need selection state
  }, [data, scope, dateRange, selectedFilters])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initialize fields when dialog opens
  useEffect(() => {
    if (isOpen && availableFields.length > 0) {
      setSelectedFields(availableFields.map((field: ExportFieldConfig) => ({ ...field })))
    }
  }, [isOpen, availableFields])

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      setFormat('csv')
      setScope('all')
      setCustomFilename('')
      setDateRange({ startDate: '', endDate: '' })
      setSelectedFilters({})
      setShowAdvanced(false)
    }
  }, [isOpen])

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setSelectedFields(prev => 
      prev.map((field: ExportFieldConfig) => 
        field.key === fieldKey ? { ...field, include: checked } : field
      )
    )
  }

  const handleSelectAllFields = () => {
    const allSelected = selectedFields.every((field: ExportFieldConfig) => field.include !== false)
    setSelectedFields(prev => 
      prev.map((field: ExportFieldConfig) => ({ ...field, include: !allSelected }))
    )
  }

  const handleFilterChange = (filterKey: string, value: any) => {
    setSelectedFilters(prev => ({ ...prev, [filterKey]: value }))
  }

  const handleExport = async () => {
    const config: ExportConfig = {
      format,
      scope,
      fields: selectedFields,
      filename: customFilename || undefined,
      includeHeaders: true,
      dateFormat: 'MM/dd/yyyy HH:mm:ss'
    }

    try {
      await onExport(config)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isLoading, onClose])

  // =============================================================================
  // RENDER PROGRESS OVERLAY
  // =============================================================================

  if (progress && isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="overflow-y-auto max-h-[90vh]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Exporting Data
            </CardTitle>
            <CardDescription>
              {progress.message}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>

            {/* Progress Details */}
            {progress.totalRecords && (
              <div className="text-sm text-gray-600">
                {progress.processedRecords 
                  ? `${progress.processedRecords} of ${progress.totalRecords} records processed`
                  : `${progress.totalRecords} records to process`
                }
              </div>
            )}

            {/* Stage Indicator */}
            <div className="flex items-center gap-2 text-sm">
              {progress.stage === 'preparing' && <Settings className="h-4 w-4" />}
              {progress.stage === 'fetching' && <Loader2 className="h-4 w-4 animate-spin" />}
              {progress.stage === 'formatting' && <FileText className="h-4 w-4" />}
              {progress.stage === 'generating' && <FileSpreadsheet className="h-4 w-4" />}
              {progress.stage === 'downloading' && <Download className="h-4 w-4" />}
              {progress.stage === 'complete' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {progress.stage === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="capitalize">{progress.stage}</span>
            </div>
          </CardContent>

          {progress.stage === 'complete' && (
            <CardFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </CardFooter>
          )}
        </div>
      </Modal>
    )
  }

  // =============================================================================
  // RENDER MAIN DIALOG
  // =============================================================================

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="overflow-y-auto max-h-[90vh]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title || `Export ${source === 'dashboard' ? 'Dashboard' : 'Leads'} Data`}
          </CardTitle>
          <CardDescription>
            Choose your export format and customize the data to include.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV File
              </Button>
              <Button
                variant={format === 'excel' ? 'default' : 'outline'}
                onClick={() => setFormat('excel')}
                className="justify-start"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel File
              </Button>
            </div>
          </div>

          {/* Data Scope Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data to Export</Label>
            <Select value={scope} onValueChange={(value: ExportScope) => setScope(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select data scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Data ({data.length} records)
                  </div>
                </SelectItem>
                <SelectItem value="filtered">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtered Data ({filteredDataCount} records)
                  </div>
                </SelectItem>
                <SelectItem value="selected">
                  <div className="flex items-center gap-2 opacity-50">
                    <Target className="h-4 w-4" />
                    Selected Items (0 records)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Fields to Include</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSelectAllFields}
                className="text-xs"
              >
                {selectedFields.every((field: ExportFieldConfig) => field.include !== false) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {selectedFields.map((field: ExportFieldConfig) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={field.include !== false}
                      onCheckedChange={(checked) => 
                        handleFieldToggle(field.key, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={field.key} 
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {field.label}
                    </Label>
                    {field.type && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {field.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters Section */}
          {(filters.length > 0 || scope === 'filtered') && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Label>

                {/* Date Range Filter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ 
                        ...prev, 
                        startDate: e.target.value 
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ 
                        ...prev, 
                        endDate: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                {/* Custom Filters */}
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1">
                    <Label className="text-xs">{filter.label}</Label>
                    {filter.type === 'select' && filter.options && (
                      <Select 
                        value={selectedFilters[filter.key] || ''} 
                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === 'text' && (
                      <Input
                        value={selectedFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        placeholder={filter.placeholder || `Enter ${filter.label}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Advanced Options */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 p-0 h-auto"
            >
              <Settings className="h-4 w-4" />
              Advanced Options
              <span className="text-xs text-gray-500">
                {showAdvanced ? '(Hide)' : '(Show)'}
              </span>
            </Button>

            {showAdvanced && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="space-y-1">
                  <Label htmlFor="customFilename" className="text-xs">Custom Filename</Label>
                  <Input
                    id="customFilename"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder={`${source}-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Export Summary
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Format: {format.toUpperCase()}</div>
              <div>Records: {filteredDataCount}</div>
              <div>Fields: {selectedFields.filter((f: ExportFieldConfig) => f.include !== false).length}</div>
              <div>Estimated Size: {formatFileSize(estimatedFileSize)}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isLoading || selectedFields.filter((f: ExportFieldConfig) => f.include !== false).length === 0}
            className="min-w-24"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </CardFooter>
      </div>
    </Modal>
  )
} 