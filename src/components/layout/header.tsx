'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chat-store'
import { 
  HamburgerMenuIcon, 
  SunIcon, 
  MoonIcon, 
  DesktopIcon,
  ChevronDownIcon 
} from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentChat } = useChatStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="h-4 w-4" />
      case 'dark':
        return <MoonIcon className="h-4 w-4" />
      default:
        return <DesktopIcon className="h-4 w-4" />
    }
  }

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <HamburgerMenuIcon className="h-4 w-4" />
        </Button>
        
        {/* Model selector */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-black dark:text-white">
          <span>ChatGPT</span>
          <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      {/* Center - Chat title */}
      <div className="flex-1 text-center">
        {currentChat && (
          <h1 className="text-sm font-medium text-black dark:text-white truncate max-w-xs sm:max-w-md">
            {currentChat.title}
          </h1>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {getThemeIcon()}
          </Button>
        )}

        {/* User menu */}
        <SignedIn>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8"
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button 
              size="sm" 
              className="h-8 px-3 text-xs font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Log in
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  )
}