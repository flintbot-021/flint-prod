/**
 * File Content Extractor
 * 
 * Utilities for extracting text content from uploaded files for AI processing.
 * Supports various file types including PDFs, documents, images with OCR, etc.
 */

export interface FileContentResult {
  success: boolean
  content?: string
  error?: string
  isImage?: boolean
  base64Data?: string
  mimeType?: string
  metadata?: {
    fileType: string
    fileName: string
    extractionMethod: string
    pageCount?: number
    wordCount?: number
  }
}

/**
 * Extract text content from a File object (server-side)
 */
export async function extractFileContentFromBuffer(
  fileBuffer: ArrayBuffer,
  fileName: string,
  fileType: string
): Promise<FileContentResult> {
  try {
    console.log(`📄 Extracting content from ${fileName} (${fileType})`)
    
    if (fileType === 'text/plain') {
      return await extractTextFileFromBuffer(fileBuffer, fileName)
    }
    
    if (fileType === 'application/pdf') {
      return await extractPdfFileFromBuffer(fileBuffer, fileName)
    }
    
    if (fileType.startsWith('image/')) {
      return await extractImageFileFromBuffer(fileBuffer, fileName, fileType)
    }
    
    if (fileType.includes('document') || fileType.includes('word')) {
      return await extractDocumentFileFromBuffer(fileBuffer, fileName, fileType)
    }
    
    // Fallback: try to read as text
    return await extractTextFileFromBuffer(fileBuffer, fileName)
    
  } catch (error) {
    console.error('❌ File content extraction failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Extract text content from a file URL
 */
export async function extractFileContent(
  fileUrl: string,
  fileName: string,
  fileType: string
): Promise<FileContentResult> {
  try {
    console.log(`📄 Extracting content from ${fileName} (${fileType})`)
    
    // For now, we'll implement basic text extraction
    // In the future, this can be enhanced with:
    // - PDF parsing (pdf-parse, pdf2pic + OCR)
    // - Image OCR (Tesseract.js, Google Vision API)
    // - Document parsing (mammoth for .docx, etc.)
    
    if (fileType === 'text/plain') {
      return await extractTextFile(fileUrl, fileName)
    }
    
    if (fileType === 'application/pdf') {
      return await extractPdfFile(fileUrl, fileName)
    }
    
    if (fileType.startsWith('image/')) {
      return await extractImageFile(fileUrl, fileName, fileType)
    }
    
    if (fileType.includes('document') || fileType.includes('word')) {
      return await extractDocumentFile(fileUrl, fileName, fileType)
    }
    
    // Fallback: try to read as text
    return await extractTextFile(fileUrl, fileName)
    
  } catch (error) {
    console.error('❌ File content extraction failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }
  }
}

/**
 * Extract content from plain text files (from buffer)
 */
async function extractTextFileFromBuffer(fileBuffer: ArrayBuffer, fileName: string): Promise<FileContentResult> {
  try {
    const content = new TextDecoder('utf-8').decode(fileBuffer)
    
    return {
      success: true,
      content,
      metadata: {
        fileType: 'text/plain',
        fileName,
        extractionMethod: 'direct_text',
        wordCount: content.split(/\s+/).length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text extraction failed'
    }
  }
}

/**
 * Extract content from plain text files
 */
async function extractTextFile(fileUrl: string, fileName: string): Promise<FileContentResult> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }
    
    const content = await response.text()
    
    return {
      success: true,
      content,
      metadata: {
        fileType: 'text/plain',
        fileName,
        extractionMethod: 'direct_text',
        wordCount: content.split(/\s+/).length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text extraction failed'
    }
  }
}

/**
 * Extract content from PDF files (from buffer)
 * Note: This is a placeholder implementation
 */
async function extractPdfFileFromBuffer(fileBuffer: ArrayBuffer, fileName: string): Promise<FileContentResult> {
  // TODO: Implement PDF parsing with pdf-parse or similar
  // For now, return a placeholder that indicates PDF content is available
  return {
    success: true,
    content: `[PDF CONTENT from ${fileName}]\n\nThis PDF file has been uploaded and is available for analysis. PDF text extraction will be implemented in a future update. For now, the AI knows that this is a PDF document that the user has provided.`,
    metadata: {
      fileType: 'application/pdf',
      fileName,
      extractionMethod: 'placeholder',
      pageCount: 1
    }
  }
}

/**
 * Extract content from PDF files
 * Note: This is a placeholder implementation
 */
async function extractPdfFile(fileUrl: string, fileName: string): Promise<FileContentResult> {
  // TODO: Implement PDF parsing
  // For now, return a placeholder that indicates PDF content is available
  return {
    success: true,
    content: `[PDF CONTENT from ${fileName}]\n\nThis PDF file has been uploaded and is available for analysis. PDF text extraction will be implemented in a future update. For now, the AI knows that this is a PDF document that the user has provided.`,
    metadata: {
      fileType: 'application/pdf',
      fileName,
      extractionMethod: 'placeholder',
      pageCount: 1
    }
  }
}

/**
 * Extract content from image files - convert to base64 for OpenAI Vision API
 */
async function extractImageFileFromBuffer(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<FileContentResult> {
  try {
    // Convert buffer to base64 for OpenAI Vision API
    const uint8Array = new Uint8Array(fileBuffer)
    const base64String = Buffer.from(uint8Array).toString('base64')
    
    return {
      success: true,
      isImage: true,
      base64Data: base64String,
      mimeType: fileType,
      content: `[IMAGE: ${fileName}]`, // Fallback text description
      metadata: {
        fileType,
        fileName,
        extractionMethod: 'base64_conversion'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image processing failed'
    }
  }
}

/**
 * Extract content from document files (.docx, .doc, etc.) (from buffer)
 * Note: This is a placeholder implementation
 */
async function extractDocumentFileFromBuffer(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<FileContentResult> {
  // TODO: Implement document parsing with mammoth.js for .docx or similar
  // For now, return a placeholder that indicates document content is available
  return {
    success: true,
    content: `[DOCUMENT CONTENT from ${fileName}]\n\nThis document file has been uploaded and is available for analysis. Document text extraction will be implemented in a future update. For now, the AI knows that this is a document file (${fileType}) that the user has provided.`,
    metadata: {
      fileType,
      fileName,
      extractionMethod: 'placeholder'
    }
  }
}

/**
 * Extract content from image files using OCR
 * Note: This is a placeholder implementation
 */
async function extractImageFile(fileUrl: string, fileName: string, fileType: string): Promise<FileContentResult> {
  // TODO: Implement OCR extraction
  // For now, return a placeholder that indicates image content is available
  return {
    success: true,
    content: `[IMAGE CONTENT from ${fileName}]\n\nThis image file has been uploaded and is available for analysis. OCR text extraction will be implemented in a future update. For now, the AI knows that this is an image file (${fileType}) that the user has provided.`,
    metadata: {
      fileType,
      fileName,
      extractionMethod: 'placeholder'
    }
  }
}

/**
 * Extract content from document files (.docx, .doc, etc.)
 * Note: This is a placeholder implementation
 */
async function extractDocumentFile(fileUrl: string, fileName: string, fileType: string): Promise<FileContentResult> {
  // TODO: Implement document parsing
  // For now, return a placeholder that indicates document content is available
  return {
    success: true,
    content: `[DOCUMENT CONTENT from ${fileName}]\n\nThis document file has been uploaded and is available for analysis. Document text extraction will be implemented in a future update. For now, the AI knows that this is a document file (${fileType}) that the user has provided.`,
    metadata: {
      fileType,
      fileName,
      extractionMethod: 'placeholder'
    }
  }
}

/**
 * Extract content from multiple files and combine
 */
export async function extractMultipleFileContents(
  files: Array<{ url: string; name: string; type: string }>
): Promise<Record<string, FileContentResult>> {
  const results: Record<string, FileContentResult> = {}
  
  for (const file of files) {
    const result = await extractFileContent(file.url, file.name, file.type)
    results[file.name] = result
  }
  
  return results
}

/**
 * Combine multiple file contents into a single string for AI processing
 */
export function combineFileContents(
  fileResults: Record<string, FileContentResult>,
  separator: string = '\n\n---\n\n'
): string {
  const contents: string[] = []
  
  Object.entries(fileResults).forEach(([fileName, result]) => {
    if (result.success && result.content) {
      contents.push(`File: ${fileName}\n${result.content}`)
    } else {
      contents.push(`File: ${fileName}\n[Error: ${result.error || 'Could not extract content'}]`)
    }
  })
  
  return contents.join(separator)
} 