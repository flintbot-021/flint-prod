'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Heading1, Heading2, Text, MousePointerClick, Image as ImageIcon, ListOrdered, List, Minus } from 'lucide-react'

interface ContentToolbarProps {
  onAdd: (type: 'headline' | 'subheading' | 'paragraph' | 'button' | 'image' | 'numbered-list' | 'bullet-list' | 'divider') => void
}

export function ContentToolbar({ onAdd }: ContentToolbarProps) {
  const Item = ({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>, label: string, onClick: () => void }) => (
    <Button size="sm" variant="outline" onClick={onClick} className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </Button>
  )

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-card border border-border rounded-full px-3 py-2 shadow-sm max-w-[90vw]">
      <Item icon={Heading1} label="Headline" onClick={() => onAdd('headline')} />
      <Item icon={Heading2} label="Subheading" onClick={() => onAdd('subheading')} />
      <Item icon={Text} label="Paragraph" onClick={() => onAdd('paragraph')} />
      <Item icon={MousePointerClick} label="Button" onClick={() => onAdd('button')} />
      <Item icon={ImageIcon} label="Image" onClick={() => onAdd('image')} />
      <Item icon={ListOrdered} label="Numbered" onClick={() => onAdd('numbered-list')} />
      <Item icon={List} label="Bulleted" onClick={() => onAdd('bullet-list')} />
      <Item icon={Minus} label="Divider" onClick={() => onAdd('divider')} />
    </div>
  )
}

export default ContentToolbar


