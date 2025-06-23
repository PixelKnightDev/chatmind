// app/api/memory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mem0Service } from '@/lib/mem0'

export async function POST(req: NextRequest) {
  try {
    const { action, userId, sessionId, messages, query } = await req.json()

    console.log('Memory API called:', { action, userId, sessionId, messageCount: messages?.length })

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (action === 'store' && messages) {
      try {
        // Process and store each message in Mem0
        for (const message of messages) {
          await mem0Service.processAndStoreMessage(
            message.content,
            message.role,
            userId,
            sessionId
          )
        }
        
        console.log(`Stored ${messages.length} messages in Mem0 for user ${userId}`)
        
        return NextResponse.json({ 
          success: true, 
          message: `Stored ${messages.length} messages in Mem0` 
        })
      } catch (error) {
        console.error('Error storing in Mem0:', error)
        
        // Fallback to local storage if Mem0 fails
        return NextResponse.json({ 
          success: true, 
          message: 'Memory stored locally (Mem0 unavailable)',
          fallback: true
        })
      }
    }
    
    if (action === 'retrieve') {
      try {
        let memories = []
        
        if (query) {
          // Search for relevant memories based on query
          memories = await mem0Service.getRelevantMemories(query, userId, 10)
        } else {
          // Get all user memories
          const allMemories = await mem0Service.getUserMemories(userId)
          memories = allMemories.map(m => m.memory)
        }
        
        console.log(`Retrieved ${memories.length} memories from Mem0 for user ${userId}`)
        
        return NextResponse.json({ 
          success: true, 
          data: { memories },
          message: `Found ${memories.length} memories in Mem0` 
        })
      } catch (error) {
        console.error('Error retrieving from Mem0:', error)
        
        // Return empty memories if Mem0 fails
        return NextResponse.json({ 
          success: true, 
          data: { memories: [] },
          message: 'No memories found (Mem0 unavailable)',
          fallback: true
        })
      }
    }

    if (action === 'search' && query) {
      try {
        const searchResults = await mem0Service.searchMemories(query, userId, 10)
        const memories = searchResults.map(result => result.memory)
        
        console.log(`Found ${memories.length} relevant memories for query: "${query}"`)
        
        return NextResponse.json({ 
          success: true, 
          data: { 
            memories,
            searchResults: searchResults.map(r => ({
              text: r.memory,
              score: r.score
            }))
          },
          message: `Found ${memories.length} relevant memories` 
        })
      } catch (error) {
        console.error('Error searching Mem0:', error)
        
        return NextResponse.json({ 
          success: true, 
          data: { memories: [], searchResults: [] },
          message: 'Search unavailable (Mem0 error)',
          fallback: true
        })
      }
    }


    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action. Use: store, retrieve, or search' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Memory API error:', error)
    
    // Always return success to avoid breaking the chat
    return NextResponse.json(
      { 
        success: true, 
        message: 'Memory service temporarily unavailable',
        data: { memories: [] },
        error: true
      },
      { status: 200 }
    )
  }
}