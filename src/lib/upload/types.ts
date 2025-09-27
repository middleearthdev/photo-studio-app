// Upload Provider Types & Interfaces

export type UploadProvider = 'supabase' | 'server' | 'uploadcare'

export interface UploadOptions {
  file: File
  path?: string
  studioId: string
  onProgress?: (progress: number) => void
  bucket?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  provider?: UploadProvider
  metadata?: {
    path?: string
    size?: number
    type?: string
    duration?: number
    id?: string
  }
}

export interface UploadProviderConfig {
  provider: UploadProvider
  fallbacks?: UploadProvider[]
  options?: Record<string, any>
}

export interface IUploadProvider {
  name: UploadProvider
  upload(options: UploadOptions): Promise<UploadResult>
  delete?(url: string): Promise<{ success: boolean; error?: string }>
  isConfigured(): boolean
}

// Provider-specific configurations
export interface SupabaseConfig {
  url: string
  anonKey: string
  bucket?: string
}

export interface ServerConfig {
  endpoint: string
  apiKey?: string
  maxSize?: number
}

export interface UploadCareConfig {
  publicKey: string
  secretKey?: string
  cdn?: string
}

// Validation
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MIN_FILE_SIZE = 1024 // 1KB

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size < MIN_FILE_SIZE) {
    return { valid: false, error: 'File too small (minimum 1KB)' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (maximum ${MAX_FILE_SIZE / 1024 / 1024}MB)` }
  }
  
  if (!ALLOWED_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed' }
  }
  
  return { valid: true }
}

export const generateFileName = (studioId: string, originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${studioId}/${timestamp}-${random}.${extension}`
}