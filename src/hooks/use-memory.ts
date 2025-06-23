import { useState } from 'react'
import { Message as ChatMessage } from '@/types/chat'

interface MemoryInput {
  userId: string
  messages: ChatMessage[]
  sessionId: string
}

interface MemoryQuery {
  userId: string
  sessionId: string
  query?: string
}

export function useMemory() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storeMemory = async (input: MemoryInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'store',
          ...input,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to store memory')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Memory storage error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const retrieveMemory = async (query: MemoryQuery) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'retrieve',
          ...query,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to retrieve memory')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Memory retrieval error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    storeMemory,
    retrieveMemory,
    isLoading,
    error,
  }
}