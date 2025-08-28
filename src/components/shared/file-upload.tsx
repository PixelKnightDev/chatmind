'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  UploadIcon, 
  Cross1Icon, 
  FileIcon, 
  ImageIcon, 
  VideoIcon
} from '@radix-ui/react-icons'

interface FileUploadProps {
  onUpload: (files: File[]) => void
  onClose: () => void
  className?: string
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
}

export function FileUpload({
  onUpload,
  onClose,
  className,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/*', 'text/*', 'application/pdf', '.doc', '.docx']
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize Uploadcare widget if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // TODO: Initialize Uploadcare widget for advanced file handling
      // This would integrate with Uploadcare's file upload service
      console.log('Uploadcare widget initialization placeholder')
    }
  }, [])

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
      return false
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      setError(`File type ${file.type} is not supported.`)
      return false
    }

    return true
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []

    for (const file of fileArray) {
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed.`)
        break
      }

      if (validateFile(file)) {
        validFiles.push(file)
        setError(null)
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      // Upload to Cloudinary via our API
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          onUpload(result.files)
        } else {
          setError('Upload failed. Please try again.')
        }
      } catch {
        setError('Upload failed. Please try again.')
      }
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    if (file.type.startsWith('video/')) {
      return <VideoIcon className="h-4 w-4" />
    }
    return <FileIcon className="h-4 w-4" />
  }

  return (
    <div className={cn(
      'bg-popover border border-border rounded-lg shadow-lg p-4',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upload Files</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Cross1Icon className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary underline hover:no-underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {maxSize}MB each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-accent/50 rounded"
              >
                {getFileIcon(file)}
                <span className="flex-1 text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <Cross1Icon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpload} className="flex-1">
              Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedFiles([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}