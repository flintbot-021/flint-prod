'use client'

import React from 'react'

interface FloatingAddBarProps {
  onAdd: (width: 1 | 2 | 3) => void
}

export function FloatingAddBar({ onAdd }: FloatingAddBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3">
        <span className="text-xs text-muted-foreground">Add Another Card</span>
        <button className="border rounded px-3 py-1 text-xs" onClick={()=> onAdd(1)}>1/3</button>
        <button className="border rounded px-3 py-1 text-xs" onClick={()=> onAdd(2)}>2/3</button>
        <button className="border rounded px-3 py-1 text-xs" onClick={()=> onAdd(3)}>Full</button>
      </div>
    </div>
  )
}

export default FloatingAddBar


