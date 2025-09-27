import { createClient } from '@/lib/supabase/client'

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

// Main upload function following Supabase docs
export const uploadFile = async ({
  bucket,
  path,
  file,
  onProgress
}: UploadOptions): Promise<UploadResult> => {
  try {
    const supabase = createClient()

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

    // Progress simulation (Supabase doesn't provide native progress for uploads)
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


    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: false,            // akan error 409 kalau file sudah ada
        contentType: fileToUpload.type || 'application/octet-stream', // bantu deteksi MIME
      });

    if (error) {
      console.error('[UPLOAD ERROR]', {
        name: error.name,
        message: error.message,
        status: (error as any).status,
      });
      // optional: lempar biar ketangkep di error boundary
      throw error;
    }

    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval)
    }

    // if (error) {
    //   return {
    //     data: null,
    //     error: new Error(error.message)
    //   }
    // }

    // Complete progress
    if (onProgress) {
      onProgress(100)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      data,
      error: null,
      publicUrl: urlData.publicUrl
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
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    return { error: error ? new Error(error.message) : null }

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
    const bucketIndex = pathParts.findIndex(part => part === 'storage')

    if (bucketIndex !== -1 && pathParts[bucketIndex + 4]) {
      return pathParts.slice(bucketIndex + 4).join('/')
    }

    return null
  } catch {
    return null
  }
}