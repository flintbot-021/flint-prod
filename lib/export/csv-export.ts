// =============================================================================
// CSV EXPORT - CSV EXPORT FUNCTIONALITY USING REACT-CSV AND PAPAPARSE
// =============================================================================

import Papa from 'papaparse'
import { ExportConfig, ExportData, ExportResult, ExportProgress } from './export-types'
import { formatExportData, validateExportData, sanitizeForCSV } from './export-utils'

/**
 * Exports data to CSV format and triggers download
 */
export const exportToCSV = async (
  data: any[],
  config: ExportConfig,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> => {
  try {
    // Update progress
    onProgress?.({
      stage: 'preparing',
      progress: 10,
      message: 'Preparing data for export...',
      totalRecords: data.length
    })

    // Validate data
    const validation = validateExportData(data, config)
    if (!validation.isValid) {
      throw new Error(`Export validation failed: ${validation.errors.join(', ')}`)
    }

    onProgress?.({
      stage: 'formatting',
      progress: 30,
      message: 'Formatting data...',
      totalRecords: data.length
    })

    // Format data for export
    const formattedData = formatExportData(data, config, {
      source: config.filename?.includes('dashboard') ? 'dashboard' : 'leads'
    })

    onProgress?.({
      stage: 'generating',
      progress: 60,
      message: 'Generating CSV file...',
      totalRecords: data.length,
      processedRecords: formattedData.rows.length
    })

    // Generate CSV content
    const csvContent = generateCSVContent(formattedData, config)

    onProgress?.({
      stage: 'downloading',
      progress: 90,
      message: 'Initiating download...',
      totalRecords: data.length,
      processedRecords: formattedData.rows.length
    })

    // Trigger download
    const filename = config.filename || 'export.csv'
    await triggerCSVDownload(csvContent, filename)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Export complete!',
      totalRecords: data.length,
      processedRecords: formattedData.rows.length
    })

    return {
      success: true,
      filename,
      metadata: formattedData.metadata
    }

  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Export failed'
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Exports an array of data directly to CSV (simpler version)
 */
export const exportArrayToCSV = (
  data: any[][],
  filename: string = 'export.csv',
  headers?: string[]
): void => {
  let csvContent = ''

  // Add headers if provided
  if (headers) {
    csvContent += headers.map(sanitizeForCSV).join(',') + '\n'
  }

  // Add data rows
  data.forEach(row => {
    csvContent += row.map(cell => sanitizeForCSV(String(cell))).join(',') + '\n'
  })

  triggerCSVDownload(csvContent, filename)
}

/**
 * Generates CSV content from formatted export data
 */
const generateCSVContent = (data: ExportData, config: ExportConfig): string => {
  const { headers, rows } = data

  // Use PapaParse for more robust CSV generation
  const csvData = [
    ...(config.includeHeaders !== false ? [headers] : []),
    ...rows
  ]

  return Papa.unparse(csvData, {
    header: false, // We're handling headers manually
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    newline: '\n',
    skipEmptyLines: false
  })
}

/**
 * Triggers CSV file download in the browser
 */
const triggerCSVDownload = (content: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create blob with proper MIME type and BOM for Excel compatibility
      const BOM = '\uFEFF' // Byte Order Mark for proper Excel import
      const blob = new Blob([BOM + content], { 
        type: 'text/csv;charset=utf-8;' 
      })

      // Create download URL
      const url = URL.createObjectURL(blob)

      // Create temporary download link
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'

      // Append to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up URL
      setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve()
      }, 100)

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Processes large datasets in chunks for CSV export
 */
export const exportLargeDatasetToCSV = async (
  data: any[],
  config: ExportConfig,
  chunkSize: number = 1000,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> => {
  try {
    onProgress?.({
      stage: 'preparing',
      progress: 5,
      message: 'Preparing large dataset for export...',
      totalRecords: data.length
    })

    // Validate data
    const validation = validateExportData(data, config)
    if (!validation.isValid) {
      throw new Error(`Export validation failed: ${validation.errors.join(', ')}`)
    }

    // Format data
    const formattedData = formatExportData(data, config)
    const { headers, rows } = formattedData

    onProgress?.({
      stage: 'generating',
      progress: 20,
      message: 'Processing data in chunks...',
      totalRecords: data.length
    })

    let csvContent = ''
    
    // Add headers
    if (config.includeHeaders !== false) {
      csvContent += Papa.unparse([headers], { header: false }) + '\n'
    }

    // Process rows in chunks
    const totalChunks = Math.ceil(rows.length / chunkSize)
    
    for (let i = 0; i < totalChunks; i++) {
      const startIndex = i * chunkSize
      const endIndex = Math.min(startIndex + chunkSize, rows.length)
      const chunk = rows.slice(startIndex, endIndex)

      // Convert chunk to CSV
      const chunkCSV = Papa.unparse(chunk, { header: false })
      csvContent += chunkCSV + (i < totalChunks - 1 ? '\n' : '')

      // Update progress
      const progress = Math.round(20 + (70 * (i + 1)) / totalChunks)
      onProgress?.({
        stage: 'generating',
        progress,
        message: `Processing chunk ${i + 1} of ${totalChunks}...`,
        totalRecords: data.length,
        processedRecords: endIndex
      })

      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    onProgress?.({
      stage: 'downloading',
      progress: 95,
      message: 'Initiating download...',
      totalRecords: data.length,
      processedRecords: rows.length
    })

    // Trigger download
    const filename = config.filename || 'large-export.csv'
    await triggerCSVDownload(csvContent, filename)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Large dataset export complete!',
      totalRecords: data.length,
      processedRecords: rows.length
    })

    return {
      success: true,
      filename,
      metadata: formattedData.metadata
    }

  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Export failed'
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Estimates the CSV file size before export
 */
export const estimateCSVSize = (data: any[], config: ExportConfig): number => {
  const formattedData = formatExportData(data.slice(0, Math.min(100, data.length)), config)
  const sampleCSV = generateCSVContent(formattedData, config)
  const bytesPerRow = sampleCSV.length / formattedData.rows.length
  
  return Math.round(bytesPerRow * data.length)
}

/**
 * Validates CSV content before download
 */
export const validateCSVContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!content || content.trim().length === 0) {
    errors.push('CSV content is empty')
    return { isValid: false, errors }
  }

  // Parse CSV to check for format issues
  try {
    const parsed = Papa.parse(content, { header: false })
    
    if (parsed.errors && parsed.errors.length > 0) {
      errors.push(...parsed.errors.map(err => err.message))
    }

    if (parsed.data.length === 0) {
      errors.push('No data rows found in CSV')
    }

  } catch (error) {
    errors.push('Invalid CSV format')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 