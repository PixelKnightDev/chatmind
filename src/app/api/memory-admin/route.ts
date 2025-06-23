// app/api/memory-admin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mem0Service } from '@/lib/mem0'

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, memoryId } = await req.json()

    if (action === 'list_all') {
      try {
        const memories = await mem0Service.getUserMemories(userId)
        return NextResponse.json({
          success: true,
          memories: memories,
          count: memories.length
        })
      } catch (error) {
        console.error('Error listing memories:', error)
        return NextResponse.json({
          success: false,
          error: getErrorMessage(error),
          memories: []
        })
      }
    }

    if (action === 'delete' && memoryId) {
      try {
        const success = await mem0Service.deleteMemory(memoryId)
        return NextResponse.json({
          success: success,
          message: success ? 'Memory deleted' : 'Failed to delete memory'
        })
      } catch (error) {
        console.error('Error deleting memory:', error)
        return NextResponse.json({
          success: false,
          error: getErrorMessage(error)
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    })
  } catch (error) {
    console.error('Memory admin API error:', error)
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    })
  }
}