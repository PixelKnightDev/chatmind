'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/chat-store'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { 
  ChatBubbleIcon, 
  DotsHorizontalIcon, 
  TrashIcon, 
  Pencil1Icon, 
  ArchiveIcon,
  DrawingPinIcon,
  DrawingPinFilledIcon
} from '@radix-ui/react-icons'
import { Chat } from '@/types/chat'

interface ChatHistoryProps {
  showArchived?: boolean
  onClose?: () => void // For closing sidebar on mobile after chat selection
}

interface ChatActionsProps {
  chat: {
    id: string;
    title: string;
    isArchived: boolean;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages?: Array<unknown>;
  };
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onPin: (id: string, isPinned: boolean) => void;
}

export function ChatHistory({ showArchived = false, onClose }: ChatHistoryProps) {
  const { chats, currentChat, updateChat, deleteChat, loadChat } = useChatStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const router = useRouter()

  const filteredChats = chats.filter(chat => 
    showArchived ? chat.isArchived : !chat.isArchived  // Fixed: use isArchived
  )

  const sortedChats = filteredChats.sort((a, b) => {
    // Pinned chats first, then by update date
    if (a.isPinned && !b.isPinned) return -1  // Fixed: use isPinned
    if (!a.isPinned && b.isPinned) return 1   // Fixed: use isPinned
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const handleChatClick = (chat: Chat) => {
    console.log('Loading chat:', chat.id, 'with', chat.messages?.length || 0, 'messages')
    
    // Load the chat and set it as current
    const loadedChat = loadChat(chat.id)
    
    if (loadedChat) {
      // Navigate to home to show the chat
      router.push('/')
      
      // Close sidebar on mobile
      onClose?.()
      
      console.log('Successfully loaded chat:', loadedChat.id)
    } else {
      console.error('Failed to load chat:', chat.id)
    }
  }

  const handleEdit = (chatId: string, currentTitle: string) => {
    setEditingId(chatId)
    setEditTitle(currentTitle)
  }

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      updateChat(chatId, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDelete = (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId)
    }
  }

  const handleArchive = (chatId: string, isArchived: boolean) => {  // Fixed: parameter name
    updateChat(chatId, { isArchived: !isArchived })  // Fixed: use isArchived
  }

  const handlePin = (chatId: string, isPinned: boolean) => {  // Fixed: parameter name
    updateChat(chatId, { isPinned: !isPinned })  // Fixed: use isPinned
  }

  if (sortedChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-white/60 text-sm">
        <ChatBubbleIcon className="h-8 w-8 mb-2 opacity-50" />
        {showArchived ? 'No archived chats' : 'No chat history'}
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {sortedChats.map((chat) => (
        <div
          key={chat.id}
          className={cn(
            'group relative rounded-lg transition-colors',
            currentChat?.id === chat.id
              ? 'bg-white/10 text-white'
              : 'hover:bg-white/5 text-white/80 hover:text-white'
          )}
        >
          {editingId === chat.id ? (
            <div className="p-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(chat.id)
                  } else if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                }}
                onBlur={() => handleSaveEdit(chat.id)}
                className="w-full bg-transparent border-none outline-none text-sm text-white"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => handleChatClick(chat)}
              className="w-full text-left p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {chat.isPinned && (  // Fixed: use isPinned
                  <DrawingPinFilledIcon className="h-3 w-3 shrink-0 text-white/60" />
                )}
                <ChatBubbleIcon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {chat.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>{formatDate(new Date(chat.createdAt))}</span>
                    {chat.messages?.length > 0 && (
                      <span>• {chat.messages.length} messages</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Chat Actions */}
          {editingId !== chat.id && (
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChatActions
                chat={chat}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onPin={handlePin}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Chat Actions Dropdown Component
function ChatActions({ chat, onEdit, onDelete, onArchive, onPin }: ChatActionsProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
      >
        <DotsHorizontalIcon className="h-3 w-3" />
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-32 bg-[#2a2a2a] border border-white/20 rounded-md shadow-md py-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(chat.id, chat.title)
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Pencil1Icon className="h-3 w-3" />
              Rename
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onPin(chat.id, chat.isPinned)  // Fixed: use isPinned
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {chat.isPinned ? (  // Fixed: use isPinned
                <>
                  <DrawingPinIcon className="h-3 w-3" />
                  Unpin
                </>
              ) : (
                <>
                  <DrawingPinFilledIcon className="h-3 w-3" />
                  Pin
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive(chat.id, chat.isArchived)  // Fixed: use isArchived
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArchiveIcon className="h-3 w-3" />
              {chat.isArchived ? 'Unarchive' : 'Archive'}  {/* Fixed: use isArchived */}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chat.id)
                setShowMenu(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <TrashIcon className="h-3 w-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}