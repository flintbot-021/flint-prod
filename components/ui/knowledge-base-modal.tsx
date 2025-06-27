'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, FileText, Upload, Trash2, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KnowledgeBaseEntry } from '@/lib/types/knowledge-base'

interface KnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  selectedEntries: string[]
  onSelectionChange: (entryIds: string[]) => void
}

interface NewEntry {
  title: string
  content: string
  type: 'text' | 'file'
  file?: File
}

export function KnowledgeBaseModal({
  isOpen,
  onClose,
  campaignId,
  selectedEntries,
  onSelectionChange
}: KnowledgeBaseModalProps) {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState<NewEntry>({
    title: '',
    content: '',
    type: 'text'
  })

  // Load existing knowledge base entries
  useEffect(() => {
    if (isOpen) {
      loadEntries()
    }
  }, [isOpen, campaignId])

  const loadEntries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to load knowledge base entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', newEntry.title)
      formData.append('content', newEntry.content)
      formData.append('content_type', newEntry.type)
      formData.append('campaign_id', campaignId)

      if (newEntry.file) {
        formData.append('file', newEntry.file)
      }

      const response = await fetch(`/api/knowledge-base`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await loadEntries()
        setNewEntry({ title: '', content: '', type: 'text' })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Failed to add knowledge base entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/knowledge-base?id=${entryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadEntries()
        // Remove from selection if it was selected
        onSelectionChange(selectedEntries.filter(id => id !== entryId))
      }
    } catch (error) {
      console.error('Failed to delete knowledge base entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSelection = (entryId: string) => {
    if (selectedEntries.includes(entryId)) {
      onSelectionChange(selectedEntries.filter(id => id !== entryId))
    } else {
      onSelectionChange([...selectedEntries, entryId])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewEntry(prev => ({
        ...prev,
        file,
        type: 'file',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Base</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add Entry Form */}
          {showAddForm && (
            <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant={newEntry.type === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewEntry(prev => ({ ...prev, type: 'text', file: undefined }))}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant={newEntry.type === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewEntry(prev => ({ ...prev, type: 'file' }))}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    File
                  </Button>
                </div>

                <div>
                  <Label htmlFor="entry-title">Title</Label>
                  <Input
                    id="entry-title"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a title for this knowledge base entry"
                    className="mt-1"
                  />
                </div>

                {newEntry.type === 'text' ? (
                  <div>
                    <Label htmlFor="entry-content">Content</Label>
                    <Textarea
                      id="entry-content"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter the knowledge base content here..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="entry-file">Upload File</Label>
                    <input
                      id="entry-file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".txt,.md,.pdf,.doc,.docx"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {newEntry.file && (
                      <div className="mt-2">
                        <Textarea
                          value={newEntry.content}
                          onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Add additional context or description for this file..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAddEntry}
                    disabled={!newEntry.title.trim() || (!newEntry.content.trim() && !newEntry.file) || isLoading}
                    size="sm"
                  >
                    Add Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewEntry({ title: '', content: '', type: 'text' })
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Add Entry Button */}
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="mb-6"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge Base Entry
            </Button>
          )}

          {/* Entries List */}
          {isLoading && entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading knowledge base entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No knowledge base entries yet. Add your first entry to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all border-2",
                    selectedEntries.includes(entry.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleToggleSelection(entry.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{entry.title}</h3>
                        <Badge variant={entry.content_type === 'document' ? 'default' : 'secondary'}>
                          {entry.content_type === 'document' ? (
                            <>
                              <Upload className="h-3 w-3 mr-1" />
                              File
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Text
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {entry.content}
                      </p>
                      {entry.metadata?.file_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          File: {entry.metadata.file_name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEntry(entry.id)
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedEntries.length} of {entries.length} entries selected
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 