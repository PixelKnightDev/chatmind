import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for chat timestamps
 */
export function formatDate(input: Date | string | number): string {
  // Convert input to Date object
  let date: Date
  
  if (input instanceof Date) {
    date = input
  } else if (typeof input === 'string' || typeof input === 'number') {
    date = new Date(input)
  } else {
    // Fallback for invalid input
    return 'Unknown'
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  // For older dates, show the actual date
  return date.toLocaleDateString()
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate chat title from first message
 */
export function generateChatTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, ' ')
  return truncateText(cleaned, 50)
}

/**
 * Validate file upload
 */
export function validateFile(file: File, maxSize: number = 10): boolean {
  const maxSizeBytes = maxSize * 1024 * 1024 // Convert MB to bytes
  
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSize}MB`)
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/pdf'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported')
  }
  
  return true
}