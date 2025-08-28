'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageActions } from './message-actions'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Pencil1Icon, CheckIcon, Cross1Icon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chat-store'
import { formatFileSize, getFileIconType } from '@/lib/file-processing'
import Image from 'next/image'

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
}

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

interface MessageItemProps {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
}

export function MessageItem({ message, onEdit }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentChat, editMessage, deleteMessagesFromIndex, getMessageIndex } = useChatStore()
  
  const isUser = message.role === 'user'
  const isEdited = message.metadata?.isEdited
  const isStreaming = message.metadata?.isStreaming

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [isEditing])

  const handleStartEdit = () => {
    if (isStreaming) return // Don't allow editing while streaming
    setIsEditing(true)
    setEditContent(message.content)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!currentChat || editContent.trim() === message.content.trim()) {
      setIsEditing(false)
      return
    }

    if (editContent.trim() === '') {
      return
    }

    const messageIndex = getMessageIndex(currentChat.id, message.id)
    if (messageIndex === -1) return

    // Edit the message in the store
    editMessage(currentChat.id, message.id, editContent.trim())

    // If this is a user message, delete all subsequent messages and regenerate
    if (isUser) {
      deleteMessagesFromIndex(currentChat.id, messageIndex + 1)
      
      // Trigger regeneration with the edited content
      if (onEdit) {
        onEdit(message.id, editContent.trim())
      }
    }

    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  // Streaming cursor component
  const StreamingCursor = () => (
    <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse" />
  )

  const getFileIcon = (type: string) => {
    const iconType = getFileIconType(type)
    const iconClass = "w-4 h-4"
    
    switch (iconType) {
      case 'image':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        )
      case 'pdf':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        )
      case 'spreadsheet':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          </svg>
        )
      case 'text':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="12" y1="9" x2="8" y2="9"/>
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
        )
    }
  }

  if (isUser) {
    // User message - small bubble on RIGHT
    return (
      <div className="w-full py-6 group">
        <div className="max-w-3xl mx-auto px-6 flex justify-end items-start gap-3">
          <div className="relative">
            {/* File Attachments Preview - shown above message */}
            {message.attachments && message.attachments.length > 0 && !isEditing && (
              <div className="mb-3 flex flex-wrap gap-2 justify-end">
                {message.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#404040] rounded-lg p-2 text-sm max-w-48"
                  >
                    {file.type.startsWith('image/') ? (
                      <div className="flex items-center gap-2">
                        <Image
                          src={file.url}
                          alt={file.originalName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white/90 text-xs font-medium truncate">
                            {file.originalName}
                          </span>
                          <span className="text-white/50 text-xs">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-white/70 flex-shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white/90 text-xs font-medium truncate">
                            {file.originalName}
                          </span>
                          <span className="text-white/50 text-xs">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>
                    )}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs flex-shrink-0"
                    >
                      ↗
                    </a>
                  </div>
                ))}
              </div>
            )}

            {isEditing ? (
              <div className="bg-[#303030] rounded-3xl px-4 py-3 max-w-sm">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-white text-[15px] resize-none border-none outline-none min-h-[20px]"
                  style={{ lineHeight: '1.5' }}
                />
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                  <Button
                    onClick={handleSaveEdit}
                    size="sm"
                    className="h-6 px-2 bg-white text-black hover:bg-white/90 text-xs"
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                  >
                    <Cross1Icon className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Press Cmd+Enter to save, Escape to cancel
                </div>
              </div>
            ) : (
              <div className="bg-[#303030] rounded-3xl px-4 py-3 max-w-sm text-white text-[15px] whitespace-pre-wrap relative">
                {message.content}
                {isEdited && (
                  <span className="text-xs text-white/60 ml-2">(edited)</span>
                )}
                
                {/* Edit button - appears on hover, disabled while streaming */}
                {!isStreaming && (
                  <Button
                    onClick={handleStartEdit}
                    variant="ghost"
                    size="sm"
                    className="absolute -left-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#404040] hover:bg-[#505050] text-white/70 hover:text-white"
                  >
                    <Pencil1Icon className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Large Image Preview for user messages */}
            {message.attachments && 
             message.attachments.some(f => f.type.startsWith('image/')) && 
             !isEditing && (
              <div className="mt-3 space-y-2 flex flex-col items-end">
                {message.attachments
                  .filter(f => f.type.startsWith('image/'))
                  .map((file, index) => (
                    <div key={index} className="rounded-lg overflow-hidden max-w-sm">
                      <Image
                        src={file.url}
                        alt={file.originalName}
                        width={400}
                        height={256}
                        className="max-w-full h-auto max-h-64 rounded-lg border border-[#404040]"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Assistant message - full width on LEFT
  return (
    <div className="group w-full py-6">
      <div className="max-w-3xl mx-auto px-6 flex gap-6">
        <div className="flex-1">
          <div className="text-white text-[15px] leading-7 mb-4">
            <ReactMarkdown
              components={{
                code(props) {
                  const { children, className } = props
                  const match = /language-(\w+)/.exec(className || '')
                  if (!match) {
                    return (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    )
                  }
                  return (
                    <SyntaxHighlighter
                      style={oneDark as Record<string, React.CSSProperties>}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md my-4"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                },
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            
            {/* Show cursor while streaming */}
            {isStreaming && <StreamingCursor />}
            
            {/* Show edited indicator */}
            {isEdited && !isStreaming && (
              <span className="text-xs text-white/60">(edited)</span>
            )}
          </div>
          
          {/* Message actions - hidden while streaming */}
          {!isStreaming && (
            <div className="opacity-100">
              <MessageActions message={message} />
            </div>
          )}
          
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="text-xs text-white/60 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Generating response...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}