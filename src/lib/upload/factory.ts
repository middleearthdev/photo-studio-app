import { IUploadProvider, UploadProvider } from './types'
import { ServerUploadProvider } from './providers/server'
import { UploadCareProvider } from './providers/uploadcare'
import { DigitalOceanClientProvider } from './providers/digitalocean-client'
import { VercelBlobProvider } from './providers/vercel'

export class UploadProviderFactory {
  private static providers: Map<UploadProvider, IUploadProvider> = new Map()

  static initialize() {
    // Initialize all providers
    this.providers.set('server', new ServerUploadProvider())
    this.providers.set('uploadcare', new UploadCareProvider())
    this.providers.set('digitalocean', new DigitalOceanClientProvider())
    this.providers.set('vercel', new VercelBlobProvider())
  }

  static getProvider(name: UploadProvider): IUploadProvider | null {
    if (this.providers.size === 0) {
      this.initialize()
    }
    
    const provider = this.providers.get(name)
    return provider || null
  }

  static getConfiguredProvider(): IUploadProvider | null {
    if (this.providers.size === 0) {
      this.initialize()
    }

    // Use NEXT_PUBLIC_UPLOAD_DESTINATION to determine provider
    const destination = process.env.NEXT_PUBLIC_UPLOAD_DESTINATION as UploadProvider
    
    if (!destination) {
      console.error('[UPLOAD-FACTORY] NEXT_PUBLIC_UPLOAD_DESTINATION not set!')
      return null
    }

    const provider = this.getProvider(destination)
    if (!provider) {
      console.error(`[UPLOAD-FACTORY] Unknown provider '${destination}'`)
      return null
    }

    if (!provider.isConfigured()) {
      console.error(`[UPLOAD-FACTORY] Provider '${destination}' not configured!`)
      return null
    }

    return provider
  }


  static async upload(
    options: {
      file: File
      studioId: string
      path?: string
      onProgress?: (progress: number) => void
      bucket?: string
    }
  ) {
    const provider = this.getConfiguredProvider()
    if (!provider) {
      return {
        success: false,
        error: 'No upload provider configured',
        provider: undefined
      }
    }

    const result = await provider.upload(options)
    return result
  }
}