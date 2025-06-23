import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A pixel-perfect ChatGPT clone built with Next.js, TypeScript, and Tailwind CSS',
  keywords: ['AI', 'Chat', 'GPT', 'Assistant', 'Next.js'],
  authors: [{ name: 'ChatGPT Clone Team' }],
}

// NEW: Separate viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {/* Add Toaster for file upload notifications */}
            <Toaster 
              theme="dark" 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#fff',
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}