// store/chat-store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, Chat, UploadedFile } from '@/types/chat'

interface ChatStore {
  currentChat: Chat | null
  chats: Chat[]
  currentUserId: string | null
  
  // User management
  setCurrentUser: (userId: string | null) => void
  clearUserData: () => void
  
  // Chat management
  createChat: (title: string) => Chat
  createNewChat: () => Chat
  loadChat: (chatId: string) => Chat | null
  setCurrentChat: (chat: Chat | null) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  deleteChat: (chatId: string) => void
  
  // Message management
  addMessage: (chatId: string, message: Message) => void
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void
  removeMessage: (chatId: string, messageId: string) => void
  editMessage: (chatId: string, messageId: string, newContent: string) => void
  deleteMessagesFromIndex: (chatId: string, fromIndex: number) => void
  getMessageIndex: (chatId: string, messageId: string) => number
  
  // File attachment management
  addAttachmentToMessage: (chatId: string, messageId: string, attachment: UploadedFile) => void
  removeAttachmentFromMessage: (chatId: string, messageId: string, attachmentIndex: number) => void
  
  // Utility functions
  clearCurrentChat: () => void
  clearAllChats: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentChat: null,
      chats: [],
      currentUserId: null,

      setCurrentUser: (userId: string | null) => {
        const currentState = get()
        
        // If switching to a different user, clear current data
        if (currentState.currentUserId !== userId) {
          set({
            currentUserId: userId,
            currentChat: null,
            chats: [] // This will load from persisted storage for the new user
          })
        }
      },

      clearUserData: () => {
        set({
          currentUserId: null,
          currentChat: null,
          chats: []
        })
      },

      createChat: (title: string) => {
        const currentState = get()
        if (!currentState.currentUserId) {
          console.warn('Cannot create chat: No user logged in')
          return {} as Chat
        }

        const newChat: Chat = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          isArchived: false,
          userId: currentState.currentUserId, // Associate with current user
        }

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChat: newChat,
        }))

        return newChat
      },

      createNewChat: () => {
        const currentState = get()
        if (!currentState.currentUserId) {
          console.warn('Cannot create chat: No user logged in')
          return {} as Chat
        }

        const newChat: Chat = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          isArchived: false,
          userId: currentState.currentUserId, // Associate with current user
        }

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChat: newChat,
        }))

        return newChat
      },

      loadChat: (chatId: string) => {
        const currentState = get()
        // Only load chats that belong to the current user
        const chat = currentState.chats.find(c => c.id === chatId && c.userId === currentState.currentUserId)
        if (chat) {
          set({ currentChat: chat })
          return chat
        }
        return null
      },

      setCurrentChat: (chat: Chat | null) => {
        const currentState = get()
        // Only set chat if it belongs to current user or is null
        if (!chat || chat.userId === currentState.currentUserId) {
          set({ currentChat: chat })
        }
      },

      updateChat: (chatId: string, updates: Partial<Chat>) => {
        const currentState = get()
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? { ...chat, ...updates, updatedAt: new Date() }
              : chat
          ),
          currentChat:
            state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
              ? { ...state.currentChat, ...updates, updatedAt: new Date() }
              : state.currentChat,
        }))
      },

      deleteChat: (chatId: string) => {
        const currentState = get()
        set((state) => ({
          chats: state.chats.filter((chat) => 
            !(chat.id === chatId && chat.userId === currentState.currentUserId)
          ),
          currentChat:
            state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId 
              ? null 
              : state.currentChat,
        }))
      },

      addMessage: (chatId: string, message: Message) => {
        const currentState = get()
        set((state) => {
          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: [...state.currentChat.messages, message],
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => {
        const currentState = get()
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            )

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: updateMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: updateMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      removeMessage: (chatId: string, messageId: string) => {
        const currentState = get()
        set((state) => {
          const filterMessages = (messages: Message[]) =>
            messages.filter((msg) => msg.id !== messageId)

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: filterMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: filterMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      addAttachmentToMessage: (chatId: string, messageId: string, attachment: UploadedFile) => {
        const currentState = get()
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    attachments: [...(msg.attachments || []), attachment],
                  }
                : msg
            )

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: updateMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: updateMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      removeAttachmentFromMessage: (chatId: string, messageId: string, attachmentIndex: number) => {
        const currentState = get()
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    attachments: msg.attachments?.filter((_, index) => index !== attachmentIndex),
                  }
                : msg
            )

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: updateMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: updateMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      editMessage: (chatId: string, messageId: string, newContent: string) => {
        const currentState = get()
        set((state) => {
          const updateMessages = (messages: Message[]) =>
            messages.map((msg) =>
              msg.id === messageId 
                ? { 
                    ...msg, 
                    content: newContent,
                    metadata: {
                      ...msg.metadata,
                      isEdited: true,
                      originalContent: msg.metadata?.originalContent || msg.content
                    }
                  } 
                : msg
            )

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: updateMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: updateMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      deleteMessagesFromIndex: (chatId: string, fromIndex: number) => {
        const currentState = get()
        set((state) => {
          const filterMessages = (messages: Message[]) =>
            messages.slice(0, fromIndex)

          const updatedChats = state.chats.map((chat) =>
            chat.id === chatId && chat.userId === currentState.currentUserId
              ? {
                  ...chat,
                  messages: filterMessages(chat.messages),
                  updatedAt: new Date(),
                }
              : chat
          )

          return {
            chats: updatedChats,
            currentChat:
              state.currentChat?.id === chatId && state.currentChat?.userId === currentState.currentUserId
                ? {
                    ...state.currentChat,
                    messages: filterMessages(state.currentChat.messages),
                    updatedAt: new Date(),
                  }
                : state.currentChat,
          }
        })
      },

      getMessageIndex: (chatId: string, messageId: string) => {
        const currentState = get()
        const chat = currentState.chats.find(c => c.id === chatId && c.userId === currentState.currentUserId) || currentState.currentChat
        if (!chat || chat.userId !== currentState.currentUserId) return -1
        return chat.messages.findIndex(msg => msg.id === messageId)
      },

      clearCurrentChat: () => {
        set({ currentChat: null })
      },

      clearAllChats: () => {
        const currentState = get()
        // Only clear chats for current user
        set((state) => ({
          chats: state.chats.filter(chat => chat.userId !== currentState.currentUserId),
          currentChat: null
        }))
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        chats: state.chats,
        currentChat: state.currentChat,
        currentUserId: state.currentUserId,
      }),
    }
  )
)