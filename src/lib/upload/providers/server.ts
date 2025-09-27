import { IUploadProvider, UploadOptions, UploadResult, validateFile, generateFileName } from '../types'

export class ServerUploadProvider implements IUploadProvider {
  name = 'server' as const
  private endpoint: string
  private apiKey?: string

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || '/api/upload'
    this.apiKey = process.env.UPLOAD_API_KEY
  }

  isConfigured(): boolean {
    // Server upload always available (using current project)
    return true
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const startTime = Date.now()
    const uploadId = Math.random().toString(36).substring(2, 8)

    try {
      console.log(`[SERVER-${uploadId}] Starting server upload...`)

      // Validate file
      const validation = validateFile(options.file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: 'server'
        }
      }

      const fileName = options.path || generateFileName(options.studioId, options.file.name)
      
      console.log(`[SERVER-${uploadId}] Upload details:`, {
        endpoint: this.endpoint,
        fileName,
        fileSize: options.file.size,
        fileType: options.file.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', options.file)
      formData.append('studioId', options.studioId)
      formData.append('fileName', fileName)

      // Progress simulation
      if (options.onProgress) {
        options.onProgress(10)
        setTimeout(() => options.onProgress?.(30), 100)
        setTimeout(() => options.onProgress?.(50), 200)
        setTimeout(() => options.onProgress?.(80), 500)
      }

      // Upload with XMLHttpRequest for progress tracking
      const result = await this.uploadWithProgress(formData, options.onProgress)

      const duration = Date.now() - startTime
      console.log(`[SERVER-${uploadId}] Upload completed in ${duration}ms`)

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Server upload failed',
          provider: 'server'
        }
      }

      return {
        success: true,
        url: result.url,
        provider: 'server',
        metadata: {
          path: fileName,
          size: options.file.size,
          type: options.file.type,
          duration
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[SERVER-${uploadId}] Exception after ${duration}ms:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Server upload failed',
        provider: 'server'
      }
    }
  }

  private uploadWithProgress(
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 90) + 10 // 10-100%
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (onProgress) onProgress(100)

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve({
              success: true,
              url: response.url
            })
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Invalid server response'
            })
          }
        } else {
          let errorMessage = `Server error: ${xhr.status}`
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            errorMessage = errorResponse.error || errorMessage
          } catch {
            // Use default error message
          }
          resolve({
            success: false,
            error: errorMessage
          })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload'
        })
      })

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Upload timeout'
        })
      })

      // Set timeout
      xhr.timeout = 30000 // 30 seconds

      // Add API key if available
      if (this.apiKey) {
        xhr.setRequestHeader('X-API-Key', this.apiKey)
      }

      xhr.open('POST', this.endpoint)
      xhr.send(formData)
    })
  }

  async delete(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[SERVER] Deleting file:`, url)

      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey })
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `Delete failed: ${response.status}`
        }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }
}