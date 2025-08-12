'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CampaignSection } from '@/lib/types/campaign-builder'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Trash2, ArrowLeftRight, AlignLeft, AlignCenter, AlignRight, SlidersHorizontal } from 'lucide-react'
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
  const [toolbarOpenFor, setToolbarOpenFor] = useState<string | null>(null)
  const [propsOpenFor, setPropsOpenFor] = useState<string | null>(null)
  const [draftRows, setDraftRows] = useState<Row[]>(rows)

  // Keep local draftRows in sync with external settings
  useEffect(() => {
    setDraftRows(rows)
  }, [rows])

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
    const newRows: Row[] = draftRows.length ? [...draftRows] : [{ id: uid('row'), blocks: [] }]
    const startPosition: 1 | 2 | 3 = 1
    newRows[0].blocks.push({ id: uid('block'), width, startPosition, content: [], ...defaultBlock })
    setDraftRows(newRows)
    await saveRows(newRows)
  }

  const addRow = async () => {
    const next = [...draftRows, { id: uid('row'), blocks: [] }]
    setDraftRows(next)
    await saveRows(next)
  }

  const removeRow = async (rowId: string) => {
    const next = draftRows.filter(r => r.id !== rowId)
    setDraftRows(next)
    await saveRows(next)
  }

  const addBlock = async (rowId: string, width: 1 | 2 | 3) => {
    const next = draftRows.map(r => ({ ...r, blocks: [...r.blocks] }))
    const row = next.find(r => r.id === rowId)!
    // Find first valid start position
    const starts: (1|2|3)[] = [1,2,3]
    const start = starts.find(s => canPlace(row, s as 1|2|3, width)) as 1|2|3 | undefined
    if (!start) return // no space
    row.blocks.push({ id: uid('block'), width, startPosition: start, content: [], ...defaultBlock })
    setDraftRows(next)
    await saveRows(next)
  }

  const deleteBlock = async (rowId: string, blockId: string) => {
    const next = draftRows.map(r => ({ ...r, blocks: r.blocks.filter(b => b.id !== blockId) }))
    setDraftRows(next)
    await saveRows(next)
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
    setToolbarOpenFor(null)
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
          <div key={row.id} className="space-y-3">
            {/* Grid + add-another side panel */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Left: the 3-col grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 gap-4">
                  {row.blocks.map(block => (
                    <div key={block.id} className={cn(`col-span-${block.width} col-start-${block.startPosition}`, 'rounded-lg border p-4 relative')} style={{background:block.backgroundColor,color:block.textColor,borderColor:block.borderColor, outline: block.outlineColor ? `2px solid ${block.outlineColor}` : undefined}}>
                      {/* Top-right icons */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80">
                        <Button size="icon" variant="ghost" title="Properties" onClick={()=> setPropsOpenFor(propsOpenFor===block.id? null : block.id)}><SlidersHorizontal className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" title="Move left" onClick={() => moveBlock(row.id, block.id, -1)}><ArrowLeftRight className="h-4 w-4 -scale-x-100"/></Button>
                        <Button size="icon" variant="ghost" title="Move right" onClick={() => moveBlock(row.id, block.id, +1)}><ArrowLeftRight className="h-4 w-4"/></Button>
                        <select className="text-xs border rounded p-1" value={block.width} onChange={(e)=>changeBlockWidth(row.id, block.id, Number(e.target.value) as 1|2|3)}>
                          <option value={1}>1/3</option>
                          <option value={2}>2/3</option>
                          <option value={3}>Full</option>
                        </select>
                        <Button size="icon" variant="ghost" className="text-red-600" title="Delete" onClick={() => deleteBlock(row.id, block.id)}><Trash2 className="h-4 w-4"/></Button>
                      </div>

                      {/* Properties panel */}
                      {propsOpenFor === block.id && (
                        <div className="absolute z-10 right-2 top-10 w-80 bg-popover border border-border rounded-lg shadow-xl p-4 space-y-3">
                          <div className="text-sm font-medium">Customize</div>
                          <div className="grid grid-cols-2 gap-3 text-xs items-center">
                            <label>Background</label>
                            <input type="color" value={block.backgroundColor || '#ffffff'} onChange={(e)=>updateBlock(row.id, block.id, { backgroundColor: e.target.value })} className="w-8 h-6 border rounded"/>
                            <label>Text</label>
                            <input type="color" value={block.textColor || '#0f172a'} onChange={(e)=>updateBlock(row.id, block.id, { textColor: e.target.value })} className="w-8 h-6 border rounded"/>
                            <label>Border</label>
                            <input type="color" value={block.borderColor || '#e5e7eb'} onChange={(e)=>updateBlock(row.id, block.id, { borderColor: e.target.value })} className="w-8 h-6 border rounded"/>
                            <label>Outline</label>
                            <input type="color" value={block.outlineColor || '#000000'} onChange={(e)=>updateBlock(row.id, block.id, { outlineColor: e.target.value })} className="w-8 h-6 border rounded"/>
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
                          <div key={item.id} className="group relative">
                            <Button size="icon" variant="ghost" className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 text-red-600" onClick={()=>deleteContentItem(row.id, block.id, item.id)}><Trash2 className="h-4 w-4"/></Button>
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
                                placeholder={item.type === 'headline' ? 'Your headline (supports @variables)' : item.type === 'subheading' ? 'Your subheading' : 'Write your paragraph...'}
                                className="w-full"
                                inputClassName={cn('!border-0 !outline-none !ring-0 !shadow-none !bg-transparent !p-0 !m-0 focus:!border-0 focus:!outline-none focus:!ring-0 focus:!shadow-none', item.type==='headline'?'!text-3xl !font-bold':'', item.type==='subheading'?'!text-xl !font-medium':'')}
                                variables={[]}
                                multiline={item.type !== 'headline'}
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
                                    inputClassName="!border-0 !outline-none !ring-0 !shadow-none !bg-transparent"
                                    variables={[]}
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
                          <div className="border-2 border-dashed rounded-xl py-10 text-center text-muted-foreground bg-background/40">
                            <div>Click below to add content</div>
                            <div className="mt-3">
                              <Button size="icon" variant="outline" className="rounded-full h-10 w-10" onClick={()=> setToolbarOpenFor(block.id)}>
                                <Plus className="h-5 w-5"/>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content toolbar (revealed by +) */}
                      {toolbarOpenFor === block.id && (
                        <div className="mt-3 border rounded-lg p-3 bg-card/60 flex flex-wrap items-center gap-3">
                          <ToolbarButton label="Headline" onClick={()=>addContentItem(row.id, block.id, 'headline')}/>
                          <ToolbarButton label="Subheading" onClick={()=>addContentItem(row.id, block.id, 'subheading')}/>
                          <ToolbarButton label="Paragraph" onClick={()=>addContentItem(row.id, block.id, 'paragraph')}/>
                          <ToolbarButton label="Button" onClick={()=>addContentItem(row.id, block.id, 'button')}/>
                          <ToolbarButton label="Image" onClick={()=>addContentItem(row.id, block.id, 'image')}/>
                          <ToolbarButton label="Numbered List" onClick={()=>addContentItem(row.id, block.id, 'numbered-list')}/>
                          <ToolbarButton label="Bullet List" onClick={()=>addContentItem(row.id, block.id, 'bullet-list')}/>
                          <ToolbarButton label="Divider" onClick={()=>addContentItem(row.id, block.id, 'divider')}/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Add Another Card panel */}
              <div className="lg:col-span-1">
                <div className="h-full border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center bg-muted/10">
                  <div className="text-sm font-medium text-foreground">Add Another Card</div>
                  <div className="text-xs text-muted-foreground mb-3">Choose width for this row</div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <button className="border rounded-md py-2 text-xs" onClick={()=> addBlock(row.id, 1)}>1/3</button>
                    <button className="border rounded-md py-2 text-xs" onClick={()=> addBlock(row.id, 2)}>2/3</button>
                    <button className="border rounded-md py-2 text-xs" onClick={async()=> { const ok = canPlace(row, 1, 3); if (ok) await addBlock(row.id, 3); else { await addRow(); const newRowId = (await (async ()=> rows[rows.length-1]?.id)()) || row.id; await addBlock(newRowId, 3) } }}>Full</button>
                  </div>
                  {remaining <= 0 && (
                    <div className="text-[11px] text-muted-foreground mt-2">Row full</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Global empty-state chooser for additional rows */}
      <div className="p-8 border-2 border-dashed rounded-2xl text-center bg-muted/10">
        <h3 className="text-lg font-medium text-foreground">Create a Content Card</h3>
        <p className="text-sm text-muted-foreground mt-1">Choose a width for your new content card</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <WidthOption onClick={async()=>{await addRow(); await addBlock(rows[rows.length-1]?.id || uid('row'), 1)}} label="1/3 Column" caption="Narrow card" bars={[true,false,false]}/>
          <WidthOption onClick={async()=>{await addRow(); await addBlock(rows[rows.length-1]?.id || uid('row'), 2)}} label="2/3 Column" caption="Wide card" bars={[true,true,false]}/>
          <WidthOption onClick={async()=>{await addRow(); await addBlock(rows[rows.length-1]?.id || uid('row'), 3)}} label="Full Width" caption="Full row card" bars={[true,true,true]}/>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">Cards will be arranged in a 3-column grid layout</div>
      </div>
    </div>
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


