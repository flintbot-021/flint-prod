// =============================================================================
// EXPORT BUTTON - TRIGGER COMPONENT FOR EXPORT FUNCTIONALITY
// =============================================================================

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChevronDown,
  Settings,
  Filter
} from 'lucide-react'
import { ExportDialog, ExportFilter } from './ExportDialog'
import { 
  ExportConfig, 
  ExportFieldConfig,
  ExportProgress
} from '@/lib/export/export-types'
import { exportToCSV, exportToExcel, useExportHistory } from '@/lib/export'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ExportButtonProps {
  data: any[]
  source: 'dashboard' | 'leads'
  title?: string
  defaultFields?: ExportFieldConfig[]
  filters?: ExportFilter[]
  onExportStart?: () => void
  onExportComplete?: (filename: string) => void
  onExportError?: (error: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showDropdown?: boolean
  disabled?: boolean
}

// =============================================================================
// EXPORT BUTTON COMPONENT
// =============================================================================

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  source,
  title,
  defaultFields,
  filters,
  onExportStart,
  onExportComplete,
  onExportError,
  className,
  variant = 'default',
  size = 'default',
  showDropdown = true,
  disabled = false
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  
  // Export history tracking
  const { startExport, completeExport, failExport } = useExportHistory()

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleQuickExport = async (format: 'csv' | 'excel') => {
    if (disabled || data.length === 0) return

    const config: ExportConfig = {
      format,
      scope: 'all',
      fields: defaultFields || [],
      includeHeaders: true,
      dateFormat: 'MM/dd/yyyy HH:mm:ss'
    }

    let historyId: string | null = null
    const startTime = Date.now()

    try {
      setIsExporting(true)
      onExportStart?.()

      // Start tracking export in history
      historyId = startExport({
        source,
        format,
        filename: config.filename || `${source}-export-${Date.now()}.${format}`,
        recordCount: data.length,
        filters: filters ? Object.fromEntries(filters.map(f => [f.key, f.value])) : undefined,
        fieldSelection: config.fields.map(f => f.key),
        metadata: {
          scope: config.scope,
          includeHeaders: config.includeHeaders,
          dateFormat: config.dateFormat
        }
      })

      const exportFunction = format === 'csv' ? exportToCSV : exportToExcel
      const result = await exportFunction(data, config, setProgress)

      if (result.success && result.filename) {
        // Calculate file size estimate and duration
        const duration = Date.now() - startTime
        const estimatedSize = data.length * 100 // Rough estimate: 100 bytes per record
        
        // Mark export as completed in history
        if (historyId) {
          completeExport(historyId, {
            duration,
            fileSize: estimatedSize
          })
        }
        
        onExportComplete?.(result.filename)
      } else {
        // Mark export as failed in history
        if (historyId) {
          failExport(historyId, result.error || 'Export failed')
        }
        onExportError?.(result.error || 'Export failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      
      // Mark export as failed in history
      if (historyId) {
        failExport(historyId, errorMessage)
      }
      
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  const handleCustomExport = async (config: ExportConfig) => {
    if (disabled || data.length === 0) return

    let historyId: string | null = null
    const startTime = Date.now()

    try {
      setIsExporting(true)
      onExportStart?.()

      // Start tracking export in history
      historyId = startExport({
        source,
        format: config.format,
        filename: config.filename || `${source}-custom-export-${Date.now()}.${config.format}`,
        recordCount: data.length,
        filters: filters ? Object.fromEntries(filters.map(f => [f.key, f.value])) : undefined,
        fieldSelection: config.fields.map(f => f.key),
        metadata: {
          scope: config.scope,
          includeHeaders: config.includeHeaders,
          dateFormat: config.dateFormat,
          customExport: true
        }
      })

      const exportFunction = config.format === 'csv' ? exportToCSV : exportToExcel
      const result = await exportFunction(data, config, setProgress)

      if (result.success && result.filename) {
        // Calculate file size estimate and duration
        const duration = Date.now() - startTime
        const estimatedSize = data.length * 100 // Rough estimate: 100 bytes per record
        
        // Mark export as completed in history
        if (historyId) {
          completeExport(historyId, {
            duration,
            fileSize: estimatedSize
          })
        }
        
        onExportComplete?.(result.filename)
        setIsDialogOpen(false)
      } else {
        // Mark export as failed in history
        if (historyId) {
          failExport(historyId, result.error || 'Export failed')
        }
        onExportError?.(result.error || 'Export failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      
      // Mark export as failed in history
      if (historyId) {
        failExport(historyId, errorMessage)
      }
      
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  // Simple single button (no dropdown)
  if (!showDropdown) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled || data.length === 0 || isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <ExportDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onExport={handleCustomExport}
          data={data}
          source={source}
          title={title}
          defaultFields={defaultFields}
          filters={filters}
          isLoading={isExporting}
          progress={progress}
        />
      </>
    )
  }

  // Dropdown button with quick export options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || data.length === 0 || isExporting}
            className={className}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel
          </DropdownMenuItem>
          {/* Custom Export option hidden - functionality preserved for future use */}
          {/* <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Custom Export...
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onExport={handleCustomExport}
        data={data}
        source={source}
        title={title}
        defaultFields={defaultFields}
        filters={filters}
        isLoading={isExporting}
        progress={progress}
      />
    </>
  )
}

// =============================================================================
// EXPORT BUTTON WITH COUNTER (SHOWS RECORD COUNT)
// =============================================================================

export interface ExportButtonWithCounterProps extends ExportButtonProps {
  showCount?: boolean
  countLabel?: string
}

export const ExportButtonWithCounter: React.FC<ExportButtonWithCounterProps> = ({
  data,
  showCount = true,
  countLabel,
  ...props
}) => {
  const recordCount = data.length
  const displayLabel = countLabel || (props.source === 'dashboard' ? 'campaigns' : 'leads')

  return (
    <div className="flex items-center gap-3">
      {showCount && recordCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {recordCount} {displayLabel}
        </span>
      )}
      <ExportButton
        {...props}
        data={data}
        disabled={props.disabled || recordCount === 0}
      />
    </div>
  )
}

// =============================================================================
// BULK EXPORT BUTTON (FOR MULTIPLE DATA SOURCES)
// =============================================================================

export interface BulkExportButtonProps {
  datasets: Array<{
    name: string
    data: any[]
    source: 'dashboard' | 'leads'
    fields?: ExportFieldConfig[]
  }>
  onExportStart?: () => void
  onExportComplete?: (filename: string) => void
  onExportError?: (error: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
}

export const BulkExportButton: React.FC<BulkExportButtonProps> = ({
  datasets,
  onExportStart,
  onExportComplete,
  onExportError,
  className,
  variant = 'default',
  size = 'default',
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)

  const handleBulkExport = async () => {
    if (disabled || datasets.length === 0) return

    try {
      setIsExporting(true)
      onExportStart?.()

      // Import the multi-sheet export function
      const { exportMultiSheetExcel } = await import('@/lib/export')

      // Prepare sheets for multi-sheet export
      const sheets = datasets.map(dataset => ({
        name: dataset.name,
        data: dataset.data,
        config: {
          format: 'excel' as const,
          scope: 'all' as const,
          fields: dataset.fields || [],
          includeHeaders: true,
          dateFormat: 'MM/dd/yyyy HH:mm:ss'
        }
      }))

      const result = await exportMultiSheetExcel(
        sheets,
        `bulk-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        setProgress
      )

      if (result.success && result.filename) {
        onExportComplete?.(result.filename)
      } else {
        onExportError?.(result.error || 'Bulk export failed')
      }
    } catch (error) {
      onExportError?.(error instanceof Error ? error.message : 'Bulk export failed')
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  const totalRecords = datasets.reduce((sum, dataset) => sum + dataset.data.length, 0)

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBulkExport}
      disabled={disabled || totalRecords === 0 || isExporting}
      className={className}
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : `Export All (${totalRecords} records)`}
    </Button>
  )
} 