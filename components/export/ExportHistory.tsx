// =============================================================================
// EXPORT HISTORY - UI COMPONENT FOR DISPLAYING EXPORT HISTORY
// =============================================================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  getExportHistory, 
  getExportStats, 
  removeExportHistoryEntry, 
  clearExportHistory,
  formatFileSize,
  formatDuration,
  getRelativeTime,
  type ExportHistoryEntry 
} from '@/lib/export/export-history'
import { 
  Download, 
  FileText, 
  Table, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MoreHorizontal,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react'

interface ExportHistoryProps {
  source?: 'dashboard' | 'leads' | 'all'
  maxEntries?: number
  showStats?: boolean
  compact?: boolean
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({
  source = 'all',
  maxEntries = 10,
  showStats = true,
  compact = false
}) => {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<ExportHistoryEntry[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getExportStats> | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all')
  const [formatFilter, setFormatFilter] = useState<'all' | 'csv' | 'excel'>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [history, source, statusFilter, formatFilter, maxEntries])

  const loadHistory = () => {
    const allHistory = getExportHistory()
    const exportStats = getExportStats()
    setHistory(allHistory)
    setStats(exportStats)
  }

  const applyFilters = () => {
    let filtered = [...history]

    // Filter by source
    if (source !== 'all') {
      filtered = filtered.filter(entry => entry.source === source)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter)
    }

    // Filter by format
    if (formatFilter !== 'all') {
      filtered = filtered.filter(entry => entry.format === formatFilter)
    }

    // Limit entries
    filtered = filtered.slice(0, maxEntries)

    setFilteredHistory(filtered)
  }

  const handleRemoveEntry = (id: string) => {
    removeExportHistoryEntry(id)
    loadHistory()
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all export history?')) {
      clearExportHistory()
      loadHistory()
    }
  }

  const getStatusIcon = (status: ExportHistoryEntry['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getFormatIcon = (format: ExportHistoryEntry['format']) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'excel':
        return <Table className="h-4 w-4 text-blue-600" />
      default:
        return <Download className="h-4 w-4 text-gray-400" />
    }
  }

  const getSourceBadge = (source: ExportHistoryEntry['source']) => {
    const variants: Record<ExportHistoryEntry['source'], 'default' | 'secondary'> = {
      dashboard: 'default',
      leads: 'secondary'
    }
    
    return (
      <Badge variant={variants[source]} className="text-xs">
        {source === 'dashboard' ? 'Dashboard' : 'Leads'}
      </Badge>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Recent Exports</h4>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
        
        {filteredHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exports yet</p>
        ) : (
          <div className="space-y-1">
            {filteredHistory.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(entry.status)}
                  {getFormatIcon(entry.format)}
                  <span className="font-medium">{entry.filename}</span>
                </div>
                <span className="text-muted-foreground">{getRelativeTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Export History</span>
            </CardTitle>
            <CardDescription>
              Track and manage your data export activities
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Section */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalExports}</div>
              <div className="text-sm text-muted-foreground">Total Exports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successfulExports}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalRecords.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Records Exported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatDuration(stats.averageDuration)}</div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm border border-input rounded px-2 py-1"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className="text-sm border border-input rounded px-2 py-1"
          >
            <option value="all">All Formats</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No exports found</h3>
            <p className="text-muted-foreground">
              {source === 'all' 
                ? 'Start exporting data to see your export history here.'
                : `No ${source} exports found. Try changing your filters.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(entry.status)}
                    {getFormatIcon(entry.format)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-foreground">{entry.filename}</span>
                      {getSourceBadge(entry.source)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{entry.recordCount.toLocaleString()} records</span>
                      {entry.fileSize && <span>{formatFileSize(entry.fileSize)}</span>}
                      {entry.duration && <span>{formatDuration(entry.duration)}</span>}
                      <span>{getRelativeTime(entry.timestamp)}</span>
                    </div>
                    
                    {entry.error && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {entry.error}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEntry(entry.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExportHistory 