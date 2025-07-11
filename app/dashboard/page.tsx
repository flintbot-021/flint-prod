'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { 
  getCampaigns, 
  getCurrentProfile,
  getCampaignLeads,
  getCampaignLeadStats,
  updateCampaign,
  publishCampaign,
  deleteCampaign
} from '@/lib/data-access'
import { Campaign, Profile, CampaignStatus } from '@/lib/types/database'
import { LazyExportButton } from '@/components/export/lazy-export-button'
import { ExportHistory } from '@/components/export/ExportHistory'
import { getDashboardExportData, getDashboardExportFields } from '@/lib/export'
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CampaignCard } from '@/components/dashboard/campaign-card'
import type { CampaignWithStats } from '@/components/dashboard/campaign-card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { 
  Users, 
  TrendingUp, 
  Target,
  Plus,
  ArrowUpRight,
  Activity,
  Clock,
  Settings,
  Globe,
  Archive,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalCampaigns: number
  totalLeads: number
  completionRate: number
  recentCampaigns: CampaignWithStats[]
  topPerformingCampaign?: CampaignWithStats
}

type TimeFilter = 'today' | 'week' | 'month' | 'all'

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' }
]

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    completionRate: 0,
    recentCampaigns: []
  })
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportData, setExportData] = useState<any[]>([])
  const [loadingExportData, setLoadingExportData] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, timeFilter])

  // Load export data whenever timeFilter or profile changes
  useEffect(() => {
    if (user && profile) {
      loadExportData()
    }
  }, [user, profile, timeFilter])

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true)
      setError(null)

      // Load profile and campaigns in parallel
      const [profileResult, campaignsResult] = await Promise.all([
        getCurrentProfile(),
        getCampaigns({ page: 1, per_page: 20 })
      ])

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to load profile')
      }

      if (!campaignsResult.success) {
        throw new Error(campaignsResult.error || 'Failed to load campaigns')
      }

      setProfile(profileResult.data || null)

      const campaignsData = campaignsResult.data?.data || []
      let totalLeads = 0
      let totalCompletedLeads = 0
      let topCampaign: CampaignWithStats | undefined

      // Get stats for each campaign
      const campaignsWithStats = await Promise.all(
        campaignsData.map(async (campaign: Campaign) => {
          const statsResult = await getCampaignLeadStats(campaign.id)
          if (statsResult.success && statsResult.data) {
            const { total, converted, conversion_rate } = statsResult.data
            totalLeads += total
            totalCompletedLeads += converted

            const campaignWithStats: CampaignWithStats = {
              ...campaign,
              leadCount: total,
              completionRate: conversion_rate,
              viewCount: total, // For now, using total as view count
              lastActivity: campaign.updated_at
            }

            if (!topCampaign || total > topCampaign.leadCount) {
              topCampaign = campaignWithStats
            }

            return campaignWithStats
          }
          return {
            ...campaign,
            leadCount: 0,
            completionRate: 0,
            viewCount: 0,
            lastActivity: campaign.updated_at
          } as CampaignWithStats
        })
      )

      const overallCompletionRate = totalLeads > 0 ? (totalCompletedLeads / totalLeads) * 100 : 0

      setCampaigns(campaignsWithStats)
      setStats({
        totalCampaigns: campaignsData.length,
        totalLeads,
        completionRate: Math.round(overallCompletionRate * 100) / 100,
        recentCampaigns: campaignsWithStats.slice(0, 5),
        topPerformingCampaign: topCampaign
      })

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingStats(false)
    }
  }

  const loadExportData = async () => {
    try {
      setLoadingExportData(true)
      const exportResult = await getDashboardExportData(timeFilter, profile)
      
      if (exportResult.success && exportResult.data) {
        setExportData(exportResult.data)
      } else {
        console.error('Failed to load export data:', exportResult.error)
        setExportData([])
      }
    } catch (error) {
      console.error('Error loading export data:', error)
      setExportData([])
    } finally {
      setLoadingExportData(false)
    }
  }

  const handleExportStart = () => {
    console.log('Export started...')
  }

  const handleExportComplete = (filename: string) => {
    console.log(`Export completed: ${filename}`)
    // Could show a success notification here
  }

  const handleExportError = (error: string) => {
    console.error('Export error:', error)
    setError(`Export failed: ${error}`)
  }

  // Campaign management functions
  const handleStatusChange = useCallback(async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      setError(null)
      
      let result
      if (newStatus === 'published') {
        result = await publishCampaign(campaignId)
      } else {
        result = await updateCampaign(campaignId, { status: newStatus })
      }

      if (!result.success) {
        throw new Error(result.error || `Failed to ${newStatus === 'published' ? 'publish' : 'update'} campaign`)
      }

      await loadDashboardData()
    } catch (err) {
      console.error('Error updating campaign status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [])

  const handleDeleteCampaign = useCallback(async (campaignId: string, campaignName: string) => {
    showConfirmation({
      title: 'Delete Campaign',
      description: `Are you sure you want to delete "${campaignName}"? This action cannot be undone and all associated data will be permanently removed.`,
      confirmText: 'Delete Campaign',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          setError(null)
          
          const result = await deleteCampaign(campaignId)
          if (!result.success) {
            throw new Error(result.error || 'Failed to delete campaign')
          }

          await loadDashboardData()
        } catch (err) {
          console.error('Error deleting campaign:', err)
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      }
    })
  }, [showConfirmation])

  const canCreateCampaign = true // No campaign limits

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-foreground">
                Flint
              </h1>
              <nav className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-primary"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/leads')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Leads
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filter and Export Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
              {timeFilterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeFilter === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeFilter(option.value as TimeFilter)}
                  className={`h-8 px-3 text-xs font-medium transition-all ${
                    timeFilter === option.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                      {option.label}
                </Button>
                  ))}
            </div>
            <div className="flex items-center space-x-3">
              <LazyExportButton
                data={exportData}
                source="dashboard"
                title="Export Dashboard Analytics"
                defaultFields={getDashboardExportFields()}
                onExportStart={handleExportStart}
                onExportComplete={handleExportComplete}
                onExportError={handleExportError}
                variant="outline"
                size="sm"
                disabled={loadingExportData}
                showDropdown={true}
                className="h-9"
              />
              <Button
                onClick={() => router.push('/dashboard/campaigns/create')}
                disabled={!canCreateCampaign}
                size="sm"
                className="h-9 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Tool</span>
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <p className="font-medium">Error loading dashboard data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={loadDashboardData}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Live Tools"
              value={campaigns.filter(c => c.status === 'published').length}
              subtitle={
                <span className="text-green-600">
                  {stats.totalCampaigns} total tools
                </span>
              }
              icon={Activity}
              iconColor="text-blue-600"
              loading={loadingStats}
            />
            
            <StatsCard
              title="Average Conversion Rate"
              value={`${stats.completionRate.toFixed(1)}%`}
              subtitle={
                <span className="text-green-600">
                  <ArrowUpRight className="h-3 w-3 inline" />
                  3.2% improvement
                </span>
              }
              icon={TrendingUp}
              iconColor="text-purple-600"
              loading={loadingStats}
            />
            
            <StatsCard
              title="Total Leads"
              value={stats.totalLeads.toLocaleString()}
              subtitle={
                <span className="text-green-600">
                  <ArrowUpRight className="h-3 w-3 inline" />
                  12% from last period
                </span>
              }
              icon={Users}
              iconColor="text-green-600"
              loading={loadingStats}
            />
          </div>

          {/* Main Content Grid */}
          <div>
            {/* Campaigns Grid */}
                    <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Your Tools</h2>
                {campaigns.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {campaigns.length} tool{campaigns.length !== 1 ? 's' : ''} total
                  </p>
                )}
                    </div>

              {/* Loading State */}
              {loadingStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
              )}

              {/* Campaigns Grid */}
              {!loadingStats && campaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteCampaign}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loadingStats && campaigns.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-xl mb-2">No tools yet</CardTitle>
                    <CardDescription className="mb-6 max-w-md mx-auto">
                      Create your first lead magnet tool to start capturing and converting leads.
                    </CardDescription>
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => router.push('/dashboard/campaigns/create')}
                        disabled={!canCreateCampaign}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Your First Tool</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


            </div>
          </div>
        </div>
      </main>
      
      {/* Confirmation Dialog */}
      {ConfirmationDialog}
    </div>
  )
} 