// hooks/use-user-chat-sync.ts

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useChatStore } from '@/store/chat-store'

export function useUserChatSync() {
  const { user, isLoaded } = useUser()
  const { setCurrentUser, clearUserData, currentUserId } = useChatStore()

  useEffect(() => {
    if (!isLoaded) return // Wait for Clerk to load

    if (user?.id) {
      // User is logged in
      if (currentUserId !== user.id) {
        console.log('User logged in:', user.id)
        setCurrentUser(user.id)
      }
    } else {
      // User is logged out
      if (currentUserId) {
        console.log('User logged out, clearing chat data')
        clearUserData()
      }
    }
  }, [user?.id, isLoaded, currentUserId, setCurrentUser, clearUserData])

  return {
    isLoggedIn: !!user?.id,
    userId: user?.id || null,
    isLoaded
  }
}