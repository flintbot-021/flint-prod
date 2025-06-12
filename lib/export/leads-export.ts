// =============================================================================
// LEADS EXPORT - LEADS-SPECIFIC EXPORT DATA PREPARATION
// =============================================================================

import { 
  LeadsExportData, 
  ExportFieldConfig,
  LEADS_EXPORT_FIELDS 
} from './export-types'
import { Lead, Campaign, Profile } from '@/lib/types/database'
import { getLeads, getCampaigns, type PaginationParams } from '@/lib/data-access'

interface LeadWithCampaign extends Lead {
  campaign: Campaign | null
}

interface LeadsExportParams {
  searchTerm?: string
  selectedCampaign?: string
  sortField?: 'created_at' | 'email' | 'phone' | 'campaign_name' | 'converted_at' | 'name' | 'conversion_time'
  sortDirection?: 'asc' | 'desc'
  includeCompleted?: boolean
  maxRecords?: number
}

/**
 * Prepares leads data for export
 */
export const getLeadsExportData = async (
  params: LeadsExportParams = {},
  profile?: Profile | null
): Promise<{
  success: boolean
  data?: any[]
  metadata?: any
  error?: string
}> => {
  try {
    const {
      searchTerm = '',
      selectedCampaign = 'all',
      sortField = 'created_at',
      sortDirection = 'desc',
      includeCompleted = true,
      maxRecords = 1000
    } = params

    // Get leads data with pagination
    const paginationParams: PaginationParams = {
      page: 1,
      per_page: maxRecords,
      sort_by: sortField,
      sort_order: sortDirection
    }

    // Add search and campaign filters if specified
    const leadsParams = {
      ...paginationParams,
      ...(selectedCampaign !== 'all' && { campaign_id: selectedCampaign }),
      ...(searchTerm && { search: searchTerm }),
      ...(includeCompleted !== undefined && { completed: includeCompleted })
    }

    const [leadsResult, campaignsResult] = await Promise.all([
      getLeads(leadsParams),
      getCampaigns({ page: 1, per_page: 100 })
    ])

    if (!leadsResult.success || !leadsResult.data) {
      return {
        success: false,
        error: 'Failed to load leads data'
      }
    }

    if (!campaignsResult.success || !campaignsResult.data) {
      return {
        success: false,
        error: 'Failed to load campaigns data'
      }
    }

    const leads = leadsResult.data.data || []
    const campaigns = campaignsResult.data.data || []

    // Create campaigns map for enrichment
    const campaignsMap = new Map<string, Campaign>()
    campaigns.forEach(campaign => {
      campaignsMap.set(campaign.id, campaign)
    })

    // Enrich leads with campaign data
    const enrichedLeads: LeadWithCampaign[] = leads.map((lead: Lead) => {
      const campaign = campaignsMap.get(lead.campaign_id) || null
      return { ...lead, campaign }
    })

    // Apply additional client-side filtering if needed
    let filteredLeads = enrichedLeads

    // Additional search filtering (if not handled by server)
    if (searchTerm && !leadsParams.search) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Format data for export
    const exportData = filteredLeads.map(lead => ({
      email: lead.email || '',
      phone: lead.phone || '',
      name: lead.name || '',
      campaignName: lead.campaign?.name || 'Unknown Campaign',
      campaignStatus: lead.campaign?.status || 'unknown',
      sessionId: lead.session_id || '',
      conversionSectionId: lead.conversion_section_id || '',
      metadata: JSON.stringify(lead.metadata || {}),
      createdAt: lead.created_at,
      convertedAt: lead.converted_at || '',
      isConverted: !!lead.converted_at,
      leadId: lead.id,
      campaignId: lead.campaign_id
    }))

    // Calculate summary statistics
    const totalLeads = filteredLeads.length
    const convertedLeads = filteredLeads.filter(lead => lead.converted_at).length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Group by campaign for analytics
    const campaignStats = new Map<string, {
      name: string
      leads: number
      converted: number
      conversionRate: number
    }>()

    filteredLeads.forEach(lead => {
      const campaignId = lead.campaign_id
      const campaignName = lead.campaign?.name || 'Unknown Campaign'
      
      if (!campaignStats.has(campaignId)) {
        campaignStats.set(campaignId, {
          name: campaignName,
          leads: 0,
          converted: 0,
          conversionRate: 0
        })
      }

      const stats = campaignStats.get(campaignId)!
      stats.leads += 1
      if (lead.converted_at) {
        stats.converted += 1
      }
      stats.conversionRate = stats.leads > 0 ? (stats.converted / stats.leads) * 100 : 0
    })

    // Create metadata
    const metadata = {
      analytics: {
        totalLeads,
        convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        campaignBreakdown: Array.from(campaignStats.values())
      },
      filters: {
        searchTerm: searchTerm || null,
        selectedCampaign: selectedCampaign !== 'all' ? selectedCampaign : null,
        sortField,
        sortDirection,
        includeCompleted,
        maxRecords
      },
      userInfo: profile ? {
        monthlyLeadsCaptured: profile.monthly_leads_captured || 0,
        monthlyLeadsLimit: profile.monthly_leads_limit || 1000,
        usagePercentage: Math.round(((profile.monthly_leads_captured || 0) / (profile.monthly_leads_limit || 1000)) * 100)
      } : null,
      exportedAt: new Date().toISOString(),
      source: 'leads' as const
    }

    return {
      success: true,
      data: exportData,
      metadata
    }

  } catch (error) {
    console.error('Error preparing leads export data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare export data'
    }
  }
}

/**
 * Gets export field configuration for leads data
 */
export const getLeadsExportFields = (): ExportFieldConfig[] => {
  return [...LEADS_EXPORT_FIELDS]
} 