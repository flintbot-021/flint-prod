'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2, ChevronLeft, Eye } from 'lucide-react'
import { getCampaignById, getSectionById, getCampaignSections, updateSection } from '@/lib/data-access/campaigns'
import type { CampaignSection } from '@/lib/types/campaign-builder'
import type { Campaign } from '@/lib/types/database'
import { AdvancedOutputBuilder } from '@/components/campaign-builder/output-advanced/AdvancedOutputBuilder'
import { toast } from '@/components/ui/use-toast'

export default function AdvancedOutputEditorPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = String(params.id)
  const sectionId = String(params.sectionId)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [section, setSection] = useState<CampaignSection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [allSections, setAllSections] = useState<CampaignSection[] | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const [c, s, list] = await Promise.all([
          getCampaignById(campaignId),
          getSectionById(sectionId),
          getCampaignSections(campaignId)
        ])
        if (!c.success || !c.data) throw new Error(c.error || 'Failed to load campaign')
        if (!s.success || !s.data) throw new Error(s.error || 'Failed to load section')

        setCampaign(c.data as Campaign)
        // Map DB section to CampaignSection shape used by builder
        const dbSection: any = s.data
        const mapped: CampaignSection = {
          id: dbSection.id,
          type: 'output-advanced',
          title: dbSection.title || 'Advanced Output',
          settings: (dbSection.configuration || {}),
          order: dbSection.order_index,
          isVisible: (dbSection.configuration?.isVisible ?? true),
          createdAt: dbSection.created_at,
          updatedAt: dbSection.updated_at
        }
        setSection(mapped)
        // Map list of sections for variable suggestions
        if (list.success && list.data) {
          const mapDbToBuilderType = (dbType: string): string => {
            switch (dbType) {
              case 'text_question': return 'question-text'
              case 'multiple_choice': return 'question-multiple-choice'
              case 'slider': return 'question-slider'
              case 'question-slider-multiple': return 'question-slider-multiple'
              case 'date_time_question': return 'question-date-time'
              case 'upload_question': return 'question-upload'
              case 'capture': return 'capture-details'
              case 'logic': return 'logic-ai'
              case 'output': return 'output-results'
              default: return dbType
            }
          }
          const mappedSections: CampaignSection[] = list.data.map((sec: any) => ({
            id: sec.id,
            type: mapDbToBuilderType(sec.type),
            title: sec.title || '',
            settings: (sec.configuration || {}),
            order: sec.order_index,
            isVisible: sec.configuration?.isVisible ?? true,
            createdAt: sec.created_at,
            updatedAt: sec.updated_at
          }))
          setAllSections(mappedSections)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [campaignId, sectionId])

  const handleUpdate = useCallback(async (updates: Partial<CampaignSection>) => {
    if (!section) return
    try {
      setIsSaving(true)
      // Build DB updates
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.settings !== undefined) dbUpdates.configuration = updates.settings
      if (updates.order !== undefined) dbUpdates.order_index = updates.order
      if (updates.isVisible !== undefined) {
        dbUpdates.configuration = {
          ...(dbUpdates.configuration || section.settings || {}),
          isVisible: updates.isVisible
        }
      }

      const result = await updateSection(section.id, dbUpdates)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save changes')
      }
      // Update local state
      setSection(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev)
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' })
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [section])

  const goBack = () => router.push(`/dashboard/campaigns/${campaignId}/builder`)
  const openPreview = () => window.open(`/campaigns/${campaignId}/preview`, '_blank')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error || !section) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || 'Section not found'}</div>
        <Button className="mt-4" onClick={goBack}><ChevronLeft className="h-4 w-4 mr-1"/>Back to Builder</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={goBack}><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>
            <div className="text-sm text-muted-foreground">Editing Advanced Output for</div>
            <div className="font-medium">{campaign?.name}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Preview</span>
              <Switch checked={isPreview} onCheckedChange={setIsPreview} />
            </div>
            <Button variant="outline" onClick={openPreview}><Eye className="h-4 w-4 mr-1"/>Open Full Preview</Button>
          </div>
        </div>
      </div>

      {/* Builder Canvas */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdvancedOutputBuilder
          section={section}
          isPreview={isPreview}
          onUpdate={handleUpdate}
          className=""
          campaignId={campaignId}
          allSections={allSections || undefined}
        />
      </div>
    </div>
  )
}


