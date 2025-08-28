'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { TypingIndicator } from './typing-indicator'
import { useChatStore } from '@/store/chat-store'
import { useMemory } from '@/hooks/use-memory'
import { trimMessagesForContext, getModelInfo, needsTrimming } from '@/lib/context-window'
import { useUser } from '@clerk/nextjs'
import type { Message as ChatMessage, UploadedFile } from '@/types/chat'

interface ChatInterfaceProps {
  chatId?: string
  className?: string
  model?: string
}

interface StreamingMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming: boolean
  createdAt: Date
  metadata?: Record<string, unknown>
}

export function ChatInterface({ model = 'llama3-8b-8192' }: ChatInterfaceProps) {
  const { currentChat, addMessage, createChat } = useChatStore()
  const { storeMemory } = useMemory()
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const [contextInfo, setContextInfo] = useState<{
    totalMessages: number
    sentMessages: number
    removedMessages: number
    totalTokens: number
  } | null>(null)

  // Messages for UI rendering (with full metadata and attachments)
  const uiMessages: ChatMessage[] = [
    ...(currentChat?.messages || []),
    ...(streamingMessage ? [{
      id: streamingMessage.id,
      role: streamingMessage.role,
      content: streamingMessage.content,
      createdAt: streamingMessage.createdAt,
      metadata: { ...streamingMessage.metadata, isStreaming: streamingMessage.isStreaming }
    }] : [])
  ]

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [uiMessages.length, streamingMessage?.content])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Function to stream response from API
  const streamFromAPI = useCallback(async (messagesToSend: Array<{ role: string; content: string }>, chatId: string, attachedFiles?: UploadedFile[]) => {
    const userId = user?.id || 'default_user'

    // Apply context window trimming
    const { trimmedMessages, removedCount, totalTokens } = trimMessagesForContext(
      messagesToSend,
      {
        model: model,
        strategy: 'smart_trim',
        preserveLastN: 6,
      }
    )

    setContextInfo({
      totalMessages: messagesToSend.length,
      sentMessages: trimmedMessages.length,
      removedMessages: removedCount,
      totalTokens: totalTokens
    })

    const apiMessages = trimmedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    console.log('Streaming from API:', {
      messageCount: apiMessages.length,
      model: model,
      tokens: totalTokens,
      attachments: attachedFiles?.length || 0
    })

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiMessages,
        chatId: chatId,
        userId: userId,
        model: model,
        stream: true,
        attachments: attachedFiles && attachedFiles.length > 0 ? attachedFiles : undefined
      }),
      signal: abortControllerRef.current.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    // Check if response is actually streaming
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      // Non-streaming response (fallback)
      const data = await response.json()
      return data.choices?.[0]?.message?.content || data.content || data.message || 'No response received'
    }

    // Handle streaming response
    if (!response.body) {
      throw new Error('No response body for streaming')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    // Create streaming message
    const streamingId = `msg-${Date.now()}-assistant-streaming`
    setStreamingMessage({
      id: streamingId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date(),
      metadata: { model }
    })

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              
              if (delta) {
                fullContent += delta
                
                // Update streaming message
                setStreamingMessage(prev => prev ? {
                  ...prev,
                  content: fullContent
                } : null)
              }
            } catch {
              // Skip invalid JSON lines
              console.warn('Failed to parse streaming chunk:', data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullContent
  }, [user, model])

  // Handle message editing with streaming
  const handleMessageEdit = useCallback(async (messageId: string) => {
    if (!currentChat) return

    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const freshChat = useChatStore.getState().currentChat
      if (!freshChat) return

      const apiMessages = freshChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))

      const assistantContent = await streamFromAPI(apiMessages, freshChat.id)

      // Clear streaming message and add final message
      setStreamingMessage(null)
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        createdAt: new Date(),
        metadata: { model }
      }

      addMessage(freshChat.id, assistantMessage)

      // Store in memory
      try {
        const userId = user?.id || 'default_user'
        const editedUserMsg = freshChat.messages.find(m => m.id === messageId)
        if (editedUserMsg) {
          await storeMemory({
            userId: userId,
            messages: [editedUserMsg, assistantMessage],
            sessionId: freshChat.id,
          })
        }
      } catch (memoryError) {
        console.warn('Failed to store in memory:', memoryError)
      }

    } catch (err) {
      setStreamingMessage(null)
      console.error('Error regenerating after edit:', err)
      
      if (currentChat) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Sorry, I encountered an error while regenerating the response. Please try again.',
          createdAt: new Date(),
        }
        addMessage(currentChat.id, errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentChat, addMessage, streamFromAPI, storeMemory, user, model])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent, attachedFiles?: UploadedFile[]) => {
    e.preventDefault()
    
    if (!input.trim() && (!attachedFiles || attachedFiles.length === 0)) return
    if (isLoading) return

    console.log('Submitting message with files:', attachedFiles?.length || 0)

    const userMessageContent = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Create chat if none exists
      let chat = currentChat
      if (!chat) {
        const title = userMessageContent || `File conversation`
        chat = createChat(title)
      }

      // Create user message with attachments
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: userMessageContent,
        createdAt: new Date(),
        attachments: attachedFiles && attachedFiles.length > 0 ? attachedFiles : undefined
      }

      addMessage(chat.id, userMessage)

      // Prepare messages for streaming
      const allMessages = [...(chat.messages || []), userMessage]

      // Stream the response with attached files
      const assistantContent = await streamFromAPI(allMessages, chat.id, attachedFiles)

      // Clear streaming message and add final message
      setStreamingMessage(null)
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        createdAt: new Date(),
        metadata: { model }
      }

      addMessage(chat.id, assistantMessage)

      // Store in memory
      try {
        const userId = user?.id || 'default_user'
        await storeMemory({
          userId: userId,
          messages: [userMessage, assistantMessage],
          sessionId: chat.id,
        })
      } catch (memoryError) {
        console.warn('Failed to store in memory:', memoryError)
      }

    } catch (err) {
      setStreamingMessage(null)
      console.error('Chat error:', err)
      
      if (currentChat) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        }
        addMessage(currentChat.id, errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    setStreamingMessage(null)
  }

  // Check if current conversation needs trimming
  const modelInfo = getModelInfo(model)
  const conversationNeedsTrimming = currentChat ? needsTrimming(
    currentChat.messages.map(m => ({ role: m.role, content: m.content })), 
    model
  ) : false

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      {/* Context Window Info Banner */}
      {(conversationNeedsTrimming || (contextInfo && contextInfo.removedMessages > 0)) && (
        <div className="bg-amber-900/20 border-b border-amber-900/30 px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-amber-200 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                Context window management active
                {contextInfo && ` (${contextInfo.sentMessages}/${contextInfo.totalMessages} messages, ~${contextInfo.totalTokens} tokens)`}
              </span>
            </div>
          </div>
        </div>
      )}

      {uiMessages.length === 0 ? (
        // Welcome Screen
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-normal text-white mb-8">
              How can I help you today?
            </h1>
            {currentChat && (
              <p className="text-sm text-white/60">
                Chat: {currentChat.title} • Model: {modelInfo.name}
              </p>
            )}
          </div>
        </div>
      ) : (
        // Messages Area
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={uiMessages} onMessageEdit={handleMessageEdit} />
          {isLoading && !streamingMessage && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input at bottom */}
      <div className="border-white/10 bg-[#212121] p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={handleStop}
            disabled={isLoading}
          />
          
          <div className="text-center mt-2">
            <p className="text-xs text-white/60">
              {streamingMessage ? (
                <span className="text-green-400">● Streaming response...</span>
              ) : (
                `Model: ${modelInfo.name} (${modelInfo.maxTokens} tokens) • Supports images & documents`
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}