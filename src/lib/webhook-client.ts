// lib/webhook-client.ts

import crypto from 'crypto'

export interface WebhookConfig {
  endpoint: string
  secret?: string
  source?: string
  retries?: number
  timeout?: number
}

export interface WebhookPayload {
  id: string
  type: string
  timestamp: string
  data: any
}

export class WebhookClient {
  private config: WebhookConfig

  constructor(config: WebhookConfig) {
    this.config = {
      retries: 3,
      timeout: 10000,
      source: 'chatgpt-clone',
      ...config
    }
  }

  private generateSignature(payload: string): string {
    if (!this.config.secret) return ''
    
    return 'sha256=' + crypto
      .createHmac('sha256', this.config.secret)
      .update(payload)
      .digest('hex')
  }

  async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    const body = JSON.stringify(payload)
    const signature = this.generateSignature(body)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ChatGPT-Clone-Webhook/1.0',
      'X-Webhook-Source': this.config.source || 'chatgpt-clone',
    }
    
    if (signature) {
      headers['X-Webhook-Signature'] = signature
    }
    
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= (this.config.retries || 3); attempt++) {
      try {
        console.log(`Sending webhook (attempt ${attempt}/${this.config.retries}):`, payload.type, payload.id)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
        
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          console.log('Webhook sent successfully:', payload.id)
          return true
        } else {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
      } catch (error) {
        lastError = error as Error
        console.error(`Webhook attempt ${attempt} failed:`, error)
        
        if (attempt < (this.config.retries || 3)) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    console.error('All webhook attempts failed:', lastError)
    return false
  }

  // Convenience methods for common webhook types
  async sendFileProcessingCompleted(data: {
    fileId: string
    userId: string
    chatId: string
    messageId: string
    originalUrl: string
    processedUrl?: string
    extractedText?: string
  }): Promise<boolean> {
    return this.sendWebhook({
      id: `file-${data.fileId}-${Date.now()}`,
      type: 'file.processing.completed',
      timestamp: new Date().toISOString(),
      data
    })
  }

  async sendFileProcessingFailed(data: {
    fileId: string
    userId: string
    chatId: string
    messageId: string
    originalUrl: string
    error: string
  }): Promise<boolean> {
    return this.sendWebhook({
      id: `file-error-${data.fileId}-${Date.now()}`,
      type: 'file.processing.failed',
      timestamp: new Date().toISOString(),
      data
    })
  }

  async sendModelCompletionReady(data: {
    jobId: string
    userId: string
    chatId: string
    messageId: string
    response: string
  }): Promise<boolean> {
    return this.sendWebhook({
      id: `model-${data.jobId}-${Date.now()}`,
      type: 'model.completion.ready',
      timestamp: new Date().toISOString(),
      data
    })
  }

  async sendModelCompletionFailed(data: {
    jobId: string
    userId: string
    chatId: string
    messageId: string
    error: string
  }): Promise<boolean> {
    return this.sendWebhook({
      id: `model-error-${data.jobId}-${Date.now()}`,
      type: 'model.completion.failed',
      timestamp: new Date().toISOString(),
      data
    })
  }
}

// Factory function for easy setup
export function createWebhookClient(endpoint: string, secret?: string): WebhookClient {
  return new WebhookClient({
    endpoint,
    secret,
    source: 'chatgpt-clone'
  })
}

// Example usage in external services:
/*
const webhookClient = createWebhookClient(
  'https://your-app.com/api/webhooks',
  process.env.WEBHOOK_SECRET
)

// When file processing completes
await webhookClient.sendFileProcessingCompleted({
  fileId: 'file-123',
  userId: 'user-456',
  chatId: 'chat-789',
  messageId: 'msg-101',
  originalUrl: 'https://example.com/file.pdf',
  extractedText: 'This is the extracted text...'
})
*/