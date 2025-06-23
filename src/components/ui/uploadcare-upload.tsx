'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Cross2Icon, PlusIcon, UploadIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UploadedFile {
  originalName: string
  size: number
  type: string
  url: string
  publicId: string
  uploadcareUuid?: string
}

interface SimpleUploadcareProps {
  onFilesSelected: (files: UploadedFile[]) => void
  maxFiles?: number
  className?: string
}

export function SimpleUploadcare({ 
  onFilesSelected, 
  maxFiles = 5,
  className 
}: SimpleUploadcareProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): boolean => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
      return false
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type ${file.type} is not supported.`)
      return false
    }

    return true
  }

  const uploadToUploadcare = async (file: File) => {
    const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY
    console.log('Uploadcare Public Key:', publicKey ? 'Set' : 'NOT SET')
    
    if (!publicKey) {
      throw new Error('Uploadcare public key not configured')
    }

    const formData = new FormData()
    formData.append('UPLOADCARE_PUB_KEY', publicKey)
    formData.append('file', file)

    console.log('Uploading to Uploadcare...', file.name)

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData,
    })

    console.log('Uploadcare response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Uploadcare error:', errorText)
      throw new Error('Uploadcare upload failed: ' + errorText)
    }

    const result = await response.json()
    console.log('Uploadcare result:', result)
    
    return {
      uuid: result.file,
      cdnUrl: `https://ucarecdn.com/${result.file}/`,
      name: file.name,
      size: file.size,
      mimeType: file.type
    }
  }

  const transferToCloudinary = async (uploadcareFile: any): Promise<UploadedFile> => {
    console.log('Transferring to Cloudinary...', uploadcareFile.name)
    
    const response = await fetch('/api/upload/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadcareUrl: uploadcareFile.cdnUrl,
        fileName: uploadcareFile.name,
        fileSize: uploadcareFile.size,
        mimeType: uploadcareFile.mimeType,
        uploadcareUuid: uploadcareFile.uuid
      }),
    })

    console.log('Transfer response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Transfer error:', errorText)
      throw new Error('Failed to transfer to Cloudinary: ' + errorText)
    }

    const result = await response.json()
    console.log('Transfer result:', result)
    
    return result.file
  }

  const handleFiles = async (files: FileList | null) => {
    console.log('handleFiles called with:', files?.length, 'files')
    
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(validateFile)

    console.log('Valid files:', validFiles.length)

    if (validFiles.length === 0) return
    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed.`)
      return
    }

    setIsUploading(true)
    const processedFiles: UploadedFile[] = []

    try {
      for (const file of validFiles) {
        console.log('Processing file:', file.name)
        
        // Upload to Uploadcare first
        const uploadcareFile = await uploadToUploadcare(file)
        
        // Then transfer to Cloudinary
        const cloudinaryFile = await transferToCloudinary(uploadcareFile)
        processedFiles.push(cloudinaryFile)
      }

      const newFiles = [...selectedFiles, ...processedFiles]
      setSelectedFiles(newFiles)
      onFilesSelected(newFiles)
      toast.success(`${processedFiles.length} file(s) uploaded successfully`)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
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
    console.log('File input changed')
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
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
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="14,2 L6,2 C4.89,2 4,2.89 4,4 L4,20 C4,21.11 4.89,22 6,22 L18,22 C19.11,22 20,21.11 20,20 L20,8 L14,2 Z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    )
  }

  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Upload Files</h3>
        <p className="text-sm text-white/60">Uploadcare + Cloudinary</p>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-white/30 hover:border-white/50 bg-white/5'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          console.log('Drop zone clicked')
          fileInputRef.current?.click()
        }}
      >
        <UploadIcon className="h-8 w-8 mx-auto mb-2 text-white/60" />
        <p className="text-sm text-white/80 mb-2">
          {isUploading ? 'Uploading...' : 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-xs text-white/50">
          Max {maxFiles} files, 10MB each • Images, PDFs, Documents
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.csv,.docx,.xlsx"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Loading indicator */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <span className="ml-2 text-sm text-blue-300">
            Processing uploads via Uploadcare...
          </span>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-white/10 rounded-lg"
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="text-white/70">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{file.originalName}</p>
                <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white"
              >
                <Cross2Icon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Button trigger component with better positioning
export function UploadcareButton({ 
  onFilesSelected, 
  className,
  children 
}: {
  onFilesSelected: (files: UploadedFile[]) => void
  className?: string
  children?: React.ReactNode
}) {
  const [showUploader, setShowUploader] = useState(false)

  const handleFilesSelected = (files: UploadedFile[]) => {
    console.log('Files selected:', files.length)
    onFilesSelected(files)
    setShowUploader(false)
  }

  const handleButtonClick = () => {
    console.log('Plus button clicked, showUploader:', showUploader)
    setShowUploader(true)
  }

  if (showUploader) {
    console.log('Rendering uploader UI')
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowUploader(false)}
        />
        
        {/* Modal */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto">
          <div className="bg-[#2a2a2a] border border-white/20 rounded-lg shadow-2xl">
            <SimpleUploadcare onFilesSelected={handleFilesSelected} />
            <div className="p-4 border-t border-white/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Cancel clicked')
                  setShowUploader(false)
                }}
                className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className={className}
      >
        {children || <PlusIcon className="h-3 w-3" />}
      </Button>
    </div>
  )
}