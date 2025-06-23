// lib/mem0.ts
import { MemoryClient } from 'mem0ai'

// Initialize Mem0 client
export const mem0Client = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY!,
})

// Types for Mem0 operations - Updated to match actual API
export interface Mem0Memory {
  id: string
  memory: string
  user_id?: string
  agent_id?: string
  app_id?: string
  run_id?: string
  hash?: string
  metadata?: Record<string, any>
  categories?: string[]
  created_at: string
  updated_at: string
}

export interface Mem0SearchResult {
  id: string
  memory: string
  score?: number
  user_id?: string
  agent_id?: string
  metadata?: Record<string, any>
  categories?: string[]
}

// Helper functions for Mem0 operations
export class Mem0Service {
  private client: MemoryClient

  constructor() {
    this.client = mem0Client
  }

  /**
   * Store a memory in Mem0
   */
  async storeMemory(
    text: string,
    userId: string,
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Correct API usage: messages array first, then options
      const messages = [{ role: 'user' as const, content: text }]
      const response = await this.client.add(messages, {
        user_id: userId,
        metadata: {
          sessionId,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      })
      
      console.log('Mem0 store response:', response)
      // Response is an array of memories
      return Array.isArray(response) && response.length > 0 ? response[0].id : 'unknown'
    } catch (error) {
      console.error('Error storing memory in Mem0:', error)
      throw error
    }
  }

  /**
   * Search memories in Mem0
   */
  async searchMemories(
    query: string,
    userId: string,
    limit: number = 10
  ): Promise<Mem0SearchResult[]> {
    try {
      // Correct API usage: query string first, then options
      const response = await this.client.search(query, {
        user_id: userId,
        limit,
      })
      
      console.log('Mem0 search response:', response)
      
      // Handle the response array and map to our interface
      if (Array.isArray(response)) {
        return response.map(memory => ({
          id: memory.id || '',
          memory: memory.memory || '',
          score: memory.score,
          user_id: memory.user_id || undefined,
          agent_id: memory.agent_id || undefined,
          metadata: memory.metadata || {},
          categories: memory.categories || []
        }))
      }
      
      return []
    } catch (error) {
      console.error('Error searching memories in Mem0:', error)
      return []
    }
  }

  /**
   * Get all memories for a user
   */
  async getUserMemories(userId: string): Promise<Mem0Memory[]> {
    try {
      const response = await this.client.getAll({
        user_id: userId,
      })
      
      console.log('Mem0 getAll response:', response)
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response.map(memory => ({
          id: memory.id || '',
          memory: memory.memory || '',
          user_id: memory.user_id || undefined,
          agent_id: memory.agent_id || undefined,
          app_id: memory.app_id || undefined,
          run_id: memory.run_id || undefined,
          hash: memory.hash || undefined,
          metadata: memory.metadata || {},
          categories: memory.categories || [],
          created_at: memory.created_at ? 
            (memory.created_at instanceof Date ? memory.created_at.toISOString() : String(memory.created_at)) 
            : new Date().toISOString(),
          updated_at: memory.updated_at ? 
            (memory.updated_at instanceof Date ? memory.updated_at.toISOString() : String(memory.updated_at)) 
            : new Date().toISOString()
        }))
      }
      
      // Handle paginated response format
      if (response && typeof response === 'object' && 'memories' in response) {
        return (response as any).memories || []
      }
      
      return []
    } catch (error) {
      console.error('Error getting user memories from Mem0:', error)
      return []
    }
  }

  /**
   * Delete a specific memory
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      await this.client.delete(memoryId)
      return true
    } catch (error) {
      console.error('Error deleting memory from Mem0:', error)
      return false
    }
  }

  /**
   * Extract important information and store as memory
   */
  async processAndStoreMessage(
    content: string,
    role: 'user' | 'assistant',
    userId: string,
    sessionId: string
  ): Promise<void> {
    // Only store meaningful messages (not just "hi" or "thanks")
    if (content.length < 10) return

    try {
      // For user messages, store preferences, facts, and context
      if (role === 'user') {
        const userContext = this.extractUserContext(content)
        if (userContext) {
          await this.storeMemory(userContext, userId, sessionId, {
            messageType: 'user',
            originalContent: content.substring(0, 200), // Store preview
          })
        }
      }
      
      // For assistant messages, store key insights or recommendations
      if (role === 'assistant' && content.length > 100) {
        const insights = this.extractKeyInsights(content)
        if (insights) {
          await this.storeMemory(insights, userId, sessionId, {
            messageType: 'assistant',
            originalContent: content.substring(0, 200), // Store preview
          })
        }
      }
    } catch (error) {
      console.error('Error processing message for memory:', error)
      // Don't throw - memory storage shouldn't break the chat
    }
  }

  /**
   * Get relevant memories for chat context
   */
  async getRelevantMemories(
    currentMessage: string,
    userId: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const memories = await this.searchMemories(currentMessage, userId, limit)
      return memories.map(memory => memory.memory)
    } catch (error) {
      console.error('Error getting relevant memories:', error)
      return []
    }
  }

  /**
   * Extract user context from message content
   */
  private extractUserContext(content: string): string | null {
    const lowerContent = content.toLowerCase()
    
    // Extract preferences (likes/loves)
    if (lowerContent.includes('i like') || lowerContent.includes('i love')) {
      const likeMatch = content.match(/i (?:like|love) (.+?)(?:\.|$|,)/i)
      if (likeMatch && likeMatch[1]) {
        return `User likes: ${likeMatch[1].trim()}`
      }
    }
    
    // Extract dislikes/hates
    if (lowerContent.includes('i hate') || lowerContent.includes('i dislike') || lowerContent.includes("i don't like")) {
      const hateMatch = content.match(/i (?:hate|dislike|don't like) (.+?)(?:\.|$|,)/i)
      if (hateMatch && hateMatch[1]) {
        return `User dislikes: ${hateMatch[1].trim()}`
      }
    }
    
    // Extract personal info
    const contextPatterns = [
      { pattern: /my name is (\w+)/i, template: 'User name: $1' },
      { pattern: /i am (\w+)/i, template: 'User name: $1' },
      { pattern: /i work (?:at|for) (.+?)(?:\.|$|,)/i, template: 'User works at: $1' },
      { pattern: /i live in (.+?)(?:\.|$|,)/i, template: 'User lives in: $1' },
      { pattern: /i'm (?:a|an) (.+?)(?:\.|$|,)/i, template: 'User is: $1' },
      { pattern: /my (.+?) is (.+?)(?:\.|$|,)/i, template: 'User $1: $2' },
    ]

    for (const { pattern, template } of contextPatterns) {
      const match = content.match(pattern)
      if (match) {
        return template.replace('$1', match[1]?.trim() || '').replace('$2', match[2]?.trim() || '')
      }
    }

    // Extract general preferences with better patterns
    if (lowerContent.includes('prefer') && !lowerContent.includes('i prefer not')) {
      const preferMatch = content.match(/i prefer (.+?)(?:\.|$|,)/i)
      if (preferMatch && preferMatch[1]) {
        return `User prefers: ${preferMatch[1].trim()}`
      }
    }

    // Extract hobbies/activities
    if (lowerContent.includes('hobby') || lowerContent.includes('hobbies')) {
      return `User hobby: ${content}`
    }

    return null
  }

  /**
   * Extract key insights from assistant responses
   */
  private extractKeyInsights(content: string): string | null {
    // Look for important recommendations or facts
    if (content.toLowerCase().includes('important') ||
        content.toLowerCase().includes('remember') ||
        content.toLowerCase().includes('key point') ||
        content.toLowerCase().includes('recommendation')) {
      
      // Extract the first sentence that contains these keywords
      const sentences = content.split('. ')
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes('important') ||
            sentence.toLowerCase().includes('remember') ||
            sentence.toLowerCase().includes('key') ||
            sentence.toLowerCase().includes('recommend')) {
          return `Assistant insight: ${sentence}`
        }
      }
    }

    return null
  }
}

// Export singleton instance
export const mem0Service = new Mem0Service()