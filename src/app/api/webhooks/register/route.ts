// app/api/webhooks/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

interface WebhookRegistration {
  id: string
  name: string
  endpoint: string
  events: string[]
  secret?: string
  active: boolean
  createdAt: string
  lastPing?: string
}

// In a real app, store this in a database
const webhookRegistrations = new Map<string, WebhookRegistration>()

// Register a new webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, endpoint, events } = body
    if (!name || !endpoint || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, endpoint, events' },
        { status: 400 }
      )
    }
    
    // Validate endpoint URL
    try {
      new URL(endpoint)
    } catch {
      return NextResponse.json(
        { error: 'Invalid endpoint URL' },
        { status: 400 }
      )
    }
    
    // Generate webhook registration
    const registration: WebhookRegistration = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      endpoint,
      events,
      secret: body.secret,
      active: true,
      createdAt: new Date().toISOString()
    }
    
    // Store registration
    webhookRegistrations.set(registration.id, registration)
    
    console.log('Webhook registered:', registration.id, name)
    
    return NextResponse.json({
      id: registration.id,
      name: registration.name,
      endpoint: registration.endpoint,
      events: registration.events,
      active: registration.active,
      createdAt: registration.createdAt
    })
    
  } catch (error) {
    console.error('Webhook registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all webhook registrations
export async function GET(request: NextRequest) {
  try {
    const registrations = Array.from(webhookRegistrations.values()).map(reg => ({
      id: reg.id,
      name: reg.name,
      endpoint: reg.endpoint,
      events: reg.events,
      active: reg.active,
      createdAt: reg.createdAt,
      lastPing: reg.lastPing
    }))
    
    return NextResponse.json({ webhooks: registrations })
    
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}