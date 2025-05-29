// =============================================================================
// DASHBOARD EXPORT - DASHBOARD-SPECIFIC EXPORT DATA PREPARATION
// =============================================================================

import { 
  DashboardExportData, 
  ExportFieldConfig,
  DASHBOARD_EXPORT_FIELDS 
} from './export-types'
import { Campaign, Profile } from '@/lib/types/database'
import { getCampaigns, getCampaignLeadStats } from '@/lib/data-access'

/**
 * Prepares dashboard analytics data for export
 */
export const getDashboardExportData = async (
  timeFilter: 'today' | 'week' | 'month' | 'all' = 'all',
  profile?: Profile | null
): Promise<{
  success: boolean
  data?: any[]
  metadata?: any
  error?: string
}> => {
  try {
    // Get campaigns data
    const campaignsResult = await getCampaigns({ 
      page: 1, 
      per_page: 100 // Get all campaigns for export
    })

    if (!campaignsResult.success || !campaignsResult.data) {
      return {
        success: false,
        error: 'Failed to load campaigns data'
      }
    }

    const campaigns = campaignsResult.data.data || []
    
    // Filter campaigns by time range if needed
    const filteredCampaigns = filterCampaignsByTime(campaigns, timeFilter)

    // Get detailed stats for each campaign
    const campaignMetrics: Array<{
      campaignId: string
      campaignName: string
      totalLeads: number
      completedLeads: number
      conversionRate: number
      avgCompletionTime: number
      createdAt: string
      lastActivity: string
    }> = []

    let totalLeads = 0
    let totalCompletedLeads = 0

    for (const campaign of filteredCampaigns) {
      try {
        const statsResult = await getCampaignLeadStats(campaign.id)
        
        if (statsResult.success && statsResult.data) {
          const { total, completed, conversion_rate } = statsResult.data
          
          campaignMetrics.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            totalLeads: total,
            completedLeads: completed,
            conversionRate: conversion_rate,
            avgCompletionTime: 0, // Not available from getCampaignLeadStats
            createdAt: campaign.created_at,
            lastActivity: campaign.updated_at || campaign.created_at
          })

          totalLeads += total
          totalCompletedLeads += completed
        } else {
          // Add campaign even if stats failed to load
          campaignMetrics.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            totalLeads: 0,
            completedLeads: 0,
            conversionRate: 0,
            avgCompletionTime: 0,
            createdAt: campaign.created_at,
            lastActivity: campaign.updated_at || campaign.created_at
          })
        }
      } catch (error) {
        console.error(`Error loading stats for campaign ${campaign.id}:`, error)
        // Continue with other campaigns
      }
    }

    // Calculate overall metrics
    const overallConversionRate = totalLeads > 0 ? (totalCompletedLeads / totalLeads) * 100 : 0
    
    // Find top performing campaign
    const topCampaigns = campaignMetrics
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 5)

    // Create export data
    const exportData = campaignMetrics.map(metric => ({
      campaignName: metric.campaignName,
      totalLeads: metric.totalLeads,
      completedLeads: metric.completedLeads,
      conversionRate: metric.conversionRate,
      avgCompletionTime: metric.avgCompletionTime,
      createdAt: metric.createdAt,
      lastActivity: metric.lastActivity
    }))

    // Create metadata with analytics summary
    const metadata = {
      analytics: {
        totalLeads,
        totalCampaigns: filteredCampaigns.length,
        conversionRate: overallConversionRate,
        avgCompletionTime: 0, // Not calculated since individual values aren't available
        topCampaigns: topCampaigns.map(c => ({
          name: c.campaignName,
          leads: c.totalLeads,
          conversion: c.conversionRate
        }))
      },
      filters: {
        timeFilter,
        dateRange: getDateRangeForFilter(timeFilter)
      },
      userInfo: profile ? {
        monthlyUsage: profile.monthly_campaigns_used,
        monthlyLimit: profile.monthly_campaign_limit,
        usagePercentage: Math.round((profile.monthly_campaigns_used / profile.monthly_campaign_limit) * 100)
      } : null,
      exportedAt: new Date().toISOString(),
      source: 'dashboard' as const
    }

    return {
      success: true,
      data: exportData,
      metadata
    }

  } catch (error) {
    console.error('Error preparing dashboard export data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare export data'
    }
  }
}

/**
 * Filters campaigns by time range
 */
const filterCampaignsByTime = (
  campaigns: Campaign[], 
  timeFilter: 'today' | 'week' | 'month' | 'all'
): Campaign[] => {
  if (timeFilter === 'all') {
    return campaigns
  }

  const now = new Date()
  const filterDate = new Date()

  switch (timeFilter) {
    case 'today':
      filterDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      filterDate.setDate(now.getDate() - 7)
      break
    case 'month':
      filterDate.setMonth(now.getMonth() - 1)
      break
  }

  return campaigns.filter(campaign => {
    const campaignDate = new Date(campaign.created_at)
    return campaignDate >= filterDate
  })
}

/**
 * Gets human-readable date range for filter
 */
const getDateRangeForFilter = (timeFilter: 'today' | 'week' | 'month' | 'all'): {
  start: string
  end: string
  description: string
} => {
  const now = new Date()
  const start = new Date()

  switch (timeFilter) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      return {
        start: start.toISOString(),
        end: now.toISOString(),
        description: 'Today'
      }
    case 'week':
      start.setDate(now.getDate() - 7)
      return {
        start: start.toISOString(),
        end: now.toISOString(),
        description: 'Last 7 days'
      }
    case 'month':
      start.setMonth(now.getMonth() - 1)
      return {
        start: start.toISOString(),
        end: now.toISOString(),
        description: 'Last 30 days'
      }
    case 'all':
    default:
      return {
        start: '2020-01-01T00:00:00.000Z', // Arbitrary start date
        end: now.toISOString(),
        description: 'All time'
      }
  }
}

/**
 * Gets export field configuration for dashboard data
 */
export const getDashboardExportFields = (): ExportFieldConfig[] => {
  return [...DASHBOARD_EXPORT_FIELDS]
} 