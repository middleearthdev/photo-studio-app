// Types
export interface UploadOptions {
  bucket: string
  path: string
  file: File
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  data: {
    path: string
    id: string
    fullPath: string
  } | null
  error: Error | null
  publicUrl?: string
}

// Constants
export const STORAGE_BUCKETS = {
  PORTFOLIO: 'portfolio-images',
  AVATARS: 'avatars'
} as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Validation
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'
    }
  }

  return { valid: true }
}

// Generate unique file path
export const generateFilePath = (studioId: string, fileName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${studioId}/${timestamp}-${random}.${extension}`
}

// Resize image if needed
export const resizeImage = (file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const { width, height } = img
      let { width: newWidth, height: newHeight } = img

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        newWidth = width * ratio
        newHeight = height * ratio
      }

      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Main upload function using server endpoint
export const uploadFile = async ({
  bucket,
  path,
  file,
  onProgress
}: UploadOptions): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        data: null,
        error: new Error(validation.error)
      }
    }

    // Resize if needed (for images > 1MB)
    let fileToUpload = file
    if (file.size > 1024 * 1024 && file.type.startsWith('image/')) {
      try {
        console.log("resize")
        fileToUpload = await resizeImage(file)
      } catch (resizeError) {
        console.warn('Image resize failed, uploading original:', resizeError)
      }
    }

    // Progress simulation
    let progressInterval: NodeJS.Timeout | null = null
    if (onProgress) {
      let progress = 10
      progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += 10
          onProgress(progress)
        }
      }, 200)
    }

    console.log("upload")

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('bucket', bucket)
    formData.append('path', path)

    // Upload to server endpoint
    const uploadEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || '/api/upload'
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...(process.env.UPLOAD_API_KEY && {
          'Authorization': `Bearer ${process.env.UPLOAD_API_KEY}`
        })
      }
    })

    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval)
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    // Complete progress
    if (onProgress) {
      onProgress(100)
    }

    // Construct public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const publicUrl = `${baseUrl}/uploads/${bucket}/${path}`

    return {
      data: {
        path: result.path || path,
        id: result.id || path,
        fullPath: result.fullPath || `${bucket}/${path}`
      },
      error: null,
      publicUrl
    }

  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Upload failed')
    }
  }
}

// Delete file
export const deleteFile = async (bucket: string, path: string): Promise<{ error: Error | null }> => {
  try {
    const deleteEndpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || '/api/upload'
    const response = await fetch(`${deleteEndpoint}?bucket=${bucket}&path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
      headers: {
        ...(process.env.UPLOAD_API_KEY && {
          'Authorization': `Bearer ${process.env.UPLOAD_API_KEY}`
        })
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete failed: ${response.status} ${errorText}`)
    }

    return { error: null }

  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Delete failed')
    }
  }
}

// Extract path from URL
export const getPathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const uploadsIndex = pathParts.findIndex(part => part === 'uploads')

    if (uploadsIndex !== -1 && pathParts[uploadsIndex + 2]) {
      return pathParts.slice(uploadsIndex + 2).join('/')
    }

    return null
  } catch {
    return null
  }
}