'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChatBubbleIcon } from '@radix-ui/react-icons'

export function TypingIndicator() {
  return (
    <div className="chat-message assistant">
      <div className="flex gap-4">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <ChatBubbleIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span className="text-sm font-semibold">Assistant</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
            <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}