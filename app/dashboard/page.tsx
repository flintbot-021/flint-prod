'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserProfile } from '@/components/ui/user-profile'
import { useAuth } from '@/lib/auth-context'
import { 
  getCampaigns, 
  getCurrentProfile,
  getCampaignLeads,
  getCampaignLeadStats 
} from '@/lib/data-access'
import { Campaign, Profile } from '@/lib/types/database'
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
  Filter
} from 'lucide-react'

interface DashboardStats {
  totalCampaigns: number
  totalLeads: number
  completionRate: number
  recentCampaigns: Campaign[]
  topPerformingCampaign?: Campaign & {
    leadCount: number
    completionRate: number
  }
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
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalLeads: 0,
    completionRate: 0,
    recentCampaigns: []
  })
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true)
      setError(null)

      // Load profile and campaigns in parallel
      const [profileResult, campaignsResult] = await Promise.all([
        getCurrentProfile(),
        getCampaigns({ page: 1, per_page: 10 })
      ])

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to load profile')
      }

      if (!campaignsResult.success) {
        throw new Error(campaignsResult.error || 'Failed to load campaigns')
      }

      setProfile(profileResult.data || null)

      const campaigns = campaignsResult.data?.data || []
      let totalLeads = 0
      let totalCompletedLeads = 0
      let topCampaign: (Campaign & { leadCount: number; completionRate: number }) | undefined

      // Get stats for each campaign
      const campaignStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const statsResult = await getCampaignLeadStats(campaign.id)
          if (statsResult.success && statsResult.data) {
            const { total, completed, conversion_rate } = statsResult.data
            totalLeads += total
            totalCompletedLeads += completed

            const campaignWithStats = {
              ...campaign,
              leadCount: total,
              completionRate: conversion_rate
            }

            if (!topCampaign || total > topCampaign.leadCount) {
              topCampaign = campaignWithStats
            }

            return campaignWithStats
          }
          return { ...campaign, leadCount: 0, completionRate: 0 }
        })
      )

      const overallCompletionRate = totalLeads > 0 ? (totalCompletedLeads / totalLeads) * 100 : 0

      setStats({
        totalCampaigns: campaigns.length,
        totalLeads,
        completionRate: Math.round(overallCompletionRate * 100) / 100,
        recentCampaigns: campaigns.slice(0, 5),
        topPerformingCampaign: topCampaign
      })
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingStats(false)
    }
  }

  const handleExportData = async () => {
    try {
      // Get all campaigns for export
      const campaignsResult = await getCampaigns({ page: 1, per_page: 100 })
      
      if (!campaignsResult.success || !campaignsResult.data) {
        throw new Error('Failed to load campaigns for export')
      }

      // Create CSV data
      const csvData = [
        ['Campaign Name', 'Status', 'Created Date', 'Total Leads', 'Completion Rate'].join(',')
      ]

      for (const campaign of campaignsResult.data?.data || []) {
        const statsResult = await getCampaignLeadStats(campaign.id)
        const stats = statsResult.success && statsResult.data ? statsResult.data : {
          total: 0,
          conversion_rate: 0
        }

        csvData.push([
          campaign.name,
          campaign.status,
          new Date(campaign.created_at).toLocaleDateString(),
          stats.total.toString(),
          `${stats.conversion_rate.toFixed(1)}%`
        ].join(','))
      }

      // Download CSV
      const csvContent = csvData.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flint-campaigns-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting data:', err)
      setError('Failed to export data')
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
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
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {timeFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {profile && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {profile.monthly_campaigns_used} / {profile.monthly_campaign_limit}
                  </span>
                  <span className="ml-1">campaigns used this month</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
              <Button
                onClick={() => router.push('/dashboard/campaigns/create')}
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
                  <span className="text-green-600">+{stats.recentCampaigns.length}</span> this period
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
                    `${Math.round((profile.monthly_campaigns_used / profile.monthly_campaign_limit) * 100)}%`
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile && `${profile.monthly_campaigns_used} of ${profile.monthly_campaign_limit} campaigns`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Campaigns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Campaigns</CardTitle>
                      <CardDescription>
                        Your latest lead magnet campaigns
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/dashboard/campaigns')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg animate-pulse">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentCampaigns.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentCampaigns.map((campaign) => (
                        <div 
                          key={campaign.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {campaign.status === 'published' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : campaign.status === 'draft' ? (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <Activity className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{campaign.name}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {campaign.status} • {new Date(campaign.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No campaigns yet</p>
                      <Button
                        onClick={() => router.push('/dashboard/campaigns/create')}
                        size="sm"
                      >
                        Create Your First Campaign
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Top Performing Campaign */}
              {stats.topPerformingCampaign && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Performer</CardTitle>
                    <CardDescription>
                      Your best converting campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{stats.topPerformingCampaign.name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {stats.topPerformingCampaign.status}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {stats.topPerformingCampaign.leadCount}
                          </p>
                          <p className="text-xs text-gray-500">Leads</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">
                            {stats.topPerformingCampaign.completionRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">Rate</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/campaigns/${stats.topPerformingCampaign?.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/campaigns')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View All Campaigns
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/campaigns/create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Campaign
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>

              {/* Profile Summary */}
              <UserProfile variant="full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 