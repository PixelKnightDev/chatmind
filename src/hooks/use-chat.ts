// hooks/use-chat.ts
import { useState, useCallback } from 'react'
import { useChatStore } from '@/store/chat-store'
import { useMemory } from './use-memory'
import { generateChatTitle } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
}

export function useChat(chatId?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  
  const { 
    currentChat, 
    addMessage, 
    updateMessage, 
    createChat, 
    setCurrentChat,
    updateChat 
  } = useChatStore()
  const { storeMemory } = useMemory()
  const { user } = useUser()

  const sendMessage = useCallback(async (content: string, attachedFiles?: UploadedFile[]) => {
    if (!content.trim() && (!attachedFiles || attachedFiles.length === 0)) return

    setIsLoading(true)
    setError(null)

    try {
      // Create chat if none exists
      let chat = currentChat
      if (!chat) {
        chat = createChat(generateChatTitle(content))
        setCurrentChat(chat)
      }

      // Build enhanced content with file references
      let enhancedContent = content
      if (attachedFiles && attachedFiles.length > 0) {
        const fileDescriptions = attachedFiles.map(file => {
          if (file.type.startsWith('image/')) {
            return `[Image: ${file.originalName}]`
          } else {
            return `[File: ${file.originalName} (${file.type})]`
          }
        }).join('\n')
        
        if (enhancedContent) {
          enhancedContent += '\n\n' + fileDescriptions
        } else {
          enhancedContent = fileDescriptions
        }
      }

      // Add user message with attachments
      const userMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user' as const,
        content: enhancedContent,
        createdAt: new Date(),
        attachments: attachedFiles
      }

      addMessage(chat.id, userMessage)

      // Update chat title if it's the first message and still default
      if (chat.messages.length === 0 && chat.title === 'New Chat') {
        const newTitle = generateChatTitle(content)
        updateChat(chat.id, { title: newTitle })
      }

      // Get user ID from Clerk or use default
      const userId = user?.id || 'default_user'

      // Send to API with userId and file attachments
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chat.messages, userMessage],
          chatId: chat.id,
          userId: userId,
          attachments: attachedFiles
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Parse JSON response
      const data = await response.json()
      
      // Get assistant response from the API
      const assistantContent = data.choices?.[0]?.message?.content || 'No response received'

      const assistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant' as const,
        content: assistantContent,
        createdAt: new Date(),
      }

      // Add assistant message to chat
      addMessage(chat.id, assistantMessage)

      // Store in memory using the updated memory hook
      await storeMemory({
        userId: userId,
        messages: [userMessage, assistantMessage],
        sessionId: chat.id,
      })

      console.log('Chat completed and stored in memory for user:', userId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [currentChat, addMessage, updateMessage, createChat, setCurrentChat, updateChat, storeMemory, user])

  const regenerateLastMessage = useCallback(async () => {
    if (!currentChat || currentChat.messages.length < 2) return

    const lastUserMessage = currentChat.messages
      .filter(m => m.role === 'user')
      .pop()

    if (lastUserMessage) {
      // Remove last assistant message
      const updatedMessages = currentChat.messages.slice(0, -1)
      updateChat(currentChat.id, { messages: updatedMessages })
      
      // Regenerate response with original attachments
      await sendMessage(lastUserMessage.content, lastUserMessage.attachments)
    }
  }, [currentChat, sendMessage, updateChat])

  // New function to search memories
  const searchMemories = useCallback(async (query: string) => {
    const userId = user?.id || 'default_user'
    
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          userId: userId,
          query: query,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.data?.memories || []
      }
    } catch (error) {
      console.error('Error searching memories:', error)
    }
    
    return []
  }, [user])

  return {
    sendMessage,
    regenerateLastMessage,
    searchMemories,
    isLoading,
    isStreaming,
    error,
    clearError: () => setError(null),
  }
}