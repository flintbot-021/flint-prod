'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { 
  getCampaigns,
  getCampaignById,
  getCurrentProfile,
  getBatchCampaignLeadStats,
  updateCampaign,
  publishCampaign,
  deleteCampaign,
  createCampaignWithUsageTracking
} from '@/lib/data-access'
import { Campaign, Profile, CampaignStatus, CreateCampaign } from '@/lib/types/database'
import { LazyExportButton } from '@/components/export/lazy-export-button'
import { getDashboardExportData, getDashboardExportFields } from '@/lib/export'
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CampaignCard } from '@/components/dashboard/campaign-card'
import type { CampaignWithStats } from '@/components/dashboard/campaign-card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { CampaignEditModal } from '@/components/campaign-builder/campaign-edit-modal'
import { PrimaryNavigation } from '@/components/primary-navigation'
import { toast } from '@/components/ui/use-toast'
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
  FileText,
  LogOut
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignStats, setCampaignStats] = useState<Record<string, {
    total: number;
    converted: number;
    conversion_rate: number;
    recent_leads: any[];
  }>>({})
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    completionRate: 0,
    recentCampaigns: []
  })
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Lazy loading for export data
  const [exportData, setExportData] = useState<any[]>([])
  const [loadingExportData, setLoadingExportData] = useState(false)
  const [hasLoadedExportData, setHasLoadedExportData] = useState(false)

  // Modal state for campaign edit/create
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user, timeFilter])

  // Memoize campaigns with stats to prevent unnecessary recalculations
  const campaignsWithStats = useMemo(() => {
    return campaigns.map(campaign => {
      const stats = campaignStats[campaign.id] || {
        total: 0,
        converted: 0,
        conversion_rate: 0,
        recent_leads: []
      }
      
      return {
        ...campaign,
        leadCount: stats.total,
        completionRate: stats.conversion_rate,
        viewCount: stats.total,
        lastActivity: campaign.updated_at
      } as CampaignWithStats
    })
  }, [campaigns, campaignStats])

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true)
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
      setCampaigns(campaignsData)

      // Load stats for all campaigns in batch
      if (campaignsData.length > 0) {
        loadCampaignStats(campaignsData)
      } else {
        setLoadingStats(false)
      }

    } catch (err) {
      console.error('Error loading campaigns:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoadingStats(false)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const loadCampaignStats = async (campaignsData: Campaign[]) => {
    try {
      setLoadingStats(true)
      
      const campaignIds = campaignsData.map(c => c.id)
      const statsResult = await getBatchCampaignLeadStats(campaignIds)

      if (!statsResult.success) {
        throw new Error(statsResult.error || 'Failed to load campaign stats')
      }

      const batchStats = statsResult.data || {}
      setCampaignStats(batchStats)

      // Calculate overall stats
      let totalLeads = 0
      let totalCompletedLeads = 0
      let topCampaign: CampaignWithStats | undefined

      const campaignsWithStatsData = campaignsData.map(campaign => {
        const stats = batchStats[campaign.id] || {
          total: 0,
          converted: 0,
          conversion_rate: 0,
          recent_leads: []
        }
        
        totalLeads += stats.total
        totalCompletedLeads += stats.converted

        const campaignWithStats: CampaignWithStats = {
          ...campaign,
          leadCount: stats.total,
          completionRate: stats.conversion_rate,
          viewCount: stats.total,
          lastActivity: campaign.updated_at
        }

        if (!topCampaign || stats.total > topCampaign.leadCount) {
          topCampaign = campaignWithStats
        }

        return campaignWithStats
      })

      const overallCompletionRate = totalLeads > 0 ? (totalCompletedLeads / totalLeads) * 100 : 0

      setStats({
        totalCampaigns: campaignsData.length,
        totalLeads,
        completionRate: Math.round(overallCompletionRate * 100) / 100,
        recentCampaigns: campaignsWithStatsData.slice(0, 5),
        topPerformingCampaign: topCampaign
      })

    } catch (err) {
      console.error('Error loading campaign stats:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingStats(false)
    }
  }

  // Lazy load export data only when needed
  const loadExportData = async () => {
    if (hasLoadedExportData) return

    try {
      setLoadingExportData(true)
      const exportResult = await getDashboardExportData(timeFilter, profile)
      
      if (exportResult.success && exportResult.data) {
        setExportData(exportResult.data)
      } else {
        console.error('Failed to load export data:', exportResult.error)
        setExportData([])
      }
      setHasLoadedExportData(true)
    } catch (error) {
      console.error('Error loading export data:', error)
      setExportData([])
    } finally {
      setLoadingExportData(false)
    }
  }

  const handleExportStart = () => {
    if (!hasLoadedExportData) {
      loadExportData()
    }
    console.log('Export started...')
  }

  const handleExportComplete = (filename: string) => {
    console.log(`Export completed: ${filename}`)
  }

  const handleExportError = (error: string) => {
    console.error('Export error:', error)
    setError(`Export failed: ${error}`)
  }

  // Campaign management functions
  const handleStatusChange = useCallback(async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      setError(null)
      
      // Prevent publishing from dashboard - users must use the builder
      if (newStatus === 'published') {
        throw new Error('Publishing must be done from the campaign builder. Please use the "Edit" option and publish from there.')
      }
      
      const result = await updateCampaign(campaignId, { status: newStatus })

      if (!result.success) {
        throw new Error(result.error || `Failed to update campaign`)
      }

      // Refresh campaigns
      loadCampaigns()
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

          // Refresh campaigns
          loadCampaigns()
        } catch (err) {
          console.error('Error deleting campaign:', err)
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      }
    })
  }, [showConfirmation])

  const canCreateCampaign = true // No campaign limits

  // Open modal for creating new campaign
  const handleCreateCampaign = useCallback(() => {
    setEditingCampaign(null) // No existing campaign - creation mode
    setShowEditModal(true)
  }, [])

  // Handle edit campaign from card
  const handleEditCampaign = useCallback(async (campaignWithStats: CampaignWithStats) => {
    try {
      setError(null)
      // Fetch full campaign data for editing
      const result = await getCampaignById(campaignWithStats.id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load campaign')
      }
      setEditingCampaign(result.data)
      setShowEditModal(true)
    } catch (err) {
      console.error('Error loading campaign for editing:', err)
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
    }
  }, [])

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowEditModal(false)
    setEditingCampaign(null)
  }, [])

  // Handle modal save
  const handleModalSave = useCallback((updatedCampaign: Campaign) => {
    // Update campaign in our local state
    setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c))
    
    // Refresh campaigns to get updated stats
    loadCampaigns()
    
    // Close modal
    handleModalClose()
    
    toast({
      title: 'Campaign updated',
      description: 'Your campaign has been successfully updated.',
    })
    if (!editingCampaign) {
      // Redirect to builder for new tool
      router.push(`/dashboard/campaigns/${updatedCampaign.id}/builder`)
    }
  }, [loadCampaigns, handleModalClose, editingCampaign, router])

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
      <PrimaryNavigation currentPage="dashboard" />

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
              {/* Optimized New Tool Button with Link prefetching */}
              <Button
                onClick={handleCreateCampaign}
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
                    onClick={loadCampaigns}
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
              loading={loadingCampaigns}
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
              {loadingCampaigns && (
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
              {!loadingCampaigns && campaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaignsWithStats.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteCampaign}
                      onEdit={handleEditCampaign}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loadingCampaigns && campaigns.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-xl mb-2">No tools yet</CardTitle>
                    <CardDescription className="mb-6 max-w-md mx-auto">
                      Create your first lead magnet tool to start capturing and converting leads.
                    </CardDescription>
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleCreateCampaign}
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
      {/* Campaign Edit Modal */}
      {showEditModal && (
        <CampaignEditModal
          campaign={editingCampaign}
          onClose={handleModalClose}
          onSave={handleModalSave}
          isOpen={showEditModal}
          mode={editingCampaign ? 'edit' : 'create'}
          initialStep={editingCampaign ? 'basic' : 'basic'}
        />
      )}
    </div>
  )
} 