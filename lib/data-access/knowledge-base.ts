import { 
  getSupabaseClient,
  withErrorHandling,
  requireAuth,
  isValidUUID
} from './base'
import { 
  KnowledgeBaseEntry, 
  CreateKnowledgeBaseEntryRequest, 
  UpdateKnowledgeBaseEntryRequest 
} from '@/lib/types/knowledge-base'
import type { DatabaseResult } from '@/lib/types/database'

export async function getKnowledgeBaseEntries(campaignId: string): Promise<DatabaseResult<KnowledgeBaseEntry[]>> {
  if (!isValidUUID(campaignId)) {
    return {
      success: false,
      error: 'Invalid campaign ID format'
    }
  }

  await requireAuth()
  const supabase = await getSupabaseClient()
  
  return withErrorHandling(async () => {
    return await supabase
      .from('knowledge_base')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  })
}

export async function createKnowledgeBaseEntry(
  entry: CreateKnowledgeBaseEntryRequest
): Promise<DatabaseResult<KnowledgeBaseEntry>> {
  const userId = await requireAuth()
  const supabase = await getSupabaseClient()

  return withErrorHandling(async () => {
    return await supabase
      .from('knowledge_base')
      .insert({
        ...entry,
        user_id: userId,
        is_active: true
      })
      .select()
      .single()
  })
}

export async function updateKnowledgeBaseEntry(
  entry: UpdateKnowledgeBaseEntryRequest
): Promise<DatabaseResult<KnowledgeBaseEntry>> {
  if (!isValidUUID(entry.id)) {
    return {
      success: false,
      error: 'Invalid entry ID format'
    }
  }

  await requireAuth()
  const supabase = await getSupabaseClient()

  return withErrorHandling(async () => {
    return await supabase
      .from('knowledge_base')
      .update({
        title: entry.title,
        content: entry.content,
        is_active: entry.is_active,
        metadata: entry.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', entry.id)
      .select()
      .single()
  })
}

export async function deleteKnowledgeBaseEntry(entryId: string): Promise<DatabaseResult<boolean>> {
  if (!isValidUUID(entryId)) {
    return {
      success: false,
      error: 'Invalid entry ID format'
    }
  }

  await requireAuth()
  const supabase = await getSupabaseClient()

  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', entryId)

    return { data: !error, error }
  })
}

export async function getKnowledgeBaseContent(entryIds: string[]): Promise<string> {
  if (!entryIds.length) return ''

  try {
    await requireAuth()
    const supabase = await getSupabaseClient()
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('title, content, content_type')
      .in('id', entryIds)
      .eq('is_active', true)

    if (error || !data?.length) {
      console.error('Error fetching knowledge base content:', error)
      return ''
    }

    // Combine all knowledge base entries into a single context string
    const contextParts = data.map((entry: any) => {
      return `**${entry.title}**\n${entry.content}`
    })

    return contextParts.join('\n\n---\n\n')
  } catch (error) {
    console.error('Error in getKnowledgeBaseContent:', error)
    return ''
  }
}

export async function getKnowledgeBaseForAI(campaignId: string): Promise<{
  textContent: string
  files: Array<{ url: string; type: string; name: string }>
}> {
  if (!isValidUUID(campaignId)) {
    return { textContent: '', files: [] }
  }

  try {
    await requireAuth()
    const supabase = await getSupabaseClient()
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('title, content, content_type, metadata, file_id')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error || !data?.length) {
      console.error('Error fetching knowledge base for AI:', error)
      return { textContent: '', files: [] }
    }

    const textParts: string[] = []
    const files: Array<{ url: string; type: string; name: string }> = []

    for (const entry of data) {
      // Add text content
      textParts.push(`**${entry.title}**\n${entry.content}`)
      
      // Check if entry has a file with URL for AI processing
      if (entry.content_type === 'document' && entry.metadata?.file_url) {
        const fileType = entry.metadata.file_type || 'application/octet-stream'
        const fileName = entry.metadata.original_filename || entry.title
        
        // Only include files that AI can process (images, PDFs, etc.)
        const supportedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'text/plain', 'text/markdown', 'text/csv'
        ]
        
        if (supportedTypes.some(type => fileType.includes(type)) || 
            fileName.match(/\.(jpg|jpeg|png|gif|webp|pdf|txt|md|csv)$/i)) {
          files.push({
            url: entry.metadata.file_url,
            type: fileType,
            name: fileName
          })
        }
      }
    }

    return {
      textContent: textParts.join('\n\n---\n\n'),
      files
    }
  } catch (error) {
    console.error('Error in getKnowledgeBaseForAI:', error)
    return { textContent: '', files: [] }
  }
} 