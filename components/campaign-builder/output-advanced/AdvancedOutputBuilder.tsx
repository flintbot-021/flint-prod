'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Trash2, MoveHorizontal, ArrowLeftRight, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { VariableSuggestionDropdown } from '@/components/ui/variable-suggestion-dropdown'
import { VariableInterpolator } from '@/lib/utils/variable-interpolator'

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
}

// Lightweight ID helper
const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export function AdvancedOutputBuilder({ section, isPreview = false, onUpdate, className }: AdvancedOutputBuilderProps) {
  const settings: any = section.settings || {}
  const rows: Row[] = settings.rows || []
  const defaultBlock = settings.defaultBlock || {}

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

  // Preview uses variable interpolator to show a basic rendering
  const previewHtml = useMemo(() => {
    if (!isPreview) return null
    const interpolator = new VariableInterpolator()
    // Simple variable map; builder preview doesn’t have live inputs, so keep empty
    const variables: Record<string, any> = {}

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
      const colSpan = b.width
      const colStart = b.startPosition
      const style = `padding:${b.padding ?? 24}px;` + (b.backgroundColor ? `background:${b.backgroundColor};` : '') + (b.textColor ? `color:${b.textColor};` : '') + (b.borderColor ? `border:1px solid ${b.borderColor};` : '')
      return `<div class="col-span-${colSpan} col-start-${colStart} rounded-lg" style="${style}">${b.content.map(renderItem).join('')}</div>`
    }

    const html = rows.map(r => `<div class="grid grid-cols-3 gap-4">${r.blocks.map(renderBlock).join('')}</div>`).join('')
    return html
  }, [isPreview, rows])

  const addFirstBlock = async (width: 1 | 2 | 3) => {
    const newRows: Row[] = rows.length ? [...rows] : [{ id: uid('row'), blocks: [] }]
    const startPosition: 1 | 2 | 3 = 1
    newRows[0].blocks.push({ id: uid('block'), width, startPosition, content: [], ...defaultBlock })
    await saveRows(newRows)
  }

  const addRow = async () => {
    const next = [...rows, { id: uid('row'), blocks: [] }]
    await saveRows(next)
  }

  const removeRow = async (rowId: string) => {
    const next = rows.filter(r => r.id !== rowId)
    await saveRows(next)
  }

  const addBlock = async (rowId: string, width: 1 | 2 | 3) => {
    const next = rows.map(r => ({ ...r, blocks: [...r.blocks] }))
    const row = next.find(r => r.id === rowId)!
    // Find first valid start position
    const starts: (1|2|3)[] = [1,2,3]
    const start = starts.find(s => canPlace(row, s as 1|2|3, width)) as 1|2|3 | undefined
    if (!start) return // no space
    row.blocks.push({ id: uid('block'), width, startPosition: start, content: [], ...defaultBlock })
    await saveRows(next)
  }

  const deleteBlock = async (rowId: string, blockId: string) => {
    const next = rows.map(r => ({ ...r, blocks: r.blocks.filter(b => b.id !== blockId) }))
    await saveRows(next)
  }

  const updateBlock = async (rowId: string, blockId: string, updates: Partial<Block>) => {
    const next = rows.map(r => {
      if (r.id !== rowId) return r
      return {
        ...r,
        blocks: r.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
      }
    })
    await saveRows(next)
  }

  const moveBlock = async (rowId: string, blockId: string, delta: number) => {
    const row = rows.find(r => r.id === rowId)
    if (!row) return
    const block = row.blocks.find(b => b.id === blockId)
    if (!block) return
    const target = (block.startPosition + delta) as 1|2|3
    if (canPlace(row, target, block.width, block.id)) {
      await updateBlock(rowId, blockId, { startPosition: target })
    }
  }

  const changeBlockWidth = async (rowId: string, blockId: string, width: 1|2|3) => {
    const row = rows.find(r => r.id === rowId)
    if (!row) return
    const block = row.blocks.find(b => b.id === blockId)
    if (!block) return
    if (canPlace(row, block.startPosition, width, block.id)) {
      await updateBlock(rowId, blockId, { width })
    }
  }

  // Content item helpers
  const addContentItem = async (rowId: string, blockId: string, type: ContentItem['type']) => {
    const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b })) }))
    const row = next.find(r => r.id === rowId)!
    const block = row.blocks.find(b => b.id === blockId)!
    const id = uid('item')
    const newItem: any = { id, type }
    if (type === 'headline' || type === 'subheading' || type === 'paragraph') newItem.content = ''
    if (type === 'button') { newItem.content = 'Button'; newItem.href = '' }
    if (type === 'numbered-list' || type === 'bullet-list') newItem.items = ['']
    block.content = [...(block.content || []), newItem]
    await saveRows(next)
  }

  const deleteContentItem = async (rowId: string, blockId: string, itemId: string) => {
    const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.filter(ci => ci.id !== itemId) })) }))
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
      <div className={cn('p-8 border-2 border-dashed rounded-xl text-center', className)}>
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground mb-6">
            <LayoutGrid className="h-5 w-5" />
            <span className="font-medium">Create a Content Card</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => addFirstBlock(1)} className="border rounded-lg p-6 hover:bg-accent">
              <div className="text-sm font-medium">1/3 Column</div>
              <div className="text-xs text-muted-foreground">Narrow card</div>
            </button>
            <button onClick={() => addFirstBlock(2)} className="border rounded-lg p-6 hover:bg-accent">
              <div className="text-sm font-medium">2/3 Column</div>
              <div className="text-xs text-muted-foreground">Wide card</div>
            </button>
            <button onClick={() => addFirstBlock(3)} className="border rounded-lg p-6 hover:bg-accent">
              <div className="text-sm font-medium">Full Width</div>
              <div className="text-xs text-muted-foreground">Full row card</div>
            </button>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">Cards will be arranged in a 3-column grid layout</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-4 space-y-6', className)}>
      {/* Row controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Advanced Output Layout</div>
        <Button size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1"/>Add Row</Button>
      </div>

      {rows.map(row => (
        <div key={row.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Row</div>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => addBlock(row.id, 1)}>+ 1/3</Button>
              <Button size="sm" variant="outline" onClick={() => addBlock(row.id, 2)}>+ 2/3</Button>
              <Button size="sm" variant="outline" onClick={() => addBlock(row.id, 3)}>+ Full</Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeRow(row.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {row.blocks.map(block => (
              <div key={block.id} className={cn(`col-span-${block.width} col-start-${block.startPosition}`, 'rounded-lg border p-4 space-y-3')} style={{background:block.backgroundColor,color:block.textColor,borderColor:block.borderColor}}>
                {/* Block header */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Block • width {block.width}/3 • start {block.startPosition}</div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" title="Move left" onClick={() => moveBlock(row.id, block.id, -1)}><ArrowLeftRight className="h-4 w-4 -scale-x-100"/></Button>
                    <Button size="icon" variant="ghost" title="Move right" onClick={() => moveBlock(row.id, block.id, +1)}><ArrowLeftRight className="h-4 w-4"/></Button>
                    <select className="text-xs border rounded p-1" value={block.width} onChange={(e)=>changeBlockWidth(row.id, block.id, Number(e.target.value) as 1|2|3)}>
                      <option value={1}>1/3</option>
                      <option value={2}>2/3</option>
                      <option value={3}>Full</option>
                    </select>
                    <Button size="icon" variant="ghost" className="text-red-600" title="Delete block" onClick={() => deleteBlock(row.id, block.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>

                {/* Style controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label>BG <input type="color" value={block.backgroundColor || '#ffffff'} onChange={(e)=>updateBlock(row.id, block.id, { backgroundColor: e.target.value })} className="w-8 h-6 border rounded"/></label>
                  <label>Text <input type="color" value={block.textColor || '#0f172a'} onChange={(e)=>updateBlock(row.id, block.id, { textColor: e.target.value })} className="w-8 h-6 border rounded"/></label>
                  <label>Border <input type="color" value={block.borderColor || '#e5e7eb'} onChange={(e)=>updateBlock(row.id, block.id, { borderColor: e.target.value })} className="w-8 h-6 border rounded"/></label>
                  <label>Padding <input type="number" min={0} max={64} value={block.padding ?? 24} onChange={(e)=>updateBlock(row.id, block.id, { padding: parseInt(e.target.value) || 0 })} className="w-16 border rounded p-1"/></label>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant={block.textAlignment==='left'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'left' })}><AlignLeft className="h-4 w-4"/></Button>
                    <Button size="icon" variant={block.textAlignment==='center'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'center' })}><AlignCenter className="h-4 w-4"/></Button>
                    <Button size="icon" variant={block.textAlignment==='right'?'default':'outline'} onClick={()=>updateBlock(row.id, block.id, { textAlignment: 'right' })}><AlignRight className="h-4 w-4"/></Button>
                  </div>
                </div>

                {/* Content toolbox */}
                <div className="flex items-center flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'headline')}>H1</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'subheading')}>H2</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'paragraph')}>Paragraph</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'button')}>Button</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'image')}>Image</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'numbered-list')}>1.</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'bullet-list')}>•</Button>
                  <Button size="sm" variant="outline" onClick={()=>addContentItem(row.id, block.id, 'divider')}>Divider</Button>
                </div>

                {/* Content items */}
                <div className={cn(block.textAlignment === 'left' ? 'text-left' : block.textAlignment === 'right' ? 'text-right' : 'text-center', 'space-y-3')}>
                  {(block.content || []).map(item => (
                    <div key={item.id} className="group relative">
                      <Button size="icon" variant="ghost" className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 text-red-600" onClick={()=>deleteContentItem(row.id, block.id, item.id)}><Trash2 className="h-4 w-4"/></Button>
                      {item.type === 'headline' || item.type === 'subheading' || item.type === 'paragraph' ? (
                        <VariableSuggestionDropdown
                          value={(item as any).content || ''}
                          onChange={()=>{}}
                          onSave={async (v)=>{
                            const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, content: v } : ci) })) }))
                            await saveRows(next)
                          }}
                          autoSave={true}
                          placeholder={item.type === 'headline' ? 'Your headline (supports @variables)' : item.type === 'subheading' ? 'Your subheading' : 'Write your paragraph...'}
                          className="w-full"
                          inputClassName={cn('!border-0 !outline-none !ring-0 !shadow-none !bg-transparent !p-0 !m-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus:!shadow-none', item.type==='headline'?'!text-3xl !font-bold':'', item.type==='subheading'?'!text-xl !font-medium':'')}
                          variables={[]}
                          multiline={item.type !== 'headline'}
                        />
                      ) : item.type === 'button' ? (
                        <div className="flex items-center justify-center gap-2">
                          <input className="border rounded px-2 py-1 text-sm" value={(item as any).content} onChange={async (e)=>{
                            const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, content: e.target.value } : ci) })) }))
                            await saveRows(next)
                          }} />
                          <input className="border rounded px-2 py-1 text-sm w-48" placeholder="https://..." value={(item as any).href || ''} onChange={async (e)=>{
                            const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, href: e.target.value } : ci) })) }))
                            await saveRows(next)
                          }} />
                        </div>
                      ) : item.type === 'image' ? (
                        <input className="border rounded px-2 py-1 text-sm w-full" placeholder="Image URL" value={(item as any).src || ''} onChange={async (e)=>{
                          const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, src: e.target.value } : ci) })) }))
                          await saveRows(next)
                        }} />
                      ) : item.type === 'divider' ? (
                        <hr className="border-input" />
                      ) : (item.type === 'numbered-list' || item.type === 'bullet-list') ? (
                        <div className="space-y-2">
                          {((item as any).items || []).map((val: string, idx: number) => (
                            <VariableSuggestionDropdown
                              key={idx}
                              value={val}
                              onChange={()=>{}}
                              onSave={async (v)=>{
                                const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, items: (ci as any).items.map((x:string,i:number)=> i===idx? v : x) } : ci) })) }))
                                await saveRows(next)
                              }}
                              autoSave={true}
                              placeholder="List item..."
                              className="w-full"
                              inputClassName="!border-0 !outline-none !ring-0 !shadow-none !bg-transparent"
                              variables={[]}
                              multiline={false}
                            />
                          ))}
                          <Button size="sm" variant="outline" onClick={async ()=>{
                            const next = rows.map(r => ({ ...r, blocks: r.blocks.map(b => ({ ...b, content: b.content.map(ci => ci.id===item.id? { ...ci, items: ([...(ci as any).items || [], '']) } : ci) })) }))
                            await saveRows(next)
                          }}>Add item</Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdvancedOutputBuilder


