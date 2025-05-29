// =============================================================================
// EXPORT TYPES - TYPE DEFINITIONS FOR EXPORT FUNCTIONALITY
// =============================================================================

export type ExportFormat = 'csv' | 'excel'

export type ExportScope = 'all' | 'selected' | 'filtered'

export interface ExportConfig {
  format: ExportFormat
  scope: ExportScope
  fields: ExportFieldConfig[]
  filename?: string
  sheetName?: string
  includeHeaders?: boolean
  dateFormat?: string
}

export interface ExportFieldConfig {
  key: string
  label: string
  type?: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone'
  formatter?: (value: any) => string
  include?: boolean
}

export interface ExportData {
  headers: string[]
  rows: any[][]
  metadata?: ExportMetadata
}

export interface ExportMetadata {
  totalRecords: number
  exportedRecords: number
  filters?: Record<string, any>
  timestamp: string
  exportedBy?: string
  source: 'dashboard' | 'leads'
}

export interface ExportProgress {
  stage: 'preparing' | 'fetching' | 'formatting' | 'generating' | 'downloading' | 'complete' | 'error'
  progress: number
  message: string
  totalRecords?: number
  processedRecords?: number
}

export interface ExportResult {
  success: boolean
  filename?: string
  downloadUrl?: string
  error?: string
  metadata?: ExportMetadata
}

export interface ExportHistory {
  id: string
  filename: string
  format: ExportFormat
  scope: ExportScope
  recordCount: number
  exportedAt: string
  source: 'dashboard' | 'leads'
  fileSize?: number
  downloadUrl?: string
  metadata?: Record<string, any>
}

// Dashboard-specific export types
export interface DashboardExportData {
  analytics: {
    totalLeads: number
    totalCampaigns: number
    conversionRate: number
    avgCompletionTime: number
    topCampaigns: Array<{
      name: string
      leads: number
      conversion: number
    }>
  }
  campaignMetrics: Array<{
    campaignId: string
    campaignName: string
    totalLeads: number
    completedLeads: number
    conversionRate: number
    avgCompletionTime: number
    createdAt: string
    lastActivity: string
  }>
  timeSeriesData?: Array<{
    date: string
    leads: number
    completions: number
    conversions: number
  }>
}

// Leads-specific export types
export interface LeadsExportData {
  leads: Array<{
    id: string
    name?: string
    email: string
    phone?: string
    campaignName: string
    campaignId: string
    status: string
    createdAt: string
    lastActivity?: string
    responses?: Record<string, any>
    completionPercentage: number
    ipAddress?: string
    userAgent?: string
    source?: string
    metadata?: Record<string, any>
  }>
  summary?: {
    totalLeads: number
    byStatus: Record<string, number>
    byCampaign: Record<string, number>
    dateRange: {
      start: string
      end: string
    }
  }
}

// Field configurations for different data sources
export const DASHBOARD_EXPORT_FIELDS: ExportFieldConfig[] = [
  { key: 'campaignName', label: 'Campaign Name', type: 'string', include: true },
  { key: 'totalLeads', label: 'Total Leads', type: 'number', include: true },
  { key: 'completedLeads', label: 'Completed Leads', type: 'number', include: true },
  { key: 'conversionRate', label: 'Conversion Rate (%)', type: 'number', formatter: (v) => `${v.toFixed(2)}%`, include: true },
  { key: 'avgCompletionTime', label: 'Avg Completion Time (min)', type: 'number', formatter: (v) => `${(v / 60).toFixed(1)}`, include: true },
  { key: 'createdAt', label: 'Created At', type: 'date', include: true },
  { key: 'lastActivity', label: 'Last Activity', type: 'date', include: true }
]

export const LEADS_EXPORT_FIELDS: ExportFieldConfig[] = [
  { key: 'name', label: 'Name', type: 'string', include: true },
  { key: 'email', label: 'Email', type: 'email', include: true },
  { key: 'phone', label: 'Phone', type: 'phone', include: false },
  { key: 'campaignName', label: 'Campaign', type: 'string', include: true },
  { key: 'status', label: 'Status', type: 'string', include: true },
  { key: 'completionPercentage', label: 'Completion %', type: 'number', formatter: (v) => `${v}%`, include: true },
  { key: 'createdAt', label: 'Created At', type: 'date', include: true },
  { key: 'lastActivity', label: 'Last Activity', type: 'date', include: false },
  { key: 'source', label: 'Source', type: 'string', include: false },
  { key: 'ipAddress', label: 'IP Address', type: 'string', include: false }
] 