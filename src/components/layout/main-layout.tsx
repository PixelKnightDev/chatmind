'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Button } from '@/components/ui/button'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { SignedIn, SignedOut, SignInButton, useUser, useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useUserChatSync } from '@/hooks/use-user-chat-sync'
import Image from 'next/image'

// Account Dropdown Component
function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()

  const handleSignOut = () => {
    console.log('User signing out, chat data will be cleared')
    signOut()
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <SignedIn>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        >
          {user?.imageUrl ? (
            <Image 
              src={user.imageUrl} 
              alt="Profile" 
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white font-medium">
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#2f2f2f] rounded-lg border border-white/10 shadow-lg z-50">
              <div className="p-3 border-b border-white/10">
                <div className="text-sm text-white font-medium">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </div>
                {user?.firstName && (
                  <div className="text-xs text-white/60 mt-1">
                    {user.firstName} {user.lastName}
                  </div>
                )}
              </div>
              
              <div className="py-2">
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                    <path d="M16 20v-2a4 4 0 0 0-8 0v2"/>
                  </svg>
                  Upgrade plan
                </button>
                
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Customize ChatGPT
                </button>
                
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                  Settings
                </button>
                
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M16 8v5a3 3 0 0 0 6 0v-5a10 10 0 1 0-20 0v5a3 3 0 0 0 6 0v-5"/>
                  </svg>
                  Help
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </button>
              </div>
              
              <div className="border-t border-white/10 py-2">
                <button 
                  onClick={handleSignOut}
                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <Button 
            size="sm" 
            className="h-8 px-3 text-xs font-medium bg-white hover:bg-gray-200 text-black"
          >
            Log in
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  )
}

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true) // Default open on desktop
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sync user state with chat store - this handles login/logout automatically
  const { isLoggedIn, userId, isLoaded } = useUserChatSync()

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-[#212121] items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      {/* Desktop and Tablet Sidebar */}
      <div className={cn(
        "hidden md:block transition-all duration-200 ease-in-out bg-[#171717]",
        sidebarOpen ? "w-[260px]" : "w-[60px]"
      )}>
        <Sidebar 
          isCollapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-[#171717] transform transition-transform duration-200 ease-in-out md:hidden w-[260px]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          isCollapsed={false}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121]">
        {/* Top bar with menu toggle */}
        <div className="flex items-center gap-2 p-3 border-white/10">
          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
          >
            <HamburgerMenuIcon className="h-4 w-4" />
          </Button>

          {/* ChatGPT Title when sidebar is collapsed */}
          {!sidebarOpen && (
            <div className="hidden md:flex items-center gap-2">
              <span className="font-medium text-base text-white">ChatGPT</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-white/60">
                <path d="M8 12L3 7l1.5-1.5L8 9l3.5-3.5L13 7l-5 5z"/>
              </svg>
            </div>
          )}

          {/* User indicator when logged in */}
          {isLoggedIn && userId && (
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-white/60">
                Personal workspace
              </span>
            </div>
          )}

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm text-white/60 hover:text-white hover:bg-white/10"
            >
              Get Plus
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </Button>

            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {/* ChatGPT Logo as toggle button */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.283 2.9 5.952 5.952 0 0 0 3.537.893 6.006 6.006 0 0 0 4.996-2.42 5.985 5.985 0 0 0 4.005-2.9 6.078 6.078 0 0 0-.75-7.09"/>
                <path d="M9.018 16.725a2.38 2.38 0 0 1-1.15-.546 1.921 1.921 0 0 1-.546-1.284c0-.453.176-.884.546-1.165a2.53 2.53 0 0 1 1.15-.665 11.39 11.39 0 0 0 .546-4.91 3.053 3.053 0 0 1 .273-1.284 2.024 2.024 0 0 1 .82-.82 2.456 2.456 0 0 1 2.503 0c.35.2.63.493.82.82.2.351.3.742.273 1.284a11.39 11.39 0 0 0 .546 4.91c.282.235.546.416 1.15.665.453.281.82.712.82 1.165a1.921 1.921 0 0 1-.546 1.284 2.38 2.38 0 0 1-1.15.546 11.39 11.39 0 0 0-4.91.546 2.456 2.456 0 0 1-2.503 0 11.39 11.39 0 0 0-4.91-.546"/>
              </svg>
            </Button>

            {/* Account Dropdown */}
            <AccountDropdown />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}