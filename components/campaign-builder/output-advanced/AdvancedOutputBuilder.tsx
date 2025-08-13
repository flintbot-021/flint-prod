'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal, GripVertical, Heading1, Heading2, Text as TextIcon, MousePointerClick, Image as ImageIcon, ListOrdered, List, Minus } from 'lucide-react'
import { ContentToolbar } from './ContentToolbar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem as UICommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { VariableSuggestionDropdown } from '@/components/ui/variable-suggestion-dropdown'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'
import { getAITestResults } from '@/lib/utils/ai-test-storage'
import { titleToVariableName, isQuestionSection } from '@/lib/utils/section-variables'

type ContentItem =
  | { id: string; type: 'headline' | 'subheading' | 'paragraph'; content: string }
  | { id: string; type: 'button'; content: string; href?: string }
  | { id: string; type: 'image'; src?: string; alt?: string }
  | { id: string; type: 'numbered-list' | 'bullet-list'; items: string[] }
  | { id: string; type: 'divider' }

type Block = {
  id: string
  width: 1 | 2 | 3
  startPosition: 1 | 2 | 3
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  outlineColor?: string
  textAlignment?: 'left' | 'center' | 'right'
  padding?: number
  spacing?: number
  content: ContentItem[]
}

type Row = { id: string; blocks: Block[] }

interface AdvancedOutputBuilderProps {
  section: CampaignSection
  isPreview?: boolean
  onUpdate: (updates: Partial<CampaignSection>) => Promise<void>
  className?: string
  campaignId: string
  allSections?: CampaignSection[]
}

// Lightweight ID helper
const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export function AdvancedOutputBuilder({ section, isPreview = false, onUpdate, className, allSections }: AdvancedOutputBuilderProps) {
  const settings: any = section.settings || {}
  const rows: Row[] = settings.rows || []
  const defaultBlock = settings.defaultBlock || {}
  const sanitizedDefaultBlock = useMemo(() => {
    const { backgroundColor, borderColor, outlineColor, ...rest } = defaultBlock || {}
    return rest
  }, [defaultBlock])
  const [toolbarOpenFor, setToolbarOpenFor] = useState<string | null>(null)
  const [activeCardRect, setActiveCardRect] = useState<{ left: number; top: number; width: number } | null>(null)
  const [propsOpenFor, setPropsOpenFor] = useState<string | null>(null)
  const [draftRows, setDraftRows] = useState<Row[]>(rows)
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const propsPanelRef = useRef<HTMLDivElement>(null)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [activeCardSpan, setActiveCardSpan] = useState<1|2|3 | null>(null)

  const recalcActiveCardRect = useCallback((blockId: string) => {
    if (typeof document === 'undefined') return
    const el = document.querySelector(`[data-card-id="${blockId}"]`) as HTMLDivElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    setActiveCardRect({ left: rect.left + rect.width/2, top: rect.bottom, width: rect.width })
  }, [])
  // Drag-and-drop disabled

  // Keep local draftRows in sync with external settings
  useEffect(() => {
    setDraftRows(rows)
    if (!activeRowId && rows.length) {
      setActiveRowId(rows[0].id)
    }
  }, [rows])

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

  // Close properties panel when clicking outside of it
  useEffect(() => {
    function handleOutsidePropsClick(e: MouseEvent) {
      if (!propsOpenFor) return
      const target = e.target as Node
      if (propsPanelRef.current && propsPanelRef.current.contains(target)) return
      setPropsOpenFor(null)
    }
    document.addEventListener('mousedown', handleOutsidePropsClick)
    return () => document.removeEventListener('mousedown', handleOutsidePropsClick)
  }, [propsOpenFor])

  const saveRows = async (nextRows: Row[]) => {
    await onUpdate({ settings: { ...settings, mode: 'advanced', rows: nextRows, defaultBlock } })
  }

  // Helpers to compute occupancy per row
  const getOccupied = (row: Row, excludeBlockId?: string) => {
    const occupied = new Set<number>()
    row.blocks.filter(b => b.id !== excludeBlockId).forEach(b => {
      for (let i = 0; i < b.width; i++) occupied.add(b.startPosition + i)
    })
    return occupied
  }

  const canPlace = (row: Row, start: 1 | 2 | 3, width: 1 | 2 | 3, excludeBlockId?: string) => {
    const occupied = getOccupied(row, excludeBlockId)
    for (let i = 0; i < width; i++) {
      const col = start + i
      if (col < 1 || col > 3) return false
      if (occupied.has(col)) return false
    }
    return true
  }

  // Build preview variable context similar to output-section
  const previewVariables = useMemo(() => {
    const vars: Record<string, string> = {}
    if (allSections && allSections.length) {
      const available = getSimpleVariablesForBuilder(allSections, section.order || 0)
      available.forEach(v => { vars[v.name] = v.sampleValue })
    }
    // Merge AI test results last so they take precedence
    const ai = getAITestResults() || {}
    Object.assign(vars, ai)
    // Ensure capture defaults
    if (!vars.name) vars.name = 'Joe Bloggs'
    if (!vars.email) vars.email = 'joe@email.com'
    if (!vars.phone) vars.phone = '+12 345 6789'
    return vars
  }, [allSections, section.order])

  // Preview uses variable interpolator to show a basic rendering
  const previewHtml = useMemo(() => {
    if (!isPreview) return null
    const interpolator = new VariableInterpolator()
    const variables: Record<string, any> = previewVariables

    const renderItem = (item: ContentItem) => {
      switch (item.type) {
        case 'headline':
          return `<h1 class="text-3xl font-bold">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</h1>`
        case 'subheading':
          return `<h2 class="text-xl text-muted-foreground">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</h2>`
        case 'paragraph':
          return `<p class="leading-relaxed">${interpolator.interpolate(item.content || '', { variables, availableVariables: [] }).content}</p>`
        case 'divider':
          return `<hr class="border-input my-4"/>`
        case 'button':
          return `<a class="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white">${item.content || 'Button'}</a>`
        case 'image':
          return item.src ? `<img class="rounded-lg w-full object-cover" src="${item.src}" alt="${item.alt || ''}"/>` : ''
        case 'numbered-list':
          return `<ol class="list-decimal pl-5">${(item.items||[]).map(li=>`<li>${interpolator.interpolate(li, { variables, availableVariables: [] }).content}</li>`).join('')}</ol>`
        case 'bullet-list':
          return `<ul class="list-disc pl-5">${(item.items||[]).map(li=>`<li>${interpolator.interpolate(li, { variables, availableVariables: [] }).content}</li>`).join('')}</ul>`
        default:
          return ''
      }
    }

    const renderBlock = (b: Block) => {
      const align = b.textAlignment || 'center'
      const styles: string[] = [
        `padding:${b.padding ?? 24}px`,
        `grid-column-start:${b.startPosition}`,
        `grid-column-end:span ${b.width}`
      ]
      if (b.backgroundColor) styles.push(`background:${b.backgroundColor}`)
      if (b.textColor) styles.push(`color:${b.textColor}`)
      if (b.borderColor) styles.push(`border:1px solid ${b.borderColor}`)
      const innerStyle = `display:grid;row-gap:${b.spacing ?? 12}px;text-align:${align}`
      return `<div class=\"rounded-lg\" style=\"${styles.join(';')}\"><div style=\"${innerStyle}\">${b.content.map(renderItem).join('')}</div></div>`
    }

    const html = rows.map(r => `<div class=\"grid grid-cols-3 gap-4 mb-6\">${r.blocks.map(renderBlock).join('')}</div>`).join('')
    return html
  }, [isPreview, rows, previewVariables])

  // Build available variables like output-section.tsx
  function getSimpleVariablesForBuilder(sections: CampaignSection[], currentOrder: number) {
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
    // Merge AI test results as additional candidates (if present)
    const ai = getAITestResults() || {}
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
    let next = draftRows.map(r => ({ ...r, blocks: r.blocks.filter(b => b.id !== blockId) }))
    // Prune any rows that became empty after deletion
    const pruned = next.filter(r => r.blocks.length > 0)
    setDraftRows(pruned)
    await saveRows(pruned)
    if (!pruned.some(r => r.id === activeRowId)) {
      setActiveRowId(pruned.length ? pruned[pruned.length - 1].id : null)
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
    if (type === 'headline' || type === 'subheading' || type === 'paragraph') newItem.content = ''
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

  // Build Mode (scaffold): show dotted chooser when empty; otherwise simple grid list (editing to be expanded next)
  if (rows.length === 0 || rows.every(r => r.blocks.length === 0)) {
    return (
      <div className={cn('p-10 border-2 border-dashed rounded-2xl text-center bg-muted/10', className)}>
        <div className="mx-auto max-w-4xl">
          <h3 className="text-2xl font-semibold text-foreground">Create a Content Card</h3>
          <p className="text-muted-foreground mt-2">Choose a width for your new content card</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <WidthOption label="1/3 Column" caption="Narrow card" bars={[true,false,false]} onClick={() => addFirstBlock(1)} />
            <WidthOption label="2/3 Column" caption="Wide card" bars={[true,true,false]} onClick={() => addFirstBlock(2)} />
            <WidthOption label="Full Width" caption="Full row card" bars={[true,true,true]} onClick={() => addFirstBlock(3)} />
          </div>
          <div className="mt-8 text-xs text-muted-foreground">Cards will be arranged in a 3-column grid layout</div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className={cn('p-4 space-y-6', className)}>
      {/* Header row controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Advanced Output Layout</div>
        <Button size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
      </div>

      {draftRows.map(row => {
        // Remaining capacity calc
        const remaining = 3 - row.blocks.reduce((s,b)=> s + b.width, 0)
        return (
          <div
            key={row.id}
            className={cn('space-y-3 relative')}
          >
            {/* Full-width 3-column grid for cards */}
            <div
              className="grid grid-cols-3 gap-4"
            >
                  {/* Render existing blocks */}
                  {row.blocks.map(block => (
                    
                          <div
                            key={block.id}
                            className={cn(
                              'group rounded-lg p-4 relative bg-transparent',
                              // Builder guide border when no custom border is set
                              !block.borderColor && (toolbarOpenFor === block.id
                                ? 'border-2 border-solid border-amber-500'
                                : 'border-2 border-dotted border-amber-500/90')
                            )}
                            style={{
                              background: block.backgroundColor || 'transparent',
                              color: block.textColor,
                              border: block.borderColor ? `1px solid ${block.borderColor}` : undefined,
                              outline: block.outlineColor ? `2px solid ${block.outlineColor}` : undefined,
                              gridColumnStart: String(block.startPosition),
                              gridColumnEnd: `span ${block.width}`,
                            }}
                             data-card-id={block.id}
                            onMouseEnter={(e)=>{
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                              setActiveCardRect({ left: rect.left + rect.width/2, top: rect.bottom, width: rect.width })
                            }}
                            onMouseLeave={()=>{
                              // don't clear here to allow toolbar to remain while interacting
                            }}
                            onClick={(e)=>{
                              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                              setActiveCardRect({ left: rect.left + rect.width/2, top: rect.bottom, width: rect.width })
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
                                <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground/80 hover:text-foreground" title="Properties" onClick={(e)=> { e.stopPropagation(); const next = propsOpenFor===block.id? null : block.id; setPropsOpenFor(next); if (next) setMenuOpenFor(null) }}>
                                  <SlidersHorizontal className="h-3.5 w-3.5"/>
                                </Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground/80 hover:text-red-600" title="Delete" onClick={(e) => { e.stopPropagation(); deleteBlock(row.id, block.id) }}>
                                  <Trash2 className="h-3.5 w-3.5"/>
                                </Button>
                              </div>
                            </div>

                            {/* Properties panel */}
                            {propsOpenFor === block.id && (
                              <div ref={propsPanelRef} className="absolute z-50 right-2 top-10 w-80 bg-popover border border-border rounded-lg shadow-xl p-4 space-y-3" onMouseDown={(e)=> e.stopPropagation()} onClick={(e)=> e.stopPropagation()}>
                                <div className="text-sm font-medium">Customize</div>
                                <div className="grid grid-cols-2 gap-3 text-xs items-center">
                                  <label>Background</label>
                                  <input type="color" value={block.backgroundColor || '#ffffff'} onChange={(e)=>updateBlock(row.id, block.id, { backgroundColor: e.target.value })} className="w-8 h-6 border rounded"/>
                                  <label>Text</label>
                                  <input type="color" value={block.textColor || '#0f172a'} onChange={(e)=>updateBlock(row.id, block.id, { textColor: e.target.value })} className="w-8 h-6 border rounded"/>
                                  <label>Border</label>
                                  <input type="color" value={block.borderColor || '#e5e7eb'} onChange={(e)=>updateBlock(row.id, block.id, { borderColor: e.target.value })} className="w-8 h-6 border rounded"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs items-center">
                                  <label>Width</label>
                                  <select className="border rounded p-1 text-xs" value={block.width} onChange={(e)=>changeBlockWidth(row.id, block.id, Number(e.target.value) as 1|2|3)}>
                                    <option value={1}>1/3</option>
                                    <option value={2}>2/3</option>
                                    <option value={3}>Full</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="icon" variant={block.textAlignment==='left'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'left' })}><AlignLeft className="h-4 w-4"/></Button>
                                  <Button size="icon" variant={block.textAlignment==='center'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'center' })}><AlignCenter className="h-4 w-4"/></Button>
                                  <Button size="icon" variant={block.textAlignment==='right'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'right' })}><AlignRight className="h-4 w-4"/></Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs items-center">
                                  <label>Padding (px)</label>
                                  <input type="range" min={0} max={64} value={block.padding ?? 24} onChange={(e)=>updateBlock(row.id, block.id, { padding: parseInt(e.target.value) || 0 })} />
                                  <label>Spacing (px)</label>
                                  <input type="range" min={0} max={48} value={block.spacing ?? 12} onChange={(e)=>updateBlock(row.id, block.id, { spacing: parseInt(e.target.value) || 0 })} />
                                </div>
                              </div>
                            )}

                            {/* Content area */}
                            <div className={cn(block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center')} style={{ rowGap: (block.spacing ?? 12) + 'px', display: 'grid' }}>
                              {(block.content || []).map(item => (
                                <div key={item.id} className="group/item relative">
                                  <Button size="icon" variant="ghost" className="absolute -right-2 -top-2 z-20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 text-red-600" onClick={()=>deleteContentItem(row.id, block.id, item.id)}><Trash2 className="h-4 w-4"/></Button>
                              {item.type === 'headline' || item.type === 'subheading' || item.type === 'paragraph' ? (
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
                                      placeholder={item.type === 'headline' ? 'Your headline' : item.type === 'subheading' ? 'Your subheading' : 'Write your paragraph...'}
                                      className="w-full"
                                      inputClassName={cn('!border-0 !outline-none !ring-0 !shadow-none !bg-transparent !p-0 !m-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus:!shadow-none',
                                        block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center',
                                        item.type==='headline'?'!text-3xl !font-bold':'', item.type==='subheading'?'!text-xl !font-medium':'')}
                              variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0) : []}
                                      multiline={true}
                                    />
                                  ) : item.type === 'button' ? (
                                    <div className="flex items-center justify-center gap-2">
                                    <input className="border rounded px-2 py-1 text-sm" value={(item as any).content} onChange={(e)=>{
                                        const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, content: e.target.value } : ci) })) }))
                                        setDraftRows(next)
                                      }} onBlur={async()=>{ await saveRows(draftRows) }} />
                                      <input className="border rounded px-2 py-1 text-sm w-48" placeholder="https://..." value={(item as any).href || ''} onChange={(e)=>{
                                        const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, href: e.target.value } : ci) })) }))
                                        setDraftRows(next)
                                      }} onBlur={async()=>{ await saveRows(draftRows) }} />
                                    </div>
                                  ) : item.type === 'image' ? (
                                    <input className="border rounded px-2 py-1 text-sm w-full" placeholder="Image URL" value={(item as any).src || ''} onChange={(e)=>{
                                      const next = draftRows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, src: e.target.value } : ci) })) }))
                                      setDraftRows(next)
                                    }} onBlur={async()=>{ await saveRows(draftRows) }} />
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
                                          variables={(allSections || []).length ? getSimpleVariablesForBuilder(allSections!, section.order || 0) : []}
                                          multiline={false}
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
                      <div key={`ph-${row.id}-${start}`} className="rounded-lg border-2 border-dashed border-input/60 bg-muted/10 flex items-center justify-center min-h-[120px]"
                           style={{ gridColumnStart: String(start), gridColumnEnd: `span ${span}` }}>
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
            {/* Row drag handle removed */}
          </div>
        )
      })}

      {/* Global empty-state chooser for additional rows: show only when there are no rows */}
      {draftRows.length === 0 && (
        <div className="p-8 border-2 border-dashed rounded-2xl text-center bg-muted/10">
          <h3 className="text-lg font-medium text-foreground">Create a Content Card</h3>
          <p className="text-sm text-muted-foreground mt-1">Choose a width for your new content card</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <WidthOption onClick={async()=>{const id = await addRow(); await addBlock(id, 1)}} label="1/3 Column" caption="Narrow card" bars={[true,false,false]}/>
            <WidthOption onClick={async()=>{const id = await addRow(); await addBlock(id, 2)}} label="2/3 Column" caption="Wide card" bars={[true,true,false]}/>
            <WidthOption onClick={async()=>{const id = await addRow(); await addBlock(id, 3)}} label="Full Width" caption="Full row card" bars={[true,true,true]}/>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Cards will be arranged in a 3-column grid layout</div>
        </div>
      )}
    </div>
    {/* Floating Notion-style command palette */}
    {menuOpenFor && activeCardRect && propsOpenFor !== menuOpenFor && (
      <div ref={menuRef} className="fixed z-50" style={{ left: activeCardRect.left, top: activeCardRect.top + 8, transform: 'translateX(-50%)' }}>
        <Command className="rounded-lg border bg-popover shadow-md w-[520px]" style={{ maxWidth: activeCardSpan ? Math.max(240, Math.floor(activeCardRect.width / activeCardSpan)) : undefined }}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Basic blocks">
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'headline'); recalcActiveCardRect(menuOpenFor) }}><Heading1 /><span>Headline</span></UICommandItem>
              <UICommandItem onSelect={async ()=>{ const row = draftRows.find(r=> r.blocks.some(b=> b.id===menuOpenFor)); if (!row || !menuOpenFor) return; await addContentItem(row.id, menuOpenFor, 'subheading'); recalcActiveCardRect(menuOpenFor) }}><Heading2 /><span>Subheading</span></UICommandItem>
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
