// =============================================================================
// EXPORT HISTORY - CLIENT-SIDE EXPORT HISTORY TRACKING AND MANAGEMENT
// =============================================================================

/**
 * Represents an export history entry
 */
export interface ExportHistoryEntry {
  id: string
  timestamp: string
  source: 'dashboard' | 'leads'
  format: 'csv' | 'excel'
  filename: string
  status: 'completed' | 'failed' | 'in-progress'
  recordCount: number
  fileSize?: number
  duration?: number
  error?: string
  filters?: Record<string, any>
  fieldSelection?: string[]
  metadata?: Record<string, any>
}

/**
 * Export statistics summary
 */
export interface ExportStats {
  totalExports: number
  successfulExports: number
  failedExports: number
  totalRecords: number
  averageDuration: number
  lastExportDate?: string
}

const STORAGE_KEY = 'flint_export_history'
const MAX_HISTORY_ENTRIES = 50

/**
 * Gets all export history entries from localStorage
 */
export const getExportHistory = (): ExportHistoryEntry[] => {
  try {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored) as ExportHistoryEntry[]
    
    // Sort by timestamp (newest first)
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error('Error loading export history:', error)
    return []
  }
}

/**
 * Adds a new export history entry
 */
export const addExportHistoryEntry = (entry: Omit<ExportHistoryEntry, 'id' | 'timestamp'>): ExportHistoryEntry => {
  try {
    const newEntry: ExportHistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString()
    }
    
    const history = getExportHistory()
    history.unshift(newEntry)
    
    // Limit to max entries
    const limitedHistory = history.slice(0, MAX_HISTORY_ENTRIES)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    }
    
    return newEntry
  } catch (error) {
    console.error('Error adding export history entry:', error)
    throw error
  }
}

/**
 * Updates an existing export history entry
 */
export const updateExportHistoryEntry = (id: string, updates: Partial<ExportHistoryEntry>): boolean => {
  try {
    const history = getExportHistory()
    const index = history.findIndex(entry => entry.id === id)
    
    if (index === -1) {
      console.warn(`Export history entry with id ${id} not found`)
      return false
    }
    
    // Update the entry
    history[index] = { ...history[index], ...updates }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
    
    return true
  } catch (error) {
    console.error('Error updating export history entry:', error)
    return false
  }
}

/**
 * Removes an export history entry by ID
 */
export const removeExportHistoryEntry = (id: string): boolean => {
  try {
    const history = getExportHistory()
    const filteredHistory = history.filter(entry => entry.id !== id)
    
    if (filteredHistory.length === history.length) {
      console.warn(`Export history entry with id ${id} not found`)
      return false
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory))
    }
    
    return true
  } catch (error) {
    console.error('Error removing export history entry:', error)
    return false
  }
}

/**
 * Clears all export history
 */
export const clearExportHistory = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.error('Error clearing export history:', error)
  }
}

/**
 * Gets export statistics
 */
export const getExportStats = (): ExportStats => {
  const history = getExportHistory()
  
  if (history.length === 0) {
    return {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      totalRecords: 0,
      averageDuration: 0
    }
  }
  
  const successful = history.filter(entry => entry.status === 'completed')
  const failed = history.filter(entry => entry.status === 'failed')
  const totalRecords = history.reduce((sum, entry) => sum + entry.recordCount, 0)
  const completedWithDuration = successful.filter(entry => entry.duration && entry.duration > 0)
  const averageDuration = completedWithDuration.length > 0
    ? completedWithDuration.reduce((sum, entry) => sum + (entry.duration || 0), 0) / completedWithDuration.length
    : 0
  
  return {
    totalExports: history.length,
    successfulExports: successful.length,
    failedExports: failed.length,
    totalRecords,
    averageDuration,
    lastExportDate: history[0]?.timestamp
  }
}

/**
 * Gets recent export history for a specific source
 */
export const getRecentExports = (source?: 'dashboard' | 'leads', limit: number = 5): ExportHistoryEntry[] => {
  const history = getExportHistory()
  
  let filtered = history
  if (source) {
    filtered = history.filter(entry => entry.source === source)
  }
  
  return filtered.slice(0, limit)
}

/**
 * Generates a unique ID for export entries
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Formats duration in human-readable format
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Gets relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Export history hook for tracking export lifecycle
 */
export const useExportHistory = () => {
  /**
   * Starts tracking a new export
   */
  const startExport = (params: {
    source: 'dashboard' | 'leads'
    format: 'csv' | 'excel'
    filename: string
    recordCount: number
    filters?: Record<string, any>
    fieldSelection?: string[]
    metadata?: Record<string, any>
  }): string => {
    const entry = addExportHistoryEntry({
      ...params,
      status: 'in-progress'
    })
    return entry.id
  }
  
  /**
   * Marks export as completed
   */
  const completeExport = (id: string, params: {
    fileSize?: number
    duration?: number
  }): void => {
    updateExportHistoryEntry(id, {
      status: 'completed',
      ...params
    })
  }
  
  /**
   * Marks export as failed
   */
  const failExport = (id: string, error: string): void => {
    updateExportHistoryEntry(id, {
      status: 'failed',
      error
    })
  }
  
  return {
    startExport,
    completeExport,
    failExport,
    getHistory: getExportHistory,
    getStats: getExportStats,
    getRecent: getRecentExports
  }
} 