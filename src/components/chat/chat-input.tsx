'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PaperPlaneIcon, StopIcon, Cross2Icon } from '@radix-ui/react-icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Textarea } from '../ui/textarea'
import { UploadcareButton } from '@/components/ui/uploadcare-upload'

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
  uploadcareUuid?: string
}

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent, attachedFiles?: UploadedFile[]) => void
  isLoading: boolean
  onStop: () => void
  disabled?: boolean
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
  disabled
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && (input.trim() || attachedFiles.length > 0)) {
        handleSubmit(e as any, attachedFiles)
        setAttachedFiles([]) // Clear files after sending
      }
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disabled && (input.trim() || attachedFiles.length > 0)) {
      handleSubmit(e, attachedFiles)
      setAttachedFiles([]) // Clear files after sending
    }
  }

  // Handle files selected from Uploadcare
  const handleFilesSelected = (files: UploadedFile[]) => {
    console.log('Files selected from Uploadcare:', files.length)
    setAttachedFiles(prev => [...prev, ...files])
    toast.success(`${files.length} file(s) added`)
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      )
    }
    if (type === 'application/pdf') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="12" y1="9" x2="8" y2="9"/>
      </svg>
    )
  }

  return (
    <form onSubmit={handleFormSubmit} className="w-full">
      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-[#404040] rounded-lg p-2 text-sm"
            >
              <div className="text-white/70">
                {getFileIcon(file.type)}
              </div>
              <div className="flex flex-col">
                <span className="text-white/90 text-xs font-medium truncate max-w-32">
                  {file.originalName}
                </span>
                <span className="text-white/50 text-xs">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-4 w-4 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
              >
                <Cross2Icon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Single rounded container with everything inside */}
      <div className="bg-[#303030] rounded-2xl border-[#565869] focus-within:border-white/20 transition-colors p-3">
        {/* Text Input Area */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          disabled={disabled}
          className={cn(
            "w-full min-h-[20px] max-h-[100px] resize-none border-0 bg-transparent px-0 py-0 mb-2 text-white placeholder-white/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-5",
            "focus:outline-none"
          )}
          rows={1}
        />

        {/* Button Row Inside the same container */}
        <div className="flex items-center justify-between">
          {/* Left side buttons */}
          <div className="flex items-center gap-1">
            {/* Uploadcare Plus button */}
            <UploadcareButton
              onFilesSelected={handleFilesSelected}
              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            />

            {/* Tools button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10 gap-1 rounded-md"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Tools
            </Button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-1">
            {/* Voice input buttons */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </Button>

            {/* Send/Stop Button */}
            {isLoading ? (
              <Button
                type="button"
                onClick={onStop}
                size="sm"
                className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 text-white rounded-md"
              >
                <StopIcon className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={disabled || (!input.trim() && attachedFiles.length === 0)}
                size="sm"
                className="h-6 w-6 p-0 bg-white hover:bg-white/90 text-black rounded-md disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-white/20"
              >
                <PaperPlaneIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}