// lib/file-processing.ts

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
}

/**
 * Extract text content from various file types
 */
export async function extractFileContent(file: UploadedFile): Promise<string | null> {
  try {
    switch (file.type) {
      case 'text/plain':
        return await fetchTextContent(file.url)
      
      case 'text/csv':
        const csvContent = await fetchTextContent(file.url)
        return csvContent ? `CSV file content:\n${csvContent}` : null
      
      case 'application/json':
        const jsonContent = await fetchTextContent(file.url)
        if (jsonContent) {
          try {
            const parsed = JSON.parse(jsonContent)
            return `JSON file content:\n${JSON.stringify(parsed, null, 2)}`
          } catch (e) {
            return `JSON file content (raw):\n${jsonContent}`
          }
        }
        return null
      
      case 'application/pdf':
        return `PDF document: ${file.originalName}\nNote: PDF content extraction requires additional setup. The file is available at: ${file.url}`
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return `Word document: ${file.originalName}\nNote: Word document content extraction requires additional setup. The file is available at: ${file.url}`
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return `Excel spreadsheet: ${file.originalName}\nNote: Excel content extraction requires additional setup. The file is available at: ${file.url}`
      
      default:
        if (file.type.startsWith('image/')) {
          return `Image file: ${file.originalName}\nImage URL: ${file.url}\nNote: This is an image that can be viewed at the provided URL.`
        }
        return `File: ${file.originalName} (${file.type})\nFile URL: ${file.url}`
    }
  } catch (error) {
    console.error(`Error processing file ${file.originalName}:`, error)
    return `Error processing file: ${file.originalName}`
  }
}

/**
 * Fetch text content from a URL
 */
async function fetchTextContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error fetching text content:', error)
    return null
  }
}

/**
 * Get file icon component name based on file type
 */
export function getFileIconType(mimeType: string): 'image' | 'pdf' | 'document' | 'spreadsheet' | 'text' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'document'
  if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return 'spreadsheet'
  if (mimeType.startsWith('text/')) return 'text'
  return 'unknown'
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'text/plain', 'text/csv', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword'
  ]
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Supported types: images, PDF, text files, Word documents, Excel spreadsheets.`
    }
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 10MB limit.`
    }
  }
  
  return { valid: true }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate file summary for AI context
 */
export function generateFileContext(files: UploadedFile[]): string {
  if (files.length === 0) return ''
  
  const fileDescriptions = files.map(file => {
    const type = getFileIconType(file.type)
    const size = formatFileSize(file.size)
    
    switch (type) {
      case 'image':
        return `📷 Image: ${file.originalName} (${size}) - Available for visual analysis at ${file.url}`
      case 'pdf':
        return `📄 PDF: ${file.originalName} (${size}) - Document available for reference at ${file.url}`
      case 'document':
        return `📝 Document: ${file.originalName} (${size}) - Word document available at ${file.url}`
      case 'spreadsheet':
        return `📊 Spreadsheet: ${file.originalName} (${size}) - Excel file available at ${file.url}`
      case 'text':
        return `📋 Text file: ${file.originalName} (${size}) - Content can be analyzed from ${file.url}`
      default:
        return `📎 File: ${file.originalName} (${size}) - ${file.type} available at ${file.url}`
    }
  })
  
  return `Attached files:\n${fileDescriptions.join('\n')}`
}

/**
 * Check if file type supports content extraction
 */
export function supportsContentExtraction(mimeType: string): boolean {
  return [
    'text/plain',
    'text/csv',
    'application/json'
  ].includes(mimeType)
}

/**
 * Get appropriate file preview component
 */
export function getFilePreview(file: UploadedFile) {
  if (file.type.startsWith('image/')) {
    return {
      type: 'image',
      component: 'img',
      src: file.url,
      alt: file.originalName
    }
  }
  
  return {
    type: 'file',
    component: 'link',
    href: file.url,
    text: file.originalName
  }
}