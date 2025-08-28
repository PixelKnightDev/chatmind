'use client'

import { MessageItem } from './message-item'

// Use the same Message interface as MessageItem
interface Message {
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
  }
}

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
}

// Accept messages with additional roles but filter them
interface ExtendedMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'data'
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
    [key: string]: unknown
  }
}

interface MessageListProps {
  messages: ExtendedMessage[]
  onMessageEdit?: (messageId: string, newContent: string) => void
}

export function MessageList({ messages, onMessageEdit }: MessageListProps) {
  // Filter messages to only include user and assistant roles
  const displayableMessages: Message[] = messages
    .filter((message): message is ExtendedMessage & { role: 'user' | 'assistant' } =>
      message.role === 'user' || message.role === 'assistant'
    )
    .map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      attachments: message.attachments,
      metadata: message.metadata
    }))

  return (
    <div className="flex flex-col">
      {displayableMessages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          onEdit={onMessageEdit}
        />
      ))}
    </div>
  )
}