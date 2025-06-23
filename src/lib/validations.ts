import { z } from 'zod'

/**
 * Message validation schema
 */
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
  createdAt: z.date(),
  metadata: z.object({
    model: z.string().optional(),
    tokens: z.number().optional(),
    images: z.array(z.string()).optional(),
    files: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Chat validation schema
 */
export const chatSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Chat title cannot be empty').max(100, 'Chat title too long'),
  messages: z.array(messageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  archived: z.boolean().optional(),
  pinned: z.boolean().optional(),
})

/**
 * Chat settings validation schema
 */
export const chatSettingsSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8192),
  systemPrompt: z.string().max(1000, 'System prompt too long').optional(),
})

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  files: z.array(z.instanceof(File)).max(5, 'Too many files'),
})

/**
 * Memory validation schema
 */
export const memorySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  messages: z.array(messageSchema),
  query: z.string().optional(),
})

/**
 * API response validation schema
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

/**
 * Environment variables validation
 */
export const envSchema = z.object({
  // Required environment variables
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  
  // Optional environment variables
  ANTHROPIC_API_KEY: z.string().optional(),
  MEM0_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: z.string().optional(),
  UPLOADCARE_SECRET_KEY: z.string().optional(),
})

/**
 * Validate environment variables
 */
export function validateEnv() {
  try {
    envSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    throw new Error('Invalid environment configuration')
  }
}

/**
 * Utility function to validate data with proper error handling
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Validation failed: ${errorMessages}`)
    }
    throw error
  }
}

/**
 * File validation utilities
 */
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${this.maxSize / (1024 * 1024)}MB`
      }
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      }
    }
    
    return { valid: true }
  }
}