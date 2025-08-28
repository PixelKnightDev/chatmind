'use client'

import { Button } from '@/components/ui/button'
import { ChatHistory } from './chat-history'
import { useChatStore } from '@/store/chat-store'
import { useRouter } from 'next/navigation'
import { 
  Cross1Icon,
  PersonIcon,
  ExitIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  TrashIcon
} from '@radix-ui/react-icons'
import { SignedIn, useClerk } from '@clerk/nextjs'

interface SidebarProps {
  onClose?: () => void
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ onClose, isCollapsed, onToggle }: SidebarProps) {
  const { chats, createNewChat, clearAllChats } = useChatStore()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleNewChat = () => {
    // Create a new chat and navigate to home
    const newChat = createNewChat()
    
    // Navigate to root to show the new chat
    router.push('/')
    
    // Close sidebar on mobile
    onClose?.()
    
    console.log('Created new chat:', newChat.id)
  }

  const handleClearAllChats = () => {
    if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      clearAllChats()
      router.push('/')
      onClose?.()
      console.log('All chats cleared')
    }
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-[#171717] text-white w-full">
        {/* Top section */}
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* ChatGPT Logo */}
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:bg-white/10 rounded-lg"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.283 2.9 5.952 5.952 0 0 0 3.537.893 6.006 6.006 0 0 0 4.996-2.42 5.985 5.985 0 0 0 4.005-2.9 6.078 6.078 0 0 0-.75-7.09"/>
                <path d="M9.018 16.725a2.38 2.38 0 0 1-1.15-.546 1.921 1.921 0 0 1-.546-1.284c0-.453.176-.884.546-1.165a2.53 2.53 0 0 1 1.15-.665 11.39 11.39 0 0 0 .546-4.91 3.053 3.053 0 0 1 .273-1.284 2.024 2.024 0 0 1 .82-.82 2.456 2.456 0 0 1 2.503 0c.35.2.63.493.82.82.2.351.3.742.273 1.284a11.39 11.39 0 0 0 .546 4.91c.282.235.546.416 1.15.665.453.281.82.712.82 1.165a1.921 1.921 0 0 1-.546 1.284 2.38 2.38 0 0 1-1.15.546 11.39 11.39 0 0 0-4.91.546 2.456 2.456 0 0 1-2.503 0 11.39 11.39 0 0 0-4.91-.546"/>
              </svg>
            </div>
          </Button>
          
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>
            </svg>
          </Button>

          {/* Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </Button>

          {/* Library Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <BookmarkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Bottom section */}
        <div className="flex flex-col items-center py-4 space-y-2">
          {/* Clear chats button (collapsed) */}
          {chats.length > 0 && (
            <Button
              onClick={handleClearAllChats}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
              title="Clear all chats"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}

          <SignedIn>
            {/* User account button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <PersonIcon className="h-4 w-4" />
            </Button>
          </SignedIn>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#171717] text-white">
      {/* Header with logo */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* ChatGPT Logo - clickable to toggle */}
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-white/10 rounded-full"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.283 2.9 5.952 5.952 0 0 0 3.537.893 6.006 6.006 0 0 0 4.996-2.42 5.985 5.985 0 0 0 4.005-2.9 6.078 6.078 0 0 0-.75-7.09"/>
                <path d="M9.018 16.725a2.38 2.38 0 0 1-1.15-.546 1.921 1.921 0 0 1-.546-1.284c0-.453.176-.884.546-1.165a2.53 2.53 0 0 1 1.15-.665 11.39 11.39 0 0 0 .546-4.91 3.053 3.053 0 0 1 .273-1.284 2.024 2.024 0 0 1 .82-.82 2.456 2.456 0 0 1 2.503 0c.35.2.63.493.82.82.2.351.3.742.273 1.284a11.39 11.39 0 0 0 .546 4.91c.282.235.546.416 1.15.665.453.281.82.712.82 1.165a1.921 1.921 0 0 1-.546 1.284 2.38 2.38 0 0 1-1.15.546 11.39 11.39 0 0 0-4.91.546 2.456 2.456 0 0 1-2.503 0 11.39 11.39 0 0 0-4.91-.546"/>
              </svg>
            </div>
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="font-medium text-base">ChatGPT</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-white/60">
              <path d="M8 12L3 7l1.5-1.5L8 9l3.5-3.5L13 7l-5 5z"/>
            </svg>
          </div>
        </div>
        
        {/* Close button for mobile and tablet */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="md:hidden h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
        >
          <Cross1Icon className="h-4 w-4" />
        </Button>
      </div>

      {/* Main navigation items */}
      <div className="px-3 space-y-1">
        {/* New chat */}
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="w-full justify-start gap-3 text-white/90 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
          New chat
        </Button>

        {/* Search chats */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Search chats
        </Button>

        {/* Library */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
        >
          <BookmarkIcon className="h-4 w-4" />
          Library
        </Button>

        {/* Spacer */}
        <div className="h-4"></div>

        {/* Sora */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
          </svg>
          Sora
        </Button>

        {/* GPTs */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          GPTs
        </Button>
      </div>

      {/* Chats section */}
      <div className="flex-1 overflow-y-auto px-3 mt-6">
        <div className="text-xs font-medium text-white/60 mb-2 px-3">Chats</div>
        <div onClick={(e) => {
          // Check if the click was on a chat item (you may need to adjust this selector)
          const target = e.target as HTMLElement;
          const chatItem = target.closest('[data-chat-item]') || target.closest('button');
          if (chatItem && onClose) {
            onClose();
          }
        }}>
          <ChatHistory />
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3">
        {/* Upgrade plan */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal mb-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
          </svg>
          <div className="flex flex-col items-start">
            <span>Upgrade plan</span>
            <span className="text-xs text-white/60">More access to the best models</span>
          </div>
        </Button>

        {/* Clear chat history */}
        <Button
          onClick={handleClearAllChats}
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 h-10 px-3 text-sm font-normal mb-1"
          disabled={chats.length === 0}
        >
          <TrashIcon className="h-4 w-4" />
          Clear chat history
          {chats.length > 0 && (
            <span className="text-xs text-red-400/60 ml-auto">
              ({chats.length})
            </span>
          )}
        </Button>

        <SignedIn>
          {/* User account */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
          >
            <PersonIcon className="h-4 w-4" />
            My account
          </Button>

          {/* Log out */}
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="w-full justify-start gap-3 text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 text-sm font-normal"
          >
            <ExitIcon className="h-4 w-4" />
            Log out
          </Button>
        </SignedIn>
      </div>
    </div>
  )
}