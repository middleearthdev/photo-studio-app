import { createClient } from '@/lib/supabase/client'
import { IUploadProvider, UploadOptions, UploadResult, validateFile, generateFileName } from '../types'

export class SupabaseUploadProvider implements IUploadProvider {
  name = 'supabase' as const
  private bucket: string
  
  constructor(bucket = 'portfolio-images') {
    this.bucket = bucket
  }

  isConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return !!(url && key)
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const startTime = Date.now()
    const uploadId = Math.random().toString(36).substring(2, 8)
    
    try {
      
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Supabase not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
          provider: 'supabase'
        }
      }

      // Validate file
      const validation = validateFile(options.file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: 'supabase'
        }
      }

      const supabase = createClient()
      const path = options.path || generateFileName(options.studioId, options.file.name)
      const bucket = options.bucket || this.bucket

        bucket,
        path,
        fileSize: options.file.size,
        fileType: options.file.type
      })

      // Progress simulation
      if (options.onProgress) {
        options.onProgress(10)
        setTimeout(() => options.onProgress?.(30), 100)
        setTimeout(() => options.onProgress?.(60), 300)
      }

      // Check bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      if (bucketError) {
        console.error(`[SUPABASE-${uploadId}] Bucket check failed:`, bucketError)
        return {
          success: false,
          error: `Storage access failed: ${bucketError.message}`,
          provider: 'supabase'
        }
      }

      const targetBucket = buckets?.find(b => b.id === bucket)
      if (!targetBucket) {
        console.error(`[SUPABASE-${uploadId}] Bucket '${bucket}' not found`)
        return {
          success: false,
          error: `Bucket '${bucket}' not found. Available: ${buckets?.map(b => b.id).join(', ')}`,
          provider: 'supabase'
        }
      }

      if (options.onProgress) {
        options.onProgress(80)
      }

      // Upload file with timeout
      const uploadPromise = supabase.storage
        .from(bucket)
        .upload(path, options.file, {
          cacheControl: '3600',
          upsert: false
        })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout (30s)')), 30000)
      })

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

      if (error) {
        console.error(`[SUPABASE-${uploadId}] Upload failed:`, error)
        return {
          success: false,
          error: `Upload failed: ${error.message}`,
          provider: 'supabase'
        }
      }

      if (options.onProgress) {
        options.onProgress(95)
      }

      // Generate public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      if (!urlData.publicUrl) {
        return {
          success: false,
          error: 'Failed to generate public URL',
          provider: 'supabase'
        }
      }

      if (options.onProgress) {
        options.onProgress(100)
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        url: urlData.publicUrl,
        provider: 'supabase',
        metadata: {
          path,
          size: options.file.size,
          type: options.file.type,
          duration,
          id: data.id
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[SUPABASE-${uploadId}] Exception after ${duration}ms:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        provider: 'supabase'
      }
    }
  }

  async delete(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Supabase not configured' }
      }

      const supabase = createClient()
      
      // Extract path from URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'storage')
      
      if (bucketIndex === -1 || !pathParts[bucketIndex + 4]) {
        return { success: false, error: 'Invalid Supabase URL format' }
      }
      
      const path = pathParts.slice(bucketIndex + 4).join('/')
      
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([path])

      if (error) {
        return { success: false, error: error.message }
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