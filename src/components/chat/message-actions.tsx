'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Message } from 'ai'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  message: Message
  className?: string
}

export function MessageActions({ message, className }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleLike = () => {
    // Implement like functionality
    console.log('Liked message:', message.id)
  }

  const handleDislike = () => {
    // Implement dislike functionality
    console.log('Disliked message:', message.id)
  }

  const handleRegenerate = () => {
    // Implement regenerate functionality
    console.log('Regenerating message:', message.id)
  }

  const handleShare = () => {
    // Implement share functionality
    console.log('Sharing message:', message.id)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Copy */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </Button>

      {/* Like */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Good response"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
      </Button>

      {/* Dislike */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDislike}
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Bad response"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
        </svg>
      </Button>

      {/* Read aloud */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Read aloud"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </Button>

      {/* Edit */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Edit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>
        </svg>
      </Button>

      {/* Regenerate */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRegenerate}
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Regenerate"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23,4 23,10 17,10"/>
          <polyline points="1,20 1,14 7,14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      </Button>

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded"
        title="Share"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16,6 12,2 8,6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </Button>
    </div>
  )
}