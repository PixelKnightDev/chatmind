// components/memory-cleanup.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'

export function MemoryCleanup() {

  interface Memory {
    id?: string;
    text?: string;
    memory?: string;
    metadata?: Record<string, unknown>;
  }
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()

  const getAllMemories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/memory-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_all',
          userId: user?.id || 'default_user',
        }),
      })
      
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Error getting memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch('/api/memory-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          memoryId: memoryId,
        }),
      })
      
      if (response.ok) {
        // Refresh the list
        await getAllMemories()
      }
    } catch (error) {
      console.error('Error deleting memory:', error)
    }
  }

  const clearAllMemories = async () => {
    if (!confirm('Are you sure you want to delete ALL memories? This cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      for (const memory of memories) {
        await deleteMemory(memory.id)
      }
      setMemories([])
    } catch (error) {
      console.error('Error clearing memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Memory Management</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={getAllMemories}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Get All Memories'}
          </Button>
          
          <Button 
            onClick={clearAllMemories}
            disabled={isLoading || memories.length === 0}
            variant="destructive"
          >
            Clear All Memories
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p>User: {user?.id || 'default_user'}</p>
          <p>Total memories: {memories.length}</p>
        </div>

        {memories.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Stored Memories:</h3>
            {memories.map((memory, index) => (
              <div key={memory.id || index} className="p-3 bg-gray-100 rounded-md flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm"><strong>Text:</strong> {memory.text || memory.memory || 'No text'}</p>
                  {memory.metadata && (
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Metadata:</strong> {JSON.stringify(memory.metadata)}
                    </p>
                  )}
                  {memory.id && (
                    <p className="text-xs text-gray-400 mt-1">
                      <strong>ID:</strong> {memory.id}
                    </p>
                  )}
                </div>
                {memory.id && (
                  <Button
                    onClick={() => deleteMemory(memory.id)}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}