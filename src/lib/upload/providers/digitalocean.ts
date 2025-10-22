import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { IUploadProvider, UploadOptions, UploadResult, validateFile, generateFileName } from '../types'

export class DigitalOceanSpacesProvider implements IUploadProvider {
  name = 'digitalocean' as const
  private client: S3Client | null = null
  private bucket: string
  private region: string
  private endpoint: string
  private accessKeyId: string
  private secretAccessKey: string
  private cdnEndpoint?: string

  constructor() {
    // Digital Ocean Spaces configuration
    this.region = process.env.DO_SPACES_REGION || 'nyc3'
    this.bucket = process.env.DO_SPACES_BUCKET || ''
    this.accessKeyId = process.env.DO_SPACES_ACCESS_KEY || ''
    this.secretAccessKey = process.env.DO_SPACES_SECRET_KEY || ''
    this.cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT
    
    // Digital Ocean Spaces endpoint format: https://{region}.digitaloceanspaces.com
    this.endpoint = `https://${this.region}.digitaloceanspaces.com`

    if (this.isConfigured()) {
      this.initializeClient()
    }
  }

  private initializeClient() {
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      forcePathStyle: false, // Digital Ocean Spaces uses virtual-hosted-style
    })
  }

  isConfigured(): boolean {
    return !!(
      this.bucket &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.region
    )
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const startTime = Date.now()
    const uploadId = Math.random().toString(36).substring(2, 8)

    try {
      console.log(`[DO-SPACES-${uploadId}] Starting Digital Ocean Spaces upload...`)

      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Digital Ocean Spaces not configured. Check DO_SPACES_* environment variables',
          provider: 'digitalocean'
        }
      }

      if (!this.client) {
        this.initializeClient()
      }

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
      const key = fileName.startsWith('/') ? fileName.slice(1) : fileName // Remove leading slash

      console.log(`[DO-SPACES-${uploadId}] Upload details:`, {
        bucket: this.bucket,
        key,
        endpoint: this.endpoint,
        fileSize: options.file.size,
        fileType: options.file.type
      })

      // Convert File to Buffer for S3 upload
      const fileBuffer = await this.fileToBuffer(options.file)

      // Create upload with progress tracking
      const upload = new Upload({
        client: this.client!,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: options.file.type,
          ACL: 'public-read', // Make file publicly accessible
          Metadata: {
            studioId: options.studioId,
            uploadedAt: new Date().toISOString(),
            originalName: options.file.name
          }
        }
      })

      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (options.onProgress && progress.total) {
          const percentage = Math.round((progress.loaded! / progress.total) * 100)
          options.onProgress(percentage)
        }
      })

      const result = await upload.done()
      const duration = Date.now() - startTime

      if (!result.Location) {
        return {
          success: false,
          error: 'Upload completed but no location returned',
          provider: 'digitalocean'
        }
      }

      // Generate final URL (use CDN if available, otherwise direct Spaces URL)
      let finalUrl = result.Location
      if (this.cdnEndpoint) {
        finalUrl = `${this.cdnEndpoint}/${key}`
      }

      console.log(`[DO-SPACES-${uploadId}] Upload successful in ${duration}ms:`, finalUrl)

      return {
        success: true,
        url: finalUrl,
        provider: 'digitalocean',
        metadata: {
          path: key,
          size: options.file.size,
          type: options.file.type,
          duration,
          location: result.Location,
          etag: result.ETag
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[DO-SPACES-${uploadId}] Exception after ${duration}ms:`, error)

      let errorMessage = 'Digital Ocean Spaces upload failed'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Handle specific S3/Spaces errors
        if (error.message.includes('AccessDenied')) {
          errorMessage = 'Access denied. Check your Digital Ocean Spaces credentials and permissions'
        } else if (error.message.includes('NoSuchBucket')) {
          errorMessage = `Bucket '${this.bucket}' does not exist or is not accessible`
        } else if (error.message.includes('InvalidAccessKeyId')) {
          errorMessage = 'Invalid Digital Ocean Spaces access key'
        } else if (error.message.includes('SignatureDoesNotMatch')) {
          errorMessage = 'Invalid Digital Ocean Spaces secret key'
        }
      }

      return {
        success: false,
        error: errorMessage,
        provider: 'digitalocean'
      }
    }
  }

  async delete(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[DO-SPACES] Deleting file:`, url)

      if (!this.isConfigured() || !this.client) {
        return {
          success: false,
          error: 'Digital Ocean Spaces not configured'
        }
      }

      // Extract key from URL
      let key = ''
      
      if (this.cdnEndpoint && url.startsWith(this.cdnEndpoint)) {
        // Extract from CDN URL
        key = url.replace(this.cdnEndpoint + '/', '')
      } else if (url.includes('.digitaloceanspaces.com/')) {
        // Extract from direct Spaces URL
        const urlParts = url.split('.digitaloceanspaces.com/')
        if (urlParts.length > 1) {
          key = urlParts[1]
        }
      } else {
        return {
          success: false,
          error: 'Invalid Digital Ocean Spaces URL format'
        }
      }

      if (!key) {
        return {
          success: false,
          error: 'Could not extract file key from URL'
        }
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })

      await this.client.send(command)

      console.log(`[DO-SPACES] Successfully deleted file: ${key}`)
      return { success: true }

    } catch (error) {
      console.error('[DO-SPACES] Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Digital Ocean Spaces delete failed'
      }
    }
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // Utility method to test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Digital Ocean Spaces not configured'
        }
      }

      if (!this.client) {
        this.initializeClient()
      }

      // Try to list objects in bucket (just to test connectivity)
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1
      })

      await this.client!.send(command)
      
      return { success: true }

    } catch (error) {
      let errorMessage = 'Connection test failed'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}