// types/chat.ts - Updated with better metadata support

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isArchived: boolean
  userId?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
  attachments?: UploadedFile[]
  metadata?: {
    model?: string
    tokens?: number
    images?: string[]
    files?: string[]
    isEdited?: boolean
    originalContent?: string
    isStreaming?: boolean
    hasAttachments?: boolean  // Add this line
    [key: string]: unknown        // Add this for flexibility
  }
}

export interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
  uploadcareUuid?: string
}