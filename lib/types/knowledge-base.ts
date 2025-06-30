export interface KnowledgeBaseEntry {
  id: string
  campaign_id: string
  user_id: string
  title: string
  content: string
  content_type: 'text' | 'document' | 'url'
  file_id?: string
  metadata?: {
    word_count?: number
    processing_status?: 'pending' | 'processed' | 'error'
    file_name?: string
    file_size?: number
    [key: string]: any
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface KnowledgeBaseSettings {
  enabled: boolean
  entries: string[] // Array of knowledge base entry IDs
}

export interface KnowledgeBaseModalData {
  textEntries: Array<{
    id: string
    title: string
    content: string
  }>
  fileEntries: Array<{
    id: string
    title: string
    fileName: string
    fileId: string
  }>
}

export interface CreateKnowledgeBaseEntryRequest {
  campaign_id: string
  title: string
  content: string
  content_type: 'text' | 'document'
  file_id?: string
  metadata?: Record<string, any>
}

export interface UpdateKnowledgeBaseEntryRequest {
  id: string
  title?: string
  content?: string
  is_active?: boolean
  metadata?: Record<string, any>
} 