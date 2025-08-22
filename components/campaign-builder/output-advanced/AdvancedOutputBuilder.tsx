'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { Campaign } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { Slider } from '@/components/ui/slider'
  import { Switch } from '@/components/ui/switch'
  import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal, GripVertical, Heading1, Heading2, Heading3, Text as TextIcon, MousePointerClick, Image as ImageIcon, ListOrdered, List, Minus, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import { ContentToolbar } from './ContentToolbar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem as UICommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { VariableSuggestionDropdown } from '@/components/ui/variable-suggestion-dropdown'
import { UnsplashImageSelector } from '@/components/ui/unsplash-image-selector'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'
import { uploadFiles } from '@/lib/supabase/storage'
import { getCampaignTheme } from '@/components/campaign-renderer/utils'

type ContentItem =
  | { id: string; type: 'headline' | 'subheading' | 'h3' | 'paragraph'; content: string }
  | { id: string; type: 'button'; content: string; href?: string; color?: string; textColor?: string }
  | { id: string; type: 'image'; src?: string; alt?: string; maxHeight?: number }
  | { id: string; type: 'numbered-list' | 'bullet-list'; items: string[] }
  | { id: string; type: 'divider' }

type Block = {
  id: string
  width: number
  startPosition: number
  backgroundColor?: string
  textColor?: string
      borderColor?: string
    borderWidth?: number
    glassEffect?: boolean
    textAlignment?: 'left' | 'center' | 'right'
    padding?: number
  spacing?: number
  borderRadius?: number
  content: ContentItem[]
}

type Row = { 
  id: string; 
  blocks: Block[];
  backgroundColor?: string;
  backgroundImage?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  topLineColor?: string;
  bottomLineColor?: string;
  topLineWidth?: number;
  bottomLineWidth?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

type PageSettings = {
  backgroundColor?: string
  gridGap?: number
  maxColumns?: 2 | 3 | 4
  rowSpacing?: number
}

interface AdvancedOutputBuilderProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  campaignId: string
  allSections?: CampaignSection[]
  onPageSettingsChange?: (pageSettings: PageSettings) => void
  campaign?: Campaign
}

// Lightweight ID helper
const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export function AdvancedOutputBuilder({ section, isPreview = false, onUpdate, className, allSections, onPageSettingsChange, campaignId, campaign }: AdvancedOutputBuilderProps) {
  const settings: any = section.settings || {}
  const rows: Row[] = settings.rows || []
  const defaultBlock = settings.defaultBlock || {}
  const pageSettings: PageSettings = settings.pageSettings || {
    backgroundColor: undefined,
    gridGap: 16,
    maxColumns: 3,
    rowSpacing: 24
  }

  // Get campaign theme colors
  const campaignTheme = getCampaignTheme(campaign)

  // Helper function to get button color (item color override or campaign theme default)
  const getButtonColor = (buttonItem: ContentItem) => {
    if (buttonItem.type === 'button' && buttonItem.color) {
      return buttonItem.color
    }
    return campaignTheme.buttonColor
  }

  // Helper function to get button text color (item text color override or campaign theme default)
  const getButtonTextColor = (buttonItem: ContentItem) => {
    if (buttonItem.type === 'button' && buttonItem.textColor) {
      return buttonItem.textColor
    }
    return campaignTheme.buttonTextColor
  }

  // Helper function to generate button hover color (slightly darker)
  const getButtonHoverColor = (baseColor: string) => {
    // Simple color darkening - convert hex to RGB, darken by 20%, convert back
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      
      const darken = (value: number) => Math.max(0, Math.floor(value * 0.8))
      
      const darkR = darken(r).toString(16).padStart(2, '0')
      const darkG = darken(g).toString(16).padStart(2, '0')
      const darkB = darken(b).toString(16).padStart(2, '0')
      
      return `#${darkR}${darkG}${darkB}`
    }
    return baseColor
  }
  const sanitizedDefaultBlock = useMemo(() => {
    const { backgroundColor, borderColor, borderWidth, ...rest } = defaultBlock || {}
    return rest
  }, [defaultBlock])
  const [toolbarOpenFor, setToolbarOpenFor] = useState<string | null>(null)
  const [activeCardRect, setActiveCardRect] = useState<{ left: number; top: number; width: number; positionAbove?: boolean } | null>(null)
  const [propsOpenFor, setPropsOpenFor] = useState<string | null>(null)
  const [pagePropsOpen, setPagePropsOpen] = useState(false)
  const [rowPropsOpenFor, setRowPropsOpenFor] = useState<string | null>(null)
  const [draftPageSettings, setDraftPageSettings] = useState<PageSettings>(pageSettings)
  const [draftRows, setDraftRows] = useState<Row[]>(rows)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [activeCardSpan, setActiveCardSpan] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imageSheetOpen, setImageSheetOpen] = useState(false)
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const [buttonSheetOpen, setButtonSheetOpen] = useState(false)
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<{rowId: string, blockId: string, block: Block} | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<{rowId: string, position: number} | null>(null)
  const isSavingRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pageSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const recalcActiveCardRect = useCallback((blockId: string) => {
    if (typeof document === 'undefined') return
    const el = document.querySelector(`[data-card-id="${blockId}"]`) as HTMLDivElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    
    // Check if there's enough space below for the command palette
    // Use a more conservative estimate based on the actual command palette content
    const spaceBelow = window.innerHeight - rect.bottom - 16 // 16px for some padding
    const estimatedPaletteHeight = 280 // More realistic height: input + ~8 items
    const shouldPositionAbove = spaceBelow < estimatedPaletteHeight
    
    setActiveCardRect({ 
      left: rect.left + rect.width/2, 
      top: shouldPositionAbove ? rect.top : rect.bottom, 
      width: rect.width,
      positionAbove: shouldPositionAbove
    })
  }, [])
  // Drag-and-drop disabled

  // Keep local draftRows in sync with external settings
  useEffect(() => {
    // Don't update draftRows if we're currently saving to prevent overriding local changes
    if (!isSavingRef.current) {
    setDraftRows(rows)
    }
    
    if (!activeRowId && rows.length) {
      setActiveRowId(rows[0].id)
    }
  }, [rows, activeRowId])

  // Sync draftPageSettings with pageSettings prop
  useEffect(() => {
    setDraftPageSettings(pageSettings)
  }, [pageSettings.backgroundColor, pageSettings.gridGap, pageSettings.maxColumns, pageSettings.rowSpacing])

  // Close floating toolbar when clicking outside the selected card and outside the toolbar
  useEffect(() => {
    function handleDocumentMouseDown(e: MouseEvent) {
      if (!toolbarOpenFor) return
      const target = e.target as Node
      if (toolbarRef.current && toolbarRef.current.contains(target)) return
      const selectedCardEl = document.querySelector(`[data-card-id="${toolbarOpenFor}"]`)
      if (selectedCardEl && selectedCardEl.contains(target as Node)) return
      // Keep menu open while card is focused
      setToolbarOpenFor(null)
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [toolbarOpenFor])

  // Close command menu when clicking outside it and outside the active card
  useEffect(() => {
    function handleOutsideMenuClick(e: MouseEvent) {
      if (!menuOpenFor) return
      const target = e.target as Node
      if (menuRef.current && menuRef.current.contains(target)) return
      const selectedCardEl = document.querySelector(`[data-card-id="${menuOpenFor}"]`)
      if (selectedCardEl && selectedCardEl.contains(target as Node)) return
      // Do not close menu automatically; only Esc or clicking away from the card will close via UI logic
      setMenuOpenFor(null)
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpenFor(null)
    }
    document.addEventListener('mousedown', handleOutsideMenuClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutsideMenuClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpenFor])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (pageSettingsTimeoutRef.current) {
        clearTimeout(pageSettingsTimeoutRef.current)
      }
    }
  }, [])

  // Notify parent of initial page settings
  useEffect(() => {
    onPageSettingsChange?.(pageSettings)
  }, [pageSettings.backgroundColor, pageSettings.gridGap, pageSettings.maxColumns, pageSettings.rowSpacing, onPageSettingsChange])


    const saveRows = async (nextRows: Row[], newPageSettings?: PageSettings) => {
    isSavingRef.current = true
    try {
      const updatedPageSettings = newPageSettings || pageSettings
      await onUpdate({ settings: { ...settings, mode: 'advanced', rows: nextRows, defaultBlock, pageSettings: updatedPageSettings } })
    } finally {
      // Use a small delay to ensure the save operation is complete before allowing updates
      setTimeout(() => {
        isSavingRef.current = false
      }, 100)
    }
  }

  const updatePageSettings = async (updates: Partial<PageSettings>) => {
    const newPageSettings = { ...pageSettings, ...updates }
    await saveRows(draftRows, newPageSettings)
    // Notify parent component of page settings change
    onPageSettingsChange?.(newPageSettings)
  }

  const updatePageSettingsDebounced = (updates: Partial<PageSettings>) => {
    // Update draft settings immediately for instant visual feedback
    const newDraftSettings = { ...draftPageSettings, ...updates }
    setDraftPageSettings(newDraftSettings)
    
    // Clear existing timeout
    if (pageSettingsTimeoutRef.current) {
      clearTimeout(pageSettingsTimeoutRef.current)
    }
    
    // Set new timeout for actual save
    pageSettingsTimeoutRef.current = setTimeout(async () => {
      await updatePageSettings(updates)
    }, 300)
  }

  // Handle image upload (based on output-section.tsx)
  const handleImageUpload = useCallback(async (files: FileList, itemId: string) => {
    if (!files.length) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    
    try {
      // Use the campaignId from props
      const uploadedFiles = await uploadFiles(
        [file],
        campaignId,
        'output-sections'
      )
      
      if (uploadedFiles.length > 0) {
        const imageUrl = uploadedFiles[0].url
        
        // Update the image in the content block immediately
        const next = draftRows.map(r => ({ 
          ...r, 
          blocks: r.blocks.map(b => ({ 
            ...b, 
            content: b.content.map(ci => 
              ci.id === itemId 
                ? { ...ci, src: imageUrl } 
                : ci
            ) 
          })) 
        }))
        setDraftRows(next)
        await saveRows(next)
        
        return imageUrl
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [campaignId, draftRows, saveRows])

  // Helpers to compute occupancy per row
  const getOccupied = (row: Row, excludeBlockId?: string) => {
    const occupied = new Set<number>()
    row.blocks.filter(b => b.id !== excludeBlockId).forEach(b => {
      for (let i = 0; i < b.width; i++) occupied.add(b.startPosition + i)
    })
    return occupied
  }

  const canPlace = (row: Row, start: number, width: number, excludeBlockId?: string) => {
    const maxCols = draftPageSettings.maxColumns ?? 3
    const occupied = getOccupied(row, excludeBlockId)
    for (let i = 0; i < width; i++) {
      const col = start + i
      if (col < 1 || col > maxCols) return false
      if (occupied.has(col)) return false
    }
    return true
  }

  // Build preview variable context similar to output-section
  const previewVariables = useMemo(() => {
    const vars: Record<string, string> = {}
    if (allSections && allSections.length) {
      const available = getSimpleVariablesForBuilder(allSections, section.order || 0, campaignId)
      available.forEach(v => { vars[v.name] = v.sampleValue })
    }
    // Merge AI test results last so they take precedence (campaign-scoped)
    const ai = campaignId ? getAITestResults(campaignId) : {}
    Object.assign(vars, ai)
    // Ensure capture defaults
    if (!vars.name) vars.name = 'Joe Bloggs'
    if (!vars.email) vars.email = 'joe@email.com'
    if (!vars.phone) vars.phone = '+12 345 6789'
    return vars
  }, [allSections, section.order, campaignId])

  // Preview uses variable interpolator to show a basic rendering
  const previewHtml = useMemo(() => {
    if (!isPreview) return null
    const interpolator = new VariableInterpolator()
    const variables: Record<string, any> = previewVariables

    const renderItem = (item: ContentItem, blockTextColor?: string, align: 'left' | 'center' | 'right' = 'center') => {
      // Use block text color if available, otherwise fall back to campaign theme
      const textColor = blockTextColor || campaignTheme.textColor
      
      switch (item.type) {
        case 'headline':
          return `<h1 class="font-black tracking-tight leading-tight text-4xl md:text-5xl lg:text-6xl" style="color:${textColor}">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</h1>`
        case 'subheading':
          return `<div class="font-medium leading-relaxed text-xl md:text-2xl lg:text-3xl" style="color:${textColor}CC">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</div>`
        case 'h3':
          return `<h3 class="font-semibold leading-relaxed text-lg md:text-xl lg:text-2xl" style="color:${textColor}DD">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</h3>`
        case 'paragraph':
          return `<div class="leading-relaxed font-medium text-lg md:text-xl" style="color:${textColor}">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</div>`
        case 'divider':
          return `<hr class="border-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent backdrop-blur-sm"/>`
        case 'button':
          const buttonHref = interpolator.interpolate((item as any).href || '#', { variables, availableVariables: [] }).content
          const buttonText = interpolator.interpolate(item.content || 'Button', { variables, availableVariables: [] }).content
          const buttonColor = getButtonColor(item)
          const buttonTextColor = getButtonTextColor(item)
          const buttonHoverColor = getButtonHoverColor(buttonColor)
          const buttonAlignment = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
          return `<div class="flex ${buttonAlignment}"><a href="${buttonHref}" class="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-center backdrop-blur-md border transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 active:scale-95 shadow-2xl" style="background-color:${buttonColor};color:${buttonTextColor};border:1px solid rgba(255, 255, 255, 0.2);box-shadow:0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)" onmouseover="this.style.backgroundColor='${buttonHoverColor}'" onmouseout="this.style.backgroundColor='${buttonColor}'">${buttonText}</a></div>`
        case 'image':
          const maxHeightStyle = (item as any).maxHeight ? `max-height:${(item as any).maxHeight}px;height:auto;` : ''
          const imageSrc = interpolator.interpolate(item.src || '', { variables, availableVariables: [] }).content
          return imageSrc ? `<img class="rounded-lg w-full object-cover" style="${maxHeightStyle}" src="${imageSrc}" alt="${item.alt || ''}"/>` : ''
        case 'numbered-list':
          return `<ol class="list-decimal pl-5 space-y-1">${(item.items||[]).map(li=>`<li>${interpolator.interpolate(li, { variables, availableVariables: [] }).content}</li>`).join('')}</ol>`
        case 'bullet-list':
          return `<ul class="list-disc pl-5 space-y-1">${(item.items||[]).map(li=>`<li>${interpolator.interpolate(li, { variables, availableVariables: [] }).content}</li>`).join('')}</ul>`
        default:
          return ''
      }
    }

    const renderBlock = (b: Block) => {
      const align = b.textAlignment || 'center'
      const hasCustomBackground = b.backgroundColor && b.backgroundColor !== 'transparent'
      const hasCustomBorder = b.borderColor
      const hasGlassEffect = b.glassEffect && (hasCustomBackground || hasCustomBorder)
      
      const styles: string[] = [
        `padding:${b.padding ?? 24}px`,
        `grid-column-start:${b.startPosition}`,
        `grid-column-end:span ${b.width}`
      ]
      
      if (hasCustomBackground) {
        styles.push(`background:${b.backgroundColor}`)
      } else {
        styles.push(`background:transparent`)
      }
      
      if (b.textColor) styles.push(`color:${b.textColor}`)
      
      if (hasCustomBorder) {
        const borderWidth = b.borderWidth || 1
        styles.push(`border:${borderWidth}px solid ${b.borderColor}`)
      } else if (hasGlassEffect && hasCustomBackground) {
        styles.push(`border:1px solid rgba(255, 255, 255, 0.2)`)
      }
      
      if (b.borderRadius) {
        styles.push(`border-radius:${b.borderRadius}px`)
      }
      
      if (hasGlassEffect) {
        styles.push(`backdrop-filter:blur(12px)`)
        if (hasCustomBorder && b.borderColor) {
          // Add glow effect with border color
          styles.push(`box-shadow:0 0 20px ${b.borderColor}80, 0 0 40px ${b.borderColor}40, 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`)
        } else {
          styles.push(`box-shadow:0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)`)
        }
      }
      
      const classNames = hasGlassEffect 
        ? 'rounded-2xl transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] shadow-2xl'
        : 'rounded-lg transition-all duration-300 ease-out'
      
      const innerStyle = `display:grid;row-gap:${b.spacing ?? 12}px;text-align:${align}`
      return `<div class="${classNames}" style="${styles.join(';')}"><div style="${innerStyle}">${b.content.map(item => renderItem(item, b.textColor, align)).join('')}</div></div>`
    }

    const containerStyle = [
      pageSettings.backgroundColor ? `background-color:${pageSettings.backgroundColor}` : '',
      'min-height:100vh',
      'display:flex',
      'flex-direction:column',
      'padding-bottom:80px'
    ].filter(Boolean).join(';')
    
    const innerContainerStyle = [
      'flex:1',
      'padding:48px 0',
      'display:flex',
      'flex-direction:column',
      'gap:32px'
    ].join(';')
    
    const gridStyle = [
      `display:grid`,
      `grid-template-columns:repeat(${pageSettings.maxColumns ?? 3}, 1fr)`,
      `gap:${pageSettings.gridGap ?? 16}px`
    ].join(';')
    
    const renderRowHtml = (r: Row, idx: number) => {
      const rowStyles: string[] = [
        'width:100vw',
        'position:relative',
        'margin-left:calc(-50vw + 50%)',
        'margin-right:calc(-50vw + 50%)',
        'transition:all 0.2s'
      ]
      if (r.backgroundColor) rowStyles.push(`background-color:${r.backgroundColor}`)
      if (r.backgroundImage) {
        rowStyles.push(`background-image:url(${r.backgroundImage})`)
        rowStyles.push('background-size:cover')
        rowStyles.push('background-position:center')
        rowStyles.push('background-repeat:no-repeat')
      }
      
      const overlay = (r.backgroundImage && r.overlayColor) 
        ? `<div style="position:absolute;inset:0;background-color:${r.overlayColor};opacity:${(r.overlayOpacity || 50) / 100};"></div>`
        : ''
      
      const topLine = r.topLineColor ? `<div style="width:100%;height:${r.topLineWidth || 1}px;background-color:${r.topLineColor};position:relative;z-index:20;"></div>` : ''
      const bottomLine = r.bottomLineColor ? `<div style="width:100%;height:${r.bottomLineWidth || 1}px;background-color:${r.bottomLineColor};position:relative;z-index:20;"></div>` : ''
      
      const contentStyle = [
        'width:100%',
        'max-width:1024px',
        'margin:0 auto',
        'position:relative',
        'z-index:10',
        'padding-left:24px',
        'padding-right:24px',
        `padding-top:${r.paddingTop || 16}px`,
        `padding-bottom:${r.paddingBottom || 16}px`
      ].join(';')
      
      return `<div style="${rowStyles.join(';')}">${overlay}${topLine}<div style="${contentStyle}"><div style="${gridStyle}">${r.blocks.map(renderBlock).join('')}</div></div>${bottomLine}</div>`
    }
    
    const html = `<div style="${containerStyle}"><div style="${innerContainerStyle}">${rows.map((r, idx) => `<div style="${idx === rows.length - 1 ? '' : `margin-bottom:${pageSettings.rowSpacing ?? 24}px`}">${renderRowHtml(r, idx)}</div>`).join('')}</div></div>`
    return html
  }, [isPreview, rows, previewVariables, pageSettings.backgroundColor, pageSettings.gridGap, pageSettings.maxColumns, pageSettings.rowSpacing])

  // Build available variables like output-section.tsx
  function getSimpleVariablesForBuilder(sections: CampaignSection[], currentOrder: number, campaignId?: string) {
    const variables: { name: string; type: 'input' | 'output' | 'capture'; description: string; sampleValue: string }[] = []
    const preceding = sections.filter(s => (s.order || 0) < currentOrder)
    preceding.forEach(section => {
      if (section.type.includes('capture')) {
        const captureSettings: any = section.settings || {}
        const enabledFields = captureSettings?.enabledFields || { name: true, email: true, phone: false }
        const fieldLabels = captureSettings?.fieldLabels || { name: 'Full Name', email: 'Email Address', phone: 'Phone Number' }
        if (enabledFields.name) variables.push({ name: 'name', type: 'capture', description: fieldLabels.name || 'Full Name', sampleValue: 'Joe Bloggs' })
        if (enabledFields.email) variables.push({ name: 'email', type: 'capture', description: fieldLabels.email || 'Email Address', sampleValue: 'joe@email.com' })
        if (enabledFields.phone) variables.push({ name: 'phone', type: 'capture', description: fieldLabels.phone || 'Phone Number', sampleValue: '+12 345 6789' })
      } else if (isQuestionSection(section.type) && section.title && !section.type.includes('capture')) {
        const settings: any = section.settings || {}
        const variableName = settings?.variableName || titleToVariableName(section.title)
        variables.push({ name: variableName, type: 'input', description: section.title || 'User input', sampleValue: settings?.placeholder || 'Sample answer' })
      } else if (section.type === 'logic-ai') {
        const aiSettings: any = section.settings || {}
        if (aiSettings?.outputVariables && Array.isArray(aiSettings.outputVariables)) {
          aiSettings.outputVariables.forEach((variable: any) => {
            if (variable.name) variables.push({ name: variable.name, type: 'output', description: variable.description || 'AI generated output', sampleValue: variable.name })
          })
        }
      }
    })
    // Merge AI test results as additional candidates (if present) - campaign-scoped
    const ai = campaignId ? getAITestResults(campaignId) : {}
    Object.keys(ai).forEach(key => {
      if (!variables.find(v => v.name === key)) {
        variables.push({ name: key, type: 'output', description: 'AI output', sampleValue: String(ai[key]) })
      }
    })
    return variables
  }

  const addFirstBlock = async (width: 1 | 2 | 3) => {
    const newRows: Row[] = draftRows.length ? [...draftRows] : [{ id: uid('row'), blocks: [] }]
    const startPosition: 1 | 2 | 3 = 1
    const block = { id: uid('block'), width, startPosition, content: [], ...sanitizedDefaultBlock }
    newRows[0].blocks.push(block)
    setDraftRows(newRows)
    setActiveRowId(newRows[0].id)
    await saveRows(newRows)
  }

  const addRow = async (): Promise<string> => {
    const newRow = { id: uid('row'), blocks: [] as Block[] }
    const next = [...draftRows, newRow]
    setDraftRows(next)
    await saveRows(next)
    setActiveRowId(newRow.id)
    return newRow.id
  }

  const removeRow = async (rowId: string) => {
    const next = draftRows.filter(r => r.id !== rowId)
    setDraftRows(next)
    await saveRows(next)
    // Update active row to the last available
    setActiveRowId(next.length ? next[next.length - 1].id : null)
  }

  const tryAddBlockToRow = (rowsState: Row[], rowId: string, width: 1 | 2 | 3): { next: Row[]; added: boolean } => {
    const next = rowsState.map(r => ({ ...r, blocks: [...r.blocks] }))
    const row = next.find(r => r.id === rowId)
    if (!row) return { next: rowsState, added: false }
    const starts: (1|2|3)[] = [1,2,3]
    const start = starts.find(s => canPlace(row, s as 1|2|3, width)) as 1|2|3 | undefined
    if (!start) return { next: rowsState, added: false }
    row.blocks.push({ id: uid('block'), width, startPosition: start, content: [], ...sanitizedDefaultBlock })
    return { next, added: true }
  }

  // Try to add a block at a specific start position within a row
  const tryAddBlockToRowAtPosition = (rowsState: Row[], rowId: string, start: 1|2|3, width: 1 | 2 | 3): { next: Row[]; added: boolean } => {
    const next = rowsState.map(r => ({ ...r, blocks: [...r.blocks] }))
    const row = next.find(r => r.id === rowId)
    if (!row) return { next: rowsState, added: false }
    if (!canPlace(row, start, width)) return { next: rowsState, added: false }
    row.blocks.push({ id: uid('block'), width, startPosition: start, content: [], ...sanitizedDefaultBlock })
    return { next, added: true }
  }

  const addBlock = async (rowId: string, width: 1 | 2 | 3) => {
    // Try to add to current rows first
    let attempt = tryAddBlockToRow(draftRows, rowId, width)
    if (attempt.added) {
      setDraftRows(attempt.next)
      setActiveRowId(rowId)
      await saveRows(attempt.next)
      return
    }
    // If it doesn't fit, create a new row locally (without relying on async state), then add to that row
    const newRow: Row = { id: uid('row'), blocks: [] }
    const next = [...draftRows, newRow]
    const attempt2 = tryAddBlockToRow(next, newRow.id, width)
    setDraftRows(attempt2.next)
    setActiveRowId(newRow.id)
    await saveRows(attempt2.next)
  }

  const addBlockAtPosition = async (rowId: string, start: 1|2|3, width: 1 | 2 | 3) => {
    const attempt = tryAddBlockToRowAtPosition(draftRows, rowId, start, width)
    if (attempt.added) {
      setDraftRows(attempt.next)
      setActiveRowId(rowId)
      await saveRows(attempt.next)
    }
  }

  const deleteBlock = async (rowId: string, blockId: string) => {
    const next = draftRows.map(r => ({ ...r, blocks: r.blocks.filter(b => b.id !== blockId) }))
    
    // Only remove empty rows if there are multiple rows and at least one has content
    const hasContentRows = next.filter(r => r.blocks.length > 0)
    const finalRows = (next.length > 1 && hasContentRows.length > 0) 
      ? next.filter(r => r.blocks.length > 0)  // Remove empty rows if conditions met
      : next  // Keep all rows (including empty ones) otherwise
    
    setDraftRows(finalRows)
    await saveRows(finalRows)
    
    // Update active row if needed
    if (!finalRows.some(r => r.id === activeRowId)) {
      setActiveRowId(finalRows.length ? finalRows[finalRows.length - 1].id : null)
    }
    
    if (toolbarOpenFor === blockId) setToolbarOpenFor(null)
    if (propsOpenFor === blockId) setPropsOpenFor(null)
  }

  const updateBlock = async (rowId: string, blockId: string, updates: Partial<Block>) => {
    const next = draftRows.map(r => {
      if (r.id !== rowId) return r
      return {
        ...r,
        blocks: r.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
      }
    })
    setDraftRows(next)
    await saveRows(next)
  }

  const updateRow = async (rowId: string, updates: Partial<Row>) => {
    const next = draftRows.map(r => 
      r.id === rowId ? { ...r, ...updates } : r
    )
    setDraftRows(next)
    await saveRows(next)
  }

  // Debounced version for real-time controls like sliders
  const updateBlockDebounced = useCallback((rowId: string, blockId: string, updates: Partial<Block>) => {
    // Immediately update local state for instant visual feedback
    const next = draftRows.map(r => {
      if (r.id !== rowId) return r
      return {
        ...r,
        blocks: r.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
      }
    })
    setDraftRows(next)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      saveRows(next)
    }, 300) // 300ms delay
  }, [draftRows])

  const moveBlock = async (rowId: string, blockId: string, delta: number) => {
    const row = draftRows.find(r => r.id === rowId)
    if (!row) return
    const block = row.blocks.find(b => b.id === blockId)
    if (!block) return
    const target = (block.startPosition + delta) as 1|2|3
    if (canPlace(row, target, block.width, block.id)) {
      await updateBlock(rowId, blockId, { startPosition: target })
    }
  }

  const changeBlockWidth = async (rowId: string, blockId: string, width: 1|2|3) => {
    const row = draftRows.find(r => r.id === rowId)
    if (!row) return
    const block = row.blocks.find(b => b.id === blockId)
    if (!block) return
    if (canPlace(row, block.startPosition, width, block.id)) {
      await updateBlock(rowId, blockId, { width })
    }
  }

  // Reorder blocks within a row by inserting the dragged block before the block covering dropCol
  // Drag reordering removed

  // findBestStart removed (drag disabled)

  // Content item helpers
  const addContentItem = async (rowId: string, blockId: string, type: ContentItem['type']) => {
    const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b })) }))
    const row = next.find(r => r.id === rowId)!
    const block = row.blocks.find(b => b.id === blockId)!
    const id = uid('item')
    const newItem: any = { id, type }
    if (type === 'headline' || type === 'subheading' || type === 'h3' || type === 'paragraph') newItem.content = ''
    if (type === 'button') { newItem.content = 'Button'; newItem.href = '' }
    if (type === 'numbered-list' || type === 'bullet-list') newItem.items = ['']
    block.content = [...(block.content || []), newItem]
    setDraftRows(next)
    await saveRows(next)
    // Keep toolbar open on the same card until user clicks elsewhere
    setToolbarOpenFor(blockId)
  }

  const deleteContentItem = async (rowId: string, blockId: string, itemId: string) => {
    const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.filter(ci => ci.id !== itemId) })) }))
    setDraftRows(next)
    await saveRows(next)
  }

  const moveContentItem = async (rowId: string, blockId: string, itemId: string, direction: 'up' | 'down') => {
    const next = draftRows.map(r => {
      if (r.id !== rowId) return r
      return {
        ...r,
        blocks: r.blocks.map(b => {
          if (b.id !== blockId) return b
          const currentIndex = b.content.findIndex(ci => ci.id === itemId)
          if (currentIndex === -1) return b
          
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
          if (newIndex < 0 || newIndex >= b.content.length) return b
          
          const newContent = [...b.content]
          const [movedItem] = newContent.splice(currentIndex, 1)
          newContent.splice(newIndex, 0, movedItem)
          
          return { ...b, content: newContent }
        })
      }
    })
    setDraftRows(next)
    await saveRows(next)
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, rowId: string, blockId: string, block: Block) => {
    setDraggedBlock({ rowId, blockId, block })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', blockId)
    
    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedBlock(null)
    setDragOverPosition(null)
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, rowId: string, position: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverPosition({ rowId, position })
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverPosition(null)
    }
  }

  const canBlockFitAtPosition = (targetRowId: string, position: number, blockWidth: number): boolean => {
    const targetRow = draftRows.find(r => r.id === targetRowId)
    if (!targetRow) return false

    const maxColumns = draftPageSettings.maxColumns ?? 3
    
    // Calculate occupied positions in target row
    const occupied = new Set<number>()
    targetRow.blocks.forEach(block => {
      for (let i = block.startPosition; i < block.startPosition + block.width; i++) {
        occupied.add(i)
      }
    })

    // Check if the block can fit at the desired position
    for (let i = position; i < position + blockWidth; i++) {
      if (i > maxColumns || occupied.has(i)) {
        return false
      }
    }
    
    return true
  }

  const findNextAvailablePosition = (targetRowId: string, preferredPosition: number, blockWidth: number): {rowId: string, position: number} | null => {
    const maxColumns = draftPageSettings.maxColumns ?? 3
    
    // Try current row first
    for (let pos = preferredPosition; pos <= maxColumns - blockWidth + 1; pos++) {
      if (canBlockFitAtPosition(targetRowId, pos, blockWidth)) {
        return { rowId: targetRowId, position: pos }
      }
    }

    // Try from the beginning of current row
    for (let pos = 1; pos < preferredPosition; pos++) {
      if (canBlockFitAtPosition(targetRowId, pos, blockWidth)) {
        return { rowId: targetRowId, position: pos }
      }
    }

    // Try next rows
    const currentRowIndex = draftRows.findIndex(r => r.id === targetRowId)
    for (let rowIndex = currentRowIndex + 1; rowIndex < draftRows.length; rowIndex++) {
      const row = draftRows[rowIndex]
      for (let pos = 1; pos <= maxColumns - blockWidth + 1; pos++) {
        if (canBlockFitAtPosition(row.id, pos, blockWidth)) {
          return { rowId: row.id, position: pos }
        }
      }
    }

    // Create new row if needed
    return null // We'll handle row creation in handleDrop
  }

  const handleDrop = async (e: React.DragEvent, targetRowId: string, targetPosition: number) => {
    e.preventDefault()
    setDragOverPosition(null)

    if (!draggedBlock) return

    const { rowId: sourceRowId, blockId: sourceBlockId, block: draggedBlockData } = draggedBlock
    
    // Don't do anything if dropping in the same position
    if (sourceRowId === targetRowId && draggedBlockData.startPosition === targetPosition) {
      setDraggedBlock(null)
      return
    }

    let newRows = [...draftRows]

    // Remove block from source position
    newRows = newRows.map(row => {
      if (row.id === sourceRowId) {
        return {
          ...row,
          blocks: row.blocks.filter(b => b.id !== sourceBlockId)
        }
      }
      return row
    })

    // Inline wrapping logic: collect all blocks and reflow like CSS flexbox
    const maxColumns = draftPageSettings.maxColumns ?? 3
    
    // Collect ALL blocks from ALL rows (we'll reflow everything)
    const allBlocks: (Block & { originalRowId: string })[] = []
    
    // Add all existing blocks
    for (const row of newRows) {
      for (const block of row.blocks) {
        allBlocks.push({ ...block, originalRowId: row.id })
      }
    }
    
    // Replace the dragged block with its new position info
    const draggedBlockIndex = allBlocks.findIndex(b => b.id === draggedBlockData.id)
    if (draggedBlockIndex !== -1) {
      allBlocks[draggedBlockIndex] = { 
        ...draggedBlockData, 
        originalRowId: allBlocks[draggedBlockIndex].originalRowId 
      }
    }
    
    // Find where to insert the dragged block in the flow
    const targetRowIndex = newRows.findIndex(r => r.id === targetRowId)
    const targetRowBlocks = allBlocks.filter(b => b.originalRowId === targetRowId)
    
    // Sort target row blocks by position to find insertion point
    targetRowBlocks.sort((a, b) => a.startPosition - b.startPosition)
    
    // Find the insertion index based on target position
    let insertIndex = 0
    for (let i = 0; i < targetRowBlocks.length; i++) {
      if (targetRowBlocks[i].id === draggedBlockData.id) continue
      if (targetRowBlocks[i].startPosition < targetPosition) {
        insertIndex = i + 1
      } else {
        break
      }
    }
    
    // Remove dragged block from its current position in allBlocks
    const filteredBlocks = allBlocks.filter(b => b.id !== draggedBlockData.id)
    
    // Calculate the global insertion index
    let globalInsertIndex = 0
    for (let rowIdx = 0; rowIdx < targetRowIndex; rowIdx++) {
      const rowId = newRows[rowIdx].id
      globalInsertIndex += filteredBlocks.filter(b => b.originalRowId === rowId).length
    }
    globalInsertIndex += insertIndex
    
    // Insert the dragged block at the calculated position
    const reorderedBlocks = [
      ...filteredBlocks.slice(0, globalInsertIndex),
      { ...draggedBlockData, originalRowId: targetRowId },
      ...filteredBlocks.slice(globalInsertIndex)
    ]
    
    // Now reflow all blocks into rows using inline wrapping
    const newRowsData: { id: string; blocks: Block[] }[] = []
    let currentRowBlocks: Block[] = []
    let currentRowWidth = 0
    let currentRowId = newRows[0]?.id || uid('row')
    
    for (const block of reorderedBlocks) {
      // Check if block fits in current row
      if (currentRowWidth + block.width <= maxColumns) {
        // Fits! Add to current row
        currentRowBlocks.push({
          ...block,
          startPosition: currentRowWidth + 1
        })
        currentRowWidth += block.width
      } else {
        // Doesn't fit, wrap to new row
        if (currentRowBlocks.length > 0) {
          newRowsData.push({
            id: currentRowId,
            blocks: currentRowBlocks
          })
        }
        
        // Start new row
        currentRowId = uid('row')
        currentRowBlocks = [{
          ...block,
          startPosition: 1
        }]
        currentRowWidth = block.width
      }
    }
    
    // Add the last row if it has blocks
    if (currentRowBlocks.length > 0) {
      newRowsData.push({
        id: currentRowId,
        blocks: currentRowBlocks
      })
    }
    
    // Replace newRows with the reflowed data
    newRows = newRowsData

    // Clean up empty rows
    newRows = newRows.filter(row => row.blocks.length > 0)

    setDraftRows(newRows)
    setDraggedBlock(null)
    await saveRows(newRows)
  }

  if (isPreview) {
    return (
      <div className={cn('py-8', className)}>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            No content yet
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: previewHtml || '' }} />
        )}
      </div>
    )
  }

  // Build Mode (scaffold): show simple dotted chooser when empty
  if (rows.length === 0 || rows.every(r => r.blocks.length === 0)) {
    return (
      <div className={cn('p-4', className)}>
        <div className="rounded-lg border-2 border-dashed border-input/60 bg-muted/10 flex items-center justify-center min-h-[120px]">
          <div className="text-center space-y-2">
            <div className="text-xs text-muted-foreground">Empty layout</div>
            <div className="flex items-center gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => addFirstBlock(1)}>Add 1/3</Button>
              <Button size="sm" variant="outline" onClick={() => addFirstBlock(2)}>Add 2/3</Button>
              <Button size="sm" variant="outline" onClick={() => addFirstBlock(3)}>Add Full</Button>
          </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div 
      className={cn('p-4', className)}
      style={{
        gap: `${draftPageSettings.rowSpacing ?? 24}px`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header row controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Advanced Output Layout</div>
        <div className="flex items-center gap-2">
          <Sheet open={pagePropsOpen} onOpenChange={setPagePropsOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-1"/>
                Page Properties
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Page Properties</SheetTitle>
                <SheetDescription>
                  Customize the overall layout and appearance of your advanced output page.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Page Background */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Page Background</CardTitle>
                    <CardDescription>Set the overall page background color</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="page-background-color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="page-background-color"
                          type="color"
                          value={draftPageSettings.backgroundColor || '#ffffff'}
                          onChange={(e) => updatePageSettingsDebounced({ backgroundColor: e.target.value })}
                          onBlur={async () => {
                            if (pageSettingsTimeoutRef.current) {
                              clearTimeout(pageSettingsTimeoutRef.current)
                              await updatePageSettings({ backgroundColor: draftPageSettings.backgroundColor })
                            }
                          }}
                          className="w-12 h-9 p-1 border rounded"
                        />
                        <Input
                          value={draftPageSettings.backgroundColor || ''}
                          onChange={(e) => updatePageSettingsDebounced({ backgroundColor: e.target.value || undefined })}
                          onBlur={async () => {
                            if (pageSettingsTimeoutRef.current) {
                              clearTimeout(pageSettingsTimeoutRef.current)
                              await updatePageSettings({ backgroundColor: draftPageSettings.backgroundColor })
                            }
                          }}
                          placeholder="#ffffff"
                          className="flex-1 text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grid Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Grid Layout</CardTitle>
                    <CardDescription>Control the grid system and spacing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="max-columns">Maximum Columns</Label>
                      <Select
                        value={String(draftPageSettings.maxColumns)}
                        onValueChange={async (value) => {
                          const newValue = Number(value) as 2 | 3 | 4
                          updatePageSettingsDebounced({ maxColumns: newValue })
                          // For select, save immediately since it's a discrete choice
                          if (pageSettingsTimeoutRef.current) {
                            clearTimeout(pageSettingsTimeoutRef.current)
                          }
                          await updatePageSettings({ maxColumns: newValue })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grid-gap-slider">Grid Gap</Label>
                        <span className="text-sm text-muted-foreground">{draftPageSettings.gridGap ?? 16}px</span>
                      </div>
                      <Slider
                        id="grid-gap-slider"
                        min={0}
                        max={48}
                        step={4}
                        value={[draftPageSettings.gridGap ?? 16]}
                        onValueChange={(value) => updatePageSettingsDebounced({ gridGap: value[0] })}
                        onValueCommit={async () => {
                          // Save immediately when user stops dragging
                          if (pageSettingsTimeoutRef.current) {
                            clearTimeout(pageSettingsTimeoutRef.current)
                          }
                          await updatePageSettings({ gridGap: draftPageSettings.gridGap })
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="row-spacing-slider">Row Spacing</Label>
                        <span className="text-sm text-muted-foreground">{draftPageSettings.rowSpacing ?? 24}px</span>
                      </div>
                      <Slider
                        id="row-spacing-slider"
                        min={0}
                        max={64}
                        step={4}
                        value={[draftPageSettings.rowSpacing ?? 24]}
                        onValueChange={(value) => updatePageSettingsDebounced({ rowSpacing: value[0] })}
                        onValueCommit={async () => {
                          // Save immediately when user stops dragging
                          if (pageSettingsTimeoutRef.current) {
                            clearTimeout(pageSettingsTimeoutRef.current)
                          }
                          await updatePageSettings({ rowSpacing: draftPageSettings.rowSpacing })
                        }}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
        <Button size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
        </div>
      </div>

      {draftRows.map((row, rowIndex) => {
        // Remaining capacity calc
        const remaining = 3 - row.blocks.reduce((s,b)=> s + b.width, 0)
        return (
          <React.Fragment key={row.id}>
            {/* Inter-row drop zone */}
            {rowIndex > 0 && (
              <div 
                className={cn(
                  "h-4 mx-4 rounded border-2 border-dashed transition-colors",
                  draggedBlock && dragOverPosition?.rowId === `inter-${rowIndex}` 
                    ? "border-primary bg-primary/10" 
                    : "border-transparent hover:border-input/40"
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverPosition({ rowId: `inter-${rowIndex}`, position: 1 })
                }}
                onDragLeave={handleDragLeave}
                onDrop={async (e) => {
                  e.preventDefault()
                  setDragOverPosition(null)
                  
                  if (!draggedBlock) return
                  
                  // Create a new row at this position
                  const newRowId = uid('row')
                  const newRows = [...draftRows]
                  
                  // Remove block from source
                  const sourceRowIndex = newRows.findIndex(r => r.id === draggedBlock.rowId)
                  if (sourceRowIndex !== -1) {
                    newRows[sourceRowIndex] = {
                      ...newRows[sourceRowIndex],
                      blocks: newRows[sourceRowIndex].blocks.filter(b => b.id !== draggedBlock.blockId)
                    }
                  }
                  
                  // Insert new row
                  newRows.splice(rowIndex, 0, {
                    id: newRowId,
                    blocks: [{
                      ...draggedBlock.block,
                      startPosition: 1
                    }]
                  })
                  
                  // Clean up empty rows
                  const cleanRows = newRows.filter(row => row.blocks.length > 0)
                  
                  setDraftRows(cleanRows)
                  setDraggedBlock(null)
                  await saveRows(cleanRows)
                }}
              >
                {draggedBlock && dragOverPosition?.rowId === `inter-${rowIndex}` && (
                  <div className="text-center text-xs text-primary py-1">
                    Drop to create new row
                  </div>
                )}
              </div>
            )}
            
            {/* Row Container with Settings */}
            <div className={cn('space-y-3 relative group')}>
              {/* Row Settings Icon */}
              <Button
                size="sm"
                variant="outline"
                className="absolute -right-2 -top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0"
                onClick={() => setRowPropsOpenFor(rowPropsOpenFor === row.id ? null : row.id)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* Top Line */}
              {row.topLineColor && (
                <div 
                  className="w-full"
                  style={{
                    height: `${row.topLineWidth || 1}px`,
                    backgroundColor: row.topLineColor
                  }}
                />
              )}
              
              {/* Row Background Container */}
              <div
                className="p-4 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: row.backgroundColor || 'transparent'
                }}
              >
                {/* Dynamic grid for cards */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${draftPageSettings.maxColumns ?? 3}, 1fr)`,
                    gap: `${draftPageSettings.gridGap ?? 16}px`
                  }}
                >
                  {/* Render existing blocks */}
                  {row.blocks.map(block => (
                    
                          <div
                            key={block.id}
                            className={cn(
                              'group rounded-lg p-4 relative transition-all duration-200',
                              draggedBlock && dragOverPosition?.rowId === row.id && dragOverPosition?.position === block.startPosition
                                ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5'
                                : '',
                              // Builder guide border when no custom border is set
                              !block.borderColor && (toolbarOpenFor === block.id
                                ? 'border-2 border-solid border-amber-500'
                                : 'border-2 border-dotted border-amber-500/90')
                            )}
                            style={{
                              backgroundColor: block.backgroundColor || undefined,
                              color: block.textColor || undefined,
                              border: block.borderColor ? `${block.borderWidth || 1}px solid ${block.borderColor}` : undefined,
                              borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
                              gridColumnStart: String(block.startPosition),
                              gridColumnEnd: `span ${block.width}`,
                            }}
                             data-card-id={block.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, row.id, block.id, block)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                              // Set drag over position to the start of this block for displacement
                              setDragOverPosition({ rowId: row.id, position: block.startPosition })
                            }}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, row.id, block.startPosition)}
                            onMouseEnter={(e)=>{
                              recalcActiveCardRect(block.id)
                            }}
                            onMouseLeave={()=>{
                              // don't clear here to allow toolbar to remain while interacting
                            }}
                            onClick={(e)=>{
                              recalcActiveCardRect(block.id)
                              setToolbarOpenFor(block.id)
                              setMenuOpenFor(block.id)
                              setActiveCardSpan(block.width)
                            }}
                          >
                            {/* Compact top bar controls with expand actions */}
                            <div className="flex items-center justify-between -mt-2 -mx-2 px-2 py-1 mb-1 border-b border-muted/30 text-muted-foreground/80">
                              <span
                                className="inline-flex items-center justify-center h-5 w-5 opacity-70"
                                title="Card"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                              <div className="flex items-center gap-1">
                                {block.width < 2 && canPlace(row, block.startPosition, 2, block.id) && (
                                  <Button size="sm" variant="outline" className="h-6 px-2" onClick={(e)=>{ e.stopPropagation(); changeBlockWidth(row.id, block.id, 2) }}>2/3</Button>
                                )}
                                {block.width < 3 && canPlace(row, block.startPosition, 3, block.id) && (
                                  <Button size="sm" variant="outline" className="h-6 px-2" onClick={(e)=>{ e.stopPropagation(); changeBlockWidth(row.id, block.id, 3) }}>Full</Button>
                                )}
                                <Sheet open={propsOpenFor === block.id} onOpenChange={(open: boolean) => {
                                  if (!open) setPropsOpenFor(null);
                                  else { setPropsOpenFor(block.id); setMenuOpenFor(null); }
                                }}>
                                  <SheetTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground/80 hover:text-foreground" title="Properties" onClick={(e)=> e.stopPropagation()}>
                                  <SlidersHorizontal className="h-3.5 w-3.5"/>
                                </Button>
                                  </SheetTrigger>
                                  <SheetContent side="right" className="w-96 overflow-y-auto">
                                    <SheetHeader>
                                      <SheetTitle>Block Properties</SheetTitle>
                                      <SheetDescription>
                                        Customize the appearance and layout of this content block.
                                      </SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6 space-y-6">
                                      {/* Color Settings */}
                                      <Card>
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-base">Colors</CardTitle>
                                          <CardDescription>Customize the block colors</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="background-color">Background</Label>
                                              <div className="flex gap-2">
                                                <Input
                                                  id="background-color"
                                                  type="color"
                                                  value={block.backgroundColor || '#ffffff'}
                                                  onChange={(e) => updateBlock(row.id, block.id, { backgroundColor: e.target.value })}
                                                  className="w-12 h-9 p-1 border rounded"
                                                />
                                                <Input
                                                  value={block.backgroundColor || ''}
                                                  onChange={(e) => updateBlock(row.id, block.id, { backgroundColor: e.target.value || undefined })}
                                                  placeholder="#ffffff"
                                                  className="flex-1 text-sm"
                                                />
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="text-color">Text</Label>
                                              <div className="flex gap-2">
                                                <Input
                                                  id="text-color"
                                                  type="color"
                                                  value={block.textColor || '#0f172a'}
                                                  onChange={(e) => updateBlock(row.id, block.id, { textColor: e.target.value })}
                                                  className="w-12 h-9 p-1 border rounded"
                                                />
                                                <Input
                                                  value={block.textColor || ''}
                                                  onChange={(e) => updateBlock(row.id, block.id, { textColor: e.target.value || undefined })}
                                                  placeholder="#0f172a"
                                                  className="flex-1 text-sm"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="border-color">Border</Label>
                                            <div className="flex gap-2">
                                              <Input
                                                id="border-color"
                                                type="color"
                                                value={block.borderColor || '#e5e7eb'}
                                                onChange={(e) => updateBlock(row.id, block.id, { borderColor: e.target.value })}
                                                className="w-12 h-9 p-1 border rounded"
                                              />
                                              <Input
                                                value={block.borderColor || ''}
                                                onChange={(e) => updateBlock(row.id, block.id, { borderColor: e.target.value || undefined })}
                                                placeholder="#e5e7eb"
                                                className="flex-1 text-sm"
                                              />
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="border-width">Border Width</Label>
                                            <Select
                                              value={String(block.borderWidth || 1)}
                                              onValueChange={(value) => updateBlock(row.id, block.id, { borderWidth: Number(value) })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="1">1px</SelectItem>
                                                <SelectItem value="2">2px</SelectItem>
                                                <SelectItem value="3">3px</SelectItem>
                                                <SelectItem value="4">4px</SelectItem>
                                                <SelectItem value="5">5px</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                              <Label htmlFor="glass-effect-toggle">Glass Effect</Label>
                                              <p className="text-xs text-muted-foreground">Add glassmorphism styling with shadows and glow</p>
                                            </div>
                                            <Switch
                                              id="glass-effect-toggle"
                                              checked={block.glassEffect || false}
                                              onCheckedChange={(checked) => {
                                                updateBlock(row.id, block.id, { glassEffect: checked })
                                              }}
                                            />
                                          </div>
                                        </CardContent>
                                      </Card>


                                      {/* Layout Settings */}
                                      <Card>
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-base">Layout</CardTitle>
                                          <CardDescription>Control block size and alignment</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="width-select">Width</Label>
                                            <Select
                                              value={String(block.width)}
                                              onValueChange={(value) => changeBlockWidth(row.id, block.id, Number(value) as 1|2|3)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="1">1/3 Column</SelectItem>
                                                <SelectItem value="2">2/3 Column</SelectItem>
                                                <SelectItem value="3">Full Width</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="space-y-3">
                                            <Label>Text Alignment</Label>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant={block.textAlignment === 'left' ? 'default' : 'outline'}
                                                onClick={() => updateBlock(row.id, block.id, { textAlignment: 'left' })}
                                                className="flex-1"
                                              >
                                                <AlignLeft className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={block.textAlignment === 'center' ? 'default' : 'outline'}
                                                onClick={() => updateBlock(row.id, block.id, { textAlignment: 'center' })}
                                                className="flex-1"
                                              >
                                                <AlignCenter className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={block.textAlignment === 'right' ? 'default' : 'outline'}
                                                onClick={() => updateBlock(row.id, block.id, { textAlignment: 'right' })}
                                                className="flex-1"
                                              >
                                                <AlignRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                                        </CardContent>
                                      </Card>

                                      {/* Spacing Settings */}
                                      <Card>
                                        <CardHeader className="pb-3">
                                          <CardTitle className="text-base">Spacing & Appearance</CardTitle>
                                          <CardDescription>Adjust padding, content spacing, and corner rounding</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <Label htmlFor="padding-slider">Padding</Label>
                                              <span className="text-sm text-muted-foreground">{block.padding ?? 24}px</span>
                                </div>
                                            <Slider
                                              id="padding-slider"
                                              min={0}
                                              max={64}
                                              step={4}
                                              value={[block.padding ?? 24]}
                                              onValueChange={(value) => updateBlockDebounced(row.id, block.id, { padding: value[0] })}
                                              className="w-full"
                                            />
                                </div>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <Label htmlFor="spacing-slider">Content Spacing</Label>
                                              <span className="text-sm text-muted-foreground">{block.spacing ?? 12}px</span>
                                </div>
                                            <Slider
                                              id="spacing-slider"
                                              min={0}
                                              max={48}
                                              step={4}
                                              value={[block.spacing ?? 12]}
                                              onValueChange={(value) => updateBlockDebounced(row.id, block.id, { spacing: value[0] })}
                                              className="w-full"
                                            />
                                </div>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <Label htmlFor="border-radius-slider">Corner Rounding</Label>
                                              <span className="text-sm text-muted-foreground">{block.borderRadius ?? 8}px</span>
                              </div>
                                            <Slider
                                              id="border-radius-slider"
                                              min={0}
                                              max={32}
                                              step={2}
                                              value={[block.borderRadius ?? 8]}
                                              onValueChange={(value) => updateBlockDebounced(row.id, block.id, { borderRadius: value[0] })}
                                              className="w-full"
                                            />
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </SheetContent>
                                </Sheet>
                                <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground/80 hover:text-red-600" title="Delete" onClick={(e) => { e.stopPropagation(); deleteBlock(row.id, block.id) }}>
                                  <Trash2 className="h-3.5 w-3.5"/>
                                </Button>
                              </div>
                            </div>



                            {/* Content area */}
                            <div className={cn(block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center')} style={{ rowGap: (block.spacing ?? 12) + 'px', display: 'grid' }}>
                              {(block.content || []).map((item, itemIndex) => (
                                <div key={item.id} className="group/item relative">
                                  {/* Reorder and Delete Controls */}
                                  <div className="absolute -right-2 -top-2 z-20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 flex gap-1">
                                    {/* Move Up Button */}
                                    {itemIndex > 0 && (
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                                        onClick={() => moveContentItem(row.id, block.id, item.id, 'up')}
                                        title="Move up"
                                      >
                                        <ChevronUp className="h-3 w-3"/>
                                      </Button>
                                    )}
                                    {/* Move Down Button */}
                                    {itemIndex < (block.content || []).length - 1 && (
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                                        onClick={() => moveContentItem(row.id, block.id, item.id, 'down')}
                                        title="Move down"
                                      >
                                        <ChevronDown className="h-3 w-3"/>
                                      </Button>
                                    )}
                                    {/* Delete Button */}
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 text-red-600 hover:text-red-700" 
                                      onClick={() => deleteContentItem(row.id, block.id, item.id)}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3"/>
                                    </Button>
                                  </div>
                              {item.type === 'headline' || item.type === 'subheading' || item.type === 'h3' || item.type === 'paragraph' ? (
                            <VariableSuggestionDropdown
                                      value={(item as any).content || ''}
                                      onChange={(v)=>{
                                        const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, content: v } : ci) })) }))
                                        setDraftRows(next)
                                      }}
                                      onSave={async (v)=>{
                                        const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, content: v } : ci) })) }))
                                        setDraftRows(next)
                                        await saveRows(next)
                                      }}
                                      autoSave={true}
                                      placeholder={item.type === 'headline' ? 'Your headline' : item.type === 'subheading' ? 'Your subheading' : item.type === 'h3' ? 'Your label' : 'Write your paragraph...'}
                                      className="w-full"
                                      inputClassName={cn('!border-0 !outline-none !ring-0 !shadow-none !bg-transparent !p-0 !m-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus:!shadow-none',
                                        block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center',
                                        item.type==='headline'?'!text-4xl md:!text-5xl lg:!text-6xl !font-black !tracking-tight !leading-tight':'', 
                                        item.type==='subheading'?'!text-xl md:!text-2xl lg:!text-3xl !font-medium !leading-relaxed':'', 
                                        item.type==='h3'?'!text-lg md:!text-xl lg:!text-2xl !font-semibold !leading-relaxed':'',
                                        item.type==='paragraph'?'!text-lg md:!text-xl !font-medium !leading-relaxed':'')}
                              variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0, campaignId) : []}
                                      multiline={true}
                                      campaignId={campaignId}
                                    />
                                  ) : item.type === 'button' ? (
                                    <div 
                                      className={cn(
                                        "flex cursor-pointer group relative",
                                        block.textAlignment === 'left' ? 'justify-start' : 
                                        block.textAlignment === 'right' ? 'justify-end' : 'justify-center'
                                      )}
                                      onClick={() => {
                                        setActiveButtonId(item.id)
                                        setButtonSheetOpen(true)
                                      }}
                                    >
                                      <button 
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors font-medium text-center group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2"
                                        type="button"
                                        style={{
                                          backgroundColor: getButtonColor(item),
                                          color: getButtonTextColor(item),
                                          '--hover-color': getButtonHoverColor(getButtonColor(item))
                                        } as React.CSSProperties & { '--hover-color': string }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = getButtonHoverColor(getButtonColor(item))
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = getButtonColor(item)
                                        }}
                                      >
                                        {(item as any).content || 'Button Text'}
                                      </button>
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-foreground">
                                          Click to edit button
                                        </div>
                                      </div>
                                    </div>
                                  ) : item.type === 'image' ? (
                                    <div 
                                      className="w-full cursor-pointer group relative"
                                      onClick={() => {
                                        setActiveImageId(item.id)
                                        setImageSheetOpen(true)
                                      }}
                                    >
                                      {(item as any).src ? (
                                        <>
                                          <img 
                                            src={(item as any).src} 
                                            alt={(item as any).alt || 'Image'} 
                                            className="w-full object-cover rounded-lg border border-input group-hover:border-primary transition-colors"
                                            style={{
                                              height: (item as any).maxHeight ? `${(item as any).maxHeight}px` : '192px',
                                              maxHeight: (item as any).maxHeight ? `${(item as any).maxHeight}px` : '192px'
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-foreground">
                                              Click to edit image
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <div 
                                          className="w-full border-2 border-dashed border-input group-hover:border-primary rounded-lg flex items-center justify-center bg-muted/10 group-hover:bg-muted/20 transition-colors"
                                          style={{
                                            height: (item as any).maxHeight ? `${(item as any).maxHeight}px` : '192px'
                                          }}
                                        >
                                          <div className="text-center text-muted-foreground">
                                            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50 group-hover:opacity-70" />
                                            <p className="text-sm">Click to add an image</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : item.type === 'divider' ? (
                                    <hr className="border-input" />
                                  ) : (item.type === 'numbered-list' || item.type === 'bullet-list') ? (
                                    <div className="space-y-2">
                                      {((item as any).items || []).map((val: string, idx: number) => (
                                        <VariableSuggestionDropdown
                                          key={idx}
                                          value={val}
                                          onChange={(v)=>{
                                            const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, items: (ci as any).items.map((x:string,i:number)=> i===idx? v : x) } : ci) })) }))
                                            setDraftRows(next)
                                          }}
                                          onSave={async (v)=>{
                                            const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, items: (ci as any).items.map((x:string,i:number)=> i===idx? v : x) } : ci) })) }))
                                            setDraftRows(next)
                                            await saveRows(next)
                                          }}
                                          autoSave={true}
                                          placeholder="List item..."
                                          className="w-full"
                                          inputClassName={cn('!border-0 !outline-none !ring-0 !shadow-none !bg-transparent',
                                            block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center')}
                                          variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0, campaignId) : []}
                                          multiline={false}
                                          campaignId={campaignId}
                                        />
                                      ))}
                                      <Button size="sm" variant="outline" onClick={async ()=>{
                                        const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, items: ([...(ci as any).items || [], '']) } : ci) })) }))
                                        setDraftRows(next)
                                        await saveRows(next)
                                      }}>Add item</Button>
                                    </div>
                                  ) : null}
                                </div>
                              ))}

                              {/* Empty content call-to-action */}
                              {(!block.content || block.content.length === 0) && (
                                <div className="rounded-xl py-10 text-center text-muted-foreground bg-transparent relative">
                                  <div className="text-lg">Click below to add content</div>
                                  <div className="mt-3">
                                    <Button size="icon" variant="secondary" className="rounded-full h-10 w-10" onClick={()=> { setToolbarOpenFor(block.id); setMenuOpenFor(block.id) }}>
                                      <Plus className="h-5 w-5"/>
                                    </Button>
                                  </div>
                                  {/* Floating toolbar appears anchored near bottom bar instead */}
                                </div>
                              )}
                            </div>

                            {/* Quick expand controls moved to top bar */}
                          </div>
                  ))}

                  {/* Single placeholder spanning first available contiguous empty space */}
                  {(() => {
                    const occupied = getOccupied(row)
                    let start: 1|2|3 | null = null
                    for (let s = 1 as 1|2|3; s <= 3; s = (s + 1) as 1|2|3) {
                      if (!occupied.has(s)) { start = s as 1|2|3; break }
                    }
                    if (!start) return null
                    let span = 0
                    for (let s = start; s <= 3; s = (s + 1) as 1|2|3) {
                      if (!occupied.has(s)) span++
                      else break
                    }
                    return (
                      <div 
                        key={`ph-${row.id}-${start}`} 
                        className={cn(
                          "rounded-lg border-2 border-dashed flex items-center justify-center min-h-[120px] transition-colors",
                          dragOverPosition?.rowId === row.id && dragOverPosition?.position === start
                            ? "border-primary bg-primary/10"
                            : "border-input/60 bg-muted/10"
                        )}
                        style={{ gridColumnStart: String(start), gridColumnEnd: `span ${span}` }}
                        onDragOver={(e) => handleDragOver(e, row.id, start!)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, row.id, start!)}
                      >
                        <div className="text-center space-y-2">
                          <div className="text-xs text-muted-foreground">Empty slot</div>
                          <div className="flex items-center gap-2 justify-center">
                            {span >= 1 && <Button size="sm" variant="outline" onClick={()=> addBlockAtPosition(row.id, start!, 1)}>Add 1/3</Button>}
                            {span >= 2 && <Button size="sm" variant="outline" onClick={()=> addBlockAtPosition(row.id, start!, 2)}>Add 2/3</Button>}
                            {span >= 3 && <Button size="sm" variant="outline" onClick={()=> addBlockAtPosition(row.id, start!, 3)}>Add Full</Button>}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                
                {/* Bottom Line */}
                {row.bottomLineColor && (
                  <div 
                    className="w-full mt-4"
                    style={{
                      height: `${row.bottomLineWidth || 1}px`,
                      backgroundColor: row.bottomLineColor
                    }}
                  />
                )}
              </div>
            </div>
          </React.Fragment>
        )
      })}

      {/* Global empty-state chooser for additional rows: show only when there are no rows */}
      {draftRows.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-input/60 bg-muted/10 flex items-center justify-center min-h-[120px]">
          <div className="text-center space-y-2">
            <div className="text-xs text-muted-foreground">Empty layout</div>
            <div className="flex items-center gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={async()=>{const id = await addRow(); await addBlock(id, 1)}}>Add 1/3</Button>
              <Button size="sm" variant="outline" onClick={async()=>{const id = await addRow(); await addBlock(id, 2)}}>Add 2/3</Button>
              <Button size="sm" variant="outline" onClick={async()=>{const id = await addRow(); await addBlock(id, 3)}}>Add Full</Button>
          </div>
          </div>
        </div>
      )}
    </div>
    {/* Floating Notion-style command palette */}
    {menuOpenFor && activeCardRect && propsOpenFor !== menuOpenFor && (
      <div 
        ref={menuRef} 
        className="fixed z-50" 
        style={{ 
          left: activeCardRect.left, 
          top: activeCardRect.positionAbove ? activeCardRect.top - 8 : activeCardRect.top + 8, 
          transform: activeCardRect.positionAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)'
        }}
      >
        <Command className="rounded-lg border bg-popover shadow-md w-[520px]" style={{ maxWidth: activeCardSpan ? Math.max(240, Math.floor(activeCardRect.width / activeCardSpan)) : undefined }}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Basic blocks">
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'headline'); recalcActiveCardRect(menuOpenFor) }}><Heading1 /><span>Headline</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'subheading'); recalcActiveCardRect(menuOpenFor) }}><Heading2 /><span>Subheading</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'h3'); recalcActiveCardRect(menuOpenFor) }}><Heading3 /><span>Label</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'paragraph'); recalcActiveCardRect(menuOpenFor) }}><TextIcon /><span>Paragraph</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'button'); recalcActiveCardRect(menuOpenFor) }}><MousePointerClick /><span>Button</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'image'); recalcActiveCardRect(menuOpenFor) }}><ImageIcon /><span>Image</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'numbered-list'); recalcActiveCardRect(menuOpenFor) }}><ListOrdered /><span>Numbered list</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'bullet-list'); recalcActiveCardRect(menuOpenFor) }}><List /><span>Bulleted list</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'divider'); recalcActiveCardRect(menuOpenFor) }}><Minus /><span>Divider</span></UICommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    )}

    {/* Dedicated Image Properties Sheet */}
    <Sheet open={imageSheetOpen} onOpenChange={setImageSheetOpen}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Image Properties</SheetTitle>
          <SheetDescription>
            Select, upload, and customize your image
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {activeImageId && (() => {
            // Find the active image item
            let activeImageItem = null
            for (const row of draftRows) {
              for (const block of row.blocks) {
                const found = block.content.find(item => item.id === activeImageId && item.type === 'image')
                if (found) {
                  activeImageItem = found
                  break
                }
              }
              if (activeImageItem) break
            }
            
            if (!activeImageItem) return null
            
            return (
              <>
                {/* Image Selector */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Image</CardTitle>
                    <CardDescription>Choose from Unsplash, upload your own, or paste a URL</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UnsplashImageSelector
                      onImageSelect={async (imageUrl) => {
                        const next = draftRows.map(r => ({ 
                          ...r, 
                          blocks: r.blocks.map(b => ({ 
                            ...b, 
                            content: b.content.map(ci => 
                              ci.id === activeImageId 
                                ? { ...ci, src: imageUrl } 
                                : ci
                            ) 
                          })) 
                        }))
                        setDraftRows(next)
                        await saveRows(next)
                      }}
                      onUpload={(files) => handleImageUpload(files, activeImageId)}
                      currentImage={(activeImageItem as any).src || ''}
                      isUploading={isUploading}
                      placeholder="Search for images or paste URL..."
                    />
                  </CardContent>
                </Card>

                {/* Image URL with Variable Support */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Direct Image URL</CardTitle>
                    <CardDescription>Paste an image URL or use variables for dynamic images</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={`image-url-${activeImageId}`}>Image URL</Label>
                                            <VariableSuggestionDropdown
                        value={(activeImageItem as any).src || ''}
                        onChange={(v) => {
                          const next = draftRows.map(r => ({ 
                            ...r, 
                            blocks: r.blocks.map(b => ({ 
                              ...b, 
                              content: b.content.map(ci => 
                                ci.id === activeImageId 
                                  ? { ...ci, src: v } 
                                  : ci
                              ) 
                            })) 
                          }))
                          setDraftRows(next)
                        }}
                        onBlur={async () => { await saveRows(draftRows) }}
                        placeholder="https://example.com/image.jpg or @variableName"
                        className="text-sm border border-input rounded-md [&>input]:!px-3 [&>input]:!py-1 focus-within:!ring-[0.25px] focus-within:!ring-black focus-within:!border-black focus-within:!rounded-md"
                        inputClassName="text-sm !px-3 !py-1 flex items-center h-8 !box-border focus:!ring-[0.25px] focus:!ring-black focus:!border-black focus-visible:!ring-[0.25px] focus-visible:!ring-black focus-visible:!border-black !outline-none !rounded-md !overflow-hidden !text-ellipsis !whitespace-nowrap"
                        variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0, campaignId) : []}
                        multiline={false}
                        campaignId={campaignId}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use @variableName to insert dynamic image URLs from user inputs or AI outputs
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Image Details</CardTitle>
                    <CardDescription>Add accessibility information and customize appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`alt-text-${activeImageId}`}>Alt Text</Label>
                      <Input
                        id={`alt-text-${activeImageId}`}
                        value={(activeImageItem as any).alt || ''}
                        onChange={(e) => {
                          const next = draftRows.map(r => ({ 
                            ...r, 
                            blocks: r.blocks.map(b => ({ 
                              ...b, 
                              content: b.content.map(ci => 
                                ci.id === activeImageId 
                                  ? { ...ci, alt: e.target.value } 
                                  : ci
                              ) 
                            })) 
                          }))
                          setDraftRows(next)
                        }}
                        onBlur={async () => { await saveRows(draftRows) }}
                        placeholder="Describe the image for accessibility"
                        className="text-sm"
                      />
                                                            <p className="text-xs text-muted-foreground">
                                        Alt text helps screen readers describe the image to visually impaired users
                                      </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={`max-height-${activeImageId}`}>Max Height</Label>
                                        <span className="text-sm text-muted-foreground">{(activeImageItem as any).maxHeight ?? 192}px</span>
                                      </div>
                                      <Slider
                                        id={`max-height-${activeImageId}`}
                                        min={100}
                                        max={800}
                                        step={10}
                                        value={[(activeImageItem as any).maxHeight ?? 192]}
                                        onValueChange={(value) => {
                                          const next = draftRows.map(r => ({ 
                                            ...r, 
                                            blocks: r.blocks.map(b => ({ 
                                              ...b, 
                                              content: b.content.map(ci => 
                                                ci.id === activeImageId 
                                                  ? { ...ci, maxHeight: value[0] } 
                                                  : ci
                                              ) 
                                            })) 
                                          }))
                                          setDraftRows(next)
                                        }}
                                        onValueCommit={async () => { await saveRows(draftRows) }}
                                        className="w-full"
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Control the maximum height of the image display
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
              </>
            )
          })()}
        </div>
      </SheetContent>
    </Sheet>

    {/* Dedicated Button Properties Sheet */}
    <Sheet open={buttonSheetOpen} onOpenChange={setButtonSheetOpen}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Button Properties</SheetTitle>
          <SheetDescription>
            Configure button text, URL, and behavior
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {activeButtonId && (() => {
            let activeButtonItem = null
            for (const row of draftRows) {
              for (const block of row.blocks) {
                const found = block.content.find(item => item.id === activeButtonId && item.type === 'button')
                if (found) {
                  activeButtonItem = found
                  break
                }
              }
              if (activeButtonItem) break
            }
            
            if (!activeButtonItem) return null
            
            return (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Button Text</CardTitle>
                    <CardDescription>Set the button label with support for dynamic variables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={`button-text-${activeButtonId}`}>Button Text</Label>
                      <VariableSuggestionDropdown
                        value={(activeButtonItem as any).content || ''}
                        onChange={(v) => {
                          const next = draftRows.map(r => ({ 
                            ...r, 
                            blocks: r.blocks.map(b => ({ 
                              ...b, 
                              content: b.content.map(ci => 
                                ci.id === activeButtonId 
                                  ? { ...ci, content: v } 
                                  : ci
                              ) 
                            })) 
                          }))
                          setDraftRows(next)
                        }}
                        onBlur={async () => { await saveRows(draftRows) }}
                        placeholder="Button text or @variableName"
                        className="text-sm border border-input rounded-md [&>input]:!px-3 [&>input]:!py-1 focus-within:!ring-[0.25px] focus-within:!ring-black focus-within:!border-black focus-within:!rounded-md"
                        inputClassName="text-sm !px-3 !py-1 flex items-center h-8 !box-border focus:!ring-[0.25px] focus:!ring-black focus:!border-black focus-visible:!ring-[0.25px] focus-visible:!ring-black focus-visible:!border-black !outline-none !rounded-md !overflow-hidden !text-ellipsis !whitespace-nowrap"
                        variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0, campaignId) : []}
                        multiline={false}
                        campaignId={campaignId}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use @variableName to insert dynamic text from user inputs or AI outputs
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Button URL</CardTitle>
                    <CardDescription>Set the destination URL with support for dynamic variables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={`button-url-${activeButtonId}`}>Button URL</Label>
                      <VariableSuggestionDropdown
                        value={(activeButtonItem as any).href || ''}
                        onChange={(v) => {
                          const next = draftRows.map(r => ({ 
                            ...r, 
                            blocks: r.blocks.map(b => ({ 
                              ...b, 
                              content: b.content.map(ci => 
                                ci.id === activeButtonId 
                                  ? { ...ci, href: v } 
                                  : ci
                              ) 
                            })) 
                          }))
                          setDraftRows(next)
                        }}
                        onBlur={async () => { await saveRows(draftRows) }}
                        placeholder="https://example.com or @variableName"
                        className="text-sm border border-input rounded-md [&>input]:!px-3 [&>input]:!py-1 focus-within:!ring-[0.25px] focus-within:!ring-black focus-within:!border-black focus-within:!rounded-md"
                        inputClassName="text-sm !px-3 !py-1 flex items-center h-8 !box-border focus:!ring-[0.25px] focus:!ring-black focus:!border-black focus-visible:!ring-[0.25px] focus-visible:!ring-black focus-visible:!border-black !outline-none !rounded-md !overflow-hidden !text-ellipsis !whitespace-nowrap"
                        variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0, campaignId) : []}
                        multiline={false}
                        campaignId={campaignId}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use @variableName to create dynamic URLs based on user data
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Button Colors</CardTitle>
                    <CardDescription>Customize the button appearance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Use Campaign Theme</Label>
                          <p className="text-xs text-muted-foreground">Use the default button colors from campaign settings</p>
                        </div>
                        <Button
                          size="sm"
                          variant={!(activeButtonItem as any).color && !(activeButtonItem as any).textColor ? "default" : "outline"}
                          onClick={() => {
                            const next = draftRows.map(r => ({ 
                              ...r, 
                              blocks: r.blocks.map(b => ({ 
                                ...b, 
                                content: b.content.map(ci => 
                                  ci.id === activeButtonId 
                                    ? { ...ci, color: undefined, textColor: undefined } 
                                    : ci
                                ) 
                              })) 
                            }))
                            setDraftRows(next)
                            saveRows(next)
                          }}
                        >
                          {!(activeButtonItem as any).color && !(activeButtonItem as any).textColor ? "Active" : "Use Theme"}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Background Color</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={(activeButtonItem as any).color || campaignTheme.buttonColor}
                              onChange={(e) => {
                                const next = draftRows.map(r => ({ 
                                  ...r, 
                                  blocks: r.blocks.map(b => ({ 
                                    ...b, 
                                    content: b.content.map(ci => 
                                      ci.id === activeButtonId 
                                        ? { ...ci, color: e.target.value } 
                                        : ci
                                    ) 
                                  })) 
                                }))
                                setDraftRows(next)
                                saveRows(next)
                              }}
                              className="w-10 h-10 rounded border border-input cursor-pointer"
                            />
                            <div className="flex-1">
                              <Input
                                value={(activeButtonItem as any).color || ''}
                                onChange={(e) => {
                                  const next = draftRows.map(r => ({ 
                                    ...r, 
                                    blocks: r.blocks.map(b => ({ 
                                      ...b, 
                                      content: b.content.map(ci => 
                                        ci.id === activeButtonId 
                                          ? { ...ci, color: e.target.value || undefined } 
                                          : ci
                                      ) 
                                    })) 
                                  }))
                                  setDraftRows(next)
                                  saveRows(next)
                                }}
                                placeholder="#3B82F6"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Text Color</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={(activeButtonItem as any).textColor || campaignTheme.buttonTextColor}
                              onChange={(e) => {
                                const next = draftRows.map(r => ({ 
                                  ...r, 
                                  blocks: r.blocks.map(b => ({ 
                                    ...b, 
                                    content: b.content.map(ci => 
                                      ci.id === activeButtonId 
                                        ? { ...ci, textColor: e.target.value } 
                                        : ci
                                    ) 
                                  })) 
                                }))
                                setDraftRows(next)
                                saveRows(next)
                              }}
                              className="w-10 h-10 rounded border border-input cursor-pointer"
                            />
                            <div className="flex-1">
                              <Input
                                value={(activeButtonItem as any).textColor || ''}
                                onChange={(e) => {
                                  const next = draftRows.map(r => ({ 
                                    ...r, 
                                    blocks: r.blocks.map(b => ({ 
                                      ...b, 
                                      content: b.content.map(ci => 
                                        ci.id === activeButtonId 
                                          ? { ...ci, textColor: e.target.value || undefined } 
                                          : ci
                                      ) 
                                    })) 
                                  }))
                                  setDraftRows(next)
                                  saveRows(next)
                                }}
                                placeholder="#FFFFFF"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Override the campaign theme with custom button colors
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Button Preview</CardTitle>
                    <CardDescription>See how your button will appear to users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex justify-center">
                        <button 
                          className="inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors font-medium text-center"
                          type="button"
                          disabled
                          style={{
                            backgroundColor: getButtonColor(activeButtonItem),
                            color: getButtonTextColor(activeButtonItem)
                          }}
                        >
                          {(() => {
                            const buttonText = (activeButtonItem as any).content || 'Button Text'
                            // Use the same variable values as the main preview (includes AI results and real data)
                            const buttonInterpolator = new VariableInterpolator()
                            return buttonInterpolator.interpolate(buttonText, { variables: previewVariables, availableVariables: [] }).content
                          })()}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <strong>URL:</strong> {(() => {
                          const buttonUrl = (activeButtonItem as any).href || 'No URL set'
                          if (buttonUrl === 'No URL set') return buttonUrl
                          // Use the same variable values as the main preview (includes AI results and real data)
                          const urlInterpolator = new VariableInterpolator()
                          return urlInterpolator.interpolate(buttonUrl, { variables: previewVariables, availableVariables: [] }).content
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )
          })()}
        </div>
      </SheetContent>
    </Sheet>

    {/* Row Properties Sheet */}
    <Sheet open={!!rowPropsOpenFor} onOpenChange={(open) => !open && setRowPropsOpenFor(null)}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Row Properties</SheetTitle>
          <SheetDescription>
            Customize the appearance and styling of this row
          </SheetDescription>
        </SheetHeader>
        
        {rowPropsOpenFor && (() => {
          const row = draftRows.find(r => r.id === rowPropsOpenFor)
          if (!row) return null
          
          return (
            <div className="space-y-6 pt-6">
              {/* Background */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Background</CardTitle>
                  <CardDescription>Set the row background color and image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="row-background-color">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="row-background-color"
                        type="color"
                        value={row.backgroundColor || '#ffffff'}
                        onChange={(e) => updateRow(row.id, { backgroundColor: e.target.value })}
                        className="w-12 h-9 p-1 border rounded"
                      />
                      <Input
                        value={row.backgroundColor || ''}
                        onChange={(e) => updateRow(row.id, { backgroundColor: e.target.value || undefined })}
                        placeholder="#ffffff"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="row-background-image">Background Image URL</Label>
                    <Input
                      id="row-background-image"
                      value={row.backgroundImage || ''}
                      onChange={(e) => updateRow(row.id, { backgroundImage: e.target.value || undefined })}
                      placeholder="https://example.com/image.jpg"
                      className="text-sm"
                    />
                  </div>
                  {row.backgroundImage && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="overlay-color">Overlay Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="overlay-color"
                            type="color"
                            value={row.overlayColor || '#000000'}
                            onChange={(e) => updateRow(row.id, { overlayColor: e.target.value })}
                            className="w-12 h-9 p-1 border rounded"
                          />
                          <Input
                            value={row.overlayColor || ''}
                            onChange={(e) => updateRow(row.id, { overlayColor: e.target.value || undefined })}
                            placeholder="#000000"
                            className="flex-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overlay-opacity">Overlay Opacity</Label>
                        <div className="flex items-center space-x-3">
                          <Slider
                            id="overlay-opacity"
                            min={0}
                            max={100}
                            step={5}
                            value={[row.overlayOpacity || 50]}
                            onValueChange={([value]) => updateRow(row.id, { overlayOpacity: value })}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-center">
                            {row.overlayOpacity || 50}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Padding */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Internal Padding</CardTitle>
                  <CardDescription>Control the vertical spacing inside the row</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="row-padding">Vertical Padding</Label>
                    <div className="flex items-center space-x-3">
                      <Slider
                        id="row-padding"
                        min={0}
                        max={128}
                        step={8}
                        value={[row.paddingTop || 16]}
                        onValueChange={([value]) => updateRow(row.id, { 
                          paddingTop: value, 
                          paddingBottom: value
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12 text-center">
                        {row.paddingTop || 16}px
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Line */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top Line</CardTitle>
                  <CardDescription>Add a line above the row content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="top-line-color">Line Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="top-line-color"
                        type="color"
                        value={row.topLineColor || '#e5e7eb'}
                        onChange={(e) => updateRow(row.id, { topLineColor: e.target.value })}
                        className="w-12 h-9 p-1 border rounded"
                      />
                      <Input
                        value={row.topLineColor || ''}
                        onChange={(e) => updateRow(row.id, { topLineColor: e.target.value || undefined })}
                        placeholder="#e5e7eb"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="top-line-width">Line Width</Label>
                    <Select
                      value={String(row.topLineWidth || 1)}
                      onValueChange={(value) => updateRow(row.id, { topLineWidth: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1px</SelectItem>
                        <SelectItem value="2">2px</SelectItem>
                        <SelectItem value="3">3px</SelectItem>
                        <SelectItem value="4">4px</SelectItem>
                        <SelectItem value="5">5px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Line */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bottom Line</CardTitle>
                  <CardDescription>Add a line below the row content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bottom-line-color">Line Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bottom-line-color"
                        type="color"
                        value={row.bottomLineColor || '#e5e7eb'}
                        onChange={(e) => updateRow(row.id, { bottomLineColor: e.target.value })}
                        className="w-12 h-9 p-1 border rounded"
                      />
                      <Input
                        value={row.bottomLineColor || ''}
                        onChange={(e) => updateRow(row.id, { bottomLineColor: e.target.value || undefined })}
                        placeholder="#e5e7eb"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bottom-line-width">Line Width</Label>
                    <Select
                      value={String(row.bottomLineWidth || 1)}
                      onValueChange={(value) => updateRow(row.id, { bottomLineWidth: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1px</SelectItem>
                        <SelectItem value="2">2px</SelectItem>
                        <SelectItem value="3">3px</SelectItem>
                        <SelectItem value="4">4px</SelectItem>
                        <SelectItem value="5">5px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })()}
      </SheetContent>
    </Sheet>
    </>
  )
}

// Width option card component
function WidthOption({ label, caption, bars, onClick }: { label: string; caption: string; bars: [boolean, boolean, boolean]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border rounded-xl p-6 bg-background hover:bg-accent transition-colors text-left">
      <div className="flex items-center gap-2 mb-4">
        {bars.map((b, i) => (
          <div key={i} className={cn('h-6 w-3 rounded', b ? 'bg-blue-300' : 'bg-gray-200')} />
        ))}
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{caption}</div>
    </button>
  )
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>{label}</Button>
  )
}

export default AdvancedOutputBuilder



// Deprecated local CommandItem retained for reference; not used now that shadcn Command is integrated
