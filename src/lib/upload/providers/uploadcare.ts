import { IUploadProvider, UploadOptions, UploadResult, validateFile } from '../types'

export class UploadCareProvider implements IUploadProvider {
  name = 'uploadcare' as const
  private publicKey: string
  private baseUrl = 'https://upload.uploadcare.com'
  private cdnUrl = 'https://ucarecdn.com'

  constructor() {
    this.publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || ''
  }

  isConfigured(): boolean {
    return !!this.publicKey
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const startTime = Date.now()
    const uploadId = Math.random().toString(36).substring(2, 8)

    try {

      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'UploadCare not configured. Check NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY',
          provider: 'uploadcare'
        }
      }

      // Validate file
      const validation = validateFile(options.file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: 'uploadcare'
        }
      }

      // Log upload attempt for debugging
      console.log('Uploadcare upload attempt:', {
        publicKey: this.publicKey.substring(0, 8) + '...',
        fileSize: options.file.size,
        fileType: options.file.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('UPLOADCARE_PUB_KEY', this.publicKey)
      formData.append('file', options.file)
      formData.append('UPLOADCARE_STORE', '1') // Store file permanently

      // Add metadata
      const metadata = {
        studioId: options.studioId,
        uploadedAt: new Date().toISOString()
      }
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value)
      })

      // Progress simulation
      if (options.onProgress) {
        options.onProgress(10)
        setTimeout(() => options.onProgress?.(30), 100)
        setTimeout(() => options.onProgress?.(60), 300)
      }

      // Upload with progress tracking
      const result = await this.uploadWithProgress(formData, options.onProgress)

      const duration = Date.now() - startTime

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'UploadCare upload failed',
          provider: 'uploadcare'
        }
      }

      // Generate CDN URL
      const cdnUrl = `${this.cdnUrl}/${result.fileId}/`

      return {
        success: true,
        url: cdnUrl,
        provider: 'uploadcare',
        metadata: {
          id: result.fileId,
          size: options.file.size,
          type: options.file.type,
          duration
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[UPLOADCARE-${uploadId}] Exception after ${duration}ms:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'UploadCare upload failed',
        provider: 'uploadcare'
      }
    }
  }

  private uploadWithProgress(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 80) + 10 // 10-90%
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (onProgress) onProgress(95)

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            
            if (response.file) {
              if (onProgress) onProgress(100)
              resolve({
                success: true,
                fileId: response.file
              })
            } else {
              resolve({
                success: false,
                error: 'No file ID returned from UploadCare'
              })
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Invalid UploadCare response'
            })
          }
        } else {
          let errorMessage = `UploadCare error: ${xhr.status}`
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            errorMessage = errorResponse.error?.detail || errorMessage
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
          error: 'Network error during UploadCare upload'
        })
      })

      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'UploadCare upload timeout'
        })
      })

      // Set timeout
      xhr.timeout = 60000 // 60 seconds for UploadCare

      xhr.open('POST', `${this.baseUrl}/base/`)
      xhr.send(formData)
    })
  }

  async delete(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[UPLOADCARE] Deleting file:`, url)

      // Extract file ID from URL
      const fileIdMatch = url.match(/\/([a-f0-9-]{36})\//i)
      if (!fileIdMatch) {
        return {
          success: false,
          error: 'Invalid UploadCare URL format'
        }
      }

      const fileId = fileIdMatch[1]
      
      // UploadCare requires secret key for deletion
      const secretKey = process.env.UPLOADCARE_SECRET_KEY
      if (!secretKey) {
        console.warn('[UPLOADCARE] No secret key configured, cannot delete file')
        return {
          success: false,
          error: 'UploadCare secret key not configured for deletion'
        }
      }

      // Create delete request with authentication
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signature = await this.createSignature('DELETE', `/files/${fileId}/`, timestamp, secretKey)

      const response = await fetch(`https://api.uploadcare.com/files/${fileId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Uploadcare.Simple ${this.publicKey}:${signature}`,
          'Date': new Date(parseInt(timestamp) * 1000).toUTCString()
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || `Delete failed: ${response.status}`
        }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'UploadCare delete failed'
      }
    }
  }

  private async createSignature(method: string, uri: string, timestamp: string, secretKey: string): Promise<string> {
    const content = [method, uri, this.publicKey, timestamp].join('\n')
    
    // Simple HMAC-SHA1 signature (in production, use crypto library)
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const key = encoder.encode(secretKey)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}