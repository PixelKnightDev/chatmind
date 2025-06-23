'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatStore } from '@/store/chat-store'

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const { chats, setCurrentChat } = useChatStore()

  useEffect(() => {
    // Find and set the current chat
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setCurrentChat(chat)
    }
  }, [chatId, chats, setCurrentChat])

  return (
    <MainLayout>
      <ChatInterface chatId={chatId} />
    </MainLayout>
  )
}