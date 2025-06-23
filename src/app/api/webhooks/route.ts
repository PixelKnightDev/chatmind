// app/api/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

// Types for different webhook events
interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  data: any
}

interface FileProcessingWebhook extends WebhookEvent {
  type: 'file.processing.completed' | 'file.processing.failed'
  data: {
    fileId: string
    userId: string
    chatId: string
    messageId: string
    originalUrl: string
    processedUrl?: string
    extractedText?: string
    error?: string
  }
}

interface ModelCompletionWebhook extends WebhookEvent {
  type: 'model.completion.ready' | 'model.completion.failed'
  data: {
    jobId: string
    userId: string
    chatId: string
    messageId: string
    response?: string
    error?: string
  }
}

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    const actualSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(actualSignature, 'hex')
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

// Process file processing webhook
async function handleFileProcessingWebhook(webhook: FileProcessingWebhook) {
  console.log('Processing file webhook:', webhook.type, webhook.data.fileId)
  
  try {
    switch (webhook.type) {
      case 'file.processing.completed':
        await handleFileProcessingCompleted(webhook.data)
        break
      
      case 'file.processing.failed':
        await handleFileProcessingFailed(webhook.data)
        break
      
      default:
        console.warn('Unknown file processing webhook type:', webhook.type)
    }
  } catch (error) {
    console.error('Error handling file processing webhook:', error)
    throw error
  }
}

// Process model completion webhook
async function handleModelCompletionWebhook(webhook: ModelCompletionWebhook) {
  console.log('Processing model completion webhook:', webhook.type, webhook.data.jobId)
  
  try {
    switch (webhook.type) {
      case 'model.completion.ready':
        await handleModelCompletionReady(webhook.data)
        break
      
      case 'model.completion.failed':
        await handleModelCompletionFailed(webhook.data)
        break
      
      default:
        console.warn('Unknown model completion webhook type:', webhook.type)
    }
  } catch (error) {
    console.error('Error handling model completion webhook:', error)
    throw error
  }
}

// File processing completed handler
async function handleFileProcessingCompleted(data: FileProcessingWebhook['data']) {
  // Update the message with extracted content
  if (data.extractedText) {
    // Here you would update your chat store or database
    // For now, we'll just log it
    console.log('File processing completed:', {
      fileId: data.fileId,
      chatId: data.chatId,
      messageId: data.messageId,
      textLength: data.extractedText.length
    })
    
    // You could trigger a real-time update to the user's chat here
    // using WebSockets, Server-Sent Events, or similar
    await notifyUserOfFileProcessing(data)
  }
}

// File processing failed handler
async function handleFileProcessingFailed(data: FileProcessingWebhook['data']) {
  console.error('File processing failed:', {
    fileId: data.fileId,
    chatId: data.chatId,
    messageId: data.messageId,
    error: data.error
  })
  
  // Notify user of failure
  await notifyUserOfFileProcessingError(data)
}

// Model completion ready handler
async function handleModelCompletionReady(data: ModelCompletionWebhook['data']) {
  console.log('Model completion ready:', {
    jobId: data.jobId,
    chatId: data.chatId,
    messageId: data.messageId,
    responseLength: data.response?.length
  })
  
  // Update the chat with the completed response
  await updateChatWithModelResponse(data)
}

// Model completion failed handler
async function handleModelCompletionFailed(data: ModelCompletionWebhook['data']) {
  console.error('Model completion failed:', {
    jobId: data.jobId,
    chatId: data.chatId,
    messageId: data.messageId,
    error: data.error
  })
  
  // Handle the failure appropriately
  await handleModelCompletionError(data)
}

// Utility functions (implement based on your needs)
async function notifyUserOfFileProcessing(data: FileProcessingWebhook['data']) {
  // Implement real-time notification to user
  // Could use WebSockets, Server-Sent Events, or database updates
  console.log('Would notify user of completed file processing:', data.userId)
}

async function notifyUserOfFileProcessingError(data: FileProcessingWebhook['data']) {
  // Implement error notification
  console.log('Would notify user of file processing error:', data.userId, data.error)
}

async function updateChatWithModelResponse(data: ModelCompletionWebhook['data']) {
  // Update chat store or database with model response
  console.log('Would update chat with model response:', data.chatId, data.messageId)
}

async function handleModelCompletionError(data: ModelCompletionWebhook['data']) {
  // Handle model completion error
  console.log('Would handle model completion error:', data.jobId, data.error)
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received')
    
    // Get the raw body
    const body = await request.text()
    const headersList = await headers()
    
    // Get webhook signature for verification
    const signature = headersList.get('x-webhook-signature') || ''
    const webhookSource = headersList.get('x-webhook-source') || 'unknown'
    
    console.log('Webhook source:', webhookSource)
    
    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }
    
    // Parse webhook data
    let webhook: WebhookEvent
    try {
      webhook = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON in webhook body')
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!webhook.id || !webhook.type || !webhook.timestamp) {
      console.error('Missing required webhook fields')
      return NextResponse.json(
        { error: 'Missing required fields: id, type, timestamp' },
        { status: 400 }
      )
    }
    
    console.log('Processing webhook:', webhook.type, webhook.id)
    
    // Route webhook to appropriate handler
    switch (true) {
      case webhook.type.startsWith('file.processing.'):
        await handleFileProcessingWebhook(webhook as FileProcessingWebhook)
        break
      
      case webhook.type.startsWith('model.completion.'):
        await handleModelCompletionWebhook(webhook as ModelCompletionWebhook)
        break
      
      default:
        console.warn('Unknown webhook type:', webhook.type)
        return NextResponse.json(
          { error: 'Unknown webhook type' },
          { status: 400 }
        )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      processed: webhook.id,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}