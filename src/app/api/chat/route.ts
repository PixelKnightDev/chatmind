// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@ai-sdk/groq'
import { streamText, generateText } from 'ai'

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
  uploadcareUuid?: string
}

// Memory service import
async function getMemoryService() {
  try {
    const { mem0Service } = await import('@/lib/mem0')
    return mem0Service
  } catch (error) {
    console.warn('Memory service not available:', error)
    return null
  }
}

// Generate file context for AI
function generateFileContext(attachments: UploadedFile[]): string {
  if (!attachments || attachments.length === 0) return ''
  
  const images = attachments.filter((f: UploadedFile) => f.type.startsWith('image/'))
  const documents = attachments.filter((f: UploadedFile) => !f.type.startsWith('image/'))
  
  let context = '\n\n=== ATTACHED FILES ===\n'
  
  if (images.length > 0) {
    context += `\nIMAGES (${images.length}):\n`
    images.forEach((img, index) => {
      context += `${index + 1}. ${img.originalName} (${img.type})\n   URL: ${img.url}\n`
    })
  }
  
  if (documents.length > 0) {
    context += `\nDOCUMENTS (${documents.length}):\n`
    documents.forEach((doc, index) => {
      context += `${index + 1}. ${doc.originalName} (${doc.type}) - ${formatFileSize(doc.size)}\n   URL: ${doc.url}\n`
    })
  }
  
  context += '\n=== END FILES ===\n'
  return context
}

// Format file size helper
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Extract content from text files
async function extractTextContent(file: UploadedFile): Promise<string | null> {
  // Only try to extract from text-based files
  if (!file.type.includes('text/') && !file.type.includes('json')) {
    return null
  }
  
  try {
    const response = await fetch(file.url)
    if (response.ok) {
      const text = await response.text()
      return text.length > 5000 ? text.substring(0, 5000) + '...[truncated]' : text
    }
  } catch (error) {
    console.warn(`Could not extract content from ${file.originalName}:`, error)
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      userId = 'default_user', 
      chatId, 
      model = 'llama3-8b-8192', 
      stream = false,
      attachments 
    } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      )
    }

    console.log(`Processing ${messages.length} messages for user ${userId}`, {
      model,
      stream,
      attachments: attachments?.length || 0
    })

    // Get memory service (optional)
    const memory = await getMemoryService()

    // Process the last message if it has attachments
    let enhancedMessages = [...messages]
    if (attachments && attachments.length > 0) {
      const lastMessage = messages[messages.length - 1]
      
      // Generate file context
      const fileContext = generateFileContext(attachments)
      
      // Try to extract content from text files
      const textContents: string[] = []
      for (const file of attachments) {
        const content = await extractTextContent(file)
        if (content) {
          textContents.push(`\n--- Content of ${file.originalName} ---\n${content}\n--- End of ${file.originalName} ---`)
        }
      }
      
      // Enhance the last message
      let enhancedContent = lastMessage.content + fileContext
      
      if (textContents.length > 0) {
        enhancedContent += '\n\nFILE CONTENTS:\n' + textContents.join('\n')
      }
      
      enhancedMessages[enhancedMessages.length - 1] = {
        ...lastMessage,
        content: enhancedContent
      }
    }

    // Retrieve relevant memories if available
    let memoryContext = ''
    if (memory) {
      try {
        const searchQuery = enhancedMessages[enhancedMessages.length - 1]?.content || ''
        const memories = await memory.searchMemories(searchQuery, userId, 5)

        if (memories && memories.length > 0) {
          memoryContext = `\n\nRelevant context from previous conversations:\n${memories
            .map((mem: any) => `- ${mem.memory}`)
            .join('\n')}`
        }
      } catch (memoryError) {
        console.warn('Memory retrieval failed:', memoryError)
      }
    }

    // Create system message
    let systemMessage = `You are a helpful AI assistant. Be concise, accurate, and friendly.${memoryContext}`
    
    if (attachments && attachments.length > 0) {
      const images = attachments.filter((f: UploadedFile) => f.type.startsWith('image/'))
      const documents = attachments.filter((f: UploadedFile) => !f.type.startsWith('image/'))
      const hasImages = images.length > 0
      const hasDocs = documents.length > 0
      
      systemMessage += '\n\nThe user has shared files with you:'
      
      if (hasImages) {
        systemMessage += '\n- Images: I can see the URLs and filenames. While I cannot directly view the images with this model, I can help based on the context and filenames provided.'
      }
      
      if (hasDocs) {
        systemMessage += '\n- Documents: I can see filenames, types, and have extracted text content where possible. Reference this information in your response.'
      }
      
      systemMessage += '\n\nPlease acknowledge the files and provide relevant assistance based on the file information provided.'
    }

    if (stream) {
      // Streaming response
      try {
        const result = await streamText({
          model: groq(model),
          system: systemMessage,
          messages: enhancedMessages,
          temperature: 0.7,
          maxTokens: 2048,
        })

        // Convert to Server-Sent Events format
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const delta of result.textStream) {
                const data = `data: ${JSON.stringify({
                  choices: [{
                    delta: {
                      content: delta
                    }
                  }]
                })}\n\n`
                controller.enqueue(encoder.encode(data))
              }
              
              // Send completion signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            } catch (error) {
              console.error('Streaming error:', error)
              controller.error(error)
            }
          },
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (streamError) {
        console.error('Streaming failed, falling back to non-streaming:', streamError)
        // Fall through to non-streaming response
      }
    }

    // Non-streaming response
    const result = await generateText({
      model: groq(model),
      system: systemMessage,
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: 2048,
    })

    // Store the conversation in memory if available
    if (memory) {
      try {
        const userMessage = enhancedMessages[enhancedMessages.length - 1]
        if (userMessage) {
          // Store user message (with file context for memory)
          let userContent = userMessage.content
          if (attachments && attachments.length > 0) {
            userContent += ` [Shared ${attachments.length} files: ${attachments.map((f: UploadedFile) => f.originalName).join(', ')}]`
          }
          
          await memory.processAndStoreMessage(userContent, 'user', userId, chatId)
          
          // Store assistant response
          let assistantContent = result.text
          if (attachments && attachments.length > 0) {
            assistantContent += ` [Responded to message with ${attachments.length} files]`
          }
          
          await memory.processAndStoreMessage(assistantContent, 'assistant', userId, chatId)
          
          console.log(`Stored conversation with ${attachments?.length || 0} files in memory for user: ${userId}`)
        }
      } catch (memoryError) {
        console.warn('Memory storage failed:', memoryError)
      }
    }

    // Return in OpenAI-compatible format
    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.text,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: result.usage?.promptTokens || 0,
        completion_tokens: result.usage?.completionTokens || 0,
        total_tokens: (result.usage?.promptTokens || 0) + (result.usage?.completionTokens || 0),
      },
    })

  } catch (error: any) {
    console.error('Chat API error:', error)

    // Handle specific errors
    if (error?.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again in a moment.',
          type: 'rate_limit_error'
        },
        { status: 429 }
      )
    }

    if (error?.message?.includes('context') || error?.message?.includes('token')) {
      return NextResponse.json(
        { 
          error: 'Message too long. Please try a shorter message or fewer files.',
          type: 'context_length_error'
        },
        { status: 400 }
      )
    }

    if (error?.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'AI service configuration error.',
          type: 'auth_error'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        type: 'internal_error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}