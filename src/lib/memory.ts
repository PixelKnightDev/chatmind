import { Message as ChatMessage } from '@/types/chat'

export interface MemoryContext {
  userId: string
  sessionId: string
  memories: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MemoryConfig {
  maxMemories: number
  retentionDays: number
  compressionThreshold: number
}

/**
 * Memory management utilities for conversation context
 */
export class MemoryManager {
  private config: MemoryConfig

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxMemories: config.maxMemories || 100,
      retentionDays: config.retentionDays || 30,
      compressionThreshold: config.compressionThreshold || 50,
    }
  }

  /**
   * Extract key information from messages for memory storage
   */
  extractMemories(messages: ChatMessage[]): string[] {
    const memories: string[] = []
    
    for (const message of messages) {
      if (message.role === 'user') {
        // Extract user preferences, facts, and context
        const userContext = this.extractUserContext(message.content)
        if (userContext) {
          memories.push(userContext)
        }
      } else if (message.role === 'assistant') {
        // Extract important information provided by assistant
        const assistantInsights = this.extractAssistantInsights(message.content)
        if (assistantInsights) {
          memories.push(assistantInsights)
        }
      }
    }

    return memories
  }

  /**
   * Extract user context from message content
   */
  private extractUserContext(content: string): string | null {
    // Simple keyword-based extraction (can be enhanced with NLP)
    const contextPatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /i work at (.+)/i,
      /i live in (.+)/i,
      /i like (.+)/i,
      /i prefer (.+)/i,
      /my (.+) is (.+)/i,
    ]

    for (const pattern of contextPatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
  }

  /**
   * Extract assistant insights from response content
   */
  private extractAssistantInsights(content: string): string | null {
    // Extract key insights, recommendations, or important information
    if (content.length > 200 && content.includes('important')) {
      // Summarize long, important responses
      return content.substring(0, 100) + '...'
    }

    return null
  }

  /**
   * Compress memories when they exceed threshold
   */
  compressMemories(memories: string[]): string[] {
    if (memories.length <= this.config.compressionThreshold) {
      return memories
    }

    // Simple compression: keep most recent and unique memories
    const uniqueMemories = Array.from(new Set(memories))
    return uniqueMemories.slice(-this.config.maxMemories)
  }

  /**
   * Clean up old memories based on retention policy
   */
  cleanupOldMemories(memoryContext: MemoryContext): MemoryContext {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    if (memoryContext.createdAt < cutoffDate) {
      // Keep only essential memories for old contexts
      return {
        ...memoryContext,
        memories: memoryContext.memories.slice(-10), // Keep last 10 memories
        updatedAt: new Date(),
      }
    }

    return memoryContext
  }

  /**
   * Format memories for AI context injection
   */
  formatMemoriesForContext(memories: string[]): string {
    if (memories.length === 0) return ''

    return `Previous conversation context:\n${memories.join('\n')}\n\n`
  }
}

// Default memory manager instance
export const memoryManager = new MemoryManager()