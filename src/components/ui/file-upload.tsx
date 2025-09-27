"use client"

import * as React from "react"
import { Upload, X, Image, FileImage, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useFileUpload } from "@/hooks/use-file-upload"

export interface FileUploadProps {
  studioId: string
  bucket?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  disabled?: boolean
  accept?: string
  maxSize?: number // in MB
  placeholder?: string
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(({
  studioId,
  bucket,
  value,
  onValueChange,
  className,
  disabled = false,
  accept = "image/*",
  maxSize = 10,
  placeholder = "Drop files here or click to upload"
}, ref) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)

  const { isUploading, progress, url, error, upload, remove, setUrl } = useFileUpload({
    bucket,
    studioId,
    onSuccess: (uploadedUrl) => {
      onValueChange?.(uploadedUrl)
    },
    showToast: true
  })

  // Set initial URL
  React.useEffect(() => {
    if (value && value !== url) {
      setUrl(value)
    }
  }, [value, url, setUrl])

  const handleFileSelect = React.useCallback((file: File) => {
    if (disabled || isUploading) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      return
    }

    upload(file)
  }, [disabled, isUploading, maxSize, upload])

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    const file = files.find(f => f.type.startsWith('image/'))
    
    if (file) {
      handleFileSelect(file)
    }
  }, [disabled, isUploading, handleFileSelect])

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleRemove = React.useCallback(async () => {
    await remove()
    onValueChange?.('')
  }, [remove, onValueChange])

  const openFileDialog = React.useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, isUploading])

  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!url ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-accent/50",
            isDragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive/50 bg-destructive/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={progress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{placeholder}</p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: {maxSize}MB
                </p>
              </div>
              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative group rounded-lg overflow-hidden border">
          <div className="aspect-video relative">
            <img
              src={url}
              alt="Uploaded file"
              className="object-cover w-full h-full"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openFileDialog}
                disabled={disabled || isUploading}
              >
                <Image className="h-4 w-4 mr-1" />
                Change
              </Button>
              
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>

          {/* Success indicator */}
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <FileImage className="h-3 w-3" />
              Uploaded
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

FileUpload.displayName = "FileUpload"