// components/memory-test.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'

export function MemoryTest() {
  const [memories, setMemories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useUser()

  const testStoreMemory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store',
          userId: user?.id || 'test_user',
          sessionId: 'test_session',
          messages: [
            {
              role: 'user',
              content: 'My name is John and I love pizza',
            },
            {
              role: 'assistant',
              content: 'Nice to meet you John! I\'ll remember that you love pizza.',
            }
          ],
        }),
      })
      
      const data = await response.json()
      console.log('Store result:', data)
    } catch (error) {
      console.error('Store error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testRetrieveMemories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retrieve',
          userId: user?.id || 'test_user',
          sessionId: 'test_session',
        }),
      })
      
      const data = await response.json()
      setMemories(data.data?.memories || [])
      console.log('Retrieve result:', data)
    } catch (error) {
      console.error('Retrieve error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testSearchMemories = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          userId: user?.id || 'test_user',
          query: searchQuery,
        }),
      })
      
      const data = await response.json()
      setMemories(data.data?.memories || [])
      console.log('Search result:', data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Mem0 Integration Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testStoreMemory}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Storing...' : 'Test Store Memory'}
          </Button>
          
          <Button 
            onClick={testRetrieveMemories}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Test Retrieve Memories'}
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button 
            onClick={testSearchMemories}
            disabled={isLoading || !searchQuery.trim()}
            variant="outline"
          >
            Search
          </Button>
        </div>

        {memories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Memories Found:</h3>
            <ul className="space-y-2">
              {memories.map((memory, index) => (
                <li key={index} className="p-3 bg-gray-100 rounded-md">
                  {memory}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>User ID: {user?.id || 'test_user'}</p>
          <p>Check the browser console for detailed API responses.</p>
        </div>
      </div>
    </div>
  )
}