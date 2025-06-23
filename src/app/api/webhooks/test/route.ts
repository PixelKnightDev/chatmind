// app/api/webhooks/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createWebhookClient } from '@/lib/webhook-client'

// Test webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, secret, type = 'test' } = body
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing required field: endpoint' },
        { status: 400 }
      )
    }
    
    // Create webhook client
    const webhookClient = createWebhookClient(endpoint, secret)
    
    // Create test payload
    const testPayload = {
      id: `test-${Date.now()}`,
      type: `${type}.test`,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook',
        timestamp: new Date().toISOString(),
        source: 'chatgpt-clone-webhook-test'
      }
    }
    
    console.log('Sending test webhook to:', endpoint)
    
    // Send test webhook
    const success = await webhookClient.sendWebhook(testPayload)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully',
        payload: testPayload
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Test webhook failed to send',
        payload: testPayload
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}