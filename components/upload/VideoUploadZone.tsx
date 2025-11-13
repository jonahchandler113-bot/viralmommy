'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, Video, X, FileVideo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']

export interface SelectedFile {
  file: File
  preview?: string
}

interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
  error?: string | null
}

export function VideoUploadZone({ onFileSelect, isUploading = false, error }: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return 'Invalid file format. Please upload MP4, MOV, AVI, MKV, or WebM files.'
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024))
      return `File is too large (${sizeMB}MB). Maximum size is 100MB.`
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    setValidationError(null)

    const error = validateFile(file)
    if (error) {
      setValidationError(error)
      return
    }

    // Create video preview thumbnail
    const url = URL.createObjectURL(file)
    setSelectedFile({ file, preview: url })
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayError = error || validationError

  if (selectedFile && !isUploading) {
    return (
      <div className="w-full">
        <div className="relative rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 transition-all">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                <FileVideo className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-gray-900 truncate">
                {selectedFile.file.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedFile.file.type}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300',
          isDragging
            ? 'border-purple-600 bg-purple-50 scale-[1.02]'
            : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50/50',
          displayError && 'border-error-400 bg-error-50/50',
          isUploading && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4 transition-transform duration-300 hover:scale-110">
            {isDragging ? (
              <Upload className="h-8 w-8 text-white animate-bounce" />
            ) : (
              <Video className="h-8 w-8 text-white" />
            )}
          </div>

          <div className="mb-2">
            <p className="text-lg font-semibold text-gray-900">
              {isDragging ? 'Drop your video here!' : 'Upload your video'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop or click to browse
            </p>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-xs text-gray-500">
              Supported formats: MP4, MOV, AVI, MKV, WebM
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: 100MB
            </p>
          </div>

          {displayError && (
            <div className="mt-4 rounded-lg bg-error-100 px-4 py-3 text-sm text-error-700 border border-error-200">
              {displayError}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
