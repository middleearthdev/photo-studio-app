import { IUploadProvider, UploadOptions, UploadResult, validateFile, generateFileName } from '../types'

export class DigitalOceanClientProvider implements IUploadProvider {
  name = 'digitalocean' as const
  private endpoint: string
  private apiKey?: string

  constructor() {
    this.endpoint = '/api/upload/digitalocean'
    this.apiKey = process.env.UPLOAD_API_KEY
  }

  isConfigured(): boolean {
    // For client-side, we assume it's configured if the NEXT_PUBLIC_UPLOAD_DESTINATION is set to digitalocean
    // The actual validation happens on the server side
    return true
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const startTime = Date.now()
    const uploadId = Math.random().toString(36).substring(2, 8)

    try {
      console.log(`[DO-SPACES-CLIENT-${uploadId}] Starting Digital Ocean Spaces upload via API...`)

      // Validate file
      const validation = validateFile(options.file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: 'digitalocean'
        }
      }

      const fileName = options.path || generateFileName(options.studioId, options.file.name)
      
      console.log(`[DO-SPACES-CLIENT-${uploadId}] Upload details:`, {
        endpoint: this.endpoint,
        fileName,
        fileSize: options.file.size,
        fileType: options.file.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', options.file)
      formData.append('studioId', options.studioId)
      formData.append('path', fileName)

      // Upload with XMLHttpRequest for progress tracking
      const result = await this.uploadWithProgress(formData, options.onProgress)

      const duration = Date.now() - startTime

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Digital Ocean Spaces upload failed',
          provider: 'digitalocean'
        }
      }

      console.log(`[DO-SPACES-CLIENT-${uploadId}] Upload successful in ${duration}ms:`, result.url)

      return {
        success: true,
        url: result.url!,
        provider: 'digitalocean',
        metadata: {
          path: fileName,
          size: options.file.size,
          type: options.file.type,
          duration,
          ...(result.metadata && result.metadata)
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[DO-SPACES-CLIENT-${uploadId}] Exception after ${duration}ms:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Digital Ocean Spaces upload failed',
        provider: 'digitalocean'
      }
    }
  }

  private uploadWithProgress(
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string; metadata?: any }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
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
              url: response.url,
              metadata: response.metadata
            })
          } catch {
            resolve({
              success: false,
              error: 'Invalid server response'
            })
          }
        } else {
          let errorMessage = `Digital Ocean Spaces error: ${xhr.status}`
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
          error: 'Network error during Digital Ocean Spaces upload'
        })
      })

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Digital Ocean Spaces upload timeout'
        })
      })

      // Set timeout
      xhr.timeout = 60000 // 60 seconds for large files

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
      console.log(`[DO-SPACES-CLIENT] Deleting file:`, url)

      const response = await fetch('/api/upload/digitalocean', {
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

      console.log(`[DO-SPACES-CLIENT] Successfully deleted file: ${url}`)
      return { success: true }

    } catch (error) {
      console.error('[DO-SPACES-CLIENT] Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Digital Ocean Spaces delete failed'
      }
    }
  }
}