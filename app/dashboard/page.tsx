'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ExportButton } from '@/components/export'
import { ExportHistory } from '@/components/export/ExportHistory'
import { getDashboardExportData, getDashboardExportFields } from '@/lib/export'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Eye,
  Target,
  Calendar,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  CheckCircle,
  Filter,
  Settings,
  Edit,
  Trash2,
  ExternalLink,
  Hammer,
  MoreVertical,
  Archive,
  Globe,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface CampaignWithStats extends Campaign {
  leadCount: number
  completionRate: number
  viewCount: number
  lastActivity?: string
}

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
            const { total, completed, conversion_rate } = statsResult.data
            totalLeads += total
            totalCompletedLeads += completed

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
  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
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
  }

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return
    }

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



  const getStatusColor = (status: CampaignStatus): string => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-accent text-gray-800 border-border'
      default:
        return 'bg-accent text-gray-800 border-border'
    }
  }

  const getStatusIcon = (status: CampaignStatus) => {
    switch (status) {
      case 'published':
        return <Activity className="h-3 w-3" />
      case 'draft':
        return <Clock className="h-3 w-3" />
      case 'archived':
        return <Settings className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusActions = (campaign: CampaignWithStats) => {
    const actions = []

    if (campaign.status === 'draft') {
      actions.push({
        label: 'Publish Campaign',
        icon: Globe,
        action: () => handleStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
      actions.push({
        label: 'Archive Campaign',
        icon: Archive,
        action: () => handleStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'published') {
      actions.push({
        label: 'Unpublish (Draft)',
        icon: FileText,
        action: () => handleStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Archive Campaign',
        icon: Archive,
        action: () => handleStatusChange(campaign.id, 'archived'),
        variant: 'secondary' as const
      })
    } else if (campaign.status === 'archived') {
      actions.push({
        label: 'Restore to Draft',
        icon: FileText,
        action: () => handleStatusChange(campaign.id, 'draft'),
        variant: 'secondary' as const
      })
      actions.push({
        label: 'Publish Campaign',
        icon: Globe,
        action: () => handleStatusChange(campaign.id, 'published'),
        variant: 'default' as const
      })
    }

    return actions
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const canCreateCampaign = true // Removed campaign limit enforcement

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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">
                Dashboard
              </h1>
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="border border-input rounded-md px-3 py-1 text-sm"
                >
                  {timeFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {profile && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {profile.monthly_campaigns_used}
                  </span>
                  <span className="ml-1">campaigns created this month</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <ExportButton
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
              />
              <Button
                onClick={() => router.push('/dashboard/campaigns/create')}
                disabled={!canCreateCampaign}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Campaigns */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalCampaigns}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">
                    {campaigns.filter(c => c.status === 'published').length} published
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Total Leads */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : stats.totalLeads.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">
                    <ArrowUpRight className="h-3 w-3 inline" />
                    12%
                  </span> from last period
                </p>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats ? '...' : `${stats.completionRate.toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">
                    <ArrowUpRight className="h-3 w-3 inline" />
                    3.2%
                  </span> improvement
                </p>
              </CardContent>
            </Card>

            {/* Monthly Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingStats || !profile ? '...' : 
                    `${profile.monthly_campaigns_used}`
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  campaigns created this month
                </p>
              </CardContent>
            </Card>
          </div>



          {/* Main Content Grid */}
          <div>
            {/* Campaigns Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
                {campaigns.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
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
                    <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold truncate mb-1 group-hover:text-primary transition-colors">
                              {campaign.name}
                            </CardTitle>
                            <CardDescription className="text-sm line-clamp-2">
                              {campaign.description || 'No description provided'}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {campaign.status === 'published' ? (
                              <Badge 
                                variant="default"
                                className={`text-xs font-medium ${
                                  campaign.is_active
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full mr-1.5 ${campaign.is_active ? 'bg-green-500' : 'bg-orange-500'}`} />
                                <span>{campaign.is_active ? 'Live' : 'Inactive'}</span>
                              </Badge>
                            ) : (
                              <Badge 
                                variant="secondary"
                                className="text-xs font-medium bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              >
                                {getStatusIcon(campaign.status)}
                                <span className="ml-1 capitalize">{campaign.status}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                            <p className="text-lg font-bold text-foreground">{campaign.viewCount}</p>
                            <p className="text-xs text-muted-foreground font-medium">Views</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                            <p className="text-lg font-bold text-foreground">{campaign.leadCount}</p>
                            <p className="text-xs text-muted-foreground font-medium">Leads</p>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                            <p className="text-lg font-bold text-foreground">
                              {campaign.completionRate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">Rate</p>
                          </div>
                        </div>

                        {/* Last Updated */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                          <Calendar className="h-4 w-4" />
                          <span>Updated {formatDate(campaign.updated_at)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/campaigns/${campaign.id}/edit`)
                              }}
                              className="h-8 px-3"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/campaigns/${campaign.id}/builder`)
                              }}
                              className="h-8 px-3"
                            >
                              <Hammer className="h-3 w-3 mr-1" />
                              Build
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {getStatusActions(campaign).map((action, index) => (
                                  <DropdownMenuItem
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      action.action()
                                    }}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <action.icon className="h-4 w-4" />
                                    <span>{action.label}</span>
                                  </DropdownMenuItem>
                                ))}
                                {getStatusActions(campaign).length > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCampaign(campaign.id, campaign.name)
                                  }}
                                  className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Campaign</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {campaign.status === 'published' && campaign.published_url && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(campaign.published_url!, '_blank')
                              }}
                              className="h-8 px-3"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Live
                            </Button>
                          )}
                          
                          {campaign.status !== 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/campaigns/${campaign.id}`)
                              }}
                              className="h-8 px-3"
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loadingStats && campaigns.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <CardTitle className="text-xl mb-2">No campaigns yet</CardTitle>
                    <CardDescription className="mb-6 max-w-md mx-auto">
                      Create your first lead magnet campaign to start capturing and converting leads.
                    </CardDescription>
                    <Button 
                      onClick={() => router.push('/dashboard/campaigns/create')}
                      disabled={!canCreateCampaign}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Campaign</span>
                    </Button>

                  </CardContent>
                </Card>
              )}


            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 