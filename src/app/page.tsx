'use client'

import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatStore } from '@/store/chat-store'

export default function HomePage() {
  const { currentChat, chats } = useChatStore()

  // Log current state for debugging
  useEffect(() => {
    console.log('HomePage: Store state', {
      currentChatId: currentChat?.id,
      currentChatTitle: currentChat?.title,
      currentChatMessages: currentChat?.messages?.length || 0,
      totalChats: chats.length,
      // Log if any messages have attachments
      messagesWithAttachments: currentChat?.messages?.filter(m => m.attachments && m.attachments.length > 0).length || 0
    })
  }, [currentChat, chats])

  return (
    <MainLayout>
      <ChatInterface chatId={currentChat?.id} />
    </MainLayout>
  )
}