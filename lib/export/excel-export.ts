// =============================================================================
// EXCEL EXPORT - EXCEL EXPORT FUNCTIONALITY USING XLSX LIBRARY
// =============================================================================

import * as XLSX from 'xlsx'
import { ExportConfig, ExportData, ExportResult, ExportProgress } from './export-types'
import { formatExportData, validateExportData, prepareForExcel } from './export-utils'

/**
 * Exports data to Excel format and triggers download
 */
export const exportToExcel = async (
  data: any[],
  config: ExportConfig,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> => {
  try {
    // Update progress
    onProgress?.({
      stage: 'preparing',
      progress: 10,
      message: 'Preparing data for Excel export...',
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
      message: 'Formatting data for Excel...',
      totalRecords: data.length
    })

    // Format data for export
    const formattedData = formatExportData(data, config, {
      source: config.filename?.includes('dashboard') ? 'dashboard' : 'leads'
    })

    onProgress?.({
      stage: 'generating',
      progress: 60,
      message: 'Generating Excel file...',
      totalRecords: data.length,
      processedRecords: formattedData.rows.length
    })

    // Generate Excel workbook
    const workbook = createExcelWorkbook(formattedData, config)

    onProgress?.({
      stage: 'downloading',
      progress: 90,
      message: 'Initiating download...',
      totalRecords: data.length,
      processedRecords: formattedData.rows.length
    })

    // Trigger download
    const filename = config.filename || 'export.xlsx'
    await triggerExcelDownload(workbook, filename)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Excel export complete!',
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
      message: error instanceof Error ? error.message : 'Excel export failed'
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Exports data to multi-sheet Excel file
 */
export const exportMultiSheetExcel = async (
  sheets: Array<{
    name: string
    data: any[]
    config: ExportConfig
  }>,
  filename: string = 'multi-sheet-export.xlsx',
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> => {
  try {
    const totalRecords = sheets.reduce((sum, sheet) => sum + sheet.data.length, 0)

    onProgress?.({
      stage: 'preparing',
      progress: 5,
      message: 'Preparing multi-sheet Excel export...',
      totalRecords
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    let processedRecords = 0

    // Process each sheet
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i]
      
      onProgress?.({
        stage: 'generating',
        progress: Math.round(10 + (70 * i) / sheets.length),
        message: `Processing sheet: ${sheet.name}...`,
        totalRecords,
        processedRecords
      })

      // Validate sheet data
      const validation = validateExportData(sheet.data, sheet.config)
      if (!validation.isValid) {
        throw new Error(`Sheet "${sheet.name}" validation failed: ${validation.errors.join(', ')}`)
      }

      // Format data for this sheet
      const formattedData = formatExportData(sheet.data, sheet.config)
      
      // Create worksheet
      const worksheet = createWorksheet(formattedData, sheet.config)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
      
      processedRecords += sheet.data.length
    }

    onProgress?.({
      stage: 'downloading',
      progress: 90,
      message: 'Generating Excel file...',
      totalRecords,
      processedRecords
    })

    // Trigger download
    await triggerExcelDownload(workbook, filename)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Multi-sheet Excel export complete!',
      totalRecords,
      processedRecords
    })

    return {
      success: true,
      filename,
      metadata: {
        totalRecords,
        exportedRecords: processedRecords,
        timestamp: new Date().toISOString(),
        source: 'dashboard' // Multi-sheet is typically from dashboard
      }
    }

  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Multi-sheet export failed'
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Creates an Excel workbook from formatted data
 */
const createExcelWorkbook = (data: ExportData, config: ExportConfig): XLSX.WorkBook => {
  const workbook = XLSX.utils.book_new()
  const worksheet = createWorksheet(data, config)
  
  const sheetName = config.sheetName || 'Data'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  return workbook
}

/**
 * Creates an Excel worksheet from formatted data
 */
const createWorksheet = (data: ExportData, config: ExportConfig): XLSX.WorkSheet => {
  // Prepare data for Excel
  const excelData = prepareForExcel(data)
  
  // Create worksheet from array
  const worksheet = XLSX.utils.aoa_to_sheet(excelData)
  
  // Apply formatting and styling
  applyExcelStyling(worksheet, data, config)
  
  return worksheet
}

/**
 * Applies styling and formatting to Excel worksheet
 */
const applyExcelStyling = (
  worksheet: XLSX.WorkSheet, 
  data: ExportData, 
  config: ExportConfig
): void => {
  // Get worksheet range
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  
  // Auto-size columns
  const columnWidths: Array<{ width: number }> = []
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 10 // Minimum width
    
    // Check header width
    if (data.headers[col]) {
      maxWidth = Math.max(maxWidth, data.headers[col].length)
    }
    
    // Check data widths (sample first 10 rows for performance)
    const sampleRows = data.rows.slice(0, 10)
    sampleRows.forEach(row => {
      if (row[col] && typeof row[col] === 'string') {
        maxWidth = Math.max(maxWidth, row[col].length)
      }
    })
    
    // Cap maximum width
    columnWidths.push({ width: Math.min(maxWidth + 2, 50) })
  }
  
  worksheet['!cols'] = columnWidths
  
  // Style header row if present
  if (config.includeHeaders !== false && data.headers.length > 0) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      const cell = worksheet[cellRef]
      
      if (cell) {
        // Add header styling
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '366092' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }
  }
  
  // Add freeze panes for headers
  if (config.includeHeaders !== false) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  }
  
  // Add auto filter
  if (data.rows.length > 0) {
    const lastRow = range.e.r
    const lastCol = range.e.c
    worksheet['!autofilter'] = {
      ref: `A1:${XLSX.utils.encode_cell({ r: lastRow, c: lastCol })}`
    }
  }
}

/**
 * Triggers Excel file download in the browser
 */
const triggerExcelDownload = (workbook: XLSX.WorkBook, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        compression: true
      })
      
      // Create blob
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
 * Processes large datasets in chunks for Excel export
 */
export const exportLargeDatasetToExcel = async (
  data: any[],
  config: ExportConfig,
  chunkSize: number = 1000,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> => {
  try {
    onProgress?.({
      stage: 'preparing',
      progress: 5,
      message: 'Preparing large dataset for Excel export...',
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
      message: 'Creating Excel workbook...',
      totalRecords: data.length
    })

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheetData: any[][] = []

    // Add headers
    if (config.includeHeaders !== false) {
      worksheetData.push(headers)
    }

    // Process rows in chunks
    const totalChunks = Math.ceil(rows.length / chunkSize)
    
    for (let i = 0; i < totalChunks; i++) {
      const startIndex = i * chunkSize
      const endIndex = Math.min(startIndex + chunkSize, rows.length)
      const chunk = rows.slice(startIndex, endIndex)

      // Add chunk to worksheet data
      worksheetData.push(...chunk)

      // Update progress
      const progress = Math.round(20 + (60 * (i + 1)) / totalChunks)
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

    // Create worksheet from all data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    applyExcelStyling(worksheet, formattedData, config)
    
    const sheetName = config.sheetName || 'Large Dataset'
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    onProgress?.({
      stage: 'downloading',
      progress: 95,
      message: 'Generating Excel file...',
      totalRecords: data.length,
      processedRecords: rows.length
    })

    // Trigger download
    const filename = config.filename || 'large-export.xlsx'
    await triggerExcelDownload(workbook, filename)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Large Excel export complete!',
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
      message: error instanceof Error ? error.message : 'Large Excel export failed'
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Estimates the Excel file size before export
 */
export const estimateExcelSize = (data: any[], config: ExportConfig): number => {
  // Excel files are typically 1.5-2x larger than CSV equivalent
  const formattedData = formatExportData(data.slice(0, Math.min(100, data.length)), config)
  const estimatedCSVSize = formattedData.headers.join(',').length + 
    formattedData.rows.reduce((sum, row) => sum + row.join(',').length, 0)
  
  return Math.round(estimatedCSVSize * 1.8) // Excel overhead multiplier
}

/**
 * Validates Excel workbook before download
 */
export const validateExcelWorkbook = (workbook: XLSX.WorkBook): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!workbook) {
    errors.push('Workbook is null or undefined')
    return { isValid: false, errors }
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    errors.push('Workbook has no sheets')
    return { isValid: false, errors }
  }

  // Check each sheet
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      errors.push(`Sheet "${sheetName}" is missing`)
      return
    }

    // Check if sheet has data
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
    if (range.e.r === 0 && range.e.c === 0) {
      errors.push(`Sheet "${sheetName}" appears to be empty`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
} 