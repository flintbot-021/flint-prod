// =============================================================================
// EXPORT UTILITIES - HELPER FUNCTIONS FOR EXPORT OPERATIONS
// =============================================================================

import { ExportConfig, ExportFieldConfig, ExportData, ExportMetadata, ExportFormat } from './export-types'

/**
 * Creates a default export configuration based on the source type
 */
export const createExportConfig = (
  source: 'dashboard' | 'leads',
  format: ExportFormat = 'csv',
  customFields?: ExportFieldConfig[]
): ExportConfig => {
  // Import field configurations dynamically to avoid circular dependencies
  const { DASHBOARD_EXPORT_FIELDS, LEADS_EXPORT_FIELDS } = require('./export-types')
  
  const defaultFields = source === 'dashboard' ? DASHBOARD_EXPORT_FIELDS : LEADS_EXPORT_FIELDS
  
  return {
    format,
    scope: 'all',
    fields: customFields || defaultFields,
    includeHeaders: true,
    dateFormat: 'MM/dd/yyyy HH:mm:ss',
    filename: generateExportFilename(source, format)
  }
}

/**
 * Formats raw data for export based on field configurations
 */
export const formatExportData = (
  rawData: any[],
  config: ExportConfig,
  metadata?: Partial<ExportMetadata>
): ExportData => {
  // Filter fields to include only selected ones
  const includedFields = config.fields.filter(field => field.include !== false)
  
  // Extract headers
  const headers = includedFields.map(field => field.label)
  
  // Format rows
  const rows = rawData.map(item => {
    return includedFields.map(field => {
      let value = getNestedValue(item, field.key)
      
      // Apply field-specific formatting
      if (value !== undefined && value !== null) {
        if (field.formatter) {
          value = field.formatter(value)
        } else {
          value = formatValueByType(value, field.type, config.dateFormat)
        }
      } else {
        value = ''
      }
      
      return value
    })
  })
  
  const exportMetadata: ExportMetadata = {
    totalRecords: rawData.length,
    exportedRecords: rows.length,
    timestamp: new Date().toISOString(),
    source: metadata?.source || 'dashboard',
    filters: metadata?.filters,
    exportedBy: metadata?.exportedBy
  }
  
  return {
    headers,
    rows,
    metadata: exportMetadata
  }
}

/**
 * Validates export data before processing
 */
export const validateExportData = (data: any[], config: ExportConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data || !Array.isArray(data)) {
    errors.push('Data must be an array')
    return { isValid: false, errors }
  }

  if (data.length === 0) {
    errors.push('Data array is empty')
    return { isValid: false, errors }
  }

  if (!config.fields || config.fields.length === 0) {
    errors.push('No fields specified for export')
    return { isValid: false, errors }
  }

  const selectedFields = config.fields.filter(field => field.include !== false)
  if (selectedFields.length === 0) {
    errors.push('No fields selected for export')
    return { isValid: false, errors }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Generates a filename for export based on source and format
 */
export const generateExportFilename = (
  source: 'dashboard' | 'leads',
  format: ExportFormat,
  customPrefix?: string,
  timestamp?: Date
): string => {
  const date = timestamp || new Date()
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
  
  const prefix = customPrefix || source
  const extension = format === 'excel' ? 'xlsx' : 'csv'
  
  return `${prefix}-export-${dateStr}-${timeStr}.${extension}`
}

/**
 * Formats a value based on its type
 */
const formatValueByType = (value: any, type?: string, dateFormat?: string): string => {
  if (value === null || value === undefined) {
    return ''
  }
  
  switch (type) {
    case 'date':
      if (value instanceof Date) {
        return formatDate(value, dateFormat)
      } else if (typeof value === 'string') {
        const date = new Date(value)
        return isNaN(date.getTime()) ? value : formatDate(date, dateFormat)
      }
      return String(value)
      
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value)
      
    case 'boolean':
      return value ? 'Yes' : 'No'
      
    case 'email':
    case 'phone':
    case 'string':
    default:
      return String(value)
  }
}

/**
 * Formats a date object to a string
 */
const formatDate = (date: Date, format?: string): string => {
  if (!format) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  
  // Simple date formatting - can be enhanced with a proper date library
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return format
    .replace('MM', month)
    .replace('dd', day)
    .replace('yyyy', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * Gets a nested value from an object using dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || typeof obj !== 'object') return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    current = current[key]
  }
  
  return current
}

/**
 * Checks if an object has a nested property using dot notation
 */
const hasNestedProperty = (obj: any, path: string): boolean => {
  if (!obj || typeof obj !== 'object') return false
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false
    }
    if (!(key in current)) return false
    current = current[key]
  }
  
  return true
}

/**
 * Calculates file size from data (rough estimation)
 */
export const estimateFileSize = (data: ExportData, format: ExportFormat): number => {
  let size = 0
  
  // Headers
  size += data.headers.join(',').length
  
  // Rows
  data.rows.forEach(row => {
    size += row.join(',').length + 1 // +1 for newline
  })
  
  // Excel files are typically larger due to formatting
  if (format === 'excel') {
    size *= 1.5 // Rough multiplier for Excel overhead
  }
  
  return Math.round(size)
}

/**
 * Chunks large arrays for processing
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Sanitizes a value for CSV export
 */
export const sanitizeForCSV = (value: string): string => {
  if (!value) return ''
  
  // Convert to string and handle special characters
  const stringValue = String(value)
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Prepares data for Excel export
 */
export const prepareForExcel = (data: ExportData): any[][] => {
  const result: any[][] = []
  
  // Add headers if they exist
  if (data.headers && data.headers.length > 0) {
    result.push(data.headers)
  }
  
  // Add data rows
  result.push(...data.rows)
  
  return result
} 