// lib/context-window.ts

export interface ModelConfig {
  name: string
  maxTokens: number
  maxOutputTokens: number
  reserveTokens: number // Reserve for system prompt, etc.
}

// Model configurations with their context windows
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'llama3-8b-8192': {
    name: 'Llama 3 8B',
    maxTokens: 8192,
    maxOutputTokens: 2048,
    reserveTokens: 500, // Reserve for system prompt and safety margin
  },
  'llama3-70b-8192': {
    name: 'Llama 3 70B',
    maxTokens: 8192,
    maxOutputTokens: 2048,
    reserveTokens: 500,
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    maxTokens: 32768,
    maxOutputTokens: 4096,
    reserveTokens: 1000,
  },
  'gemma-7b-it': {
    name: 'Gemma 7B',
    maxTokens: 8192,
    maxOutputTokens: 2048,
    reserveTokens: 500,
  },
}

// Simple token estimation (roughly 4 characters = 1 token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Estimate tokens for a message
export function estimateMessageTokens(message: { role: string; content: string }): number {
  // Role tokens (user/assistant/system) + content tokens + formatting
  const roleTokens = 2
  const contentTokens = estimateTokens(message.content)
  const formatTokens = 3 // For message formatting
  
  return roleTokens + contentTokens + formatTokens
}

// Calculate total tokens for an array of messages
export function calculateTotalTokens(messages: { role: string; content: string }[]): number {
  return messages.reduce((total, message) => total + estimateMessageTokens(message), 0)
}

export interface TrimOptions {
  model?: string
  maxTokens?: number
  preserveSystemMessage?: boolean
  preserveLastN?: number // Always preserve the last N messages
  strategy?: 'sliding_window' | 'smart_trim' | 'exponential_decay'
}

// Main function to trim messages to fit within context window
export function trimMessagesForContext(
  messages: { role: string; content: string; id?: string; createdAt?: Date }[],
  options: TrimOptions = {}
): { 
  trimmedMessages: { role: string; content: string; id?: string; createdAt?: Date }[], 
  removedCount: number,
  totalTokens: number 
} {
  const {
    model = 'llama3-8b-8192',
    preserveSystemMessage = true,
    preserveLastN = 4, // Always keep last 2 user-assistant pairs
    strategy = 'sliding_window'
  } = options

  const modelConfig = MODEL_CONFIGS[model] || MODEL_CONFIGS['llama3-8b-8192']
  const maxAllowedTokens = (options.maxTokens || modelConfig.maxTokens) - modelConfig.reserveTokens - modelConfig.maxOutputTokens

  let workingMessages = [...messages]
  
  // Always preserve system message if it exists
  const systemMessage = preserveSystemMessage ? workingMessages.find(m => m.role === 'system') : null
  const nonSystemMessages = workingMessages.filter(m => m.role !== 'system')

  let totalTokens = calculateTotalTokens(workingMessages)
  
  // If we're already under the limit, return as-is
  if (totalTokens <= maxAllowedTokens) {
    return {
      trimmedMessages: workingMessages,
      removedCount: 0,
      totalTokens
    }
  }

  let trimmedMessages: typeof messages = []
  let removedCount = 0

  switch (strategy) {
    case 'sliding_window':
      // Keep the most recent messages that fit
      trimmedMessages = [...nonSystemMessages]
      
      // Always preserve the last N messages if possible
      const preserveMessages = trimmedMessages.slice(-preserveLastN)
      const preserveTokens = calculateTotalTokens(preserveMessages)
      
      if (preserveTokens > maxAllowedTokens) {
        // Even the preserve messages don't fit, keep what we can
        trimmedMessages = []
        let runningTokens = systemMessage ? estimateMessageTokens(systemMessage) : 0
        
        for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
          const message = nonSystemMessages[i]
          const messageTokens = estimateMessageTokens(message)
          
          if (runningTokens + messageTokens <= maxAllowedTokens) {
            trimmedMessages.unshift(message)
            runningTokens += messageTokens
          } else {
            removedCount++
          }
        }
      } else {
        // Start with preserve messages and add more if possible
        trimmedMessages = [...preserveMessages]
        let runningTokens = calculateTotalTokens(trimmedMessages)
        
        if (systemMessage) {
          runningTokens += estimateMessageTokens(systemMessage)
        }
        
        // Try to add more messages from the beginning
        for (let i = nonSystemMessages.length - preserveLastN - 1; i >= 0; i--) {
          const message = nonSystemMessages[i]
          const messageTokens = estimateMessageTokens(message)
          
          if (runningTokens + messageTokens <= maxAllowedTokens) {
            trimmedMessages.unshift(message)
            runningTokens += messageTokens
          } else {
            removedCount++
          }
        }
      }
      break

    case 'smart_trim':
      // Prefer to keep complete conversation pairs (user + assistant)
      const messagePairs: Array<Array<{ role: string; content: string; id?: string; createdAt?: Date }>> = []
      
      for (let i = 0; i < nonSystemMessages.length; i += 2) {
        const userMsg = nonSystemMessages[i]
        const assistantMsg = nonSystemMessages[i + 1]
        
        if (userMsg && assistantMsg && userMsg.role === 'user' && assistantMsg.role === 'assistant') {
          messagePairs.push([userMsg, assistantMsg])
        } else if (userMsg) {
          messagePairs.push([userMsg])
        }
      }
      
      // Start from the most recent pairs and work backwards
      trimmedMessages = []
      let runningTokens = systemMessage ? estimateMessageTokens(systemMessage) : 0
      
      for (let i = messagePairs.length - 1; i >= 0; i--) {
        const pair = messagePairs[i]
        const pairTokens = calculateTotalTokens(pair.map(msg => ({ role: msg.role, content: msg.content })))
        
        if (runningTokens + pairTokens <= maxAllowedTokens) {
          trimmedMessages.unshift(...pair)
          runningTokens += pairTokens
        } else {
          removedCount += pair.length
        }
      }
      break

    case 'exponential_decay':
      // Keep recent messages with higher priority, gradually include older ones
      const weights = nonSystemMessages.map((_, index) => {
        const recency = (nonSystemMessages.length - index) / nonSystemMessages.length
        return Math.pow(recency, 2) // Exponential preference for recent messages
      })
      
      const weightedMessages = nonSystemMessages.map((msg, index) => ({
        message: msg,
        weight: weights[index],
        tokens: estimateMessageTokens(msg)
      }))
      
      // Sort by weight (highest first)
      weightedMessages.sort((a, b) => b.weight - a.weight)
      
      let runningTokensExp = systemMessage ? estimateMessageTokens(systemMessage) : 0
      const selectedMessages: typeof messages = []
      
      for (const { message, tokens } of weightedMessages) {
        if (runningTokensExp + tokens <= maxAllowedTokens) {
          selectedMessages.push(message)
          runningTokensExp += tokens
        } else {
          removedCount++
        }
      }
      
      // Sort selected messages back to chronological order
      trimmedMessages = selectedMessages.sort((a, b) => {
        const aIndex = nonSystemMessages.indexOf(a)
        const bIndex = nonSystemMessages.indexOf(b)
        return aIndex - bIndex
      })
      break
  }

  // Add system message back if it exists
  const finalMessages = systemMessage ? [systemMessage, ...trimmedMessages] : trimmedMessages
  totalTokens = calculateTotalTokens(finalMessages)

  console.log(`Context window trimming: ${messages.length} → ${finalMessages.length} messages (${removedCount} removed), ~${totalTokens} tokens`)

  return {
    trimmedMessages: finalMessages,
    removedCount,
    totalTokens
  }
}

// Helper to get model info
export function getModelInfo(model: string): ModelConfig {
  return MODEL_CONFIGS[model] || MODEL_CONFIGS['llama3-8b-8192']
}

// Helper to check if messages need trimming
export function needsTrimming(messages: { role: string; content: string }[], model: string = 'llama3-8b-8192'): boolean {
  const modelConfig = getModelInfo(model)
  const totalTokens = calculateTotalTokens(messages)
  const maxAllowedTokens = modelConfig.maxTokens - modelConfig.reserveTokens - modelConfig.maxOutputTokens
  
  return totalTokens > maxAllowedTokens
}